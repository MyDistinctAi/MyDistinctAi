/**
 * Process Training Files with OpenRouter Embeddings
 * Directly processes files and stores embeddings using admin client
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openrouterKey = process.env.OPENROUTER_API_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

if (!openrouterKey) {
  console.error('❌ Missing OpenRouter API key')
  console.log('💡 Add OPENROUTER_API_KEY to .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Chunk text into smaller pieces
function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = []
  let start = 0
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunk = text.substring(start, end)
    
    if (chunk.trim().length > 0) {
      chunks.push({
        text: chunk.trim(),
        index: chunks.length,
        startChar: start,
        endChar: end
      })
    }
    
    start += chunkSize - overlap
  }
  
  return chunks
}

// Generate embedding using OpenRouter
async function generateEmbedding(text) {
  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:4000',
      'X-Title': 'MyDistinctAI'
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: text,
      dimensions: 1536
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

async function processFile(file, modelId) {
  console.log(`\n  📄 Processing: ${file.file_name}`)
  
  try {
    // 1. Download file
    console.log('     📥 Downloading...')
    const filePath = file.file_url.split('/training-data/')[1]
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('training-data')
      .download(filePath)

    if (downloadError || !fileData) {
      throw new Error(`Download failed: ${downloadError?.message}`)
    }

    const text = await fileData.text()
    console.log(`     ✅ Downloaded ${text.length} characters`)

    // 2. Chunk text
    console.log('     ✂️  Chunking...')
    const chunks = chunkText(text, 1000, 200)
    console.log(`     ✅ Created ${chunks.length} chunks`)

    // 3. Generate embeddings
    console.log('     🔢 Generating embeddings...')
    const embeddings = []
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      
      try {
        const embedding = await generateEmbedding(chunk.text)
        embeddings.push(embedding)
        
        if ((i + 1) % 5 === 0 || i === chunks.length - 1) {
          console.log(`        Progress: ${i + 1}/${chunks.length} embeddings`)
        }
      } catch (error) {
        console.error(`        ❌ Chunk ${i + 1} failed: ${error.message}`)
        throw error
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`     ✅ Generated ${embeddings.length} embeddings`)

    // 4. Store embeddings
    console.log('     💾 Storing in database...')
    const embeddingsData = chunks.map((chunk, index) => ({
      model_id: modelId,
      training_data_id: file.id,
      chunk_text: chunk.text,
      chunk_index: chunk.index,
      start_char: chunk.startChar,
      end_char: chunk.endChar,
      embedding: embeddings[index],
      metadata: {
        file_name: file.file_name,
        file_type: file.file_type
      }
    }))

    const { data: stored, error: storeError } = await supabase
      .from('document_embeddings')
      .insert(embeddingsData)
      .select('id')

    if (storeError) {
      throw new Error(`Storage failed: ${storeError.message}`)
    }

    console.log(`     ✅ Stored ${stored?.length || embeddings.length} embeddings`)

    // 5. Update file status
    await supabase
      .from('training_data')
      .update({ 
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', file.id)

    return { success: true, chunks: chunks.length, embeddings: embeddings.length }
  } catch (error) {
    console.error(`     ❌ Error: ${error.message}`)
    
    // Update status to failed
    await supabase
      .from('training_data')
      .update({ status: 'failed' })
      .eq('id', file.id)
    
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('🚀 Processing Training Files with OpenRouter\n')

  // Get all models
  const { data: models, error: modelsError } = await supabase
    .from('models')
    .select('id, name')
    .eq('status', 'ready')
    .order('created_at', { ascending: false })

  if (modelsError || !models || models.length === 0) {
    console.error('❌ No models found')
    return
  }

  console.log(`📊 Found ${models.length} models`)

  let totalProcessed = 0
  let totalFailed = 0

  for (const model of models) {
    console.log(`\n📁 Model: ${model.name}`)

    // Get training files
    const { data: trainingFiles } = await supabase
      .from('training_data')
      .select('*')
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
        console.log(`  ✅ ${file.file_name} - Already has ${count} embeddings`)
        continue
      }

      const result = await processFile(file, model.id)
      
      if (result.success) {
        totalProcessed++
      } else {
        totalFailed++
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Processing Complete!')
  console.log('='.repeat(60))
  console.log(`✅ Successfully processed: ${totalProcessed} files`)
  console.log(`❌ Failed: ${totalFailed} files`)
  
  if (totalProcessed > 0) {
    console.log('\n🎉 RAG system is now ready!')
    console.log('💡 Test by sending a chat message')
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
