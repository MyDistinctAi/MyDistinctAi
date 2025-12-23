/**
 * Worker Health Check Endpoint
 * Returns worker status, job queue stats, and any issues
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createJobQueueClient } from '@/lib/job-queue'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const jobQueue = createJobQueueClient()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get job queue statistics
    const stats = await jobQueue.getStats()

    // Get worker heartbeat
    const { data: heartbeat } = await supabase
      .from('worker_heartbeat')
      .select('*')
      .eq('worker_name', 'main-worker')
      .single()

    // Get stuck jobs
    const { data: stuckJobs } = await supabase.rpc('detect_stuck_jobs')

    // Detect issues
    const issues = []
    const warnings = []

    // Check for stuck jobs
    if (stuckJobs && stuckJobs.length > 0) {
      issues.push({
        type: 'stuck_jobs',
        severity: 'high',
        message: `${stuckJobs.length} jobs stuck in processing`,
        count: stuckJobs.length
      })
    }

    // Check for high queue backlog
    if (stats && stats.pending_jobs > 50) {
      warnings.push({
        type: 'queue_backlog',
        severity: 'medium',
        message: `High queue backlog: ${stats.pending_jobs} pending jobs`,
        count: stats.pending_jobs
      })
    }

    // Check for too many processing jobs
    if (stats && stats.processing_jobs > 10) {
      warnings.push({
        type: 'too_many_processing',
        severity: 'medium',
        message: `Too many processing jobs: ${stats.processing_jobs}`,
        count: stats.processing_jobs
      })
    }

    // Check worker heartbeat (should run at least every 2 minutes)
    const workerStale = heartbeat && 
      new Date(heartbeat.last_run).getTime() < Date.now() - 2 * 60 * 1000

    if (workerStale) {
      issues.push({
        type: 'worker_stale',
        severity: 'high',
        message: 'Worker hasn\'t run in over 2 minutes',
        lastRun: heartbeat.last_run
      })
    }

    // Determine overall status
    let status = 'healthy'
    if (issues.length > 0) {
      status = 'unhealthy'
    } else if (warnings.length > 0) {
      status = 'degraded'
    }

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      worker: {
        name: 'main-worker',
        lastRun: heartbeat?.last_run || null,
        jobsProcessed: heartbeat?.jobs_processed || 0,
        errors: heartbeat?.errors || 0,
        isStale: workerStale
      },
      queue: {
        total: stats?.total_jobs || 0,
        pending: stats?.pending_jobs || 0,
        processing: stats?.processing_jobs || 0,
        completed: stats?.completed_jobs || 0,
        failed: stats?.failed_jobs || 0
      },
      stuckJobs: stuckJobs?.length || 0,
      issues,
      warnings
    })

  } catch (error) {
    console.error('[Health Check] Error:', error)
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
