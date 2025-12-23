/**
 * Background Worker Script
 * Runs the file processing worker
 */

import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '..', '.env.local') })

// Dynamic import of the worker
const { startFileProcessorWorker } = await import('../src/lib/workers/file-processor-worker.ts')

console.log('🔄 Starting Background Worker...\n')

// Start the worker
startFileProcessorWorker().catch((error) => {
  console.error('❌ Worker failed:', error)
  process.exit(1)
})
