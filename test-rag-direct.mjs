/**
 * Direct RAG Test Script
 * Tests the RAG system by directly calling the chat API with the secret code question
 */

const SUPABASE_URL = 'https://ekfdbotohslpalnyvdpk.supabase.co'
const MODEL_ID = '353608a6-c981-4dfb-9e75-c70fcdeeba2b' // Model with embeddings

console.log('🧪 Testing RAG System with Secret Code Query')
console.log('='.repeat(60))

// Test the chat API
async function testChatWithRAG() {
  console.log('\n📝 Step 1: Sending chat message with secret code query')

  const chatPayload = {
    modelId: MODEL_ID,
    message: 'What is the SECRET CODE FOR TESTING in the uploaded file?',
    sessionId: 'test-session-' + Date.now(),
    useRAG: true
  }

  console.log('Request:', JSON.stringify(chatPayload, null, 2))

  try {
    const response = await fetch('http://localhost:4000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatPayload)
    })

    console.log('\n📡 Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error response:', errorText)
      return
    }

    // Stream the response
    console.log('\n💬 AI Response:')
    console.log('-'.repeat(60))

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim())

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.slice(6))
            if (json.token) {
              process.stdout.write(json.token)
              fullResponse += json.token
            }
            if (json.done) {
              console.log('\n' + '-'.repeat(60))
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

    // Check if the response contains the secret code
    console.log('\n\n🔍 Analysis:')
    if (fullResponse.includes('ALPHA-BRAVO-2025')) {
      console.log('✅ SUCCESS! The AI found the secret code: ALPHA-BRAVO-2025')
      console.log('✅ RAG system is working correctly!')
    } else {
      console.log('❌ FAILURE! The AI did not mention the secret code.')
      console.log('❌ RAG system may not be retrieving context correctly.')
      console.log('\nFull response was:', fullResponse)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error)
  }
}

// Run the test
testChatWithRAG()
