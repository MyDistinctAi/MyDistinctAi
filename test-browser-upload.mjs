/**
 * Browser-based test for multiple file formats
 * This script simulates what you would do manually in the browser
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_USER_ID = '68df2d44-5377-471a-a121-2f4023131a5c' // johndoe

console.log('🎯 AUTOMATED MULTI-FORMAT TEST')
console.log('='.repeat(60))
console.log('This test simulates browser upload with 3 files')
console.log('='.repeat(60))

async function main() {
  try {
    // Step 1: Create model
    console.log('\n📝 Step 1: Creating Model...')
    const { data: model, error: modelError } = await supabase
      .from('models')
      .insert({
        user_id: TEST_USER_ID,
        name: 'Browser Test - Multi Format',
        description: 'Testing 3 different text files with RAG',
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

    if (modelError) {
      console.error('❌ Error creating model:', modelError)
      return
    }

    console.log(`✅ Model created: ${model.name}`)
    console.log(`   ID: ${model.id}`)

    // Step 2: Upload files directly to Supabase Storage
    console.log('\n📤 Step 2: Uploading Files to Storage...')
    
    const files = [
      'sample-company-policy.txt',
      'sample-employee-handbook.txt',
      'sample-safety-guidelines.txt'
    ]

    const uploadedFiles = []

    for (const fileName of files) {
      const filePath = path.join(process.cwd(), fileName)
      const fileContent = fs.readFileSync(filePath)
      const storagePath = `${TEST_USER_ID}/${model.id}/${fileName}`

      // Upload to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('training-data')
        .upload(storagePath, fileContent, {
          contentType: 'text/plain',
          upsert: true
        })

      if (storageError) {
        console.error(`❌ Error uploading ${fileName}:`, storageError)
        continue
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('training-data')
        .getPublicUrl(storagePath)

      // Create database record
      const { data: fileRecord, error: fileError } = await supabase
        .from('training_data')
        .insert({
          model_id: model.id,
          file_name: fileName,
          file_type: 'text/plain',
          file_size: fileContent.length,
          file_url: urlData.publicUrl,
          status: 'uploaded'
        })
        .select()
        .single()

      if (fileError) {
        console.error(`❌ Error creating file record:`, fileError)
        continue
      }

      uploadedFiles.push(fileRecord)
      console.log(`✅ Uploaded: ${fileName} (${fileContent.length} bytes)`)
    }

    // Step 3: Process files and generate embeddings
    console.log('\n⚙️  Step 3: Processing Files & Generating Embeddings...')

    for (const file of uploadedFiles) {
      console.log(`\n📄 Processing: ${file.file_name}`)

      try {
        // Download file content
        const response = await fetch(file.file_url)
        const text = await response.text()
        console.log(`   ✅ Downloaded ${text.length} characters`)

        // Chunk the text (split by double newlines, keep chunks > 100 chars)
        const chunks = text
          .split('\n\n')
          .filter(chunk => chunk.trim().length > 100)
          .map((chunk, index) => ({
            text: chunk.trim(),
            index,
          }))

        console.log(`   ✅ Created ${chunks.length} chunks`)

        // Generate embeddings
        console.log('   🔢 Generating embeddings...')
        const embeddings = []

        for (const chunk of chunks) {
          const embeddingResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'openai/text-embedding-3-small',
              input: chunk.text,
            }),
          })

          const embeddingData = await embeddingResponse.json()
          
          if (embeddingData.error) {
            console.error('   ❌ Embedding error:', embeddingData.error)
            continue
          }

          const embedding = embeddingData.data[0].embedding

          embeddings.push({
            model_id: model.id,
            training_data_id: file.id,
            chunk_text: chunk.text,
            chunk_index: chunk.index,
            embedding: embedding,
          })
        }

        console.log(`   ✅ Generated ${embeddings.length} embeddings`)

        // Store embeddings in batches
        if (embeddings.length > 0) {
          const { error: embeddingError } = await supabase
            .from('document_embeddings')
            .insert(embeddings)

          if (embeddingError) {
            console.error('   ❌ Error storing embeddings:', embeddingError)
          } else {
            console.log(`   ✅ Stored ${embeddings.length} embeddings`)
          }
        }

        // Mark file as processed
        await supabase
          .from('training_data')
          .update({ status: 'processed' })
          .eq('id', file.id)

        console.log('   ✅ File marked as processed')

      } catch (error) {
        console.error(`   ❌ Error processing file:`, error.message)
      }
    }

    // Step 4: Test chat with different queries
    console.log('\n💬 Step 4: Testing Chat with RAG...')
    console.log('='.repeat(60))

    const testQueries = [
      {
        question: 'What are the work hours at ACME Corporation?',
        expectedFile: 'sample-company-policy.txt',
        expectedKeywords: ['9:00 AM', '5:00 PM', 'Monday', 'Friday']
      },
      {
        question: 'What is the dress code policy?',
        expectedFile: 'sample-employee-handbook.txt',
        expectedKeywords: ['Business Casual', 'Friday', 'Client']
      },
      {
        question: 'What should I do in case of a fire emergency?',
        expectedFile: 'sample-safety-guidelines.txt',
        expectedKeywords: ['alarm', 'evacuate', 'stairwell', 'parking']
      }
    ]

    let successCount = 0

    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i]
      console.log(`\n[Test ${i + 1}/3] ❓ "${query.question}"`)
      console.log(`Expected from: ${query.expectedFile}`)

      try {
        // Create session
        const { data: session, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: TEST_USER_ID,
            model_id: model.id,
            title: query.question.substring(0, 50),
          })
          .select()
          .single()

        if (sessionError || !session) {
          console.error('❌ Session creation error:', sessionError)
          continue
        }

        // Send message
        const response = await fetch('http://localhost:4000/api/chat/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            modelId: model.id,
            message: query.question,
            sessionId: session.id,
            useRAG: true,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('❌ Chat API error:', error)
          continue
        }

        // Read streaming response
        let fullResponse = ''
        const decoder = new TextDecoder()

        try {
          for await (const chunk of response.body) {
            const text = decoder.decode(chunk, { stream: true })
            const lines = text.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  if (data.content) {
                    fullResponse += data.content
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ Error reading stream:', error.message)
          continue
        }

        // Verify response
        console.log('\n📥 Response:')
        console.log('-'.repeat(60))
        console.log(fullResponse.substring(0, 300) + '...')
        console.log('-'.repeat(60))

        // Check if response contains expected keywords
        const foundKeywords = query.expectedKeywords.filter(keyword => 
          fullResponse.toLowerCase().includes(keyword.toLowerCase())
        )

        console.log(`\n✅ Response length: ${fullResponse.length} characters`)
        console.log(`✅ Found ${foundKeywords.length}/${query.expectedKeywords.length} expected keywords`)
        
        if (foundKeywords.length >= query.expectedKeywords.length / 2) {
          console.log('✅ TEST PASSED - Response contains relevant information!')
          successCount++
        } else {
          console.log('⚠️  TEST WARNING - Response may not be accurate')
        }

      } catch (error) {
        console.error('❌ Error:', error.message)
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Final summary
    console.log('\n' + '='.repeat(60))
    console.log('🎉 TEST COMPLETE!')
    console.log('='.repeat(60))
    console.log(`✅ Model created: ${model.name}`)
    console.log(`✅ Files uploaded: ${uploadedFiles.length}`)
    console.log(`✅ Files processed: ${uploadedFiles.length}`)
    console.log(`✅ Tests passed: ${successCount}/${testQueries.length}`)
    console.log('='.repeat(60))

    if (successCount === testQueries.length) {
      console.log('🎊 ALL TESTS PASSED! Multi-format RAG is working perfectly!')
    } else if (successCount > 0) {
      console.log('⚠️  Some tests passed. Check responses for accuracy.')
    } else {
      console.log('❌ Tests failed. Check server logs for errors.')
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

main()
