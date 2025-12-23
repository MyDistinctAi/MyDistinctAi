/**
 * Training File Status API
 * Get real-time processing status and progress
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Get training data with model info and embedding count
    const { data: trainingData, error: tdError } = await supabase
      .from('training_data')
      .select(`
        *,
        models!inner(user_id, name),
        document_embeddings(count)
      `)
      .eq('id', trainingDataId)
      .single()

    if (tdError || !trainingData) {
      return NextResponse.json(
        { error: 'Training data not found' },
        { status: 404 }
      )
    }

    const td = trainingData as any

    // Verify ownership
    if (td.models.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Calculate progress
    const embeddingCount = td.document_embeddings?.[0]?.count || 0
    let progress = 0
    let progressMessage = ''

    switch (td.status) {
      case 'uploaded':
        progress = 0
        progressMessage = 'Waiting to process...'
        break
      case 'processing':
        // Estimate progress based on embeddings created
        // Assume average file creates ~20-50 embeddings
        progress = Math.min(embeddingCount * 2, 90) // Cap at 90% until complete
        progressMessage = `Processing... (${embeddingCount} chunks embedded)`
        break
      case 'processed':
        progress = 100
        progressMessage = `Complete! (${embeddingCount} embeddings)`
        break
      case 'failed':
        progress = 0
        progressMessage = td.error_message || 'Processing failed'
        break
      default:
        progress = 0
        progressMessage = 'Unknown status'
    }

    return NextResponse.json({
      id: td.id,
      fileName: td.file_name,
      fileSize: td.file_size,
      fileType: td.file_type,
      status: td.status,
      progress,
      progressMessage,
      embeddingCount,
      errorMessage: td.error_message,
      uploadedAt: td.created_at,
      processedAt: td.processed_at,
      modelName: td.models.name,
    })

  } catch (error) {
    console.error('Error getting training status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
