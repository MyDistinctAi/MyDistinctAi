/**
 * Training File Processing API
 * Immediately processes uploaded files and generates embeddings
 * Uses admin client because this is called internally from upload route
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractTextFromUrl } from '@/lib/document-processor'
import { chunkText, getChunkStats } from '@/lib/text-chunker'
import { generateEmbedding } from '@/lib/embeddings'

// Create admin client for internal processing (bypasses RLS)
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseServiceKey)
}

export const maxDuration = 300 // 5 minutes for processing

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Use admin client for internal processing
    const supabase = createAdminClient()

    // Parse request body
    const { trainingDataId } = await request.json()

    console.log(`[PROCESS] Received request for trainingDataId: ${trainingDataId}`)

    if (!trainingDataId) {
      return NextResponse.json(
        { error: 'trainingDataId is required' },
        { status: 400 }
      )
    }

    // Get training data record
    const { data: trainingData, error: tdError } = await supabase
      .from('training_data')
      .select('*, models(user_id)')
      .eq('id', trainingDataId)
      .single()

    if (tdError || !trainingData) {
      console.error(`[PROCESS] Training data not found:`, tdError)
      return NextResponse.json(
        { error: 'Training data not found' },
        { status: 404 }
      )
    }

    const td = trainingData as any

    // Check if already processing
    if (td.status === 'processing') {
      return NextResponse.json(
        { error: 'File is already being processed' },
        { status: 409 }
      )
    }

    console.log(`[PROCESS] 🔄 Starting processing for: ${td.file_name}`)

    // Update status to processing
    await supabase
      .from('training_data')
      .update({ status: 'processing', error_message: null } as any)
      .eq('id', trainingDataId)

    // 1. Extract text from file
    console.log('[PROCESS] Extracting text...')
    const extractResult = await extractTextFromUrl(td.file_url, td.file_name)

    if (!extractResult.success || !extractResult.text) {
      await supabase
        .from('training_data')
        .update({ status: 'failed', error_message: extractResult.error } as any)
        .eq('id', trainingDataId)

      return NextResponse.json({ error: extractResult.error }, { status: 500 })
    }

    console.log(`[PROCESS] Extracted ${extractResult.text.length} characters`)

    // 2. Chunk the text
    console.log('[PROCESS] Chunking text...')
    const chunks = chunkText(extractResult.text, {
      chunkSize: 1000,
      chunkOverlap: 200
    })

    const stats = getChunkStats(chunks)
    console.log(`[PROCESS] Created ${chunks.length} chunks`)

    // 3. Generate embeddings
    console.log('[PROCESS] Generating embeddings...')
    const embeddings: any[] = []
    let embeddingError: string | null = null

    for (let i = 0; i < chunks.length; i++) {
      const result = await generateEmbedding(chunks[i].text)

      if (result.success && result.embedding) {
        embeddings.push({
          model_id: td.model_id,
          training_data_id: trainingDataId,
          chunk_text: chunks[i].text,
          chunk_index: i,
          embedding: result.embedding,
          metadata: {
            fileName: td.file_name,
            fileType: td.file_type,
            chunkIndex: i
          }
        })
      } else {
        // Capture the first error
        if (!embeddingError) {
          embeddingError = result.error || 'Failed to generate embedding'
        }
      }
    }

    console.log(`[PROCESS] Generated ${embeddings.length} embeddings`)

    // CRITICAL: If no embeddings were generated, mark as failed
    if (embeddings.length === 0) {
      const errorMsg = embeddingError || 'No embeddings generated - check OpenRouter API key'
      console.error(`[PROCESS] ❌ No embeddings generated: ${errorMsg}`)

      await supabase
        .from('training_data')
        .update({
          status: 'failed',
          error_message: errorMsg
        } as any)
        .eq('id', trainingDataId)

      return NextResponse.json(
        { error: errorMsg, success: false },
        { status: 500 }
      )
    }

    // 4. Store embeddings
    const { error: insertError } = await supabase
      .from('document_embeddings')
      .insert(embeddings)

    if (insertError) {
      await supabase
        .from('training_data')
        .update({
          status: 'failed',
          error_message: `Failed to store embeddings: ${insertError.message}`
        } as any)
        .eq('id', trainingDataId)

      throw new Error(`Failed to store embeddings: ${insertError.message}`)
    }

    // 5. Update status to processed (only when successful)
    const elapsed = Date.now() - startTime

    console.log(`[PROCESS] Updating status to processed for: ${trainingDataId}`)

    const { error: updateError } = await supabase
      .from('training_data')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        chunk_count: chunks.length,
        character_count: extractResult.text.length,
        error_message: null
      } as any)
      .eq('id', trainingDataId)

    if (updateError) {
      console.error(`[PROCESS] ❌ Failed to update status: ${updateError.message}`)
    } else {
      console.log(`[PROCESS] ✅ Status updated to processed`)
    }

    // Verify the update worked
    const { data: verifyData } = await supabase
      .from('training_data')
      .select('status')
      .eq('id', trainingDataId)
      .single()

    console.log(`[PROCESS] Verification - Current status: ${(verifyData as any)?.status}`)

    console.log(`[PROCESS] ✅ Complete in ${elapsed}ms`)
    console.log(`   Chunks: ${chunks.length}`)
    console.log(`   Embeddings: ${embeddings.length}`)

    return NextResponse.json({
      success: true,
      stats: {
        chunks: chunks.length,
        embeddings: embeddings.length,
        characters: extractResult.text.length,
        processingTime: elapsed
      }
    })

  } catch (error) {
    console.error('[PROCESS] ❌ Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
