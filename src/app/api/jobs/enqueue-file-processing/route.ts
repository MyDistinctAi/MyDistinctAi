import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/jobs/enqueue-file-processing
 * Enqueue a file processing job to the background job queue
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { trainingDataId, modelId, fileUrl, fileName, fileType } = body

    // Validate required fields
    if (!trainingDataId || !modelId || !fileUrl || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields: trainingDataId, modelId, fileUrl, fileName' },
        { status: 400 }
      )
    }

    // Create job payload
    const payload = {
      user_id: user.id,
      training_data_id: trainingDataId,
      model_id: modelId,
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType || 'unknown',
    }

    // Enqueue job using database function
    const { data: jobData, error: jobError } = (await supabase.rpc('enqueue_job', {
      p_job_type: 'file_processing',
      p_payload: payload,
      p_priority: 0,
    } as any)) as { data: string | null; error: any }

    if (jobError) {
      console.error('Failed to enqueue job:', jobError)
      return NextResponse.json(
        { error: 'Failed to enqueue job', details: jobError.message },
        { status: 500 }
      )
    }

    console.log(`✅ File processing job enqueued: ${jobData} for file: ${fileName}`)

    // Trigger immediate processing (fire-and-forget)
    console.log(`[ENQUEUE] Triggering immediate processing for: ${trainingDataId}`)

    const processUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}/api/training/process`

    fetch(processUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trainingDataId }),
    })
      .then(res => {
        if (res.ok) {
          console.log(`[ENQUEUE] ✅ Processing triggered for ${fileName}`)
        } else {
          console.log(`[ENQUEUE] ⚠️ Processing trigger failed: ${res.status}`)
        }
      })
      .catch(err => {
        console.log(`[ENQUEUE] ⚠️ Processing trigger error: ${err.message}`)
      })

    return NextResponse.json(
      {
        success: true,
        jobId: jobData,
        message: 'File processing job enqueued and processing triggered',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in enqueue-file-processing:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
