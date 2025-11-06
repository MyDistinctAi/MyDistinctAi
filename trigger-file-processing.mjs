/**
 * Trigger File Processing via API
 * Calls the file processing API endpoint for all unprocessed files
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function triggerFileProcessing() {
  console.log('🔄 Triggering File Processing...\n')

  // 1. Get all models with training files
  const { data: models, error: modelsError } = await supabase
    .from('models')
    .select('id, name')
    .eq('status', 'ready')

  if (modelsError || !models || models.length === 0) {
    console.error('❌ No models found')
    return
  }

  console.log(`📊 Found ${models.length} models\n`)

  let totalTriggered = 0

  // 2. For each model, get unprocessed files
  for (const model of models) {
    console.log(`\n📁 Model: ${model.name}`)

    // Get files that need processing (no embeddings)
    const { data: trainingFiles } = await supabase
      .from('training_data')
      .select('id, file_name, status')
      .eq('model_id', model.id)
      .in('status', ['uploaded', 'processed'])

    if (!trainingFiles || trainingFiles.length === 0) {
      console.log('  ⚠️  No training files')
      continue
    }

    for (const file of trainingFiles) {
      // Check if embeddings exist
      const { count } = await supabase
        .from('document_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('training_data_id', file.id)

      if (count && count > 0) {
        console.log(`  ✅ ${file.file_name} - Has ${count} embeddings`)
        continue
      }

      console.log(`  🔄 Triggering: ${file.file_name}`)

      try {
        // Call the processing API endpoint
        const response = await fetch('http://localhost:4000/api/jobs/process-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trainingDataId: file.id,
            modelId: model.id,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          console.log(`    ✅ Triggered successfully`)
          totalTriggered++
        } else {
          const error = await response.text()
          console.error(`    ❌ Failed: ${response.status} - ${error}`)
        }
      } catch (error) {
        console.error(`    ❌ Error: ${error.message}`)
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`✅ Triggered processing for ${totalTriggered} files`)
  console.log('⏳ Files will be processed in the background')
  console.log('💡 Check server logs to monitor progress')
  console.log('='.repeat(60))
}

triggerFileProcessing().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
