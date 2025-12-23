/**
 * Training Data Status API
 * Returns real-time processing status and progress
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trainingDataId = params.id

    // Get training data with model info
    const { data: trainingData, error: tdError } = await supabase
      .from('training_data')
      .select(`
        id,
        file_name,
        file_size,
        status,
        progress_percentage,
        progress_message,
        total_chunks,
        processed_chunks,
        processing_started_at,
        processing_completed_at,
        created_at,
        updated_at,
        models (
          id,
          name,
          user_id
        )
      `)
      .eq('id', trainingDataId)
      .single()

    if (tdError || !trainingData) {
      return NextResponse.json(
        { error: 'Training data not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if ((trainingData.models as any)?.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get job info if processing
    let jobInfo = null
    if (trainingData.status === 'processing') {
      const { data: jobs } = await supabase
        .from('job_queue')
        .select('id, status, attempts, error, created_at, started_at')
        .eq('payload->>trainingDataId', trainingDataId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (jobs && jobs.length > 0) {
        jobInfo = jobs[0]
      }
    }

    // Calculate processing time
    let processingTime = null
    if (trainingData.processing_started_at) {
      const startTime = new Date(trainingData.processing_started_at).getTime()
      const endTime = trainingData.processing_completed_at
        ? new Date(trainingData.processing_completed_at).getTime()
        : Date.now()
      processingTime = Math.round((endTime - startTime) / 1000) // seconds
    }

    // Get embedding count
    const { count: embeddingCount } = await supabase
      .from('document_embeddings')
      .select('id', { count: 'exact', head: true })
      .eq('training_data_id', trainingDataId)

    return NextResponse.json({
      id: trainingData.id,
      fileName: trainingData.file_name,
      fileSize: trainingData.file_size,
      status: trainingData.status,
      progress: {
        percentage: trainingData.progress_percentage || 0,
        message: trainingData.progress_message || 'Waiting to start...',
        processedChunks: trainingData.processed_chunks || 0,
        totalChunks: trainingData.total_chunks || 0,
      },
      timing: {
        createdAt: trainingData.created_at,
        startedAt: trainingData.processing_started_at,
        completedAt: trainingData.processing_completed_at,
        processingTimeSeconds: processingTime,
      },
      embeddings: {
        count: embeddingCount || 0,
      },
      job: jobInfo ? {
        id: jobInfo.id,
        status: jobInfo.status,
        attempts: jobInfo.attempts,
        error: jobInfo.error,
        createdAt: jobInfo.created_at,
        startedAt: jobInfo.started_at,
      } : null,
      model: {
        id: (trainingData.models as any)?.id,
        name: (trainingData.models as any)?.name,
      },
    })

  } catch (error) {
    console.error('[Status API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
