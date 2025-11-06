/**
 * Training File Upload API
 * Handles file uploads for model training data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const modelId = formData.get('modelId') as string

    if (!file || !modelId) {
      return NextResponse.json(
        { error: 'File and modelId are required' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/markdown',
      'text/csv',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: TXT, PDF, DOC, DOCX, MD, CSV' },
        { status: 400 }
      )
    }

    // Verify model belongs to user
    const { data: model, error: modelError } = await supabase
      .from('models')
      .select('*')
      .eq('id', modelId)
      .eq('user_id', user.id)
      .single()

    if (modelError || !model) {
      return NextResponse.json(
        { error: 'Model not found or access denied' },
        { status: 404 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}-${sanitizedName}`
    const filePath = `${user.id}/${modelId}/${fileName}`

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('training-data')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file to storage', details: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('training-data')
      .getPublicUrl(uploadData.path)

    // Create training_data record
    const { data: trainingData, error: dbError } = await supabase
      .from('training_data')
      .insert({
        model_id: modelId,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        status: 'uploaded',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      
      // Clean up uploaded file
      await supabase.storage.from('training-data').remove([uploadData.path])
      
      return NextResponse.json(
        { error: 'Failed to save file record', details: dbError.message },
        { status: 500 }
      )
    }

    console.log(`✅ File uploaded successfully: ${file.name} (${modelId})`)

    return NextResponse.json({
      success: true,
      file: trainingData,
      message: 'File uploaded successfully',
    }, { status: 201 })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
