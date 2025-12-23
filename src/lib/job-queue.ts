/**
 * Job Queue Service
 * Database-based job queue for background processing
 */

import { createClient } from '@supabase/supabase-js'

// Job types
export enum JobType {
  PROCESS_FILE = 'file_processing',
  PROCESS_MODEL_FILES = 'process_model_files',
  PROCESS_TRAINING_DATA = 'process_training_data',
}

// Job status
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Job interfaces
export interface Job {
  id: string
  job_type: JobType
  status: JobStatus
  priority: number
  payload: Record<string, any>
  result?: Record<string, any>
  error?: string
  attempts: number
  max_attempts: number
  created_at: string
  started_at?: string
  completed_at?: string
  failed_at?: string
  next_retry_at?: string
}

export interface ProcessFileJobPayload {
  trainingDataId: string
  modelId: string
  fileUrl: string
  fileName: string
  fileType?: string
  userId: string
}

export interface ProcessModelFilesJobPayload {
  modelId: string
  userId: string
}

export interface JobStats {
  total_jobs: number
  pending_jobs: number
  processing_jobs: number
  completed_jobs: number
  failed_jobs: number
}

/**
 * Job Queue Client
 * Provides methods to interact with the job queue
 */
export class JobQueueClient {
  private supabase

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Enqueue a new job
   */
  async enqueue(
    jobType: JobType,
    payload: Record<string, any>,
    priority: number = 0
  ): Promise<string | null> {
    try {
      console.log('[Job Queue] Attempting to enqueue job:', {
        jobType,
        payload,
        priority
      })
      
      const { data, error } = await this.supabase.rpc('enqueue_job', {
        p_job_type: jobType,
        p_payload: payload,
        p_priority: priority,
      })

      if (error) {
        console.error('[Job Queue] Failed to enqueue job:', error)
        console.error('[Job Queue] Error details:', JSON.stringify(error, null, 2))
        return null
      }

      if (!data) {
        console.error('[Job Queue] No job ID returned from enqueue_job')
        return null
      }

      console.log(`[Job Queue] ✅ Successfully enqueued ${jobType} job:`, data)
      return data as string
    } catch (error) {
      console.error('[Job Queue] Exception enqueueing job:', error)
      return null
    }
  }

  /**
   * Enqueue a file processing job
   */
  async enqueueFileProcessing(payload: ProcessFileJobPayload): Promise<string | null> {
    return this.enqueue(JobType.PROCESS_FILE, payload, 10) // High priority
  }

  /**
   * Enqueue a model files processing job
   */
  async enqueueModelFilesProcessing(payload: ProcessModelFilesJobPayload): Promise<string | null> {
    return this.enqueue(JobType.PROCESS_MODEL_FILES, payload, 5) // Medium priority
  }

  /**
   * Get next pending job (for workers)
   */
  async getNextJob(): Promise<Job | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_next_job')

      if (error) {
        console.error('[Job Queue] Failed to get next job:', error)
        return null
      }

      if (!data || data.length === 0) {
        return null
      }

      return data[0] as Job
    } catch (error) {
      console.error('[Job Queue] Error getting next job:', error)
      return null
    }
  }

  /**
   * Mark job as completed
   */
  async completeJob(jobId: string, result?: Record<string, any>): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('complete_job', {
        p_job_id: jobId,
        p_result: result || null,
      })

      if (error) {
        console.error('[Job Queue] Failed to complete job:', error)
        return false
      }

      console.log(`[Job Queue] Completed job: ${jobId}`)
      return true
    } catch (error) {
      console.error('[Job Queue] Error completing job:', error)
      return false
    }
  }

  /**
   * Mark job as failed
   */
  async failJob(jobId: string, errorMessage: string, shouldRetry: boolean = true): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('fail_job', {
        p_job_id: jobId,
        p_error: errorMessage,
        p_should_retry: shouldRetry,
      })

      if (error) {
        console.error('[Job Queue] Failed to fail job:', error)
        return false
      }

      console.log(`[Job Queue] Failed job: ${jobId} (retry: ${shouldRetry})`)
      return true
    } catch (error) {
      console.error('[Job Queue] Error failing job:', error)
      return false
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    try {
      const { data, error } = await this.supabase
        .from('job_queue')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) {
        console.error('[Job Queue] Failed to get job:', error)
        return null
      }

      return data as Job
    } catch (error) {
      console.error('[Job Queue] Error getting job:', error)
      return null
    }
  }

  /**
   * Get jobs by user ID
   */
  async getUserJobs(userId: string, limit: number = 10): Promise<Job[]> {
    try {
      const { data, error } = await this.supabase
        .from('job_queue')
        .select('*')
        .eq('payload->>userId', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('[Job Queue] Failed to get user jobs:', error)
        return []
      }

      return (data || []) as Job[]
    } catch (error) {
      console.error('[Job Queue] Error getting user jobs:', error)
      return []
    }
  }

  /**
   * Get job statistics
   */
  async getStats(): Promise<JobStats | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_job_stats')

      if (error) {
        console.error('[Job Queue] Failed to get stats:', error)
        return null
      }

      if (!data || data.length === 0) {
        return null
      }

      return data[0] as JobStats
    } catch (error) {
      console.error('[Job Queue] Error getting stats:', error)
      return null
    }
  }

  /**
   * Clean up old completed jobs
   */
  async cleanup(): Promise<number> {
    try {
      const { data, error } = await this.supabase.rpc('cleanup_old_jobs')

      if (error) {
        console.error('[Job Queue] Failed to cleanup:', error)
        return 0
      }

      console.log(`[Job Queue] Cleaned up ${data} old jobs`)
      return data as number
    } catch (error) {
      console.error('[Job Queue] Error cleaning up:', error)
      return 0
    }
  }
}

/**
 * Create a job queue client
 */
export function createJobQueueClient(supabaseUrl?: string, supabaseKey?: string): JobQueueClient {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!

  return new JobQueueClient(url, key)
}
