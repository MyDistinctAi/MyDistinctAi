/**
 * Process PDF Files
 * Extract text, generate embeddings, and store them
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import pdf from 'pdf-parse/lib/pdf-parse.js'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openrouterKey = process.env.OPENROUTER_API_KEY

if (!supabaseUrl || !supabaseKey || !openrouterKey) {
  console.error('❌ Missing required credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Chunk text
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

// Generate embedding
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

async function processPDFFile(file) {
  console.log(`\n📄 Processing: ${file.file_name}`)
  console.log(`   Model: ${file.model_id}`)
  
  try {
    // 1. Download PDF
    console.log('   📥 Downloading PDF...')
    const pdfUrl = file.file_url
    const pdfResponse = await fetch(pdfUrl)
    
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF: ${pdfResponse.status}`)
    }
    
    const pdfBuffer = await pdfResponse.arrayBuffer()
    console.log(`   ✅ Downloaded ${pdfBuffer.byteLength} bytes`)

    // 2. Extract text from PDF
    console.log('   📖 Extracting text from PDF...')
    const data = await pdf(Buffer.from(pdfBuffer))
    const text = data.text
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text extracted from PDF')
    }
    
    console.log(`   ✅ Extracted ${text.length} characters`)
    console.log(`   📄 Pages: ${data.numpages}`)

    // 3. Chunk text
    console.log('   ✂️  Chunking text...')
    const chunks = chunkText(text, 1000, 200)
    console.log(`   ✅ Created ${chunks.length} chunks`)

    // 4. Generate embeddings
    console.log('   🔢 Generating embeddings...')
    const embeddings = []
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      
      try {
        const embedding = await generateEmbedding(chunk.text)
        embeddings.push(embedding)
        
        if ((i + 1) % 5 === 0 || i === chunks.length - 1) {
          console.log(`      Progress: ${i + 1}/${chunks.length} embeddings`)
        }
      } catch (error) {
        console.error(`      ❌ Chunk ${i + 1} failed: ${error.message}`)
        throw error
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`   ✅ Generated ${embeddings.length} embeddings`)

    // 5. Store embeddings
    console.log('   💾 Storing in database...')
    const embeddingsData = chunks.map((chunk, index) => ({
      model_id: file.model_id,
      training_data_id: file.id,
      chunk_text: chunk.text,
      chunk_index: chunk.index,
      start_char: chunk.startChar,
      end_char: chunk.endChar,
      embedding: embeddings[index],
      metadata: {
        file_name: file.file_name,
        file_type: 'pdf',
        pages: data.numpages
      }
    }))

    const { data: stored, error: storeError } = await supabase
      .from('document_embeddings')
      .insert(embeddingsData)
      .select('id')

    if (storeError) {
      throw new Error(`Storage failed: ${storeError.message}`)
    }

    console.log(`   ✅ Stored ${stored?.length || embeddings.length} embeddings`)

    // 6. Update file status
    await supabase
      .from('training_data')
      .update({ 
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', file.id)

    console.log(`   ✅ File marked as processed`)

    return { success: true, chunks: chunks.length, embeddings: embeddings.length }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    
    // Update status to failed
    await supabase
      .from('training_data')
      .update({ status: 'failed' })
      .eq('id', file.id)
    
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('🚀 Processing PDF Files\n')

  // Find unprocessed PDF files
  const { data: pdfFiles, error } = await supabase
    .from('training_data')
    .select('*')
    .ilike('file_name', '%.pdf')
    .eq('status', 'uploaded')
    .order('created_at', { ascending: false })

  if (error || !pdfFiles || pdfFiles.length === 0) {
    console.log('No unprocessed PDF files found')
    return
  }

  console.log(`Found ${pdfFiles.length} unprocessed PDF file(s)`)

  let processed = 0
  let failed = 0

  for (const file of pdfFiles) {
    const result = await processPDFFile(file)
    
    if (result.success) {
      processed++
    } else {
      failed++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Processing Complete!')
  console.log('='.repeat(60))
  console.log(`✅ Successfully processed: ${processed} files`)
  console.log(`❌ Failed: ${failed} files`)
  
  if (processed > 0) {
    console.log('\n🎉 PDF files are now ready for RAG!')
    console.log('💡 Try asking about the content again')
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
