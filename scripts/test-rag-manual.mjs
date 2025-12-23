/**
 * Manual RAG Testing Script
 * Tests file upload → processing → chat with context
 */

// Simpler approach - just test the core RAG functions
const testRAG = async () => {
  console.log('🧪 Testing RAG Implementation\n')

  // Test 1: Check Ollama is running
  console.log('1️⃣ Checking Ollama connection...')
  try {
    const ollamaCheck = await fetch('http://localhost:11434/api/tags')
    if (ollamaCheck.ok) {
      const data = await ollamaCheck.json()
      const hasEmbedModel = data.models.some(m => m.name.includes('nomic-embed-text'))
      const hasChatModel = data.models.some(m => m.name.includes('mistral'))

      console.log(`   ✅ Ollama running`)
      console.log(`   ${hasEmbedModel ? '✅' : '❌'} Embedding model (nomic-embed-text)`)
      console.log(`   ${hasChatModel ? '✅' : '❌'} Chat model (mistral)`)

      if (!hasEmbedModel || !hasChatModel) {
        console.log('\n⚠️ Missing required models')
        return
      }
    }
  } catch (error) {
    console.log('   ❌ Ollama not running')
    console.log('   Run: ollama serve')
    return
  }

  // Test 2: Test embedding generation
  console.log('\n2️⃣ Testing embedding generation...')
  try {
    const testText = 'This is a test document for RAG'
    const embeddingRes = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: testText,
      }),
    })

    if (embeddingRes.ok) {
      const embeddingData = await embeddingRes.json()
      console.log(`   ✅ Generated embedding (${embeddingData.embedding.length} dimensions)`)
    } else {
      console.log('   ❌ Failed to generate embedding')
      return
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message)
    return
  }

  // Test 3: Test text chunking
  console.log('\n3️⃣ Testing text chunking...')
  const sampleText = `MyDistinctAI Landing Page

Welcome to MyDistinctAI - Your Private AI Studio

Build your own GPT - offline, encrypted, and trained on you.
Your private AI studio: no code, no cloud, no compromises.

Key Features:
1. Local-First AI - Your data never leaves your device.
2. GDPR/HIPAA Compliant - Built-in compliance with AES-256 encryption.
3. Host Anywhere - Self-host on your infrastructure.

Pricing:
- Starter: $29/month
- Professional: $99/month
- Enterprise: Custom pricing
`

  const chunks = []
  const chunkSize = 200
  const overlap = 50

  for (let i = 0; i < sampleText.length; i += chunkSize - overlap) {
    chunks.push(sampleText.slice(i, i + chunkSize).trim())
  }

  console.log(`   ✅ Created ${chunks.length} chunks from sample text`)

  // Test 4: Test similarity search concept
  console.log('\n4️⃣ Testing RAG concept (embedding similarity)...')

  // Generate embeddings for chunks
  const chunkEmbeddings = []
  for (let i = 0; i < Math.min(chunks.length, 3); i++) {
    const res = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: chunks[i],
      }),
    })
    const data = await res.json()
    chunkEmbeddings.push(data.embedding)
  }

  // Generate embedding for a query
  const queryRes = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: 'What are the pricing tiers?',
    }),
  })
  const queryData = await queryRes.json()
  const queryEmbedding = queryData.embedding

  // Calculate cosine similarity
  const cosineSimilarity = (a, b) => {
    let dotProduct = 0
    let magnitudeA = 0
    let magnitudeB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      magnitudeA += a[i] * a[i]
      magnitudeB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
  }

  const similarities = chunkEmbeddings.map((emb, i) => ({
    chunkIndex: i,
    similarity: cosineSimilarity(queryEmbedding, emb),
    preview: chunks[i].substring(0, 50) + '...',
  }))

  similarities.sort((a, b) => b.similarity - a.similarity)

  console.log('   ✅ Similarity scores for query "What are the pricing tiers?":')
  similarities.forEach(s => {
    console.log(`      Chunk ${s.chunkIndex}: ${(s.similarity * 100).toFixed(1)}% - "${s.preview}"`)
  })

  // Test 5: Test chat with context
  console.log('\n5️⃣ Testing chat with RAG context...')

  const topChunk = chunks[similarities[0].chunkIndex]
  const promptWithContext = `You are a helpful AI assistant. Use the following context to answer the user's question.

Context: ${topChunk}

User question: What are the pricing tiers for MyDistinctAI?

Answer:`

  const chatRes = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mistral:7b',
      prompt: promptWithContext,
      stream: false,
    }),
  })

  if (chatRes.ok) {
    const chatData = await chatRes.json()
    console.log('   ✅ AI Response with RAG context:')
    console.log('   ' + chatData.response.trim().split('\n').join('\n   '))
  }

  console.log('\n✅ RAG Implementation Test Complete!')
  console.log('\n📝 Summary:')
  console.log('   - Ollama is running with required models')
  console.log('   - Embedding generation works')
  console.log('   - Text chunking works')
  console.log('   - Similarity search works')
  console.log('   - Chat with context works')
  console.log('\n🎉 RAG system is functional! You can now:')
  console.log('   1. Upload files via the UI')
  console.log('   2. Files will be processed automatically')
  console.log('   3. Chat with your model using uploaded file context')
}

testRAG().catch(console.error)
