/**
 * Chat API Route - Simplified RAG Pipeline
 * 
 * Features:
 * - Bulletproof platform detection (Web = OpenRouter, Desktop = Ollama)
 * - Simplified RAG with vector search
 * - Comprehensive logging at every step
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchSimilarDocuments } from '@/lib/vector-search'
import { logTokenUsage, checkUsageLimit } from '@/lib/usage-tracking'
import OpenAI from 'openai'

// ============================================================================
// PLATFORM DETECTION - This is the fix for "Ollama not running" error
// ============================================================================

const IS_TAURI_BUILD = process.env.TAURI_BUILD === 'true'

function isDesktopApp(request: NextRequest): boolean {
  const header = request.headers.get('x-desktop-app')
  const isDesktop = header === 'true' || IS_TAURI_BUILD
  console.log('[CHAT] Platform detection:', {
    header,
    isTauriBuild: IS_TAURI_BUILD,
    isDesktop,
    platform: isDesktop ? 'DESKTOP (Ollama)' : 'WEB (OpenRouter)',
    timestamp: new Date().toISOString()
  })
  return isDesktop
}

// ============================================================================
// AI CLIENT CONFIGURATION
// ============================================================================

// Web App - OpenRouter (cloud AI)
function createWebClient() {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
      'X-Title': 'MyDistinctAI'
    }
  })
}

// Desktop App - Ollama (local AI)
function createDesktopClient() {
  return new OpenAI({
    baseURL: process.env.OLLAMA_URL || 'http://localhost:11434/v1',
    apiKey: 'ollama' // Ollama doesn't require a real key
  })
}

const WEB_MODEL = process.env.NEXT_PUBLIC_DEFAULT_AI_MODEL || 'deepseek/deepseek-chat'
const DESKTOP_MODEL = process.env.NEXT_PUBLIC_OLLAMA_MODEL || 'mistral:7b'

// ============================================================================
// REQUEST INTERFACE
// ============================================================================

interface ChatRequest {
  modelId: string
  message: string
  sessionId: string
  useRAG?: boolean
}

// ============================================================================
// MAIN CHAT HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[CHAT] ============================================')
  console.log('[CHAT] New chat request received')

  try {
    // 1. PLATFORM DETECTION - Critical for routing
    const isDesktop = isDesktopApp(request)
    const platform = isDesktop ? 'DESKTOP' : 'WEB'
    const aiClient = isDesktop ? createDesktopClient() : createWebClient()
    const model = isDesktop ? DESKTOP_MODEL : WEB_MODEL

    console.log('[CHAT] AI Configuration:', {
      platform,
      model,
      client: isDesktop ? 'Ollama (localhost)' : 'OpenRouter'
    })

    // 2. VALIDATE ENVIRONMENT for web app
    if (!isDesktop && !process.env.OPENROUTER_API_KEY) {
      console.error('[CHAT] ❌ OPENROUTER_API_KEY not configured for web app!')
      return NextResponse.json(
        {
          error: 'AI service not configured',
          message: 'OpenRouter API key is missing. Please add OPENROUTER_API_KEY to environment variables.'
        },
        { status: 503 }
      )
    }

    // 3. AUTHENTICATE USER
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const isDevelopment = process.env.NODE_ENV === 'development'

    if (!isDevelopment && !isDesktop && (authError || !user)) {
      console.error('[CHAT] Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[CHAT] User:', user?.id || 'anonymous (dev mode)')

    // 4. PARSE REQUEST
    let body: ChatRequest
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('[CHAT] Failed to parse request:', parseError)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { modelId, message, sessionId, useRAG = true } = body

    if (!modelId || !message || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: modelId, message, sessionId' },
        { status: 400 }
      )
    }

    console.log('[CHAT] Request details:', {
      modelId,
      sessionId,
      messageLength: message.length,
      useRAG,
      platform
    })

    // 5. CHECK USAGE LIMITS
    if (user) {
      const usageCheck = await checkUsageLimit(user.id)
      if (!usageCheck.allowed) {
        return NextResponse.json(
          { error: usageCheck.message || 'Monthly token limit exceeded' },
          { status: 429 }
        )
      }
    }

    // 6. RAG - SEARCH FOR RELEVANT CONTEXT
    let contextText = ''
    let ragMatches: any[] = []

    if (useRAG) {
      console.log('[CHAT] Starting RAG search...')
      const relevantDocs = await searchSimilarDocuments(message, {
        modelId,
        limit: 5,
        threshold: 0.25
      })

      ragMatches = relevantDocs
      const hasContext = relevantDocs.length > 0

      console.log('[CHAT] RAG search complete:', {
        documentsFound: relevantDocs.length,
        hasContext,
        topSimilarity: relevantDocs[0]?.similarity || 0
      })

      if (hasContext) {
        contextText = relevantDocs
          .map((doc, i) => `[Document ${i + 1}] (${(doc.similarity * 100).toFixed(1)}%):\n${doc.content}`)
          .join('\n\n---\n\n')

        console.log('[CHAT] Context built:', {
          totalChars: contextText.length,
          preview: contextText.substring(0, 200) + '...'
        })
      }
    } else {
      console.log('[CHAT] RAG disabled')
    }

    // 7. BUILD MESSAGES
    const systemPrompt = contextText
      ? `You are a helpful AI assistant. Use the following context from the user's documents to answer their questions. If the context doesn't contain relevant information, use your general knowledge.

CONTEXT:
${contextText}

Answer based on the context above. Be concise and accurate.`
      : 'You are a helpful AI assistant. Answer questions clearly and concisely.'

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: message }
    ]

    console.log('[CHAT] Sending to AI:', {
      platform,
      model,
      messageCount: messages.length,
      hasContext: !!contextText,
      systemPromptLength: systemPrompt.length
    })

    // 8. STREAM AI RESPONSE
    const stream = await aiClient.chat.completions.create({
      model: model,
      messages: messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000
    })

    console.log('[CHAT] AI streaming started')

    // 9. CREATE READABLE STREAM
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = ''
          let chunkCount = 0

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              fullResponse += content
              chunkCount++
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
            }
          }

          console.log('[CHAT] AI streaming complete:', {
            chunks: chunkCount,
            responseLength: fullResponse.length
          })

          // 10. SAVE TO DATABASE
          if (user) {
            const tokensUsed = Math.ceil(fullResponse.length / 4)

            await supabase
              .from('chat_messages')
              .insert({
                session_id: sessionId,
                role: 'assistant',
                content: fullResponse,
                tokens: tokensUsed
              })

            await logTokenUsage({
              userId: user.id,
              tokens: tokensUsed,
              modelId: modelId,
              sessionId: sessionId,
              requestType: 'chat',
              modelName: model
            })

            console.log('[CHAT] Saved to database')
          }

          const elapsed = Date.now() - startTime
          console.log(`[CHAT] ✅ Request complete in ${elapsed}ms`)
          console.log('[CHAT] ============================================')

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          controller.close()

        } catch (error: any) {
          console.error('[CHAT] ❌ Stream error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error: any) {
    console.error('[CHAT] ❌ Fatal error:', error)
    console.log('[CHAT] ============================================')

    return NextResponse.json(
      {
        error: error.message || 'Chat request failed',
        details: error.toString()
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-desktop-app',
    },
  })
}
