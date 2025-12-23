/**
 * Embeddings Generation Service
 * Generates vector embeddings using OpenAI/OpenRouter
 * 
 * CRITICAL: Web app NEVER falls back to Ollama
 */

import OpenAI from 'openai'

// Environment detection
const IS_TAURI_BUILD = process.env.TAURI_BUILD === 'true'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OLLAMA_API_URL = process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434'

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

// Create OpenRouter client for embeddings
function createEmbeddingsClient(): OpenAI | null {
  if (!OPENROUTER_API_KEY) {
    console.log('[EMBEDDINGS] No OPENROUTER_API_KEY - embeddings disabled')
    return null
  }

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
      'X-Title': 'MyDistinctAI'
    }
  })
}

/**
 * Generate embedding for a single text
 * Uses OpenRouter for web, Ollama for desktop only
 */
export async function generateEmbedding(
  text: string,
  model?: string
): Promise<EmbeddingResult> {
  const startTime = Date.now()
  const isDesktop = IS_TAURI_BUILD

  console.log('[EMBEDDINGS] Generating:', {
    provider: isDesktop ? 'Ollama (desktop)' : 'OpenRouter (web)',
    textLength: text.length,
    model: model || 'default',
    timestamp: new Date().toISOString()
  })

  // =========================================================================
  // WEB APP: Use OpenRouter only (never Ollama)
  // =========================================================================
  if (!isDesktop) {
    const client = createEmbeddingsClient()

    if (!client) {
      return {
        success: false,
        error: 'OpenRouter API key not configured. Cannot generate embeddings.'
      }
    }

    try {
      const response = await client.embeddings.create({
        model: 'openai/text-embedding-3-small',
        input: text
      })

      const embedding = response.data[0]?.embedding

      if (!embedding) {
        return {
          success: false,
          error: 'No embedding returned from OpenRouter'
        }
      }

      return {
        success: true,
        embedding,
        metadata: {
          model: 'openai/text-embedding-3-small',
          dimensions: embedding.length,
          processingTime: Date.now() - startTime
        }
      }
    } catch (error: any) {
      console.error('[EMBEDDINGS] OpenRouter error:', error)
      return {
        success: false,
        error: `OpenRouter embedding failed: ${error.message || 'Unknown error'}`
      }
    }
  }

  // =========================================================================
  // DESKTOP APP: Use Ollama
  // =========================================================================
  const ollamaModel = model || 'nomic-embed-text'

  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: text,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `Ollama is not running. Please start Ollama service at ${OLLAMA_API_URL}`,
      }
    }

    const data = await response.json()

    if (!data.embedding || !Array.isArray(data.embedding)) {
      return {
        success: false,
        error: 'Invalid response from Ollama: missing embedding array',
      }
    }

    return {
      success: true,
      embedding: data.embedding,
      metadata: {
        model: ollamaModel,
        dimensions: data.embedding.length,
        processingTime: Date.now() - startTime,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Ollama is not running. Please start Ollama service at ${OLLAMA_API_URL}`,
    }
  }
}

/**
 * Generate embeddings for multiple texts (batch processing)
 */
export async function generateEmbeddings(
  texts: string[],
  model?: string,
  batchSize: number = 10
): Promise<BatchEmbeddingResult> {
  const startTime = Date.now()
  const isDesktop = IS_TAURI_BUILD

  console.log('[EMBEDDINGS] Batch generating:', {
    provider: isDesktop ? 'Ollama (desktop)' : 'OpenRouter (web)',
    count: texts.length,
    timestamp: new Date().toISOString()
  })

  // =========================================================================
  // WEB APP: Use OpenRouter batch API
  // =========================================================================
  if (!isDesktop) {
    const client = createEmbeddingsClient()

    if (!client) {
      return {
        success: false,
        error: 'OpenRouter API key not configured. Cannot generate embeddings.'
      }
    }

    try {
      const response = await client.embeddings.create({
        model: 'openai/text-embedding-3-small',
        input: texts
      })

      const embeddings = response.data.map(d => d.embedding)

      return {
        success: true,
        embeddings,
        metadata: {
          model: 'openai/text-embedding-3-small',
          dimensions: embeddings[0]?.length || 0,
          count: embeddings.length,
          totalProcessingTime: Date.now() - startTime
        }
      }
    } catch (error: any) {
      console.error('[EMBEDDINGS] OpenRouter batch error:', error)
      return {
        success: false,
        error: `OpenRouter batch embedding failed: ${error.message || 'Unknown error'}`
      }
    }
  }

  // =========================================================================
  // DESKTOP APP: Process with Ollama one by one
  // =========================================================================
  try {
    const embeddings: number[][] = []

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      const results = await Promise.all(batch.map(text => generateEmbedding(text, model)))

      const errors = results.filter(r => !r.success)
      if (errors.length > 0) {
        return {
          success: false,
          error: errors[0].error || 'Batch embedding failed'
        }
      }

      results.forEach(result => {
        if (result.embedding) {
          embeddings.push(result.embedding)
        }
      })
    }

    return {
      success: true,
      embeddings,
      metadata: {
        model: model || 'nomic-embed-text',
        dimensions: embeddings[0]?.length || 0,
        count: embeddings.length,
        totalProcessingTime: Date.now() - startTime
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Batch embedding failed: ${error.message || 'Unknown error'}`
    }
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimensions')
  }

  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    magnitudeA += a[i] * a[i]
    magnitudeB += b[i] * b[i]
  }

  magnitudeA = Math.sqrt(magnitudeA)
  magnitudeB = Math.sqrt(magnitudeB)

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0
  }

  return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * Find most similar embeddings using cosine similarity
 */
export function findMostSimilar(
  queryEmbedding: number[],
  embeddings: { embedding: number[]; metadata?: any }[],
  topK: number = 5
): Array<{ index: number; similarity: number; metadata?: any }> {
  const similarities = embeddings.map((item, index) => ({
    index,
    similarity: cosineSimilarity(queryEmbedding, item.embedding),
    metadata: item.metadata,
  }))

  return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topK)
}
