/**
 * OpenRouter Chat Service
 * 
 * Handles chat completions using OpenRouter API
 */

import { createOpenRouterClient, getDefaultModel, getModelById } from './client'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  modelId?: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

/**
 * Generate chat completion
 */
export async function generateChatCompletion(options: ChatCompletionOptions) {
  const {
    modelId,
    messages,
    temperature = 0.7,
    maxTokens = 2000,
    stream = false,
  } = options

  const client = createOpenRouterClient()
  const model = modelId ? getModelById(modelId) : getDefaultModel()

  if (!model) {
    throw new Error(`Model not found: ${modelId}`)
  }

  try {
    const response = await client.chat.completions.create({
      model: model.id,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream,
    })

    return response
  } catch (error) {
    console.error('[OpenRouter] Chat completion error:', error)
    throw error
  }
}

/**
 * Generate streaming chat completion
 */
export async function generateStreamingChatCompletion(options: ChatCompletionOptions) {
  const {
    modelId,
    messages,
    temperature = 0.7,
    maxTokens = 2000,
  } = options

  const client = createOpenRouterClient()
  
  // Try to get model from FREE_MODELS, otherwise use the modelId directly
  const model = modelId ? getModelById(modelId) : null
  const actualModelId = model ? model.id : (modelId || getDefaultModel().id)

  console.log(`[OpenRouter] Using model: ${actualModelId}`)

  try {
    const stream = await client.chat.completions.create({
      model: actualModelId,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    })

    return stream
  } catch (error) {
    console.error('[OpenRouter] Streaming chat completion error:', error)
    throw error
  }
}

/**
 * Check if OpenRouter is available
 */
export async function checkOpenRouterStatus(): Promise<boolean> {
  try {
    const client = createOpenRouterClient()
    const model = getDefaultModel()
    
    // Try a simple completion to check if the service is available
    await client.chat.completions.create({
      model: model.id,
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5,
    })
    
    return true
  } catch (error) {
    console.error('[OpenRouter] Status check failed:', error)
    return false
  }
}
