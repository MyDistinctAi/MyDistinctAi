/**
 * Test Chat with New Models
 * Tests both text and PDF file RAG retrieval with DeepSeek
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

async function testChat(modelId, modelName, question) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📝 Testing: ${modelName}`)
  console.log(`Question: "${question}"`)
  console.log('='.repeat(60))

  try {
    // Create a test session
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        model_id: modelId,
        user_id: '68df2d44-5377-471a-a121-2f4023131a5c', // Test user
        title: 'Test Chat'
      })
      .select()
      .single()

    if (sessionError) {
      console.error('❌ Failed to create session:', sessionError)
      return
    }

    console.log(`✅ Session created: ${session.id}`)

    // Send chat message
    const response = await fetch('http://localhost:4000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

    console.log('✅ Chat API responded')
    console.log('📥 Streaming response...\n')

    // Read streaming response
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''
    let chunkCount = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))

            if (data.content) {
              fullResponse += data.content
              chunkCount++
              process.stdout.write(data.content)
            }

            if (data.done) {
              console.log('\n')
              console.log(`✅ Stream complete! Received ${chunkCount} chunks`)
              console.log(`📊 Total response length: ${fullResponse.length} characters`)
            }
          } catch (parseError) {
            // Skip invalid JSON
          }
        }
      }
    }

    // Check if response contains relevant information
    if (fullResponse.length > 0) {
      console.log('\n✅ Response received successfully!')
      
      // Check for specific keywords based on the question
      if (question.includes('vacation') && fullResponse.toLowerCase().includes('vacation')) {
        console.log('✅ RAG working - response contains vacation policy info!')
      } else if (question.includes('company number') && /\d{8}/.test(fullResponse)) {
        console.log('✅ RAG working - response contains company number!')
      } else if (question.includes('Vilexy') && fullResponse.includes('14298856')) {
        console.log('✅ RAG working - correct company number retrieved!')
      }
    } else {
      console.log('⚠️  Empty response received')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function main() {
  console.log('🧪 Testing Chat with New AI Models\n')

  // Get models with training data
  const { data: models, error } = await supabase
    .from('models')
    .select('*')
    .eq('base_model', 'deepseek/deepseek-chat-v3.1:free')
    .limit(2)

  if (error || !models || models.length === 0) {
    console.log('⚠️  No models found with DeepSeek. Checking all models...')
    
    const { data: allModels } = await supabase
      .from('models')
      .select('*')
      .limit(5)

    if (allModels && allModels.length > 0) {
      console.log(`\n📊 Found ${allModels.length} models:`)
      allModels.forEach(m => {
        console.log(`   - ${m.name} (${m.base_model})`)
      })
    }
    return
  }

  console.log(`📊 Found ${models.length} models with DeepSeek\n`)

  // Test 1: Text file (company handbook)
  const textModel = models.find(m => m.name.includes('testing'))
  if (textModel) {
    await testChat(
      textModel.id,
      textModel.name,
      'What are the vacation policies at ACME Corporation?'
    )
  }

  // Test 2: PDF file (company register)
  const pdfModel = models.find(m => m.name.includes('pdf'))
  if (pdfModel) {
    await testChat(
      pdfModel.id,
      pdfModel.name,
      'What is Vilexy Ltd company number?'
    )
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 Testing Complete!')
  console.log('='.repeat(60))
}

main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
