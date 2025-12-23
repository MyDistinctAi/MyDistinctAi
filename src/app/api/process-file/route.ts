/**
 * File Processing API Route
 * Processes uploaded training files: extracts text, generates embeddings, stores vectors
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractTextFromUrl } from '@/lib/document-processor'
import { chunkText, getChunkStats } from '@/lib/text-chunker'
import { generateEmbedding } from '@/lib/embeddings'

// Force Node.js runtime for file processing
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds max for file processing

interface ProcessFileRequest {
  trainingDataId?: string // Process specific file
  modelId?: string // Process all unprocessed files for a model
}

/**
 * Process a single training file
 */
async function processTrainingFile(
  trainingDataId: string,
  modelId: string,
  fileUrl: string,
  fileName: string,
  fileType: string,
  supabase: any
): Promise<{ success: boolean; error?: string; stats?: any }> {
  const startTime = Date.now()
  console.log('[PROCESS] Starting file processing:', {
    trainingDataId,
    modelId,
    fileName,
    fileType,
    timestamp: new Date().toISOString()
  })

  try {
    // 1. Extract text from file
    const extractResult = await extractTextFromUrl(fileUrl, fileName)

    if (!extractResult.success || !extractResult.text) {
      throw new Error(extractResult.error || 'Failed to extract text')
    }

    console.log('[PROCESS] Text extracted:', {
      characters: extractResult.text.length,
      words: extractResult.metadata?.wordCount
    })

    // 2. Chunk the text
    const chunks = chunkText(extractResult.text, {
      chunkSize: 1000,
      chunkOverlap: 200
    })

    const chunkStats = getChunkStats(chunks)
    console.log('[PROCESS] Text chunked:', chunkStats)

    // 3. Generate embeddings for each chunk
    console.log('[PROCESS] Generating embeddings...')
    const embeddings: { chunkIndex: number; content: string; embedding: number[] }[] = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const embeddingResult = await generateEmbedding(chunk.text)

      if (embeddingResult.success && embeddingResult.embedding) {
        embeddings.push({
          chunkIndex: i,
          content: chunk.text,
          embedding: embeddingResult.embedding
        })
      } else {
        console.warn(`[PROCESS] Failed to generate embedding for chunk ${i}`)
      }
    }

    console.log('[PROCESS] Embeddings generated:', {
      total: embeddings.length,
      failed: chunks.length - embeddings.length
    })

    // 4. Store embeddings in database
    if (embeddings.length > 0) {
      const embeddingRecords = embeddings.map(e => ({
        model_id: modelId,
        training_data_id: trainingDataId,
        chunk_text: e.content,
        chunk_index: e.chunkIndex,
        embedding: e.embedding,
        metadata: {
          fileName,
          fileType,
          chunkIndex: e.chunkIndex
        }
      }))

      const { error: insertError } = await supabase
        .from('document_embeddings')
        .insert(embeddingRecords)

      if (insertError) {
        console.error('[PROCESS] Failed to insert embeddings:', insertError)
        throw new Error(`Failed to store embeddings: ${insertError.message}`)
      }

      console.log('[PROCESS] Embeddings stored in database')
    }

    // 5. Update training data status
    await supabase
      .from('training_data')
      .update({
        status: 'processed',
        chunk_count: chunks.length,
        character_count: extractResult.text.length,
        processed_at: new Date().toISOString()
      })
      .eq('id', trainingDataId)

    const elapsed = Date.now() - startTime
    console.log(`[PROCESS] ✅ Complete in ${elapsed}ms`)

    return {
      success: true,
      stats: {
        chunks: chunks.length,
        embeddings: embeddings.length,
        characters: extractResult.text.length,
        processingTime: elapsed
      }
    }

  } catch (error) {
    console.error('[PROCESS] ❌ Error:', error)

    // Update training data with error
    await supabase
      .from('training_data')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', trainingDataId)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Process File API] Starting file processing...')

    const supabase = await createClient()

    // 1. Validate authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Process File API] Unauthorized:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Process File API] User authenticated:', user.id)

    // 2. Parse request body
    const body: ProcessFileRequest = await request.json()
    const { trainingDataId, modelId } = body

    if (!trainingDataId && !modelId) {
      return NextResponse.json(
        { error: 'Must provide either trainingDataId or modelId' },
        { status: 400 }
      )
    }

    // 3. Process specific file
    if (trainingDataId) {
      const { data: trainingData, error: fetchError } = await supabase
        .from('training_data')
        .select('*, models!inner(*)')
        .eq('id', trainingDataId)
        .single()

      if (fetchError || !trainingData) {
        return NextResponse.json({ error: 'Training data not found' }, { status: 404 })
      }

      const td = trainingData as any
      if (td.models.user_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      const result = await processTrainingFile(
        trainingData.id,
        trainingData.model_id,
        trainingData.file_url,
        trainingData.file_name,
        trainingData.file_type,
        supabase
      )

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      return NextResponse.json({ success: true, stats: result.stats })
    }

    // 4. Process all unprocessed files for a model
    if (modelId) {
      const { data: model } = await supabase
        .from('models')
        .select('*')
        .eq('id', modelId)
        .eq('user_id', user.id)
        .single()

      if (!model) {
        return NextResponse.json({ error: 'Model not found' }, { status: 404 })
      }

      // Get unprocessed files
      const { data: files } = await supabase
        .from('training_data')
        .select('*')
        .eq('model_id', modelId)
        .eq('status', 'uploaded')

      let processed = 0
      let failed = 0
      const errors: string[] = []

      for (const file of files || []) {
        const result = await processTrainingFile(
          file.id,
          file.model_id,
          file.file_url,
          file.file_name,
          file.file_type,
          supabase
        )

        if (result.success) {
          processed++
        } else {
          failed++
          errors.push(`${file.file_name}: ${result.error}`)
        }
      }

      return NextResponse.json({ success: true, processed, failed, errors })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  } catch (error) {
    console.error('File processing API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
