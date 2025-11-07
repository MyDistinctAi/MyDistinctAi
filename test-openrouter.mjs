#!/usr/bin/env node

/**
 * Test OpenRouter API with DeepSeek Model
 */

import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY not found in .env.local')
  process.exit(1)
}

console.log('🔑 API Key:', OPENROUTER_API_KEY.substring(0, 20) + '...')
console.log('🤖 Testing DeepSeek model on OpenRouter...\n')

async function testOpenRouter() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mydistinctai-delta.vercel.app',
        'X-Title': 'MyDistinctAI',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3.1:free',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello from DeepSeek!" in one sentence.'
          }
        ],
        max_tokens: 50,
        temperature: 0.7,
      })
    })

    console.log('📡 Response Status:', response.status, response.statusText)
    console.log('📋 Response Headers:')
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`)
    }
    console.log('')

    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ OpenRouter API Error:')
      console.error(JSON.stringify(data, null, 2))
      return
    }

    console.log('✅ OpenRouter API Success!')
    console.log('📝 Response:')
    console.log(JSON.stringify(data, null, 2))
    
    if (data.choices && data.choices[0]) {
      console.log('\n💬 AI Response:', data.choices[0].message.content)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.cause) {
      console.error('Cause:', error.cause)
    }
  }
}

testOpenRouter()
