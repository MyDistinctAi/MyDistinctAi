/**
 * Test OpenRouter API
 * Verifies that OpenRouter API key is working and tests both chat and embeddings
 */

import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY not found in .env.local')
  process.exit(1)
}

console.log('🧪 Testing OpenRouter API...\n')
console.log('API Key:', OPENROUTER_API_KEY.substring(0, 20) + '...')
console.log('')

// Test 1: Chat Completion
async function testChatCompletion() {
  console.log('📝 Test 1: Chat Completion')
  console.log('   Model: meta-llama/llama-3.3-70b-instruct:free')
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:4000',
        'X-Title': 'MyDistinctAI Test'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello from OpenRouter!" and nothing else.'
          }
        ],
        max_tokens: 50
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`   ❌ Failed: ${response.status} - ${error}`)
      return false
    }

    const data = await response.json()
    const message = data.choices[0]?.message?.content || 'No response'
    
    console.log(`   ✅ Success!`)
    console.log(`   Response: "${message}"`)
    console.log(`   Model: ${data.model}`)
    console.log(`   Tokens: ${data.usage?.total_tokens || 'N/A'}`)
    return true
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    return false
  }
}

// Test 2: Embeddings
async function testEmbeddings() {
  console.log('\n🔢 Test 2: Embeddings')
  console.log('   Model: openai/text-embedding-3-small')
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:4000',
        'X-Title': 'MyDistinctAI Test'
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: 'This is a test sentence for embedding generation.',
        dimensions: 1536
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`   ❌ Failed: ${response.status} - ${error}`)
      return false
    }

    const data = await response.json()
    const embedding = data.data[0]?.embedding
    
    if (!embedding || !Array.isArray(embedding)) {
      console.error('   ❌ Invalid embedding response')
      return false
    }

    console.log(`   ✅ Success!`)
    console.log(`   Dimensions: ${embedding.length}`)
    console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`)
    console.log(`   Model: ${data.model}`)
    return true
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    return false
  }
}

// Test 3: Streaming Chat
async function testStreamingChat() {
  console.log('\n🌊 Test 3: Streaming Chat')
  console.log('   Model: meta-llama/llama-3.3-70b-instruct:free')
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:4000',
        'X-Title': 'MyDistinctAI Test'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          {
            role: 'user',
            content: 'Count from 1 to 5, one number per line.'
          }
        ],
        stream: true,
        max_tokens: 50
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`   ❌ Failed: ${response.status} - ${error}`)
      return false
    }

    console.log('   ✅ Streaming started...')
    console.log('   Response: ', { newline: false })

    let fullResponse = ''
    const reader = response.body
    
    for await (const chunk of reader) {
      const lines = chunk.toString().split('\n').filter(line => line.trim() !== '')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          
          if (data === '[DONE]') {
            continue
          }
          
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content || ''
            if (content) {
              process.stdout.write(content)
              fullResponse += content
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    console.log('')
    console.log(`   ✅ Streaming complete!`)
    console.log(`   Total length: ${fullResponse.length} characters`)
    return true
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    return false
  }
}

// Test 4: Available Models
async function testAvailableModels() {
  console.log('\n📋 Test 4: Available Models')
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`   ❌ Failed: ${response.status} - ${error}`)
      return false
    }

    const data = await response.json()
    const models = data.data || []
    
    console.log(`   ✅ Found ${models.length} models`)
    
    // Show free models
    const freeModels = models.filter(m => 
      m.id.includes('free') || 
      m.pricing?.prompt === '0' || 
      m.pricing?.prompt === 0
    )
    
    console.log(`\n   🆓 Free Models (${freeModels.length}):`)
    freeModels.slice(0, 10).forEach(model => {
      console.log(`      - ${model.id}`)
    })
    
    if (freeModels.length > 10) {
      console.log(`      ... and ${freeModels.length - 10} more`)
    }
    
    return true
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    return false
  }
}

// Test 5: Account Credits/Limits
async function testAccountInfo() {
  console.log('\n💳 Test 5: Account Information')
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`   ❌ Failed: ${response.status} - ${error}`)
      return false
    }

    const data = await response.json()
    
    console.log(`   ✅ Account Info:`)
    console.log(`      Label: ${data.data?.label || 'N/A'}`)
    console.log(`      Usage: $${data.data?.usage || '0'}`)
    console.log(`      Limit: ${data.data?.limit ? '$' + data.data.limit : 'Unlimited'}`)
    console.log(`      Rate Limit: ${data.data?.rate_limit?.requests || 'N/A'} requests`)
    
    return true
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    return false
  }
}

// Run all tests
async function runAllTests() {
  const results = {
    chatCompletion: await testChatCompletion(),
    embeddings: await testEmbeddings(),
    streamingChat: await testStreamingChat(),
    availableModels: await testAvailableModels(),
    accountInfo: await testAccountInfo()
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Test Results Summary')
  console.log('='.repeat(60))
  
  const tests = [
    { name: 'Chat Completion', result: results.chatCompletion },
    { name: 'Embeddings', result: results.embeddings },
    { name: 'Streaming Chat', result: results.streamingChat },
    { name: 'Available Models', result: results.availableModels },
    { name: 'Account Info', result: results.accountInfo }
  ]

  tests.forEach(test => {
    const icon = test.result ? '✅' : '❌'
    console.log(`${icon} ${test.name}: ${test.result ? 'PASSED' : 'FAILED'}`)
  })

  const passedCount = tests.filter(t => t.result).length
  const totalCount = tests.length

  console.log('')
  console.log(`Result: ${passedCount}/${totalCount} tests passed`)
  
  if (passedCount === totalCount) {
    console.log('\n🎉 All tests passed! OpenRouter API is working perfectly!')
    console.log('✅ Your RAG system is ready to use!')
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.')
  }
  
  console.log('='.repeat(60))
}

runAllTests().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
