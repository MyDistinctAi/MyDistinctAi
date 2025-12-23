#!/usr/bin/env node

/**
 * Local Worker Script
 * Manually trigger the background job worker for development
 * Usage: node scripts/run-worker.mjs
 */

import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const WORKER_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'
const WORKER_API_KEY = process.env.WORKER_API_KEY || 'dev-worker-key'

console.log('🚀 Starting background worker...')
console.log(`📍 Worker URL: ${WORKER_URL}/api/worker/process-jobs`)

async function runWorker() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 300000) // 5 minutes timeout

    const response = await fetch(`${WORKER_URL}/api/worker/process-jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WORKER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      // Increase header timeout
      keepalive: true,
    })

    clearTimeout(timeout)

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Worker completed:', data)
    } else {
      console.error('❌ Worker failed:', data)
    }

    return data
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⏱️  Worker timeout (5 min) - job may still be processing')
      return { success: true, message: 'Timeout - check logs' }
    }
    console.error('❌ Worker error:', error.message || error)
    // Don't throw - just log and continue
    return { success: false, error: error.message }
  }
}

// Run worker in a loop (every 10 seconds)
async function runWorkerLoop() {
  console.log('🔄 Starting worker loop (every 10 seconds)...')
  console.log('Press Ctrl+C to stop\n')

  while (true) {
    try {
      await runWorker()
    } catch (error) {
      console.error('Error in worker loop:', error)
    }

    // Wait 10 seconds before next run
    await new Promise(resolve => setTimeout(resolve, 10000))
  }
}

// Check if we should run once or in a loop
const args = process.argv.slice(2)
const runOnce = args.includes('--once')

if (runOnce) {
  console.log('Running worker once...\n')
  runWorker()
    .then(() => {
      console.log('\n✅ Worker completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Worker failed:', error)
      process.exit(1)
    })
} else {
  runWorkerLoop()
}
