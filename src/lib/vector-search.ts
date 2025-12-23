/**
 * Vector Search
 * Wrapper for similarity search using Supabase RPC
 */

import { createClient } from '@/lib/supabase/client'
import { generateEmbedding } from './embeddings'

export interface SearchResult {
    content: string
    similarity: number
    metadata?: Record<string, any>
}

export interface SearchOptions {
    modelId: string
    limit?: number
    threshold?: number
}

/**
 * Search for similar documents using vector similarity
 */
export async function searchSimilarDocuments(
    query: string,
    options: SearchOptions
): Promise<SearchResult[]> {
    const { modelId, limit = 5, threshold = 0.5 } = options
    const startTime = Date.now()

    console.log('[VECTOR_SEARCH] Starting search:', {
        queryLength: query.length,
        modelId,
        limit,
        threshold,
        timestamp: new Date().toISOString()
    })

    try {
        // 1. Generate embedding for the query
        console.log('[VECTOR_SEARCH] Generating query embedding...')
        const embeddingResult = await generateEmbedding(query)

        if (!embeddingResult.success || !embeddingResult.embedding) {
            console.error('[VECTOR_SEARCH] ❌ Failed to generate embedding:', embeddingResult.error)
            return []
        }

        console.log('[VECTOR_SEARCH] Embedding generated:', {
            dimensions: embeddingResult.embedding.length
        })

        // 2. Call Supabase Edge Function for vector search
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

        console.log('[VECTOR_SEARCH] Calling vector-search Edge Function...')

        const response = await fetch(`${supabaseUrl}/functions/v1/vector-search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
                embedding: embeddingResult.embedding,
                modelId: modelId,
                limit: limit,
                threshold: threshold
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('[VECTOR_SEARCH] ❌ Edge Function error:', errorText)
            return []
        }

        const result = await response.json()
        const matches = result.matches || []

        const elapsed = Date.now() - startTime
        console.log('[VECTOR_SEARCH] Search complete:', {
            matchCount: matches.length,
            topSimilarity: matches[0]?.similarity || 0,
            elapsed: `${elapsed}ms`
        })

        // 3. Return results
        return matches.map((match: any) => ({
            content: match.chunk_text || match.content,
            similarity: match.similarity,
            metadata: match.metadata
        }))

    } catch (error) {
        console.error('[VECTOR_SEARCH] ❌ Error:', error)
        return []
    }
}

/**
 * Search using RPC function directly (fallback)
 */
export async function searchDocumentsRPC(
    queryEmbedding: number[],
    modelId: string,
    options: { limit?: number; threshold?: number } = {}
): Promise<SearchResult[]> {
    const { limit = 5, threshold = 0.5 } = options

    try {
        const supabase = createClient()

        const { data, error } = await supabase.rpc('search_documents', {
            query_embedding: queryEmbedding,
            p_model_id: modelId,
            match_threshold: threshold,
            match_count: limit
        })

        if (error) {
            console.error('[VECTOR_SEARCH] RPC error:', error)
            return []
        }

        return (data || []).map((row: any) => ({
            content: row.content,
            similarity: row.similarity,
            metadata: row.metadata
        }))

    } catch (error) {
        console.error('[VECTOR_SEARCH] RPC error:', error)
        return []
    }
}
