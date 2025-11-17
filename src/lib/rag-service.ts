/**
 * RAG (Retrieval Augmented Generation) Service
 * Orchestrates file processing, embedding generation, and context retrieval
 */

import { extractTextFromURL, extractTextFromPath, type ExtractionResult } from './file-extraction'
import { chunkText, type TextChunk, getChunkStats } from './text-chunking'
import { generateEmbedding, generateEmbeddings, checkOllamaAvailability } from './embeddings'
import { searchSimilarDocuments, hybridSearch, storeEmbeddings, type SimilarityMatch } from './vector-store'
import { contextCache, embeddingCache } from './cache'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ProcessFileResult {
  success: boolean
  stats?: {
    extractedText: number // characters
    chunks: number
    embeddings: number
    processingTime: number // ms
  }
  error?: string
}

export interface RetrievalResult {
  success: boolean
  context?: string
  matches?: SimilarityMatch[]
  error?: string
  confidence?: number // 0-100, overall confidence score
  sources?: Array<{
    fileName: string
    similarity: number
    chunkIndex: number
  }>
  verified?: boolean // true if answer was verified against sources
}

/**
 * Process a training data file: extract text, chunk, generate embeddings, store
 */
export async function processTrainingFile(
  trainingDataId: string,
  modelId: string,
  fileUrlOrPath: string,
  fileName: string,
  fileType?: string,
  supabaseClient?: SupabaseClient
): Promise<ProcessFileResult> {
  const startTime = Date.now()

  try {
    console.log('[RAG] Processing file:', fileName)
    
    // Step 1: Extract text from file (URL or local path)
    const isUrl = fileUrlOrPath.startsWith('http://') || fileUrlOrPath.startsWith('https://')
    const extractionResult: ExtractionResult = isUrl
      ? await extractTextFromURL(fileUrlOrPath, fileName, fileType)
      : await extractTextFromPath(fileUrlOrPath, fileName, fileType)

    if (!extractionResult.success || !extractionResult.text) {
      return {
        success: false,
        error: extractionResult.error || 'Failed to extract text from file',
      }
    }

    // Step 3: Chunk the text
    const chunks: TextChunk[] = chunkText(extractionResult.text, {
      chunkSize: 1000,
      overlap: 200,
      preserveParagraphs: true,
      minChunkSize: 100,
    })

    if (chunks.length === 0) {
      return {
        success: false,
        error: 'No chunks generated from the text',
      }
    }

    // Step 4: Generate embeddings for all chunks
    console.log(`[RAG] Generating embeddings for ${chunks.length} chunks...`)
    const chunkTexts = chunks.map((chunk) => chunk.text)
    const embeddingsResult = await generateEmbeddings(chunkTexts, undefined, 10)

    if (!embeddingsResult.success || !embeddingsResult.embeddings) {
      return {
        success: false,
        error: embeddingsResult.error || 'Failed to generate embeddings',
      }
    }

    // Step 5: Store embeddings in database
    const storeResult = await storeEmbeddings({
      modelId,
      trainingDataId,
      chunks,
      embeddings: embeddingsResult.embeddings,
      metadata: {
        fileName,
        fileType: extractionResult.metadata?.fileType,
        pageCount: extractionResult.metadata?.pageCount,
        wordCount: extractionResult.metadata?.wordCount,
      },
    })

    if (!storeResult.success) {
      return {
        success: false,
        error: storeResult.error || 'Failed to store embeddings',
      }
    }

    // Step 6: Update training_data status to 'processed'
    if (supabaseClient) {
      await supabaseClient
        .from('training_data')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', trainingDataId)
    }

    const processingTime = Date.now() - startTime

    return {
      success: true,
      stats: {
        extractedText: extractionResult.text.length,
        chunks: chunks.length,
        embeddings: embeddingsResult.embeddings.length,
        processingTime,
      },
    }
  } catch (error) {
    // Update training_data status to 'failed' on error
    if (supabaseClient) {
      await supabaseClient
        .from('training_data')
        .update({
          status: 'failed',
        })
        .eq('id', trainingDataId)
    }

    return {
      success: false,
      error: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Retrieve relevant context for a user query using RAG
 */
export async function retrieveContext(
  query: string,
  modelId: string,
  options: {
    topK?: number
    similarityThreshold?: number
  } = {}
): Promise<RetrievalResult> {
  try {
    const { topK = 5, similarityThreshold = 0.25 } = options

    console.log(`[RAG] Retrieving context for query: "${query}"`)
    console.log(`[RAG] Model ID: ${modelId}`)
    console.log(`[RAG] Settings: topK=${topK}, threshold=${similarityThreshold}`)

    // Check cache first
    const cacheKey = `${query}:${topK}:${similarityThreshold}`
    const cached = contextCache.get<RetrievalResult>(cacheKey, modelId)
    if (cached) {
      console.log('[RAG] ⚡ Cache hit! Returning cached context')
      return cached
    }

    // Step 1: Generate embedding for the query
    console.log('[RAG] Generating query embedding...')
    
    // Check embedding cache
    const cachedEmbedding = embeddingCache.get<number[]>(query, modelId)
    let queryEmbedding: number[]
    
    if (cachedEmbedding) {
      console.log('[RAG] ⚡ Using cached embedding')
      queryEmbedding = cachedEmbedding
    } else {
      const embeddingResult = await generateEmbedding(query)
    
      if (!embeddingResult.success || !embeddingResult.embedding) {
        console.error('[RAG] ❌ Failed to generate query embedding:', embeddingResult.error)
        return {
          success: true, // Don't fail the chat, just return empty context
          context: '',
          matches: [],
          error: `Failed to generate embedding: ${embeddingResult.error}`,
        }
      }

      queryEmbedding = embeddingResult.embedding
      console.log(`[RAG] ✅ Query embedding generated (${queryEmbedding.length} dimensions)`)
      
      // Cache the embedding for future use (24 hour TTL)
      embeddingCache.set(query, modelId, queryEmbedding, 24 * 60 * 60 * 1000)
    }

    // Step 2: Hybrid search (semantic + keyword)
    console.log('[RAG] Performing hybrid search (semantic + keyword)...')
    const searchResult = await hybridSearch(query, queryEmbedding, modelId, {
      limit: topK,
      similarityThreshold,
      keywordWeight: 0.3 // 30% keyword, 70% semantic
    })

    if (!searchResult.success) {
      console.error('[RAG] Search failed:', searchResult.error)
      return {
        success: true, // Don't fail the chat, just return empty context
        context: '',
        matches: [],
      }
    }

    // Step 3: Format context from matches
    const matches = searchResult.matches || []

    if (matches.length === 0) {
      console.log('[RAG] ⚠️  No relevant context found for query (try lowering threshold)')
      return {
        success: true,
        context: '',
        matches: [],
      }
    }

    console.log(`[RAG] ✅ Found ${matches.length} relevant chunks`)
    matches.forEach((match, i) => {
      console.log(`[RAG]   Match ${i + 1}: ${(match.similarity * 100).toFixed(1)}% - "${match.chunk_text.substring(0, 80)}..."`)
    })

    // Calculate confidence score (average of top matches weighted by similarity)
    const confidenceScore = calculateConfidenceScore(matches)
    console.log(`[RAG] 📊 Confidence score: ${confidenceScore.toFixed(1)}%`)

    // Extract unique sources
    const sources = extractSources(matches)
    console.log(`[RAG] 📚 Sources: ${sources.map(s => s.fileName).join(', ')}`)

    // Build context string from matched chunks with document names
    const contextParts = matches.map((match, index) => {
      const docName = match.metadata?.fileName || 'Unknown Document'
      return `[Source: ${docName}] (Confidence: ${(match.similarity * 100).toFixed(1)}%)\n${match.chunk_text}`
    })

    const context = contextParts.join('\n\n---\n\n')

    const result: RetrievalResult = {
      success: true,
      context,
      matches,
      confidence: confidenceScore,
      sources,
      verified: confidenceScore >= 70, // Mark as verified if confidence >= 70%
    }

    // Cache the result (1 hour TTL)
    contextCache.set(cacheKey, modelId, result, 60 * 60 * 1000)

    return result
  } catch (error) {
    console.error('[RAG] Error retrieving context:', error)
    // Don't fail the chat, just return empty context
    return {
      success: true,
      context: '',
      matches: [],
    }
  }
}

/**
 * Process all unprocessed training files for a model
 */
export async function processAllUnprocessedFiles(
  modelId: string,
  supabaseClient: SupabaseClient
): Promise<{
  success: boolean
  processed?: number
  failed?: number
  errors?: string[]
}> {
  try {
    const supabase = supabaseClient

    // Get all unprocessed training files for this model
    const { data: trainingFiles, error } = await supabase
      .from('training_data')
      .select('*')
      .eq('model_id', modelId)
      .eq('status', 'uploaded')

    if (error) {
      return {
        success: false,
        processed: 0,
        failed: 0,
        errors: [`Failed to fetch training files: ${error.message}`],
      }
    }

    if (!trainingFiles || trainingFiles.length === 0) {
      return {
        success: true,
        processed: 0,
        failed: 0,
        errors: [],
      }
    }

    // Process each file
    let processed = 0
    let failed = 0
    const errors: string[] = []

    for (const file of trainingFiles) {
      const result = await processTrainingFile(
        file.id,
        modelId,
        file.file_url,
        file.file_name,
        file.file_type,
        supabase  // Pass the Supabase client
      )

      if (result.success) {
        processed++
      } else {
        failed++
        errors.push(`${file.file_name}: ${result.error}`)
      }
    }

    return {
      success: true,
      processed,
      failed,
      errors,
    }
  } catch (error) {
    return {
      success: false,
      processed: 0,
      failed: 0,
      errors: [`Failed to process files: ${error instanceof Error ? error.message : 'Unknown error'}`],
    }
  }
}

/**
 * Check if a model has any processed training data
 */
export async function hasProcessedData(modelId: string): Promise<boolean> {
  const stats = await getModelEmbeddingStats(modelId)
  return stats.success && (stats.stats?.totalChunks || 0) > 0
}

/**
 * Get RAG-ready status for a model
 */
export async function getRAGStatus(modelId: string): Promise<{
  ready: boolean
  stats?: {
    totalChunks: number
    totalFiles: number
    avgChunksPerFile: number
  }
  issues?: string[]
}> {
  const issues: string[] = []

  // Check Ollama availability
  const ollamaCheck = await checkOllamaAvailability()
  if (!ollamaCheck.available) {
    issues.push('Ollama is not running')
  }
  if (!ollamaCheck.hasModel) {
    issues.push('Embedding model (nomic-embed-text) not found')
  }

  // Check for processed data
  const statsResult = await getModelEmbeddingStats(modelId)
  if (!statsResult.success) {
    issues.push('Failed to fetch embedding stats')
  }

  const totalChunks = statsResult.stats?.totalChunks || 0
  if (totalChunks === 0) {
    issues.push('No training data has been processed yet')
  }

  return {
    ready: issues.length === 0 && totalChunks > 0,
    stats: statsResult.stats,
    issues,
  }
}

/**
 * Calculate confidence score from similarity matches
 * Uses weighted average based on similarity scores
 */
function calculateConfidenceScore(matches: SimilarityMatch[]): number {
  if (matches.length === 0) return 0

  // Weight top matches more heavily
  const weights = matches.map((_, i) => 1 / (i + 1))
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)

  const weightedSum = matches.reduce((sum, match, i) => {
    return sum + match.similarity * weights[i] * 100
  }, 0)

  return Math.min(100, weightedSum / totalWeight)
}

/**
 * Extract unique sources from matches
 */
function extractSources(matches: SimilarityMatch[]): Array<{
  fileName: string
  similarity: number
  chunkIndex: number
}> {
  const sourceMap = new Map<
    string,
    { fileName: string; similarity: number; chunkIndex: number }
  >()

  matches.forEach((match) => {
    const fileName = match.metadata?.fileName || 'Unknown Document'
    const existing = sourceMap.get(fileName)

    // Keep the highest similarity score for each document
    if (!existing || match.similarity > existing.similarity) {
      sourceMap.set(fileName, {
        fileName,
        similarity: match.similarity,
        chunkIndex: match.chunk_index || 0,
      })
    }
  })

  return Array.from(sourceMap.values()).sort((a, b) => b.similarity - a.similarity)
}
