/**
 * Re-process All Training Files
 * Processes all training files that have been uploaded but don't have embeddings
 */

import { createClient } from '@supabase/supabase-js'
import { processTrainingFile } from './src/lib/rag-service.js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function reprocessAllFiles() {
  console.log('🔄 Re-processing All Training Files...\n')

  // 1. Get all models
  const { data: models, error: modelsError } = await supabase
    .from('models')
    .select('id, name, status')
    .eq('status', 'ready')
    .order('created_at', { ascending: false })

  if (modelsError || !models || models.length === 0) {
    console.error('❌ No models found')
    return
  }

  console.log(`📊 Found ${models.length} models\n`)

  let totalProcessed = 0
  let totalFailed = 0

  // 2. Process each model
  for (const model of models) {
    console.log(`\n📁 Processing model: ${model.name} (${model.id})`)

    // Get training files for this model
    const { data: trainingFiles, error: filesError } = await supabase
      .from('training_data')
      .select('*')
      .eq('model_id', model.id)
      .in('status', ['uploaded', 'processed']) // Include both uploaded and "processed" files

    if (filesError || !trainingFiles || trainingFiles.length === 0) {
      console.log('  ⚠️  No training files found')
      continue
    }

    console.log(`  Found ${trainingFiles.length} training files`)

    // Check which files have embeddings
    for (const file of trainingFiles) {
      // Check if embeddings exist for this file
      const { count, error: countError } = await supabase
        .from('document_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('training_data_id', file.id)

      const hasEmbeddings = !countError && count && count > 0

      if (hasEmbeddings) {
        console.log(`  ✅ ${file.file_name} - Already has ${count} embeddings, skipping`)
        continue
      }

      console.log(`  🔄 Processing: ${file.file_name}`)

      try {
        // Update status to processing
        await supabase
          .from('training_data')
          .update({ status: 'processing' })
          .eq('id', file.id)

        // Process the file
        const result = await processTrainingFile(
          file.id,
          model.id,
          file.file_url,
          file.file_name,
          file.file_type,
          supabase
        )

        if (result.success) {
          console.log(`    ✅ Success!`)
          console.log(`       - Extracted: ${result.stats.extractedText} chars`)
          console.log(`       - Chunks: ${result.stats.chunks}`)
          console.log(`       - Embeddings: ${result.stats.embeddings}`)
          console.log(`       - Time: ${(result.stats.processingTime / 1000).toFixed(1)}s`)
          totalProcessed++
        } else {
          console.error(`    ❌ Failed: ${result.error}`)
          totalFailed++
        }
      } catch (error) {
        console.error(`    ❌ Error: ${error.message}`)
        totalFailed++
        
        // Update status to failed
        await supabase
          .from('training_data')
          .update({ status: 'failed' })
          .eq('id', file.id)
      }

      // Rate limiting - wait between files
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Processing Complete!')
  console.log('='.repeat(60))
  console.log(`✅ Successfully processed: ${totalProcessed} files`)
  console.log(`❌ Failed: ${totalFailed} files`)
  console.log('')

  if (totalProcessed > 0) {
    console.log('🎉 RAG system is now ready!')
    console.log('💡 Test it by sending a chat message')
  }
}

reprocessAllFiles().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
