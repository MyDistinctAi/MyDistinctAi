/**
 * Comprehensive Chat Functionality Tests
 * Tests: Streaming, RAG, Context, Multiple Messages, Session Management
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_USER_ID = '68df2d44-5377-471a-a121-2f4023131a5c' // johndoe

console.log('🧪 COMPREHENSIVE CHAT FUNCTIONALITY TESTS')
console.log('='.repeat(60))
console.log('Testing: Streaming, RAG, Context, Sessions, Multiple Messages')
console.log('='.repeat(60))

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
}

function recordTest(name, passed, details = '') {
  testResults.total++
  if (passed) {
    testResults.passed++
    console.log(`✅ PASS: ${name}`)
  } else {
    testResults.failed++
    console.log(`❌ FAIL: ${name}`)
  }
  if (details) {
    console.log(`   ${details}`)
  }
  testResults.details.push({ name, passed, details })
}

async function sendChatMessage(modelId, sessionId, message, useRAG = true) {
  const response = await fetch('http://localhost:4000/api/chat/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      modelId,
      message,
      sessionId,
      useRAG,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(JSON.stringify(error))
  }

  // Read streaming response
  let fullResponse = ''
  let chunkCount = 0
  const decoder = new TextDecoder()

  try {
    for await (const chunk of response.body) {
      chunkCount++
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
    throw new Error(`Stream error: ${error.message}`)
  }

  return { fullResponse, chunkCount }
}

async function test1_BasicChat() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 1: Basic Chat Without RAG')
  console.log('='.repeat(60))

  try {
    // Create model
    const { data: model } = await supabase
      .from('models')
      .insert({
        user_id: TEST_USER_ID,
        name: 'Test Chat Basic',
        base_model: 'deepseek/deepseek-chat-v3.1:free',
        status: 'ready',
      })
      .select()
      .single()

    // Create session
    const { data: session } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: TEST_USER_ID,
        model_id: model.id,
        title: 'Basic Chat Test',
      })
      .select()
      .single()

    // Send simple message
    const { fullResponse, chunkCount } = await sendChatMessage(
      model.id,
      session.id,
      'Hello! Please respond with a short greeting.',
      false // No RAG
    )

    recordTest(
      'Basic chat response received',
      fullResponse.length > 0,
      `Response: ${fullResponse.length} chars, ${chunkCount} chunks`
    )

    recordTest(
      'Response is streaming',
      chunkCount > 1,
      `Received ${chunkCount} chunks`
    )

    recordTest(
      'Response is coherent',
      fullResponse.toLowerCase().includes('hello') || 
      fullResponse.toLowerCase().includes('hi') ||
      fullResponse.toLowerCase().includes('greet'),
      `Response contains greeting`
    )

  } catch (error) {
    recordTest('Basic chat', false, error.message)
  }
}

async function test2_ChatWithRAG() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 2: Chat With RAG Context')
  console.log('='.repeat(60))

  try {
    // Use existing model from multi-format test
    const { data: models } = await supabase
      .from('models')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('name', 'Browser Test - Multi Format')
      .order('created_at', { ascending: false })
      .limit(1)

    if (!models || models.length === 0) {
      recordTest('RAG chat - model exists', false, 'No test model found. Run test-browser-upload.mjs first.')
      return
    }

    const model = models[0]

    // Create session
    const { data: session } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: TEST_USER_ID,
        model_id: model.id,
        title: 'RAG Test',
      })
      .select()
      .single()

    // Send message that should use RAG
    const { fullResponse, chunkCount } = await sendChatMessage(
      model.id,
      session.id,
      'What are the vacation policies?',
      true // Use RAG
    )

    recordTest(
      'RAG response received',
      fullResponse.length > 0,
      `Response: ${fullResponse.length} chars`
    )

    recordTest(
      'RAG retrieved relevant context',
      fullResponse.toLowerCase().includes('vacation') ||
      fullResponse.toLowerCase().includes('days'),
      'Response mentions vacation/days'
    )

    recordTest(
      'RAG context is accurate',
      fullResponse.includes('15') || fullResponse.includes('20') || fullResponse.includes('25'),
      'Response contains vacation day numbers'
    )

  } catch (error) {
    recordTest('Chat with RAG', false, error.message)
  }
}

async function test3_MultipleMessages() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 3: Multiple Messages in Same Session')
  console.log('='.repeat(60))

  try {
    // Create model
    const { data: model } = await supabase
      .from('models')
      .insert({
        user_id: TEST_USER_ID,
        name: 'Test Multi Message',
        base_model: 'deepseek/deepseek-chat-v3.1:free',
        status: 'ready',
      })
      .select()
      .single()

    // Create session
    const { data: session } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: TEST_USER_ID,
        model_id: model.id,
        title: 'Multi Message Test',
      })
      .select()
      .single()

    // Send first message
    const response1 = await sendChatMessage(
      model.id,
      session.id,
      'My name is Alice. Remember this.',
      false
    )

    recordTest(
      'First message sent',
      response1.fullResponse.length > 0,
      `Response: ${response1.fullResponse.length} chars`
    )

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Send second message
    const response2 = await sendChatMessage(
      model.id,
      session.id,
      'What is my name?',
      false
    )

    recordTest(
      'Second message sent',
      response2.fullResponse.length > 0,
      `Response: ${response2.fullResponse.length} chars`
    )

    // Check if messages were stored
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })

    recordTest(
      'Messages stored in database',
      messages && messages.length >= 4, // 2 user + 2 AI
      `Found ${messages?.length || 0} messages`
    )

    recordTest(
      'Session maintains context',
      response2.fullResponse.toLowerCase().includes('alice'),
      'AI remembered the name from previous message'
    )

  } catch (error) {
    recordTest('Multiple messages', false, error.message)
  }
}

async function test4_SessionManagement() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 4: Session Management')
  console.log('='.repeat(60))

  try {
    // Create model
    const { data: model } = await supabase
      .from('models')
      .insert({
        user_id: TEST_USER_ID,
        name: 'Test Session Mgmt',
        base_model: 'deepseek/deepseek-chat-v3.1:free',
        status: 'ready',
      })
      .select()
      .single()

    // Create multiple sessions
    const session1 = await supabase
      .from('chat_sessions')
      .insert({
        user_id: TEST_USER_ID,
        model_id: model.id,
        title: 'Session 1',
      })
      .select()
      .single()

    const session2 = await supabase
      .from('chat_sessions')
      .insert({
        user_id: TEST_USER_ID,
        model_id: model.id,
        title: 'Session 2',
      })
      .select()
      .single()

    recordTest(
      'Multiple sessions created',
      session1.data && session2.data,
      'Created 2 sessions'
    )

    // Send message to session 1
    await sendChatMessage(
      model.id,
      session1.data.id,
      'This is session 1',
      false
    )

    // Send message to session 2
    await sendChatMessage(
      model.id,
      session2.data.id,
      'This is session 2',
      false
    )

    // Check messages are in correct sessions
    const { data: messages1 } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session1.data.id)

    const { data: messages2 } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session2.data.id)

    recordTest(
      'Sessions are isolated',
      messages1.length >= 2 && messages2.length >= 2,
      `Session 1: ${messages1.length} msgs, Session 2: ${messages2.length} msgs`
    )

    // Update session title
    await supabase
      .from('chat_sessions')
      .update({ title: 'Updated Title' })
      .eq('id', session1.data.id)

    const { data: updatedSession } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', session1.data.id)
      .single()

    recordTest(
      'Session title can be updated',
      updatedSession.title === 'Updated Title',
      'Title updated successfully'
    )

  } catch (error) {
    recordTest('Session management', false, error.message)
  }
}

async function test5_ErrorHandling() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 5: Error Handling')
  console.log('='.repeat(60))

  try {
    // Test with invalid model ID
    try {
      await sendChatMessage(
        'invalid-model-id',
        'invalid-session-id',
        'Test message',
        false
      )
      recordTest('Invalid model ID handling', false, 'Should have thrown error')
    } catch (error) {
      recordTest(
        'Invalid model ID handling',
        true,
        'Correctly rejected invalid model'
      )
    }

    // Test with empty message
    const { data: model } = await supabase
      .from('models')
      .insert({
        user_id: TEST_USER_ID,
        name: 'Test Error Handling',
        base_model: 'deepseek/deepseek-chat-v3.1:free',
        status: 'ready',
      })
      .select()
      .single()

    const { data: session } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: TEST_USER_ID,
        model_id: model.id,
        title: 'Error Test',
      })
      .select()
      .single()

    try {
      await sendChatMessage(model.id, session.id, '', false)
      recordTest('Empty message handling', false, 'Should have thrown error')
    } catch (error) {
      recordTest(
        'Empty message handling',
        true,
        'Correctly rejected empty message'
      )
    }

  } catch (error) {
    recordTest('Error handling', false, error.message)
  }
}

async function test6_StreamingPerformance() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 6: Streaming Performance')
  console.log('='.repeat(60))

  try {
    const { data: model } = await supabase
      .from('models')
      .insert({
        user_id: TEST_USER_ID,
        name: 'Test Streaming',
        base_model: 'deepseek/deepseek-chat-v3.1:free',
        status: 'ready',
      })
      .select()
      .single()

    const { data: session } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: TEST_USER_ID,
        model_id: model.id,
        title: 'Streaming Test',
      })
      .select()
      .single()

    const startTime = Date.now()
    const { fullResponse, chunkCount } = await sendChatMessage(
      model.id,
      session.id,
      'Write a short paragraph about artificial intelligence.',
      false
    )
    const duration = Date.now() - startTime

    recordTest(
      'Streaming completed',
      fullResponse.length > 100,
      `Response: ${fullResponse.length} chars in ${duration}ms`
    )

    recordTest(
      'Multiple chunks received',
      chunkCount > 5,
      `Received ${chunkCount} chunks`
    )

    recordTest(
      'Reasonable response time',
      duration < 30000, // Less than 30 seconds
      `Completed in ${(duration / 1000).toFixed(2)}s`
    )

  } catch (error) {
    recordTest('Streaming performance', false, error.message)
  }
}

async function test7_RAGAccuracy() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 7: RAG Accuracy & Relevance')
  console.log('='.repeat(60))

  try {
    // Use existing model with training data
    const { data: models } = await supabase
      .from('models')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('name', 'Browser Test - Multi Format')
      .order('created_at', { ascending: false })
      .limit(1)

    if (!models || models.length === 0) {
      recordTest('RAG accuracy test', false, 'No test model found')
      return
    }

    const model = models[0]

    const testQueries = [
      {
        question: 'What is the gym membership reimbursement?',
        expectedKeywords: ['50', 'month', 'gym'],
        expectedFile: 'company-policy'
      },
      {
        question: 'What should I wear on Friday?',
        expectedKeywords: ['casual', 'friday', 'jeans'],
        expectedFile: 'handbook'
      },
      {
        question: 'Where is the assembly point for fire emergencies?',
        expectedKeywords: ['north', 'parking', 'lot'],
        expectedFile: 'safety'
      }
    ]

    for (const query of testQueries) {
      const { data: session } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: TEST_USER_ID,
          model_id: model.id,
          title: query.question.substring(0, 50),
        })
        .select()
        .single()

      const { fullResponse } = await sendChatMessage(
        model.id,
        session.id,
        query.question,
        true
      )

      const foundKeywords = query.expectedKeywords.filter(keyword =>
        fullResponse.toLowerCase().includes(keyword.toLowerCase())
      )

      recordTest(
        `RAG accuracy: "${query.question.substring(0, 30)}..."`,
        foundKeywords.length >= query.expectedKeywords.length / 2,
        `Found ${foundKeywords.length}/${query.expectedKeywords.length} keywords`
      )

      // Small delay between queries
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

  } catch (error) {
    recordTest('RAG accuracy', false, error.message)
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total Tests: ${testResults.total}`)
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`)
  console.log('='.repeat(60))

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:')
    testResults.details
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`   - ${t.name}`)
        if (t.details) console.log(`     ${t.details}`)
      })
  }

  console.log('\n' + '='.repeat(60))
  if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Chat functionality is working perfectly!')
  } else if (testResults.passed > testResults.failed) {
    console.log('⚠️  Most tests passed. Review failures above.')
  } else {
    console.log('❌ Multiple test failures. Check server logs and configuration.')
  }
  console.log('='.repeat(60))
}

async function main() {
  try {
    await test1_BasicChat()
    await test2_ChatWithRAG()
    await test3_MultipleMessages()
    await test4_SessionManagement()
    await test5_ErrorHandling()
    await test6_StreamingPerformance()
    await test7_RAGAccuracy()

    await printSummary()

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

main()
