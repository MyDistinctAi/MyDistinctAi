/**
 * Fix Embeddings Storage Issue
 * Process a file and verify embeddings are stored correctly
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fetch from 'node-fetch'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiKey = process.env.OPENAI_API_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

if (!openaiKey) {
  console.error('❌ Missing OpenAI API key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Simple text chunking
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
        start_char: start,
        end_char: end
      })
    }
    
    start += chunkSize - overlap
  }
  
  return chunks
}

// Generate embedding using OpenAI
async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

async function fixEmbeddingsStorage() {
  console.log('🔧 Fixing Embeddings Storage...\n')

  // Get a model with processed files but no embeddings
  const modelId = '353608a6-c981-4dfb-9e75-c70fcdeeba2b' // Test File Upload Model

  console.log(`📊 Processing model: ${modelId}`)

  // Get training data
  const { data: trainingFiles, error: filesError } = await supabase
    .from('training_data')
    .select('*')
    .eq('model_id', modelId)
    .eq('status', 'processed')
    .limit(1)

  if (filesError || !trainingFiles || trainingFiles.length === 0) {
    console.error('❌ No processed files found')
    return
  }

  const file = trainingFiles[0]
  console.log(`\n📁 Processing file: ${file.file_name}`)

  // Download file content
  console.log('📥 Downloading file...')
  const { data: fileData, error: downloadError } = await supabase
    .storage
    .from('training-data')
    .download(file.file_url.split('/training-data/')[1])

  if (downloadError || !fileData) {
    console.error('❌ Failed to download file:', downloadError)
    return
  }

  const text = await fileData.text()
  console.log(`✅ Downloaded ${text.length} characters`)

  // Chunk the text
  console.log('\n✂️  Chunking text...')
  const chunks = chunkText(text, 1000, 200)
  console.log(`✅ Created ${chunks.length} chunks`)

  // Generate embeddings
  console.log('\n🔢 Generating embeddings...')
  const embeddings = []
  
  for (let i = 0; i < Math.min(chunks.length, 3); i++) {
    const chunk = chunks[i]
    console.log(`  Processing chunk ${i + 1}/${chunks.length}...`)
    
    try {
      const embedding = await generateEmbedding(chunk.text)
      embeddings.push({
        model_id: modelId,
        training_data_id: file.id,
        chunk_index: chunk.index,
        chunk_text: chunk.text,
        embedding: embedding,
        metadata: {
          start_char: chunk.start_char,
          end_char: chunk.end_char,
          file_name: file.file_name
        }
      })
      console.log(`  ✅ Generated embedding (${embedding.length}D)`)
    } catch (error) {
      console.error(`  ❌ Error:`, error.message)
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Store embeddings
  console.log(`\n💾 Storing ${embeddings.length} embeddings...`)
  
  const { data: stored, error: storeError } = await supabase
    .from('document_embeddings')
    .insert(embeddings)
    .select()

  if (storeError) {
    console.error('❌ Failed to store embeddings:', storeError)
    console.error('Error details:', JSON.stringify(storeError, null, 2))
    return
  }

  console.log(`✅ Successfully stored ${stored?.length || 0} embeddings`)

  // Verify storage
  console.log('\n🔍 Verifying storage...')
  const { data: verification, error: verifyError } = await supabase
    .from('document_embeddings')
    .select('id, chunk_text, embedding')
    .eq('model_id', modelId)
    .limit(5)

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError)
    return
  }

  console.log(`✅ Found ${verification?.length || 0} embeddings in database`)
  if (verification && verification.length > 0) {
    verification.forEach((emb, i) => {
      const preview = emb.chunk_text.substring(0, 60).replace(/\n/g, ' ')
      const dimensions = emb.embedding ? emb.embedding.length : 'unknown'
      console.log(`  ${i + 1}. "${preview}..." (${dimensions}D)`)
    })
  }

  console.log('\n✅ Fix complete!')
}

fixEmbeddingsStorage().catch(console.error)
