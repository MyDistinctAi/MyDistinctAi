/**
 * GPT API Client
 * Handles OpenAI GPT API calls with streaming support
 * Used for webapp (Ollama is for desktop app)
 */

export interface GPTMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GPTStreamOptions {
  model?: string
  messages: GPTMessage[]
  temperature?: number
  maxTokens?: number
  onToken?: (token: string) => void
  onComplete?: (fullText: string, tokensUsed: number) => void
  onError?: (error: Error) => void
}

export interface GPTResponse {
  content: string
  tokensUsed: number
  model: string
}

/**
 * Stream GPT response using OpenAI API
 * Note: API key needs to be configured in environment
 */
export async function streamGPTResponse(
  options: GPTStreamOptions
): Promise<void> {
  const {
    model = 'gpt-4',
    messages,
    temperature = 0.7,
    maxTokens = 2000,
    onToken,
    onComplete,
    onError,
  } = options

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    const error = new Error(
      'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.'
    )
    onError?.(error)
    throw error
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error = new Error(
        errorData.error?.message || `GPT API error: ${response.statusText}`
      )
      onError?.(error)
      throw error
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
        if (line.startsWith('data: ')) {
          const data = line.slice(6)

          if (data === '[DONE]') {
            continue
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content

            if (content) {
              fullText += content
              tokensUsed += estimateTokens(content)
              onToken?.(content)
            }
          } catch (parseError) {
            console.warn('Failed to parse SSE data:', parseError)
          }
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
 * Non-streaming GPT API call
 */
export async function callGPT(
  messages: GPTMessage[],
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<GPTResponse> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(
      'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.'
    )
  }

  const model = options?.model || 'gpt-4'
  const temperature = options?.temperature ?? 0.7
  const maxTokens = options?.maxTokens ?? 2000

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.error?.message || `GPT API error: ${response.statusText}`
    )
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || ''
  const tokensUsed = data.usage?.total_tokens || estimateTokens(content)

  return {
    content,
    tokensUsed,
    model: data.model,
  }
}

/**
 * Estimate token count (rough approximation)
 * OpenAI's rule of thumb: 1 token ≈ 4 characters for English
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Check if GPT API is configured
 */
export function isGPTConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}

/**
 * Get available GPT models
 */
export const GPT_MODELS = {
  'gpt-4': {
    name: 'GPT-4',
    description: 'Most capable model, best for complex tasks',
    maxTokens: 8192,
    costPer1kTokens: 0.03, // Input tokens
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    description: 'Faster and cheaper than GPT-4',
    maxTokens: 128000,
    costPer1kTokens: 0.01,
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    description: 'Fast and affordable for most tasks',
    maxTokens: 4096,
    costPer1kTokens: 0.0015,
  },
} as const

export type GPTModel = keyof typeof GPT_MODELS
