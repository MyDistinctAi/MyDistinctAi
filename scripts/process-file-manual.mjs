/**
 * Manual file processing script
 * Processes a training file to generate embeddings
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const trainingDataId = '4998bf2c-ced8-40a4-97ae-bf6501dede43'
const modelId = '87f4997c-7114-4a62-908e-6d8f10988c4d'
const fileUrl =
  'https://ekfdbotohslpalnyvdpk.supabase.co/storage/v1/object/public/training-data/68df2d44-5377-471a-a121-2f4023131a5c/87f4997c-7114-4a62-908e-6d8f10988c4d/1761610183531-Landing%20Page%20Content.txt'
const fileName = 'Landing Page Content.txt'

console.log('Starting file processing...')
console.log('Training Data ID:', trainingDataId)
console.log('Model ID:', modelId)
console.log('File URL:', fileUrl)

// Import the processing function
const processFile = async () => {
  try {
    // Fetch file content
    console.log('\n1. Fetching file content...')
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    const text = await response.text()
    console.log(`✓ File fetched (${text.length} characters)`)

    // Chunk the text
    console.log('\n2. Chunking text...')
    const chunks = []
    const chunkSize = 1000
    const overlap = 200

    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      const chunk = text.slice(i, i + chunkSize)
      chunks.push({
        text: chunk.trim(),
        index: chunks.length,
        startChar: i,
        endChar: i + chunk.length,
      })
    }
    console.log(`✓ Created ${chunks.length} chunks`)

    // Generate embeddings
    console.log('\n3. Generating embeddings with Ollama...')
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
    console.log(`\n✓ Generated ${embeddings.length} embeddings`)

    // Store in database
    console.log('\n4. Storing embeddings in database...')
    const embeddingsData = chunks.map((chunk, index) => ({
      model_id: modelId,
      training_data_id: trainingDataId,
      chunk_text: chunk.text,
      chunk_index: chunk.index,
      start_char: chunk.startChar,
      end_char: chunk.endChar,
      embedding: JSON.stringify(embeddings[index]),
      metadata: {
        fileName,
        fileType: 'text/plain',
      },
    }))

    const { error: insertError } = await supabase.from('document_embeddings').insert(embeddingsData)

    if (insertError) {
      throw new Error(`Failed to insert embeddings: ${insertError.message}`)
    }

    console.log(`✓ Stored ${embeddingsData.length} embeddings`)

    // Update training_data status
    console.log('\n5. Updating training data status...')
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

    console.log('✓ Status updated to processed')

    console.log('\n✅ File processing complete!')
    console.log('\nYou can now chat with your model and it will have access to this file.')
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

processFile()
