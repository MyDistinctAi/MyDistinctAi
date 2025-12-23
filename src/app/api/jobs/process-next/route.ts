import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max execution time

/**
 * POST /api/jobs/process-next
 * Process the next pending job from the queue
 * This endpoint should be called by a background worker (cron job, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    // Use admin client to bypass RLS for background jobs
    const supabase = createAdminClient()

    // Get next job from queue
    const { data: jobs, error: jobError } = (await supabase.rpc(
      'get_next_job'
    )) as {
      data: Array<{ id: string; job_type: string; payload: any; attempts: number }> | null
      error: any
    }

    if (jobError) {
      console.error('Failed to get next job:', jobError)
      return NextResponse.json(
        { error: 'Failed to get next job', details: jobError.message },
        { status: 500 }
      )
    }

    // No jobs available
    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ message: 'No jobs available' }, { status: 200 })
    }

    const job = jobs[0] as {
      id: string
      job_type: string
      payload: any
      attempts: number
    }
    console.log(`🔄 Processing job ${job.id} (${job.job_type})`)

    try {
      // Process based on job type
      let result: any = null

      switch (job.job_type) {
        case 'file_processing':
        case 'process_training_data':
          result = await processFileJob(job.payload, supabase)
          break

        default:
          throw new Error(`Unknown job type: ${job.job_type}`)
      }

      // Mark job as completed
      await supabase.rpc('complete_job', {
        p_job_id: job.id,
        p_result: result,
      } as any)

      console.log(`✅ Job ${job.id} completed successfully`)

      return NextResponse.json(
        {
          success: true,
          jobId: job.id,
          jobType: job.job_type,
          result,
        },
        { status: 200 }
      )
    } catch (processingError) {
      console.error(`❌ Job ${job.id} failed:`, processingError)

      // Mark job as failed
      await supabase.rpc('fail_job', {
        p_job_id: job.id,
        p_error:
          processingError instanceof Error ? processingError.message : 'Unknown error',
        p_should_retry: true,
      } as any)

      return NextResponse.json(
        {
          success: false,
          jobId: job.id,
          error: processingError instanceof Error ? processingError.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in process-next:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Process a file processing job
 */
async function processFileJob(payload: any, supabase: any) {
  const { training_data_id, file_url, file_name, file_type, model_id } = payload

  console.log(`📄 Processing file: ${file_name} (${file_type})`)

  // Update training_data status to processing
  await supabase
    .from('training_data')
    .update({ status: 'processing' })
    .eq('id', training_data_id)

  try {
    // Import processing utilities
    const { extractTextFromFile, chunkText, downloadFileFromStorage, cleanupTempFile } = await import('@/lib/text-extraction')
    const { generateEmbeddings } = await import('@/lib/embeddings') // Use main embeddings service (OpenAI/OpenRouter)
    const { storeEmbeddings } = await import('@/lib/vector-store')
    const path = await import('path')
    const os = await import('os')

    // 1. Download file to temp location
    const tempDir = os.tmpdir()
    const tempFilePath = path.join(tempDir, `${training_data_id}-${file_name}`)
    
    console.log(`⬇️  Downloading file from ${file_url}`)
    await downloadFileFromStorage(file_url, tempFilePath)

    // 2. Extract text from file
    console.log(`📝 Extracting text from ${file_type} file`)
    const text = await extractTextFromFile(tempFilePath, file_type)
    
    // 3. Chunk text into segments
    console.log(`✂️  Chunking text (${text.length} characters)`)
    const textChunks = chunkText(text, 1000, 100)
    console.log(`   Created ${textChunks.length} chunks`)

    // 4. Generate embeddings for each chunk
    console.log(`🧠 Generating embeddings for ${textChunks.length} chunks`)
    const result = await generateEmbeddings(textChunks)

    if (!result.success || !result.embeddings) {
      throw new Error(result.error || 'Failed to generate embeddings')
    }

    const embeddings = result.embeddings

    // 5. Store embeddings in database
    console.log(`💾 Storing ${embeddings.length} embeddings in database`)
    
    // Convert chunks to the format expected by storeEmbeddings
    const chunks = textChunks.map((text, index) => ({
      text,
      index,
      startChar: index * 900, // Approximate
      endChar: (index + 1) * 900,
    }))

    const storeResult = await storeEmbeddings({
      modelId: model_id,
      trainingDataId: training_data_id,
      chunks,
      embeddings,
      metadata: {
        file_name,
        file_type,
        total_chunks: chunks.length,
      },
      supabaseClient: supabase, // Pass admin client to bypass RLS
    })

    if (!storeResult.success) {
      throw new Error(storeResult.error || 'Failed to store embeddings')
    }

    console.log(`✅ Stored ${storeResult.count} embeddings successfully`)

    // 6. Clean up temp file
    await cleanupTempFile(tempFilePath)

    // 7. Update training_data status to processed
    await supabase
      .from('training_data')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', training_data_id)

    return {
      training_data_id,
      file_name,
      status: 'processed',
      chunks_created: textChunks.length,
      embeddings_stored: storeResult.count,
      processed_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`❌ File processing failed:`, error)
    
    // Update training_data status to failed
    await supabase
      .from('training_data')
      .update({ status: 'failed' })
      .eq('id', training_data_id)

    throw error
  }
}
