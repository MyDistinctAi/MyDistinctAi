/**
 * Unified AI Service
 * Routes requests between Ollama (local/desktop) and GPT (cloud/webapp)
 */

import { streamGPTResponse, callGPT, isGPTConfigured, type GPTMessage } from './gpt-client'

export type AIProvider = 'ollama' | 'gpt'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIStreamOptions {
  provider?: AIProvider
  model?: string
  messages: AIMessage[]
  temperature?: number
  maxTokens?: number
  onToken?: (token: string) => void
  onComplete?: (fullText: string, tokensUsed: number) => void
  onError?: (error: Error) => void
}

export interface AIResponse {
  content: string
  tokensUsed: number
  model: string
  provider: AIProvider
}

/**
 * Get default AI provider based on configuration
 * Defaults to Ollama (local), falls back to GPT if Ollama unavailable
 */
export function getDefaultProvider(): AIProvider {
  // Check if we're in browser (client-side) or server
  const isBrowser = typeof window !== 'undefined'

  // For webapp, prefer GPT if configured, otherwise Ollama
  if (isBrowser || process.env.NEXT_PUBLIC_USE_GPT === 'true') {
    return isGPTConfigured() ? 'gpt' : 'ollama'
  }

  // For desktop/server, prefer Ollama (local)
  return 'ollama'
}

/**
 * Stream AI response with automatic provider routing
 */
export async function streamAIResponse(options: AIStreamOptions): Promise<void> {
  const provider = options.provider || getDefaultProvider()

  console.log(`[AI Service] Using provider: ${provider}`)

  if (provider === 'gpt') {
    await streamGPTResponse({
      model: options.model || 'gpt-3.5-turbo',
      messages: options.messages as GPTMessage[],
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      onToken: options.onToken,
      onComplete: options.onComplete,
      onError: options.onError,
    })
  } else {
    // Ollama streaming (existing implementation)
    await streamOllamaResponse(options)
  }
}

/**
 * Stream response from Ollama (local AI)
 */
async function streamOllamaResponse(options: AIStreamOptions): Promise<void> {
  const {
    model = 'mistral:7b',
    messages,
    temperature = 0.7,
    onToken,
    onComplete,
    onError,
  } = options

  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434'

  try {
    // Convert messages to Ollama format
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n')

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
        options: {
          temperature,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let fullText = ''
    let tokensUsed = 0

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        onComplete?.(fullText, tokensUsed)
        break
      }

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter((line) => line.trim() !== '')

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line)

          if (parsed.response) {
            fullText += parsed.response
            tokensUsed += 1 // Rough estimate
            onToken?.(parsed.response)
          }

          if (parsed.done) {
            break
          }
        } catch (parseError) {
          console.warn('Failed to parse Ollama response:', parseError)
        }
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    onError?.(err)
    throw err
  }
}

/**
 * Non-streaming AI call
 */
export async function callAI(
  messages: AIMessage[],
  options?: {
    provider?: AIProvider
    model?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<AIResponse> {
  const provider = options?.provider || getDefaultProvider()

  if (provider === 'gpt') {
    const result = await callGPT(messages as GPTMessage[], {
      model: options?.model,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    })

    return {
      ...result,
      provider: 'gpt',
    }
  } else {
    // Ollama non-streaming call
    const result = await callOllama(messages, {
      model: options?.model,
      temperature: options?.temperature,
    })

    return {
      ...result,
      provider: 'ollama',
    }
  }
}

/**
 * Non-streaming Ollama call
 */
async function callOllama(
  messages: AIMessage[],
  options?: {
    model?: string
    temperature?: number
  }
): Promise<Omit<AIResponse, 'provider'>> {
  const model = options?.model || 'mistral:7b'
  const temperature = options?.temperature ?? 0.7
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434'

  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n')

  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.response || ''
  const tokensUsed = Math.ceil(content.length / 4) // Rough estimate

  return {
    content,
    tokensUsed,
    model,
  }
}

/**
 * Check which providers are available
 */
export async function getAvailableProviders(): Promise<{
  ollama: boolean
  gpt: boolean
}> {
  const gptAvailable = isGPTConfigured()

  // Check Ollama availability
  let ollamaAvailable = false
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434'
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000), // 2 second timeout
    })
    ollamaAvailable = response.ok
  } catch {
    ollamaAvailable = false
  }

  return {
    ollama: ollamaAvailable,
    gpt: gptAvailable,
  }
}
