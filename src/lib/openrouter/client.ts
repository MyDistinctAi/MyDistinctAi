/**
 * OpenRouter Client
 * 
 * Provides access to multiple AI models through OpenRouter API
 * Compatible with OpenAI SDK
 */

import OpenAI from 'openai'

// Available free models on OpenRouter
// Note: Do NOT use :free suffix - OpenRouter API rejects it
export const FREE_MODELS = {
  DEEPSEEK_CHAT: {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'DeepSeek',
    contextWindow: 64000, // 64K tokens
    speed: 'Fast',
    quality: 'Excellent',
    description: 'Best for coding and technical tasks',
    free: true,
  },
  GEMINI_FLASH: {
    id: 'google/gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash Experimental',
    provider: 'Google',
    contextWindow: 1000000, // 1M tokens
    speed: 'Very Fast',
    quality: 'Excellent',
    description: 'Latest Gemini with improved speed and quality',
    free: true,
  },
  LLAMA_70B: {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    provider: 'Meta',
    contextWindow: 128000, // 128K tokens
    speed: 'Fast',
    quality: 'Excellent',
    description: 'Best for complex reasoning and quality',
    free: true,
  },
  QWEN_72B: {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen 2.5 72B Instruct',
    provider: 'Qwen',
    contextWindow: 128000, // 128K tokens
    speed: 'Fast',
    quality: 'Excellent',
    description: 'Best for multilingual support',
    free: true,
  },
} as const

export type ModelId = typeof FREE_MODELS[keyof typeof FREE_MODELS]['id']

/**
 * Create OpenRouter client
 */
export function createOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY

  console.log('[OPENROUTER] Creating client:', {
    apiKeyPresent: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    timestamp: new Date().toISOString()
  })

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set')
  }

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
      'X-Title': 'MyDistinctAI',
    },
  })
}

/**
 * Get model by ID
 */
export function getModelById(modelId: string) {
  return Object.values(FREE_MODELS).find(model => model.id === modelId)
}

/**
 * Get default model (Gemini Flash - fastest and largest context)
 */
export function getDefaultModel() {
  return FREE_MODELS.GEMINI_FLASH
}

/**
 * Get all available models as array
 */
export function getAllModels() {
  return Object.values(FREE_MODELS)
}
