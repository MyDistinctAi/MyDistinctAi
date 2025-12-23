/**
 * Ollama Embeddings Service
 * 
 * Generate vector embeddings using Ollama's nomic-embed-text model
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const EMBEDDING_MODEL = 'nomic-embed-text'

/**
 * Generate embedding for a single text chunk
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        prompt: text,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.embedding
  } catch (error) {
    console.error('[Embeddings] Error generating embedding:', error)
    throw error
  }
}

/**
 * Generate embeddings for multiple text chunks (batch processing)
 */
export async function generateEmbeddings(
  texts: string[],
  onProgress?: (current: number, total: number) => void
): Promise<number[][]> {
  const embeddings: number[][] = []

  for (let i = 0; i < texts.length; i++) {
    const embedding = await generateEmbedding(texts[i])
    embeddings.push(embedding)

    if (onProgress) {
      onProgress(i + 1, texts.length)
    }

    // Small delay to avoid overwhelming Ollama
    if (i < texts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return embeddings
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Test Ollama connection and embedding model
 */
export async function testOllamaConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`)
    
    if (!response.ok) {
      return false
    }

    const data = await response.json()
    const hasEmbeddingModel = data.models?.some(
      (model: any) => model.name === `${EMBEDDING_MODEL}:latest`
    )

    if (!hasEmbeddingModel) {
      console.warn(
        `[Embeddings] ${EMBEDDING_MODEL} model not found. Please run: ollama pull ${EMBEDDING_MODEL}`
      )
      return false
    }

    return true
  } catch (error) {
    console.error('[Embeddings] Failed to connect to Ollama:', error)
    return false
  }
}
