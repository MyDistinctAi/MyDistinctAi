#!/usr/bin/env node

/**
 * Test Gemini Flash with OpenRouter
 */

import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

console.log('🧪 Testing Gemini Flash on OpenRouter...\n')

async function testGemini() {
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
        model: 'google/gemini-flash-1.5-8b',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello from Gemini Flash!" in one sentence.'
          }
        ],
        max_tokens: 50,
        temperature: 0.7,
      })
    })

    console.log('📡 Status:', response.status, response.statusText)
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Error Response:')
      console.error(JSON.stringify(data, null, 2))
      return
    }

    console.log('✅ SUCCESS!')
    console.log('💬 AI Response:', data.choices[0].message.content)
    console.log('\n🎉 Gemini Flash is working perfectly!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testGemini()
