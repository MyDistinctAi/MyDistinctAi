/**
 * Chat API Route
 *
 * Handles chat messages and streams AI responses with RAG support
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { retrieveContext } from '@/lib/rag-service'
import { logTokenUsage, checkUsageLimit } from '@/lib/usage-tracking'
import { generateStreamingChatCompletion } from '@/lib/openrouter/chat'
import { getDefaultModel } from '@/lib/openrouter/client'

// Ollama API configuration (fallback for desktop)
const OLLAMA_API_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const USE_OPENROUTER = !!process.env.OPENROUTER_API_KEY

interface ChatRequest {
  modelId: string
  message: string
  sessionId: string
  useRAG?: boolean // Optional: allow disabling RAG
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Validate authentication (skip in test/dev for mock data)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Skip auth check if no user but allow testing with mock modelId
    const isDevelopment = process.env.NODE_ENV === 'development'
    if (!isDevelopment && (authError || !user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    let body: ChatRequest
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { modelId, message, sessionId } = body
    const useRAG = true // FORCE RAG ON - Testing RAG system

    console.log(`[Chat API] ===== NEW CHAT REQUEST =====`)
    console.log(`[Chat API] Model ID: ${modelId}`)
    console.log(`[Chat API] Message: "${message}"`)
    console.log(`[Chat API] useRAG FORCED TO: ${useRAG}`)

    if (!modelId || !message || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: modelId, message, sessionId' },
        { status: 400 }
      )
    }

    // 3. Check usage limits (skip in development without auth)
    if (user) {
      const usageCheck = await checkUsageLimit(user.id)

      if (!usageCheck.allowed) {
        return NextResponse.json(
          {
            error: usageCheck.message || 'Monthly token limit exceeded',
            usage: usageCheck.usage
          },
          { status: 429 } // Too Many Requests
        )
      }

      console.log(`[Chat API] Usage check passed - ${usageCheck.usage?.tokensUsed || 0} / ${usageCheck.usage?.monthlyCap || 0} tokens used`)
    }

    // 4. Fetch model config and user preferences from Supabase
    let model = null
    let session = null
    let userPreferredModel = getDefaultModel().id
    let modelBaseModel = null // Track the model's base_model

    if (user) {
      // Get user's preferred AI model
      const { data: userData } = await supabase
        .from('users')
        .select('preferred_ai_model')
        .eq('id', user.id)
        .single() as { data: any }

      if (userData?.preferred_ai_model) {
        userPreferredModel = userData.preferred_ai_model
      }
      console.log(`[Chat API] User preferred model: ${userPreferredModel}`)

      const { data: modelData, error: modelError } = await supabase
        .from('models')
        .select('*')
        .eq('id', modelId)
        .eq('user_id', user.id)
        .single() as { data: any; error: any }

      if (modelError || !modelData) {
        return NextResponse.json(
          { error: 'Model not found' },
          { status: 404 }
        )
      }

      if (modelData.status !== 'ready') {
        return NextResponse.json(
          { error: 'Model is not ready. Current status: ' + modelData.status },
          { status: 400 }
        )
      }

      model = modelData
      modelBaseModel = modelData.base_model
      
      // If model uses OpenRouter base model, use that instead of user preference
      if (modelBaseModel && (modelBaseModel.includes('google/') || modelBaseModel.includes('meta-llama/') || modelBaseModel.includes('qwen/'))) {
        userPreferredModel = modelBaseModel
        console.log(`[Chat API] Using model's base_model: ${modelBaseModel}`)
      }

      // 4. Verify session belongs to user
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()

      if (sessionError || !sessionData) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        )
      }

      session = sessionData
    } else {
      // Mock data for testing
      model = {
        id: modelId,
        base_model: 'mistral:7b',
        status: 'ready'
      }
      session = { id: sessionId }
    }

    // 5. Load conversation history (skip in test mode)
    let conversationHistory: any[] = []

    if (user) {
      const { data: history, error: historyError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (historyError) {
        console.error('Failed to load history:', historyError)
      }

      conversationHistory = (history || [])
        .reverse()
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

      // 6. Save user message to database
      const { error: saveError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content: message,
          tokens: message.split(' ').length,
        })

      if (saveError) {
        console.error('Failed to save user message:', saveError)
        // Don't return error in dev, just log it
        if (!isDevelopment) {
          return NextResponse.json(
            { error: 'Failed to save message' },
            { status: 500 }
          )
        }
      }
    }

    // 7. Retrieve relevant context using RAG (if enabled and available)
    let contextText = ''
    let ragMatches: any[] = []

    if (useRAG) {
      console.log(`[Chat API] 🔍 Retrieving RAG context for model: ${modelId}`)
      console.log(`[Chat API] Query: "${message}"`)

      const retrievalResult = await retrieveContext(message, modelId, {
        topK: 5,
        similarityThreshold: 0.0, // Set to 0.0 for debugging - will return all matches
      })

      console.log(`[Chat API] RAG Result:`, {
        success: retrievalResult.success,
        hasContext: !!retrievalResult.context,
        contextLength: retrievalResult.context?.length || 0,
        matchCount: retrievalResult.matches?.length || 0,
        error: retrievalResult.error
      })

      if (retrievalResult.success && retrievalResult.context) {
        contextText = retrievalResult.context
        ragMatches = retrievalResult.matches || []
        console.log(`[Chat API] ✅ Retrieved ${ragMatches.length} context chunks`)
        console.log(`[Chat API] Context preview:`, contextText.substring(0, 200) + '...')
      } else if (retrievalResult.error) {
        console.warn(`[Chat API] ⚠️ RAG retrieval warning: ${retrievalResult.error}`)
        // Continue without context instead of failing
      } else {
        console.warn(`[Chat API] ⚠️ No RAG context retrieved (no error, but no results)`)
      }
    } else {
      console.log(`[Chat API] ⚠️ RAG is disabled`)
    }

    // 8. Build prompt with context (if available)
    let finalPrompt = message

    if (contextText) {
      // Build a prompt that includes the retrieved context
      finalPrompt = `You are a helpful AI assistant. Use the following context from the uploaded documents to answer the user's question. If the context doesn't contain relevant information, you can use your general knowledge.

Context from uploaded documents:
${contextText}

User question: ${message}

Answer:`
    }

    // 9. Call AI API (OpenRouter or Ollama) with streaming
    const encoder = new TextEncoder()
    console.log(`[Chat API] Using RAG: ${useRAG && contextText ? 'Yes' : 'No'}`)
    console.log(`[Chat API] OpenRouter available: ${USE_OPENROUTER}`)
    console.log(`[Chat API] OPENROUTER_API_KEY set: ${!!process.env.OPENROUTER_API_KEY}`)
    console.log(`[Chat API] Model base_model: ${model?.base_model}`)
    console.log(`[Chat API] Selected model: ${userPreferredModel}`)

    // Try OpenRouter first if available
    if (USE_OPENROUTER) {
      try {
        console.log(`[Chat API] ✅ Attempting OpenRouter with model: ${userPreferredModel}`)
        
        const messages = [
          {
            role: 'system' as const,
            content: contextText 
              ? `You are a helpful AI assistant. Use the following context from uploaded documents to answer questions. If the context doesn't contain relevant information, use your general knowledge.\n\nContext:\n${contextText}`
              : 'You are a helpful AI assistant.'
          },
          { role: 'user' as const, content: message }
        ]

        const stream = await generateStreamingChatCompletion({
          modelId: userPreferredModel,
          messages,
          temperature: 0.7,
          maxTokens: 2000,
        })

        // Convert OpenAI stream to our format
        const readableStream = new ReadableStream({
          async start(controller) {
            let fullResponse = ''
            
            try {
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || ''
                if (content) {
                  fullResponse += content
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: content })}

`))
                }
              }

              // Save message to database
              if (user) {
                const tokensUsed = Math.ceil(fullResponse.length / 4)

                await supabase
                  .from('chat_messages')
                  .insert({
                    session_id: sessionId,
                    role: 'assistant',
                    content: fullResponse,
                    tokens: tokensUsed,
                  })

                await logTokenUsage({
                  userId: user.id,
                  tokens: tokensUsed,
                  modelId: modelId,
                  sessionId: sessionId,
                  requestType: 'chat',
                  modelName: userPreferredModel
                })
              }

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}

`))
              controller.close()
            } catch (error) {
              console.error('[Chat API] OpenRouter streaming error:', error)
              controller.error(error)
            }
          }
        })

        return new Response(readableStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      } catch (openrouterError) {
        console.error('[Chat API] ❌ OpenRouter failed:', openrouterError)
        console.error('[Chat API] Error details:', openrouterError instanceof Error ? openrouterError.message : String(openrouterError))
        console.error('[Chat API] Falling back to Ollama...')
        // Fall through to Ollama
      }
    } else {
      console.log('[Chat API] ⚠️ OpenRouter not available, using Ollama')
    }

    // Fallback to Ollama (for desktop or when OpenRouter fails)
    const ollamaModel = model?.base_model || 'mistral:7b'
    console.log(`[Chat API] Using Ollama model: ${ollamaModel}`)
    console.log(`[Chat API] Ollama URL: ${OLLAMA_API_URL}/api/generate`)

    let ollamaResponse
    try {
      console.log(`[Chat API] Attempting to connect to Ollama at ${OLLAMA_API_URL}/api/generate`)
      console.log(`[Chat API] Using model: ${ollamaModel}`)
      
      ollamaResponse = await fetch(`${OLLAMA_API_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: finalPrompt,
          stream: true,
          // Note: context should be the previous context array from Ollama, not conversation history
          // For now, we'll omit it and just use the prompt with conversation history
        }),
      })

      console.log(`[Chat API] Ollama response status: ${ollamaResponse.status}`)

      if (!ollamaResponse.ok) {
        const errorText = await ollamaResponse.text()
        console.error(`[Chat API] Ollama error response: ${errorText}`)
        throw new Error(`Ollama API request failed: ${ollamaResponse.statusText}`)
      }
      
      console.log(`[Chat API] Successfully connected to Ollama, streaming response...`)
    } catch (ollamaError) {
      console.error('[Chat API] Ollama connection failed:', ollamaError)
      console.error('[Chat API] Error details:', ollamaError instanceof Error ? ollamaError.message : String(ollamaError))

      // Return mock response when Ollama is not available (development only)
      if (isDevelopment) {
        const mockResponse = `I'm a mock AI response because Ollama is not running. You asked: "${message}"\n\nTo enable real AI responses, please start Ollama by running:\n1. Install Ollama from https://ollama.ai\n2. Run: ollama pull ${ollamaModel}\n3. Ollama will run automatically on http://localhost:11434`

        const stream = new ReadableStream({
          async start(controller) {
            // Simulate typing effect
            const words = mockResponse.split(' ')
            for (const word of words) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: word + ' ' })}\n\n`))
              await new Promise(resolve => setTimeout(resolve, 50))
            }

            // Save mock message if user exists
            if (user) {
              const tokensUsed = mockResponse.split(' ').length

              await supabase
                .from('chat_messages')
                .insert({
                  session_id: sessionId,
                  role: 'assistant',
                  content: mockResponse,
                  tokens: tokensUsed,
                })

              // Log token usage
              try {
                await logTokenUsage({
                  userId: user.id,
                  tokens: tokensUsed,
                  modelId: modelId,
                  sessionId: sessionId,
                  requestType: 'chat',
                  modelName: 'mock-response'
                })
              } catch (logError) {
                console.error('[Chat API] Failed to log token usage:', logError)
              }
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
            controller.close()
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      }

      throw new Error(`Ollama is not running. Please start Ollama service at ${OLLAMA_API_URL}`)
    }

    // Stream Ollama response to client
    const reader = ollamaResponse.body?.getReader()
    if (!reader) {
      throw new Error('No response body from Ollama')
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = ''
          const decoder = new TextDecoder()

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n').filter(line => line.trim())

            for (const line of lines) {
              try {
                const json = JSON.parse(line)

                if (json.response) {
                  fullResponse += json.response
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: json.response })}\n\n`))
                }

                if (json.done) {
                  const tokensUsed = json.eval_count || fullResponse.split(' ').length

                  // Save AI message to database (skip in test mode)
                  if (user) {
                    const { error: aiSaveError } = await supabase
                      .from('chat_messages')
                      .insert({
                        session_id: sessionId,
                        role: 'assistant',
                        content: fullResponse,
                        tokens: tokensUsed,
                      })

                    if (aiSaveError) {
                      console.error('Failed to save AI message:', aiSaveError)
                    }

                    // Log token usage for tracking and billing
                    try {
                      await logTokenUsage({
                        userId: user.id,
                        tokens: tokensUsed,
                        modelId: model.id,
                        sessionId: sessionId,
                        requestType: 'chat',
                        modelName: model.base_model || 'mistral:7b'
                      })
                      console.log(`[Chat API] Logged ${tokensUsed} tokens for user ${user.id}`)
                    } catch (logError) {
                      console.error('[Chat API] Failed to log token usage:', logError)
                      // Don't fail the request if logging fails
                    }
                  }

                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
                  controller.close()
                }
              } catch (parseError) {
                console.error('Failed to parse Ollama response:', parseError)
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
