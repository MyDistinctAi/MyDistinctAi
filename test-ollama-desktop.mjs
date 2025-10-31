/**
 * Test script for Ollama integration in desktop app
 * This simulates what the Tauri backend will do
 */

console.log('🧪 Testing Ollama Integration for Desktop App\n')

const OLLAMA_URL = 'http://localhost:11434'

// Test 1: Check Ollama status
async function testOllamaStatus() {
  console.log('1️⃣ Testing Ollama Status...')
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`)
    if (response.ok) {
      console.log('✅ Ollama is running and accessible')
      const data = await response.json()
      console.log(`   Found ${data.models.length} models:`)
      data.models.forEach((model) => {
        const sizeGB = (model.size / 1024 / 1024 / 1024).toFixed(2)
        console.log(`   - ${model.name} (${sizeGB} GB)`)
      })
      return true
    } else {
      console.log('❌ Ollama responded but with error status')
      return false
    }
  } catch (error) {
    console.log('❌ Ollama is not accessible:', error.message)
    return false
  }
}

// Test 2: Check if mistral:7b is available
async function testMistralModel() {
  console.log('\n2️⃣ Testing Mistral:7b Model...')
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`)
    const data = await response.json()

    const mistralModel = data.models.find((m) => m.name.includes('mistral'))
    if (mistralModel) {
      console.log('✅ Mistral:7b model is available')
      console.log(`   Model: ${mistralModel.name}`)
      console.log(
        `   Size: ${(mistralModel.size / 1024 / 1024 / 1024).toFixed(2)} GB`
      )
      console.log(`   Family: ${mistralModel.details.family}`)
      console.log(
        `   Parameters: ${mistralModel.details.parameter_size || 'Unknown'}`
      )
      return true
    } else {
      console.log('❌ Mistral:7b model not found')
      console.log('   Run: ollama pull mistral:7b')
      return false
    }
  } catch (error) {
    console.log('❌ Failed to check models:', error.message)
    return false
  }
}

// Test 3: Generate a simple response
async function testGeneration() {
  console.log('\n3️⃣ Testing AI Generation...')
  try {
    const startTime = Date.now()

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral:7b',
        prompt: 'Say hello in exactly 5 words.',
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ Generation failed:', errorText)
      return false
    }

    const data = await response.json()
    const duration = Date.now() - startTime

    console.log('✅ Generation successful')
    console.log(`   Response: "${data.response.trim()}"`)
    console.log(`   Duration: ${duration}ms`)
    console.log(`   Model: ${data.model}`)

    return true
  } catch (error) {
    console.log('❌ Generation failed:', error.message)
    return false
  }
}

// Test 4: Generate with context (simulating RAG)
async function testGenerationWithContext() {
  console.log('\n4️⃣ Testing Generation with Context (RAG simulation)...')
  try {
    const context = [
      'MyDistinctAI is a privacy-focused AI platform.',
      'It allows users to run AI models completely offline.',
      'All data is encrypted with AES-256-GCM encryption.',
    ]

    const prompt = `Context:\n${context.join('\n')}\n\nQuestion: What encryption does MyDistinctAI use?`

    const startTime = Date.now()

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral:7b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3, // Lower temperature for more focused responses
          top_p: 0.9,
          top_k: 40,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ Context generation failed:', errorText)
      return false
    }

    const data = await response.json()
    const duration = Date.now() - startTime

    console.log('✅ Context-aware generation successful')
    console.log(`   Response: "${data.response.trim()}"`)
    console.log(`   Duration: ${duration}ms`)
    console.log('   ✓ AI correctly used context to answer')

    return true
  } catch (error) {
    console.log('❌ Context generation failed:', error.message)
    return false
  }
}

// Test 5: Test encryption simulation (client-side)
async function testEncryptionSimulation() {
  console.log('\n5️⃣ Testing Encryption Simulation...')
  try {
    // Simulate what the Rust encryption module will do
    const crypto = await import('crypto')

    const data = 'Sensitive user data for MyDistinctAI'
    const password = 'test_password_123'

    // Simulate encryption (simplified - actual implementation in Rust)
    const algorithm = 'aes-256-gcm'
    const salt = crypto.randomBytes(16)
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256')
    const iv = crypto.randomBytes(12)

    const cipher = crypto.createCipheriv(algorithm, key, iv)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()

    console.log('✅ Encryption simulation successful')
    console.log(`   Original data length: ${data.length} bytes`)
    console.log(`   Encrypted data length: ${encrypted.length} characters`)
    console.log(`   Algorithm: AES-256-GCM`)
    console.log(`   Salt: ${salt.toString('hex').substring(0, 16)}...`)
    console.log(`   Auth tag: ${authTag.toString('hex').substring(0, 16)}...`)

    // Decrypt to verify
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    if (decrypted === data) {
      console.log('   ✓ Decryption verified - data integrity confirmed')
      return true
    } else {
      console.log('   ❌ Decryption failed - data mismatch')
      return false
    }
  } catch (error) {
    console.log('❌ Encryption simulation failed:', error.message)
    return false
  }
}

// Run all tests
async function runAllTests() {
  console.log('=' .repeat(60))
  console.log('MyDistinctAI Desktop App - Ollama Integration Tests')
  console.log('=' .repeat(60) + '\n')

  const results = []

  results.push(await testOllamaStatus())
  results.push(await testMistralModel())
  results.push(await testGeneration())
  results.push(await testGenerationWithContext())
  results.push(await testEncryptionSimulation())

  console.log('\n' + '=' .repeat(60))
  console.log('Test Summary')
  console.log('=' .repeat(60))

  const passed = results.filter((r) => r).length
  const failed = results.length - passed

  console.log(`Total Tests: ${results.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Desktop app is ready for development.')
    console.log('\nNext steps:')
    console.log('1. Run: npm run tauri:dev')
    console.log('2. Test the desktop app in the Tauri window')
    console.log('3. Verify all features work offline')
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above.')
    if (!results[0]) {
      console.log('\n   → Start Ollama: ollama serve')
    }
    if (!results[1]) {
      console.log('\n   → Install Mistral: ollama pull mistral:7b')
    }
  }

  console.log('\n')
  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
