/**
 * Training File Upload API
 * Handles file uploads for model training data
 * Uses IMMEDIATE processing (no background worker)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFileSizeAllowed, canAddMoreFiles, formatFileSize, getPackageLimits, type PackageTier } from '@/lib/packages'

export const maxDuration = 60 // 1 minute for upload

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

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

    // Get user's package tier
    const userTier: PackageTier = 'free'
    const limits = getPackageLimits(userTier)

    // Validate file size
    if (!isFileSizeAllowed(file.size, userTier)) {
      return NextResponse.json(
        {
          error: `File size exceeds ${formatFileSize(limits.maxFileSize)} limit for ${limits.name} plan`,
          upgrade: true
        },
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

    // Check files per model limit
    const { count: fileCount } = await supabase
      .from('training_data')
      .select('id', { count: 'exact', head: true })
      .eq('model_id', modelId)

    if (!canAddMoreFiles(fileCount || 0, userTier)) {
      return NextResponse.json(
        {
          error: `Maximum ${limits.maxFilesPerModel} files per model reached`,
          upgrade: true
        },
        { status: 400 }
      )
    }

    console.log(`[UPLOAD] 📤 Starting upload: ${file.name} (${file.size} bytes)`)

    // Step 1: Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}-${sanitizedName}`
    const storagePath = `${user.id}/${modelId}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('training-data')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[UPLOAD] Storage error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('training-data')
      .getPublicUrl(uploadData.path)

    // Step 2: Create training_data record
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
      console.error('[UPLOAD] Database error:', dbError)
      await supabase.storage.from('training-data').remove([uploadData.path])
      return NextResponse.json(
        { error: 'Failed to save file record' },
        { status: 500 }
      )
    }

    console.log(`[UPLOAD] ✅ File uploaded: ${file.name}`)
    console.log(`[UPLOAD] 🔄 Starting immediate processing...`)

    // Step 3: Trigger IMMEDIATE processing (no worker)
    const processUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}/api/training/process`

    // Fire-and-forget processing call
    fetch(processUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        trainingDataId: (trainingData as any).id
      }),
    })
      .then(res => {
        if (res.ok) {
          console.log(`[UPLOAD] ✅ Processing started for ${file.name}`)
        } else {
          console.log(`[UPLOAD] ⚠️ Processing request failed: ${res.status}`)
        }
      })
      .catch(err => {
        console.log(`[UPLOAD] ⚠️ Processing request error: ${err.message}`)
      })

    return NextResponse.json({
      success: true,
      file: {
        id: (trainingData as any).id,
        name: file.name,
        size: file.size,
        status: 'processing',
      },
      message: 'File uploaded, processing started',
    }, { status: 201 })

  } catch (error) {
    console.error('[UPLOAD] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
