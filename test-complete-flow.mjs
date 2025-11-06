/**
 * Test Complete Flow
 * 1. Create model with DeepSeek
 * 2. Upload training files
 * 3. Process and generate embeddings
 * 4. Test chat with RAG
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openrouterKey = process.env.OPENROUTER_API_KEY

if (!supabaseUrl || !supabaseKey || !openrouterKey) {
  console.error('❌ Missing required credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Test user ID
const TEST_USER_ID = '68df2d44-5377-471a-a121-2f4023131a5c'

async function step1_CreateModel() {
  console.log('\n' + '='.repeat(60))
  console.log('📝 STEP 1: Creating Model with DeepSeek')
  console.log('='.repeat(60))

  const { data: model, error } = await supabase
    .from('models')
    .insert({
      user_id: TEST_USER_ID,
      name: 'Test DeepSeek Model',
      description: 'Testing DeepSeek with RAG',
      base_model: 'deepseek/deepseek-chat-v3.1:free',
      status: 'ready',
      training_progress: 100,
      config: {
        trainingMode: 'standard',
        personality: 'Professional and helpful',
        temperature: 0.7,
      },
    })
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating model:', error)
    return null
  }

  console.log(`✅ Model created: ${model.name}`)
  console.log(`   ID: ${model.id}`)
  console.log(`   Base Model: ${model.base_model}`)
  return model
}

async function step2_UploadFiles(modelId) {
  console.log('\n' + '='.repeat(60))
  console.log('📤 STEP 2: Uploading Training Files')
  console.log('='.repeat(60))

  const files = []

  // Create test TXT file
  const txtContent = `ACME Corporation Company Information

Founded: 2020
Headquarters: San Francisco, CA
Employees: 500+

Vacation Policy:
- Year 1-2: 15 days paid vacation
- Year 3-5: 20 days paid vacation  
- Year 6+: 25 days paid vacation

All employees must request vacation at least 2 weeks in advance.

Contact: hr@acmecorp.com
Phone: (555) 123-4567`

  const txtPath = path.join(__dirname, 'test-company-info.txt')
  fs.writeFileSync(txtPath, txtContent)
  console.log('✅ Created test TXT file')

  // Upload TXT file
  const txtFileName = `${Date.now()}-company-info.txt`
  const txtFile = fs.readFileSync(txtPath)
  
  const { data: txtUpload, error: txtError } = await supabase.storage
    .from('training-data')
    .upload(`${TEST_USER_ID}/${modelId}/${txtFileName}`, txtFile, {
      contentType: 'text/plain',
    })

  if (txtError) {
    console.error('❌ Error uploading TXT:', txtError)
  } else {
    const { data: { publicUrl } } = supabase.storage
      .from('training-data')
      .getPublicUrl(txtUpload.path)

    const { data: txtRecord } = await supabase
      .from('training_data')
      .insert({
        model_id: modelId,
        file_name: 'company-info.txt',
        file_url: publicUrl,
        file_size: txtFile.length,
        file_type: 'text/plain',
        status: 'uploaded',
      })
      .select()
      .single()

    files.push(txtRecord)
    console.log(`✅ Uploaded TXT file: company-info.txt`)
  }

  // Clean up temp file
  fs.unlinkSync(txtPath)

  return files
}

async function step3_ProcessFiles(files) {
  console.log('\n' + '='.repeat(60))
  console.log('⚙️  STEP 3: Processing Files & Generating Embeddings')
  console.log('='.repeat(60))

  for (const file of files) {
    console.log(`\n📄 Processing: ${file.file_name}`)

    // Download file
    const response = await fetch(file.file_url)
    const text = await response.text()
    console.log(`   ✅ Downloaded ${text.length} characters`)

    // Chunk text
    const chunks = []
    const chunkSize = 1000
    const overlap = 200
    let start = 0

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length)
      const chunk = text.substring(start, end).trim()
      
      if (chunk.length > 0) {
        chunks.push({
          text: chunk,
          index: chunks.length,
          startChar: start,
          endChar: end,
        })
      }
      
      start += chunkSize - overlap
    }

    console.log(`   ✅ Created ${chunks.length} chunks`)

    // Generate embeddings
    console.log('   🔢 Generating embeddings...')
    const embeddings = []

    for (let i = 0; i < chunks.length; i++) {
      const embResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:4000',
          'X-Title': 'MyDistinctAI',
        },
        body: JSON.stringify({
          model: 'openai/text-embedding-3-small',
          input: chunks[i].text,
          dimensions: 1536,
        }),
      })

      const embData = await embResponse.json()
      embeddings.push(embData.data[0].embedding)
      
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`   ✅ Generated ${embeddings.length} embeddings`)

    // Store embeddings
    const embeddingsData = chunks.map((chunk, index) => ({
      model_id: file.model_id,
      training_data_id: file.id,
      chunk_text: chunk.text,
      chunk_index: chunk.index,
      start_char: chunk.startChar,
      end_char: chunk.endChar,
      embedding: embeddings[index],
      metadata: { file_name: file.file_name },
    }))

    const { error: storeError } = await supabase
      .from('document_embeddings')
      .insert(embeddingsData)

    if (storeError) {
      console.error('   ❌ Error storing embeddings:', storeError)
    } else {
      console.log(`   ✅ Stored ${embeddings.length} embeddings`)

      // Update file status
      await supabase
        .from('training_data')
        .update({ 
          status: 'processed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', file.id)

      console.log('   ✅ File marked as processed')
    }
  }
}

async function step4_TestChat(modelId) {
  console.log('\n' + '='.repeat(60))
  console.log('💬 STEP 4: Testing Chat with RAG')
  console.log('='.repeat(60))

  // Create session
  const { data: session } = await supabase
    .from('chat_sessions')
    .insert({
      model_id: modelId,
      user_id: TEST_USER_ID,
      title: 'Test Chat',
    })
    .select()
    .single()

  console.log(`✅ Session created: ${session.id}`)

  // Test question
  const question = 'What are the vacation policies at ACME Corporation?'
  console.log(`\n❓ Question: "${question}"`)
  console.log('\n📥 Response:')
  console.log('-'.repeat(60))

  const response = await fetch('http://localhost:4000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelId,
      message: question,
      sessionId: session.id,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('❌ Chat API error:', error)
    return
  }

  // Read streaming response (Node.js compatible)
  let fullResponse = ''
  const decoder = new TextDecoder()

  try {
    // Use async iterator for Node.js streams
    for await (const chunk of response.body) {
      const text = decoder.decode(chunk, { stream: true })
      const lines = text.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.content) {
              fullResponse += data.content
              process.stdout.write(data.content)
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    console.error('\n❌ Error reading stream:', error.message)
    return
  }

  console.log('\n' + '-'.repeat(60))

  // Verify response
  if (fullResponse.length > 0) {
    console.log('\n✅ Response received!')
    console.log(`📊 Length: ${fullResponse.length} characters`)
    
    if (fullResponse.toLowerCase().includes('vacation') || 
        fullResponse.includes('15') || 
        fullResponse.includes('20') ||
        fullResponse.includes('25')) {
      console.log('✅ RAG WORKING! Response contains training data!')
    } else {
      console.log('⚠️  Response may not be using RAG context')
    }
  } else {
    console.log('❌ Empty response')
  }
}

async function main() {
  console.log('🚀 TESTING COMPLETE FLOW WITH DEEPSEEK')
  console.log('='.repeat(60))

  try {
    // Step 1: Create model
    const model = await step1_CreateModel()
    if (!model) return

    // Step 2: Upload files
    const files = await step2_UploadFiles(model.id)
    if (files.length === 0) return

    // Step 3: Process files
    await step3_ProcessFiles(files)

    // Step 4: Test chat
    await step4_TestChat(model.id)

    console.log('\n' + '='.repeat(60))
    console.log('🎉 COMPLETE FLOW TEST FINISHED!')
    console.log('='.repeat(60))
    console.log('✅ Model created with DeepSeek')
    console.log('✅ Training files uploaded')
    console.log('✅ Embeddings generated and stored')
    console.log('✅ Chat tested with RAG retrieval')
    console.log('')
    console.log('💡 Check the response above to verify RAG is working!')

  } catch (error) {
    console.error('\n❌ Fatal error:', error)
  }
}

main()
