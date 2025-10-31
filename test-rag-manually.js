// Quick manual test of RAG components
// Run with: node test-rag-manually.js

async function testOllama() {
  console.log('Testing Ollama connection...')
  
  try {
    const response = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: 'Hello world'
      })
    })
    
    const data = await response.json()
    console.log('✅ Ollama working! Embedding dimensions:', data.embedding.length)
    return true
  } catch (error) {
    console.error('❌ Ollama error:', error.message)
    return false
  }
}

async function testProcessNext() {
  console.log('\nTesting process-next endpoint...')
  
  try {
    const response = await fetch('http://localhost:4000/api/jobs/process-next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (data.success) {
      console.log('✅ Job processed successfully!')
      console.log('   File:', data.result?.file_name)
      console.log('   Chunks:', data.result?.chunks_created)
      console.log('   Embeddings:', data.result?.embeddings_stored)
    } else if (data.message === 'No jobs available') {
      console.log('ℹ️  No jobs in queue')
    } else {
      console.log('❌ Processing failed:', data.error)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function main() {
  console.log('=== RAG System Test ===\n')
  
  const ollamaOk = await testOllama()
  if (!ollamaOk) {
    console.log('\n⚠️  Ollama not running. Start it first!')
    return
  }
  
  await testProcessNext()
  
  console.log('\n=== Test Complete ===')
}

main()
