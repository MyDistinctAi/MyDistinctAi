/**
 * File Processing API Route
 *
 * Process uploaded training files and extract text content
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processFile, downloadFile, validateFile } from '@/lib/processing/fileProcessor'

export const maxDuration = 300 // 5 minutes max execution time
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get file metadata from database
    const { data: fileData, error: fileError } = await supabase
      .from('training_data')
      .select('*')
      .eq('id', fileId)
      .single()

    if (fileError || !fileData) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Verify the file belongs to the user's model
    const { data: modelData, error: modelError } = await supabase
      .from('models')
      .select('user_id')
      .eq('id', fileData.model_id)
      .single()

    if (modelError || !modelData || modelData.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Validate file
    const validation = validateFile(fileData.file_size, fileData.file_type)
    if (!validation.valid) {
      await supabase
        .from('training_data')
        .update({ status: 'failed' })
        .eq('id', fileId)

      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Update status to processing
    await supabase
      .from('training_data')
      .update({ status: 'processing' })
      .eq('id', fileId)

    try {
      // Download file from Supabase Storage
      const fileBuffer = await downloadFile(fileData.file_url)

      // Process the file
      const result = await processFile(
        fileBuffer,
        fileData.file_name,
        fileData.file_type
      )

      // Store processed data (for now, just mark as processed)
      // In the future, this is where you would store embeddings in LanceDB

      // Update file status to processed
      await supabase
        .from('training_data')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', fileId)

      return NextResponse.json(
        {
          success: true,
          message: 'File processed successfully',
          data: {
            totalChunks: result.metadata.totalChunks,
            totalCharacters: result.metadata.totalCharacters,
            processingTime: result.metadata.processingTime,
          },
        },
        { status: 200 }
      )
    } catch (processingError) {
      console.error('Processing error:', processingError)

      // Update status to failed
      await supabase
        .from('training_data')
        .update({ status: 'failed' })
        .eq('id', fileId)

      return NextResponse.json(
        {
          error: 'File processing failed',
          details: processingError instanceof Error ? processingError.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error processing file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get file processing status
    const { data: fileData, error: fileError } = await supabase
      .from('training_data')
      .select('*, models!inner(user_id)')
      .eq('id', fileId)
      .single()

    if (fileError || !fileData) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Verify ownership
    if (fileData.models.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      id: fileData.id,
      fileName: fileData.file_name,
      fileSize: fileData.file_size,
      fileType: fileData.file_type,
      status: fileData.status,
      processedAt: fileData.processed_at,
      createdAt: fileData.created_at,
    })
  } catch (error) {
    console.error('Error fetching file status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
