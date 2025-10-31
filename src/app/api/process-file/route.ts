/**
 * File Processing API Route
 * Processes uploaded training files: extracts text, generates embeddings, stores vectors
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processTrainingFile, processAllUnprocessedFiles } from '@/lib/rag-service'

// Force Node.js runtime for file processing
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds max for file processing

interface ProcessFileRequest {
  trainingDataId?: string // Process specific file
  modelId?: string // Process all unprocessed files for a model
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Process File API] Starting file processing...')

    // Log request headers for debugging
    console.log('[Process File API] Request headers:', {
      cookie: request.headers.get('cookie') ? 'present' : 'missing',
      contentType: request.headers.get('content-type'),
    })

    const supabase = await createClient()

    // 1. Validate authentication
    let user
    let authError

    try {
      const authResult = await supabase.auth.getUser()
      user = authResult.data?.user
      authError = authResult.error
    } catch (error) {
      console.error('[Process File API] Auth error caught:', error)
      return NextResponse.json({
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 401 })
    }

    if (authError || !user) {
      console.error('[Process File API] Unauthorized:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Process File API] User authenticated:', user.id)

    // 2. Parse request body
    const body: ProcessFileRequest = await request.json()
    const { trainingDataId, modelId } = body

    // Must provide either trainingDataId or modelId
    if (!trainingDataId && !modelId) {
      return NextResponse.json(
        { error: 'Must provide either trainingDataId or modelId' },
        { status: 400 }
      )
    }

    // 3. Process specific file
    if (trainingDataId) {
      // Fetch training data
      const { data: trainingData, error: fetchError } = await supabase
        .from('training_data')
        .select('*, models!inner(*)')
        .eq('id', trainingDataId)
        .single()

      if (fetchError || !trainingData) {
        return NextResponse.json({ error: 'Training data not found' }, { status: 404 })
      }

      // Verify ownership
      if (trainingData.models.user_id !== user.id) {
        console.error('[Process File API] User does not own this training data')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      console.log('[Process File API] Processing file:', trainingData.file_name)
      console.log('[Process File API] File URL:', trainingData.file_url)

      // Process the file
      const result = await processTrainingFile(
        trainingData.id,
        trainingData.model_id,
        trainingData.file_url,
        trainingData.file_name,
        trainingData.file_type,
        supabase
      )

      if (!result.success) {
        console.error('[Process File API] Processing failed:', result.error)
        return NextResponse.json(
          {
            error: result.error || 'Failed to process file',
            trainingDataId,
          },
          { status: 500 }
        )
      }

      console.log('[Process File API] Processing successful!', result.stats)

      return NextResponse.json({
        success: true,
        trainingDataId,
        stats: result.stats,
      })
    }

    // 4. Process all unprocessed files for a model
    if (modelId) {
      // Verify model ownership
      const { data: model, error: modelError } = await supabase
        .from('models')
        .select('*')
        .eq('id', modelId)
        .eq('user_id', user.id)
        .single()

      if (modelError || !model) {
        return NextResponse.json({ error: 'Model not found' }, { status: 404 })
      }

      // Process all unprocessed files
      const result = await processAllUnprocessedFiles(modelId, supabase)

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Failed to process some files',
            processed: result.processed || 0,
            failed: result.failed || 0,
            errors: result.errors || [],
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        modelId,
        processed: result.processed || 0,
        failed: result.failed || 0,
        errors: result.errors || [],
      })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('File processing API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
