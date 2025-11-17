/**
 * Training File Upload API
 * Handles file uploads for model training data
 * Enqueues processing jobs for background processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createJobQueueClient, JobType } from '@/lib/job-queue'
import { isFileSizeAllowed, canAddMoreFiles, formatFileSize, getPackageLimits, type PackageTier } from '@/lib/packages'

export const maxDuration = 60 // 1 minute for upload only

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

    // Get user's package tier (default to 'free' for now)
    // TODO: Fetch from user profile/subscription table
    const userTier: PackageTier = 'free'
    const limits = getPackageLimits(userTier)

    // Validate file size based on package
    if (!isFileSizeAllowed(file.size, userTier)) {
      return NextResponse.json(
        { 
          error: `File size exceeds ${formatFileSize(limits.maxFileSize)} limit for ${limits.name} plan`,
          limit: limits.maxFileSize,
          currentSize: file.size,
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
          error: `Maximum ${limits.maxFilesPerModel} files per model reached for ${limits.name} plan`,
          limit: limits.maxFilesPerModel,
          currentCount: fileCount,
          upgrade: true
        },
        { status: 400 }
      )
    }

    console.log(`📤 Uploading file: ${file.name} (${file.size} bytes)`)

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

    // Step 2: Create training_data record (status: uploaded, will be updated to processing by worker)
    const { data: trainingData, error: dbError } = await supabase
      .from('training_data')
      .insert({
        model_id: modelId,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        status: 'uploaded',
      } as any)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      await supabase.storage.from('training-data').remove([uploadData.path])
      return NextResponse.json(
        { error: 'Failed to save file record', details: dbError.message },
        { status: 500 }
      )
    }

    const td = trainingData as any

    console.log(`✅ File uploaded: ${file.name}`)
    console.log(`📋 Enqueuing processing job...`)

    // Step 3: Enqueue background processing job
    const jobQueue = createJobQueueClient()
    const jobId = await jobQueue.enqueueFileProcessing({
      training_data_id: td.id,
      model_id: modelId,
      file_url: publicUrl,
      file_name: file.name,
      file_type: file.type,
      user_id: user.id,
    } as any)

    if (!jobId) {
      console.error('❌ Failed to enqueue processing job')
      // Don't fail the upload, just mark as failed
      await supabase
        .from('training_data')
        .update({ status: 'failed' } as any)
        .eq('id', td.id)
      
      return NextResponse.json({
        success: false,
        error: 'File uploaded but failed to enqueue processing job',
        fileId: td.id,
      }, { status: 500 })
    }

    console.log(`✅ Processing job enqueued: ${jobId}`)

    // Trigger worker immediately (fire-and-forget for speed)
    console.log(`🚀 Triggering worker for immediate processing...`)

    // Fire-and-forget: Don't await the worker response to avoid blocking upload
    // No timeout - let the worker take as long as it needs
    const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}/api/worker/process-jobs`
    const workerKey = process.env.WORKER_API_KEY

    console.log(`[Worker Trigger] URL: ${workerUrl}`)
    console.log(`[Worker Trigger] API Key exists: ${!!workerKey}`)
    console.log(`[Worker Trigger] API Key length: ${workerKey?.length || 0}`)

    if (!workerKey) {
      console.error(`❌ WORKER_API_KEY not set in environment variables!`)
      console.log(`⚠️  Worker trigger skipped - set WORKER_API_KEY in .env.local`)
    } else {
      fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${workerKey}`,
          'Content-Type': 'application/json',
        },
        // No timeout signal - worker can process as long as needed
      })
        .then(async res => {
          console.log(`[Worker Trigger] Response status: ${res.status}`)
          console.log(`[Worker Trigger] Response ok: ${res.ok}`)

          const responseText = await res.text()
          console.log(`[Worker Trigger] Response body: ${responseText.substring(0, 200)}`)

          if (res.ok) {
            console.log(`✅ Worker triggered successfully`)
          } else {
            console.log(`⚠️  Worker trigger failed (${res.status}) - background worker will process`)
          }
        })
        .catch(err => {
          console.log(`⚠️  Worker trigger error: ${err.name} - ${err.message}`)
          console.log(`⚠️  Background worker will process instead`)
        })
    }

    return NextResponse.json({
      success: true,
      file: {
        id: td.id,
        name: file.name,
        size: file.size,
        status: 'processing',
        jobId,
        progress: 0,
      },
      message: 'File uploaded successfully, processing started',
    }, { status: 201 })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
