import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/jobs/worker
 * Background worker that processes pending jobs from the queue
 * This should be called by a cron job (e.g., every minute)
 * 
 * Usage:
 * - Set up a cron job: curl http://localhost:4000/api/jobs/worker
 * - Or use Vercel Cron Jobs
 * - Or use a service like cron-job.org
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Optional: Add authentication for the worker endpoint
    const authHeader = request.headers.get('authorization')
    const workerSecret = process.env.WORKER_SECRET

    if (workerSecret && authHeader !== `Bearer ${workerSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let processedCount = 0
    let failedCount = 0
    const maxJobs = 10 // Process up to 10 jobs per run

    // Process jobs until queue is empty or max reached
    for (let i = 0; i < maxJobs; i++) {
      // Call the process-next endpoint
      const processResponse = await fetch(
        `${request.nextUrl.origin}/api/jobs/process-next`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const result = await processResponse.json()

      if (processResponse.status === 200 && result.success) {
        processedCount++
        console.log(`✅ Processed job ${result.jobId}`)
      } else if (result.message === 'No jobs available') {
        // Queue is empty
        break
      } else {
        failedCount++
        console.error(`❌ Failed to process job:`, result.error)
      }

      // Small delay between jobs to avoid overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return NextResponse.json(
      {
        success: true,
        processedCount,
        failedCount,
        message: `Processed ${processedCount} jobs, ${failedCount} failed`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in job worker:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
