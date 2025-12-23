/**
 * Embedding Compression Utility
 *
 * Provides compression and decompression for embedding vectors
 * to reduce storage costs by ~75% using quantization techniques.
 *
 * Compression methods:
 * - int8: Quantize float32 → int8 (75% compression)
 * - int16: Quantize float32 → int16 (50% compression)
 */

export type CompressionMethod = 'int8' | 'int16' | 'none'

export interface CompressionResult {
  compressed: number[]
  method: CompressionMethod
  originalDimensions: number
  min: number
  max: number
  compressionRatio: number
}

export interface DecompressionResult {
  decompressed: number[]
  originalDimensions: number
}

/**
 * Compress embedding vector using quantization
 *
 * @param embedding - Original float32 embedding vector
 * @param method - Compression method ('int8' or 'int16')
 * @returns Compressed embedding with metadata
 */
export function compressEmbedding(
  embedding: number[],
  method: CompressionMethod = 'int8'
): CompressionResult {
  if (method === 'none') {
    return {
      compressed: embedding,
      method: 'none',
      originalDimensions: embedding.length,
      min: 0,
      max: 0,
      compressionRatio: 1,
    }
  }

  // Find min and max values for normalization
  const min = Math.min(...embedding)
  const max = Math.max(...embedding)
  const range = max - min

  // Quantization ranges
  const quantRange = method === 'int8' ? 255 : 65535
  const bytesPerValue = method === 'int8' ? 1 : 2

  // Normalize and quantize
  const compressed = embedding.map((value) => {
    const normalized = (value - min) / range
    const quantized = Math.round(normalized * quantRange)
    return quantized
  })

  // Calculate compression ratio
  const originalBytes = embedding.length * 4 // float32 = 4 bytes
  const compressedBytes = compressed.length * bytesPerValue + 16 // + metadata
  const compressionRatio = compressedBytes / originalBytes

  return {
    compressed,
    method,
    originalDimensions: embedding.length,
    min,
    max,
    compressionRatio,
  }
}

/**
 * Decompress embedding vector back to float32
 *
 * @param compressed - Compressed embedding vector
 * @param metadata - Compression metadata (min, max, method)
 * @returns Decompressed float32 embedding
 */
export function decompressEmbedding(
  compressed: number[],
  metadata: {
    min: number
    max: number
    method: CompressionMethod
    originalDimensions: number
  }
): DecompressionResult {
  if (metadata.method === 'none') {
    return {
      decompressed: compressed,
      originalDimensions: metadata.originalDimensions,
    }
  }

  const { min, max, method } = metadata
  const range = max - min
  const quantRange = method === 'int8' ? 255 : 65535

  // Dequantize and denormalize
  const decompressed = compressed.map((quantized) => {
    const normalized = quantized / quantRange
    const value = normalized * range + min
    return value
  })

  return {
    decompressed,
    originalDimensions: metadata.originalDimensions,
  }
}

/**
 * Calculate storage savings from compression
 *
 * @param originalDimensions - Original embedding dimensions
 * @param method - Compression method
 * @returns Storage savings information
 */
export function calculateStorageSavings(
  originalDimensions: number,
  method: CompressionMethod
): {
  originalBytes: number
  compressedBytes: number
  savedBytes: number
  savingsPercentage: number
} {
  const originalBytes = originalDimensions * 4 // float32 = 4 bytes per dimension
  const bytesPerValue = method === 'int8' ? 1 : method === 'int16' ? 2 : 4
  const compressedBytes = originalDimensions * bytesPerValue + 16 // + metadata

  const savedBytes = originalBytes - compressedBytes
  const savingsPercentage = (savedBytes / originalBytes) * 100

  return {
    originalBytes,
    compressedBytes,
    savedBytes,
    savingsPercentage,
  }
}

/**
 * Batch compress multiple embeddings
 *
 * @param embeddings - Array of embedding vectors
 * @param method - Compression method
 * @returns Array of compressed embeddings
 */
export function batchCompressEmbeddings(
  embeddings: number[][],
  method: CompressionMethod = 'int8'
): CompressionResult[] {
  return embeddings.map((embedding) => compressEmbedding(embedding, method))
}

/**
 * Batch decompress multiple embeddings
 *
 * @param compressed - Array of compressed embeddings
 * @param metadata - Array of compression metadata
 * @returns Array of decompressed embeddings
 */
export function batchDecompressEmbeddings(
  compressed: number[][],
  metadata: Array<{
    min: number
    max: number
    method: CompressionMethod
    originalDimensions: number
  }>
): DecompressionResult[] {
  return compressed.map((comp, i) => decompressEmbedding(comp, metadata[i]))
}

/**
 * Example usage:
 *
 * // Compress
 * const embedding = [0.123, -0.456, 0.789, ...] // 1536 dimensions
 * const compressed = compressEmbedding(embedding, 'int8')
 * console.log('Compression ratio:', compressed.compressionRatio) // ~0.25 (75% savings)
 *
 * // Store in database
 * await supabase.from('document_embeddings').insert({
 *   embedding: compressed.compressed,
 *   compressed: true,
 *   compression_method: compressed.method,
 *   original_dimensions: compressed.originalDimensions,
 *   metadata: {
 *     min: compressed.min,
 *     max: compressed.max,
 *   }
 * })
 *
 * // Decompress for similarity search
 * const decompressed = decompressEmbedding(
 *   compressed.compressed,
 *   {
 *     min: compressed.min,
 *     max: compressed.max,
 *     method: compressed.method,
 *     originalDimensions: compressed.originalDimensions,
 *   }
 * )
 *
 * // Use decompressed.decompressed for vector similarity search
 */
