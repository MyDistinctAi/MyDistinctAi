#!/usr/bin/env node

/**
 * Quick test to verify RAG retrieves CEO information
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const MODEL_ID = '6ec4e7b7-2a23-4ec7-b94f-896beb25d9f2' // Alber imou model with ACME data
const TEST_USER_ID = '68df2d44-5377-471a-a121-2f4023131a5c' // johndoe

async function testCEOQuestion() {
  console.log('🧪 Testing CEO Question with RAG\n')
  console.log('Model ID:', MODEL_ID)
  console.log('Question: "Who is the CEO of ACME Corporation?"\n')

  try {
    // Create a test session
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: TEST_USER_ID,
        model_id: MODEL_ID,
        title: 'CEO Test',
      })
      .select()
      .single()

    if (sessionError) {
      console.error('❌ Failed to create session:', sessionError)
      return
    }

    console.log('✅ Session created:', session.id)

    // Send the question to the chat API
    const response = await fetch('http://localhost:4000/api/chat/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelId: MODEL_ID,
        message: 'Who is the CEO of ACME Corporation?',
        sessionId: session.id,
        useRAG: true,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Chat API error:', error)
      return
    }

    // Read streaming response
    let fullResponse = ''
    const decoder = new TextDecoder()

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

    console.log('\n\n📊 Test Result:')
    console.log('─'.repeat(60))
    console.log('Full Response:', fullResponse)
    console.log('─'.repeat(60))

    // Check if response mentions Sarah Johnson
    const hasSarahJohnson = fullResponse.includes('Sarah Johnson')
    const hasCEO = fullResponse.toLowerCase().includes('ceo')

    if (hasSarahJohnson) {
      console.log('✅ SUCCESS: Response correctly identifies Sarah Johnson as CEO')
    } else if (hasCEO) {
      console.log('⚠️  PARTIAL: Response mentions CEO but not Sarah Johnson')
      console.log('   This might indicate RAG context was not retrieved')
    } else {
      console.log('❌ FAIL: Response does not mention CEO or Sarah Johnson')
      console.log('   RAG system may not be working correctly')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testCEOQuestion()
