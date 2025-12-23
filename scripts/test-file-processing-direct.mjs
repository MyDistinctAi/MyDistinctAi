/**
 * Direct file processing test
 * Bypasses API routes to test RAG processing directly
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ekfdbotohslpalnyvdpk.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZmRib3RvaHNscGFsbnl2ZHBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk2MjIxMSwiZXhwIjoyMDc2NTM4MjExfQ.EAqXIjfGI7YZNpxzT-hZRuMidRHjWlC1HVN8beo8rm8'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// File to process
const trainingDataId = '3dd4f5fb-1fe3-4dc8-9148-a27ed3bba404'

console.log('🧪 Testing Direct File Processing\n')
console.log('Training Data ID:', trainingDataId)
console.log('')

try {
  // 1. Fetch training data
  console.log('1️⃣ Fetching training data record...')
  const { data: trainingData, error: fetchError } = await supabase
    .from('training_data')
    .select('*')
    .eq('id', trainingDataId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch training data: ${fetchError.message}`)
  }

  console.log('   ✅ Found:', trainingData.file_name)
  console.log('   Model ID:', trainingData.model_id)
  console.log('   File URL:', trainingData.file_url)
  console.log('')

  // 2. Fetch file content
  console.log('2️⃣ Downloading file from storage...')
  const response = await fetch(trainingData.file_url)

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  console.log(`   ✅ Downloaded ${text.length} characters`)
  console.log('')

  // 3. Chunk the text
  console.log('3️⃣ Chunking text...')
  const chunks = []
  const chunkSize = 1000
  const overlap = 200

  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    const chunk = text.slice(i, Math.min(i + chunkSize, text.length))
    if (chunk.trim().length >= 100) {  // minChunkSize
      chunks.push({
        text: chunk.trim(),
        index: chunks.length,
        startChar: i,
        endChar: i + chunk.length,
      })
    }
  }

  console.log(`   ✅ Created ${chunks.length} chunks`)
  console.log('')

  // 4. Generate embeddings
  console.log('4️⃣ Generating embeddings with Ollama...')
  const embeddings = []

  for (let i = 0; i < chunks.length; i++) {
    process.stdout.write(`   Processing chunk ${i + 1}/${chunks.length}...\r`)

    const embeddingResponse = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: chunks[i].text,
      }),
    })

    if (!embeddingResponse.ok) {
      throw new Error(`Failed to generate embedding: ${embeddingResponse.statusText}`)
    }

    const embeddingData = await embeddingResponse.json()
    embeddings.push(embeddingData.embedding)
  }

  console.log(`\n   ✅ Generated ${embeddings.length} embeddings (${embeddings[0].length} dimensions each)`)
  console.log('')

  // 5. Store in database
  console.log('5️⃣ Storing embeddings in database...')
  const embeddingsData = chunks.map((chunk, index) => ({
    model_id: trainingData.model_id,
    training_data_id: trainingDataId,
    chunk_text: chunk.text,
    chunk_index: chunk.index,
    start_char: chunk.startChar,
    end_char: chunk.endChar,
    embedding: JSON.stringify(embeddings[index]),
    metadata: {
      fileName: trainingData.file_name,
      fileType: trainingData.file_type || 'text/plain',
    },
  }))

  const { error: insertError, count } = await supabase
    .from('document_embeddings')
    .insert(embeddingsData)
    .select('id', { count: 'exact' })

  if (insertError) {
    throw new Error(`Failed to insert embeddings: ${insertError.message}`)
  }

  console.log(`   ✅ Stored ${count} embeddings`)
  console.log('')

  // 6. Update training_data status
  console.log('6️⃣ Updating training data status...')
  const { error: updateError } = await supabase
    .from('training_data')
    .update({
      status: 'processed',
      processed_at: new Date().toISOString(),
    })
    .eq('id', trainingDataId)

  if (updateError) {
    throw new Error(`Failed to update status: ${updateError.message}`)
  }

  console.log('   ✅ Status updated to "processed"')
  console.log('')

  // 7. Test retrieval
  console.log('7️⃣ Testing context retrieval...')
  const testQuery = 'What are the pricing tiers?'

  // Generate query embedding
  const queryEmbeddingRes = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: testQuery,
    }),
  })

  const queryEmbeddingData = await queryEmbeddingRes.json()

  // Search for similar documents
  const { data: matches, error: searchError } = await supabase.rpc('match_documents', {
    query_embedding: JSON.stringify(queryEmbeddingData.embedding),
    match_model_id: trainingData.model_id,
    match_count: 3,
    similarity_threshold: 0.5,
  })

  if (searchError) {
    throw new Error(`Search failed: ${searchError.message}`)
  }

  console.log(`   ✅ Found ${matches.length} relevant chunks:`)
  matches.forEach((match, i) => {
    console.log(`      ${i + 1}. Similarity: ${(match.similarity * 100).toFixed(1)}%`)
    console.log(`         Preview: "${match.chunk_text.substring(0, 60)}..."`)
  })
  console.log('')

  console.log('✅ File Processing Complete!')
  console.log('')
  console.log('📊 Summary:')
  console.log(`   - File: ${trainingData.file_name}`)
  console.log(`   - Characters: ${text.length}`)
  console.log(`   - Chunks: ${chunks.length}`)
  console.log(`   - Embeddings: ${embeddings.length}`)
  console.log(`   - Model: ${trainingData.model_id}`)
  console.log('')
  console.log('🎉 You can now chat with this model and it will use the file context!')

} catch (error) {
  console.error('\n❌ Error:', error.message)
  console.error(error)
  process.exit(1)
}
