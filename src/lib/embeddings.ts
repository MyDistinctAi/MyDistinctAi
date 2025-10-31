/**
 * Embeddings Generation Service
 * Generates vector embeddings using Ollama
 */

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

/**
 * Generate embedding for a single text using Ollama
 */
export async function generateEmbedding(
  text: string,
  model: string = 'nomic-embed-text'
): Promise<EmbeddingResult> {
  const startTime = Date.now()

  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: text,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `Ollama API error: ${response.status} - ${errorText}`,
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
        model,
        dimensions: data.embedding.length,
        processingTime: Date.now() - startTime,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Generate embeddings for multiple texts (batch processing)
 */
export async function generateEmbeddings(
  texts: string[],
  model: string = 'nomic-embed-text',
  batchSize: number = 10
): Promise<BatchEmbeddingResult> {
  const startTime = Date.now()

  try {
    const embeddings: number[][] = []

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)

      const batchPromises = batch.map((text) => generateEmbedding(text, model))

      const results = await Promise.all(batchPromises)

      // Check for errors
      const errors = results.filter((r) => !r.success)
      if (errors.length > 0) {
        return {
          success: false,
          error: `Failed to generate embeddings for ${errors.length} texts: ${errors.map((e) => e.error).join(', ')}`,
        }
      }

      // Add embeddings
      results.forEach((result) => {
        if (result.embedding) {
          embeddings.push(result.embedding)
        }
      })
    }

    // Verify all embeddings have the same dimensions
    const dimensions = embeddings[0]?.length || 0
    const allSameDimension = embeddings.every((emb) => emb.length === dimensions)

    if (!allSameDimension) {
      return {
        success: false,
        error: 'Embeddings have inconsistent dimensions',
      }
    }

    return {
      success: true,
      embeddings,
      metadata: {
        model,
        dimensions,
        count: embeddings.length,
        totalProcessingTime: Date.now() - startTime,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Check if Ollama is available and has the embedding model
 */
export async function checkOllamaAvailability(model: string = 'nomic-embed-text'): Promise<{
  available: boolean
  hasModel: boolean
  error?: string
}> {
  try {
    // Check if Ollama is running
    const response = await fetch(`${OLLAMA_API_URL}/api/tags`)

    if (!response.ok) {
      return {
        available: false,
        hasModel: false,
        error: 'Ollama API is not responding',
      }
    }

    const data = await response.json()

    // Check if the embedding model is available
    const hasModel = data.models?.some((m: any) => m.name.includes(model))

    return {
      available: true,
      hasModel,
      error: hasModel ? undefined : `Model ${model} not found. Run: ollama pull ${model}`,
    }
  } catch (error) {
    return {
      available: false,
      hasModel: false,
      error: `Failed to connect to Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

  // Sort by similarity (highest first) and return top K
  return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topK)
}
