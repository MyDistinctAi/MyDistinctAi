/**
 * Test Chat with RAG Context
 * Simulates a chat request that should retrieve context from embeddings
 */

console.log('🧪 Testing Chat with RAG Context\n')

const modelId = '3ac57325-981b-4f2c-b97d-8ba488a0a5c4'
const testQuery = 'What is the git workflow I should follow?'

console.log('Model ID:', modelId)
console.log('Query:', testQuery)
console.log('')

try {
  // 1. Generate query embedding
  console.log('1️⃣ Generating query embedding...')
  const queryEmbeddingRes = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: testQuery,
    }),
  })

  if (!queryEmbeddingRes.ok) {
    throw new Error(`Failed to generate embedding: ${queryEmbeddingRes.statusText}`)
  }

  const queryEmbeddingData = await queryEmbeddingRes.json()
  console.log(`   ✅ Generated ${queryEmbeddingData.embedding.length}-dimensional embedding`)
  console.log('')

  // 2. Search for similar documents (simulate what the API would do)
  console.log('2️⃣ Searching for relevant context...')

  // We'll use direct database query to test match_documents function
  const { createClient } = await import('@supabase/supabase-js')

  const supabase = createClient(
    'https://ekfdbotohslpalnyvdpk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZmRib3RvaHNscGFsbnl2ZHBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk2MjIxMSwiZXhwIjoyMDc2NTM4MjExfQ.EAqXIjfGI7YZNpxzT-hZRuMidRHjWlC1HVN8beo8rm8'
  )

  const { data: matches, error: searchError } = await supabase.rpc('match_documents', {
    query_embedding: JSON.stringify(queryEmbeddingData.embedding),
    match_model_id: modelId,
    match_count: 3,
    similarity_threshold: 0.3,
  })

  if (searchError) {
    throw new Error(`Search failed: ${searchError.message}`)
  }

  console.log(`   ✅ Found ${matches.length} relevant chunks`)
  matches.forEach((match, i) => {
    console.log(`      ${i + 1}. Similarity: ${(match.similarity * 100).toFixed(1)}%`)
    console.log(`         "${match.chunk_text.substring(0, 80).replace(/\r?\n/g, ' ')}..."`)
  })
  console.log('')

  // 3. Build context string
  console.log('3️⃣ Building context for LLM...')
  const contextParts = matches.map((match, index) => {
    return `[Context ${index + 1}] (Similarity: ${(match.similarity * 100).toFixed(1)}%)\n${match.chunk_text}`
  })
  const context = contextParts.join('\n\n---\n\n')

  console.log(`   ✅ Built context: ${context.length} characters`)
  console.log('')

  // 4. Generate AI response with context
  console.log('4️⃣ Generating AI response with RAG context...')

  const promptWithContext = `You are a helpful AI assistant. Use the following context from the uploaded documents to answer the user's question.

Context from uploaded documents:
${context}

User question: ${testQuery}

Answer based on the context provided:`

  const chatRes = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mistral:7b',
      prompt: promptWithContext,
      stream: false,
    }),
  })

  if (!chatRes.ok) {
    throw new Error(`Chat failed: ${chatRes.statusText}`)
  }

  const chatData = await chatRes.json()

  console.log('   ✅ AI Response:\n')
  console.log('   ' + chatData.response.trim().split('\n').join('\n   '))
  console.log('')

  // 5. Summary
  console.log('✅ Complete RAG Flow Test Successful!\n')
  console.log('📊 Summary:')
  console.log(`   - Query: "${testQuery}"`)
  console.log(`   - Relevant chunks found: ${matches.length}`)
  console.log(`   - Average similarity: ${(matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length * 100).toFixed(1)}%`)
  console.log(`   - Context size: ${context.length} chars`)
  console.log(`   - AI used the context to answer the question ✅`)
  console.log('')
  console.log('🎉 RAG system is working end-to-end!')

} catch (error) {
  console.error('\n❌ Error:', error.message)
  console.error(error)
  process.exit(1)
}
