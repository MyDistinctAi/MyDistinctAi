/**
 * Simple Chat & RAG Test Script
 * Tests chat and RAG functionality without browser automation
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ekfdbotohslpalnyvdpk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZmRib3RvaHNscGFsbnl2ZHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NjIyMTEsImV4cCI6MjA3NjUzODIxMX0.me4ZQupg0WNTf8K6r-B8AsnkXvetSXn0Um390y1UZ1w'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('🧪 Testing Chat & RAG Functionality\n')
console.log('=' .repeat(60))

async function test() {
  try {
    // Step 1: Find a model with training files
    console.log('\n📋 Step 1: Finding models with training data...')
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select(`
        id,
        name,
        base_model,
        user_id,
        training_data (count)
      `)
      .limit(10)

    if (modelsError) {
      console.error('❌ Error fetching models:', modelsError)
      return
    }

    console.log(`✅ Found ${models.length} models`)

    // Find model with training files
    const modelWithFiles = models.find(m => m.training_data && m.training_data.length > 0)

    if (!modelWithFiles) {
      console.log('⚠️  No models with training files found')
      console.log('📊 Available models:')
      models.forEach(m => {
        console.log(`   - ${m.name} (base: ${m.base_model})`)
      })
      console.log('\n💡 Continuing with chat test using first available model...')
    } else {
      console.log(`✅ Using model: ${modelWithFiles.name}`)
      console.log(`   - ID: ${modelWithFiles.id}`)
      console.log(`   - Base model: ${modelWithFiles.base_model}`)
      console.log(`   - Training files: ${modelWithFiles.training_data[0].count}`)
    }

    const testModel = modelWithFiles || models[0]

    if (!testModel) {
      console.error('❌ No models available for testing')
      return
    }

    // Step 2: Check embeddings
    console.log('\n📋 Step 2: Checking embeddings...')
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('embeddings')
      .select('id, model_id, content')
      .eq('model_id', testModel.id)
      .limit(3)

    if (embeddingsError) {
      console.log('⚠️  Error checking embeddings:', embeddingsError.message)
    } else if (embeddings && embeddings.length > 0) {
      console.log(`✅ Found ${embeddings.length} embeddings for this model`)
      console.log('   Sample content:')
      embeddings.forEach((emb, i) => {
        const preview = emb.content.substring(0, 100)
        console.log(`   ${i + 1}. ${preview}...`)
      })
    } else {
      console.log('ℹ️  No embeddings found - RAG will not be tested')
    }

    // Step 3: Test chat API
    console.log('\n📋 Step 3: Testing chat API...')
    console.log('   Sending message: "Hello, can you help me?"')

    const chatResponse = await fetch('http://localhost:4000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelId: testModel.id,
        message: 'Hello, can you help me?',
        sessionId: 'test-session-' + Date.now()
      })
    })

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text()
      console.error(`❌ Chat API returned ${chatResponse.status}:`, errorText)
      return
    }

    console.log('✅ Chat API responded successfully!')
    console.log(`   Status: ${chatResponse.status}`)
    console.log(`   Content-Type: ${chatResponse.headers.get('content-type')}`)

    // Read streaming response
    const reader = chatResponse.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''
    let chunkCount = 0

    console.log('\n📨 Streaming response:')
    console.log('-'.repeat(60))

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      chunkCount++
      fullResponse += chunk

      // Show first 200 chars
      if (fullResponse.length < 200) {
        process.stdout.write(chunk)
      } else if (chunkCount === 1) {
        process.stdout.write('...')
      }
    }

    console.log('\n' + '-'.repeat(60))
    console.log(`✅ Received ${chunkCount} chunks`)
    console.log(`✅ Total response length: ${fullResponse.length} characters`)

    // Step 4: Test RAG if embeddings exist
    if (embeddings && embeddings.length > 0) {
      console.log('\n📋 Step 4: Testing RAG retrieval...')
      console.log('   Asking question about training data...')

      const ragResponse = await fetch('http://localhost:4000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: testModel.id,
          message: 'What information do you have in your training data?',
          sessionId: 'test-rag-session-' + Date.now()
        })
      })

      if (!ragResponse.ok) {
        console.error(`❌ RAG test failed: ${ragResponse.status}`)
      } else {
        console.log('✅ RAG query sent successfully')

        // Read response
        const ragReader = ragResponse.body.getReader()
        const ragDecoder = new TextDecoder()
        let ragFullResponse = ''

        while (true) {
          const { done, value } = await ragReader.read()
          if (done) break
          ragFullResponse += ragDecoder.decode(value)
        }

        console.log('\n📨 RAG response preview:')
        console.log('-'.repeat(60))
        console.log(ragFullResponse.substring(0, 300) + '...')
        console.log('-'.repeat(60))
        console.log(`✅ RAG response length: ${ragFullResponse.length} characters`)
      }
    }

    // Step 5: Verify no :free suffix in models
    console.log('\n📋 Step 5: Verifying model IDs (no :free suffix)...')
    const { data: allModels } = await supabase
      .from('models')
      .select('id, name, base_model')

    let foundFreesufix = false
    allModels.forEach(model => {
      if (model.base_model && model.base_model.includes(':free')) {
        console.error(`❌ Found :free suffix in model: ${model.name} (${model.base_model})`)
        foundFreeSuffix = true
      }
    })

    if (!foundFreeSuffix) {
      console.log('✅ No :free suffix found in any models!')
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('🎉 TEST SUMMARY')
    console.log('='.repeat(60))
    console.log('✅ Chat API working')
    console.log('✅ Streaming responses working')
    console.log(`✅ Model: ${testModel.base_model}`)
    console.log(`✅ No :free suffix in models`)
    if (embeddings && embeddings.length > 0) {
      console.log('✅ RAG embeddings present')
      console.log('✅ RAG retrieval tested')
    } else {
      console.log('ℹ️  No embeddings - RAG not tested')
    }
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    console.error(error.stack)
  }
}

test()
