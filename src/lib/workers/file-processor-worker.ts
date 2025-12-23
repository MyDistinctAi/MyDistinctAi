/**
 * File Processing Worker
 * Background worker that processes file processing jobs from the queue
 */

import { createJobQueueClient, Job, JobType, ProcessFileJobPayload } from '../job-queue'
import { processTrainingFile } from '../rag-service'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Process a single file processing job
 */
async function processFileJob(job: Job): Promise<void> {
  const payload = job.payload as any // Handle both camelCase and snake_case

  // Extract fields - handle both naming conventions
  const trainingDataId = payload.trainingDataId || payload.training_data_id
  const modelId = payload.modelId || payload.model_id
  const fileUrl = payload.fileUrl || payload.file_url
  const fileName = payload.fileName || payload.file_name
  const fileType = payload.fileType || payload.file_type

  console.log(`[Worker] Processing file job ${job.id}:`, fileName)

  // Create Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Process the file
  const result = await processTrainingFile(
    trainingDataId,
    modelId,
    fileUrl,
    fileName,
    fileType,
    supabase
  )

  if (!result.success) {
    throw new Error(result.error || 'Failed to process file')
  }

  console.log(`[Worker] File processed successfully:`, result.stats)
}

/**
 * Worker main loop
 */
export async function startFileProcessorWorker(): Promise<void> {
  console.log('[Worker] File Processor Worker starting...')

  const jobQueue = createJobQueueClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  let isRunning = true
  let consecutiveErrors = 0
  const MAX_CONSECUTIVE_ERRORS = 5

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[Worker] SIGTERM received, shutting down gracefully...')
    isRunning = false
  })

  process.on('SIGINT', () => {
    console.log('[Worker] SIGINT received, shutting down gracefully...')
    isRunning = false
  })

  while (isRunning) {
    try {
      // Get next job
      const job = await jobQueue.getNextJob()

      if (!job) {
        // No jobs available, wait before checking again
        consecutiveErrors = 0
        await sleep(5000) // 5 seconds
        continue
      }

      console.log(`[Worker] Processing job ${job.id} (${job.job_type})`)

      try {
        // Process based on job type
        switch (job.job_type) {
          case JobType.PROCESS_FILE:
          case JobType.PROCESS_TRAINING_DATA:
            await processFileJob(job)
            break

          default:
            throw new Error(`Unknown job type: ${job.job_type}`)
        }

        // Mark job as completed
        await jobQueue.completeJob(job.id, {
          processedAt: new Date().toISOString(),
        })

        consecutiveErrors = 0
      } catch (jobError) {
        console.error(`[Worker] Job ${job.id} failed:`, jobError)

        // Mark job as failed
        const errorMessage = jobError instanceof Error ? jobError.message : 'Unknown error'
        await jobQueue.failJob(job.id, errorMessage, true) // Allow retry

        consecutiveErrors++
      }

      // If too many consecutive errors, back off
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error(`[Worker] Too many consecutive errors (${consecutiveErrors}), backing off...`)
        await sleep(60000) // 1 minute
        consecutiveErrors = 0
      }
    } catch (error) {
      console.error('[Worker] Error in worker loop:', error)
      consecutiveErrors++

      // Back off on errors
      await sleep(Math.min(1000 * Math.pow(2, consecutiveErrors), 60000))
    }
  }

  console.log('[Worker] Worker stopped')
}

/**
 * Helper function to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Start worker if run directly
if (require.main === module) {
  console.log('[Worker] Starting File Processor Worker...')
  startFileProcessorWorker().catch((error) => {
    console.error('[Worker] Fatal error:', error)
    process.exit(1)
  })
}
