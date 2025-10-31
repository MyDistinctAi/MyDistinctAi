/**
 * Vector Store Service
 * Handles storing and retrieving embeddings from Supabase with pgvector
 */

import { createClient } from '@/lib/supabase/client'
import { createAdminClient } from '@/lib/supabase/admin'
import type { TextChunk } from './text-chunking'

export interface StoredEmbedding {
  id: string
  model_id: string
  training_data_id: string
  chunk_text: string
  chunk_index: number
  start_char?: number
  end_char?: number
  embedding: number[]
  metadata?: Record<string, any>
  created_at: string
}

export interface SimilarityMatch {
  id: string
  model_id: string
  training_data_id: string
  chunk_text: string
  chunk_index: number
  similarity: number
}

export interface StoreEmbeddingsParams {
  modelId: string
  trainingDataId: string
  chunks: TextChunk[]
  embeddings: number[][]
  metadata?: Record<string, any>
  supabaseClient?: any // Optional Supabase client (use admin for background jobs)
}

/**
 * Store embeddings in the database
 */
export async function storeEmbeddings({
  modelId,
  trainingDataId,
  chunks,
  embeddings,
  metadata = {},
  supabaseClient,
}: StoreEmbeddingsParams): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    if (chunks.length !== embeddings.length) {
      return {
        success: false,
        error: 'Number of chunks and embeddings must match',
      }
    }

    const supabase = supabaseClient || createClient()

    // Prepare data for insertion
    const embeddingsData = chunks.map((chunk, index) => ({
      model_id: modelId,
      training_data_id: trainingDataId,
      chunk_text: chunk.text,
      chunk_index: chunk.index,
      start_char: chunk.startChar,
      end_char: chunk.endChar,
      embedding: embeddings[index], // Pass as array - Supabase will convert to vector type
      metadata,
    }))

    // Insert embeddings (batch insert)
    const { error, count } = await supabase
      .from('document_embeddings')
      .insert(embeddingsData)
      .select('id', { count: 'exact' })

    if (error) {
      return {
        success: false,
        error: `Failed to store embeddings: ${error.message}`,
      }
    }

    return {
      success: true,
      count: count || chunks.length,
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to store embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Search for similar documents using vector similarity
 */
export async function searchSimilarDocuments(
  queryEmbedding: number[],
  modelId: string,
  options: {
    limit?: number
    similarityThreshold?: number
  } = {}
): Promise<{ success: boolean; matches?: SimilarityMatch[]; error?: string }> {
  try {
    const { limit = 5, similarityThreshold = 0.7 } = options

    const supabase = createClient()

    // Call the match_documents function
    const embeddingString = JSON.stringify(queryEmbedding)
    console.log(`[Vector Store] Calling match_documents with:`)
    console.log(`  - Model ID: ${modelId}`)
    console.log(`  - Embedding length: ${queryEmbedding.length}`)
    console.log(`  - Embedding string length: ${embeddingString.length}`)
    console.log(`  - Embedding string preview: ${embeddingString.substring(0, 100)}...`)
    console.log(`  - Limit: ${limit}`)
    console.log(`  - Threshold: ${similarityThreshold}`)

    // WORKAROUND: Use Supabase Edge Function to bypass RPC/PostgREST issues
    console.log(`  - Calling Supabase Edge Function: vector-search`)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const response = await fetch(`${supabaseUrl}/functions/v1/vector-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        embedding: queryEmbedding, // Pass as array
        modelId: modelId,
        limit: limit,
        threshold: similarityThreshold
      })
    })

    let data = null
    let error = null

    if (!response.ok) {
      const errorText = await response.text()
      error = { message: `HTTP ${response.status}: ${errorText}` }
      console.error(`[Vector Store] Edge Function Error:`, error)
    } else {
      const result = await response.json()
      data = result.matches || []
    }

    console.log(`[Vector Store] RPC result:`, { data, error })
    
    // Debug: Check if data has content
    if (data && data.length > 0) {
      console.log(`[Vector Store] First match similarity: ${data[0].similarity}`)
      console.log(`[Vector Store] First match text: ${data[0].chunk_text?.substring(0, 100)}...`)
    }

    if (error) {
      console.error(`[Vector Store] ❌ Error:`, error)
      return {
        success: false,
        error: `Failed to search documents: ${error.message}`,
      }
    }

    console.log(`[Vector Store] ✅ Found ${data?.length || 0} matches`)

    return {
      success: true,
      matches: data as SimilarityMatch[],
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to search documents: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Get all embeddings for a specific model
 */
export async function getModelEmbeddings(
  modelId: string
): Promise<{ success: boolean; embeddings?: StoredEmbedding[]; error?: string }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('document_embeddings')
      .select('*')
      .eq('model_id', modelId)
      .order('training_data_id', { ascending: true })
      .order('chunk_index', { ascending: true })

    if (error) {
      return {
        success: false,
        error: `Failed to fetch embeddings: ${error.message}`,
      }
    }

    return {
      success: true,
      embeddings: data as StoredEmbedding[],
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Get embeddings for a specific training data file
 */
export async function getTrainingDataEmbeddings(
  trainingDataId: string
): Promise<{ success: boolean; embeddings?: StoredEmbedding[]; error?: string }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('document_embeddings')
      .select('*')
      .eq('training_data_id', trainingDataId)
      .order('chunk_index', { ascending: true })

    if (error) {
      return {
        success: false,
        error: `Failed to fetch embeddings: ${error.message}`,
      }
    }

    return {
      success: true,
      embeddings: data as StoredEmbedding[],
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Delete all embeddings for a specific model
 */
export async function deleteModelEmbeddings(
  modelId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = createClient()

    const { error, count } = await supabase
      .from('document_embeddings')
      .delete({ count: 'exact' })
      .eq('model_id', modelId)

    if (error) {
      return {
        success: false,
        error: `Failed to delete embeddings: ${error.message}`,
      }
    }

    return {
      success: true,
      count: count || 0,
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to delete embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Delete embeddings for a specific training data file
 */
export async function deleteTrainingDataEmbeddings(
  trainingDataId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = createClient()

    const { error, count } = await supabase
      .from('document_embeddings')
      .delete({ count: 'exact' })
      .eq('training_data_id', trainingDataId)

    if (error) {
      return {
        success: false,
        error: `Failed to delete embeddings: ${error.message}`,
      }
    }

    return {
      success: true,
      count: count || 0,
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to delete embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Get statistics about stored embeddings for a model
 */
export async function getModelEmbeddingStats(modelId: string): Promise<{
  success: boolean
  stats?: {
    totalChunks: number
    totalFiles: number
    avgChunksPerFile: number
  }
  error?: string
}> {
  try {
    const supabase = createClient()

    // Get total chunks
    const { count: totalChunks, error: countError } = await supabase
      .from('document_embeddings')
      .select('id', { count: 'exact', head: true })
      .eq('model_id', modelId)

    if (countError) {
      return {
        success: false,
        error: `Failed to fetch stats: ${countError.message}`,
      }
    }

    // Get unique files
    const { data: filesData, error: filesError } = await supabase
      .from('document_embeddings')
      .select('training_data_id')
      .eq('model_id', modelId)

    if (filesError) {
      return {
        success: false,
        error: `Failed to fetch stats: ${filesError.message}`,
      }
    }

    const uniqueFiles = new Set(filesData?.map((d) => d.training_data_id) || [])
    const totalFiles = uniqueFiles.size

    return {
      success: true,
      stats: {
        totalChunks: totalChunks || 0,
        totalFiles,
        avgChunksPerFile: totalFiles > 0 ? Math.round((totalChunks || 0) / totalFiles) : 0,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
