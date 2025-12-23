/**
 * OpenAI Embeddings Service
 * Generates vector embeddings using OpenAI API (compatible with OpenRouter)
 */

import OpenAI from 'openai'

const OPENAI_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
const USE_OPENROUTER = !!process.env.OPENROUTER_API_KEY

export interface EmbeddingResult {
  success: boolean
  embedding?: number[]
  error?: string
  metadata?: {
    model: string
    dimensions: number
    processingTime?: number
  }
}

export interface BatchEmbeddingResult {
  success: boolean
  embeddings?: number[][]
  error?: string
  metadata?: {
    model: string
    dimensions: number
    count: number
    totalProcessingTime?: number
  }
}

/**
 * Create OpenAI client (works with OpenRouter too)
 */
function createClient() {
  if (!OPENAI_API_KEY) {
    throw new Error('No API key found for embeddings')
  }

  // Use OpenRouter if available, otherwise OpenAI
  const baseURL = USE_OPENROUTER 
    ? 'https://openrouter.ai/api/v1'
    : 'https://api.openai.com/v1'

  return new OpenAI({
    apiKey: OPENAI_API_KEY,
    baseURL,
    defaultHeaders: USE_OPENROUTER ? {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
      'X-Title': 'MyDistinctAI',
    } : undefined,
  })
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(
  text: string,
  model: string = 'openai/text-embedding-3-small'
): Promise<EmbeddingResult> {
  const startTime = Date.now()

  try {
    const client = createClient()
    
    // OpenRouter requires full model name, OpenAI just needs the model name
    const modelName = USE_OPENROUTER ? model : (model?.split('/').pop() || model || 'text-embedding-3-small')
    
    const response = await client.embeddings.create({
      model: modelName,
      input: text,
    })

    const embedding = response.data[0].embedding
    const processingTime = Date.now() - startTime

    return {
      success: true,
      embedding,
      metadata: {
        model,
        dimensions: embedding.length,
        processingTime,
      },
    }
  } catch (error) {
    console.error('[OpenAI Embeddings] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(
  texts: string[],
  model: string = 'openai/text-embedding-3-small'
): Promise<BatchEmbeddingResult> {
  const startTime = Date.now()

  try {
    console.log(`[OpenAI Embeddings] 🚀 Batch generating ${texts.length} embeddings using model: ${model}`)
    const client = createClient()
    
    // OpenRouter requires full model name, OpenAI just needs the model name
    const modelName = USE_OPENROUTER ? model : (model?.split('/').pop() || model || 'text-embedding-3-small')
    
    const response = await client.embeddings.create({
      model: modelName,
      input: texts,
    })

    const embeddings = response.data.map(item => item.embedding)
    const totalProcessingTime = Date.now() - startTime
    const avgTimePerEmbedding = totalProcessingTime / texts.length

    console.log(`[OpenAI Embeddings] ✅ Batch complete: ${texts.length} embeddings in ${totalProcessingTime}ms (avg: ${avgTimePerEmbedding.toFixed(0)}ms each)`)

    return {
      success: true,
      embeddings,
      metadata: {
        model,
        dimensions: embeddings[0]?.length || 0,
        count: embeddings.length,
        totalProcessingTime,
      },
    }
  } catch (error) {
    console.error('[OpenAI Embeddings] Batch error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if OpenAI/OpenRouter is available
 */
export async function checkOpenAIAvailability(): Promise<boolean> {
  try {
    const result = await generateEmbedding('test', 'text-embedding-3-small')
    return result.success
  } catch (error) {
    console.error('[OpenAI Embeddings] Availability check failed:', error)
    return false
  }
}

/**
 * Get embedding model info
 */
export function getEmbeddingModelInfo() {
  return {
    provider: USE_OPENROUTER ? 'OpenRouter' : 'OpenAI',
    model: 'text-embedding-3-small',
    dimensions: 1536,
    maxTokens: 8191,
  }
}
