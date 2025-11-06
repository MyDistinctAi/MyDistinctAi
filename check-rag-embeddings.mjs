/**
 * Check RAG Embeddings in Database
 * Diagnose why RAG context is not being retrieved
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRAGEmbeddings() {
  console.log('🔍 Checking RAG Embeddings...\n')

  // 1. Check all models
  console.log('📊 Models in database:')
  const { data: models, error: modelsError } = await supabase
    .from('models')
    .select('id, name, status')
    .order('created_at', { ascending: false })

  if (modelsError) {
    console.error('❌ Error fetching models:', modelsError)
    return
  }

  if (!models || models.length === 0) {
    console.log('⚠️  No models found')
    return
  }

  console.log(`Found ${models.length} models:`)
  models.forEach((model, i) => {
    console.log(`  ${i + 1}. ${model.name} (${model.id}) - Status: ${model.status}`)
  })
  console.log()

  // 2. Check training data for each model
  for (const model of models) {
    console.log(`\n📁 Training data for model: ${model.name}`)
    
    const { data: trainingData, error: trainingError } = await supabase
      .from('training_data')
      .select('id, file_name, status, processed_at')
      .eq('model_id', model.id)

    if (trainingError) {
      console.error('  ❌ Error:', trainingError)
      continue
    }

    if (!trainingData || trainingData.length === 0) {
      console.log('  ⚠️  No training data files')
      continue
    }

    console.log(`  Found ${trainingData.length} files:`)
    trainingData.forEach((file, i) => {
      console.log(`    ${i + 1}. ${file.file_name} - Status: ${file.status}`)
      if (file.processed_at) {
        console.log(`       Processed: ${new Date(file.processed_at).toLocaleString()}`)
      }
    })

    // 3. Check embeddings for this model
    console.log(`\n  🔢 Embeddings for model: ${model.name}`)
    
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('document_embeddings')
      .select('id, chunk_text, embedding')
      .eq('model_id', model.id)
      .limit(10)

    if (embeddingsError) {
      console.error('  ❌ Error:', embeddingsError)
      continue
    }

    if (!embeddings || embeddings.length === 0) {
      console.log('  ❌ NO EMBEDDINGS FOUND - This is the problem!')
      console.log('  → Training data was uploaded but not processed into embeddings')
      console.log('  → Run the file processor to generate embeddings')
      continue
    }

    console.log(`  ✅ Found ${embeddings.length} embeddings (showing first 10)`)
    embeddings.forEach((emb, i) => {
      const preview = emb.chunk_text.substring(0, 60).replace(/\n/g, ' ')
      const dimensions = emb.embedding ? emb.embedding.length : 'unknown'
      console.log(`    ${i + 1}. "${preview}..." (${dimensions}D)`)
    })

    // 4. Count total embeddings
    const { count, error: countError } = await supabase
      .from('document_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('model_id', model.id)

    if (!countError && count !== null) {
      console.log(`  📊 Total embeddings: ${count}`)
    }
  }

  console.log('\n✅ Diagnosis complete!')
  console.log('\n💡 If no embeddings were found:')
  console.log('   1. Upload training files to your model')
  console.log('   2. Run: node process-file-directly.mjs')
  console.log('   3. Or use the file processor worker')
}

checkRAGEmbeddings().catch(console.error)
