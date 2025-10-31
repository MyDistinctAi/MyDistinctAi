// Test RAG search directly
async function testSearch() {
  console.log('Testing RAG search...\n')
  
  // 1. Generate embedding for "secret code"
  const embeddingResponse = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: 'secret code'
    })
  })
  
  const embeddingData = await embeddingResponse.json()
  const queryEmbedding = embeddingData.embedding
  
  console.log('✅ Generated query embedding (768 dimensions)')
  
  // 2. Search using Supabase
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_model_id: '353608a6-c981-4dfb-9e75-c70fcdeeba2b',
    match_count: 5,
    similarity_threshold: 0.3
  })
  
  if (error) {
    console.error('❌ Search error:', error)
    return
  }
  
  console.log(`\n✅ Found ${data?.length || 0} matches:\n`)
  
  data?.forEach((match, i) => {
    console.log(`Match ${i + 1}:`)
    console.log(`  Similarity: ${(match.similarity * 100).toFixed(1)}%`)
    console.log(`  Text: ${match.chunk_text.substring(0, 200)}...`)
    console.log()
  })
}

testSearch().catch(console.error)
