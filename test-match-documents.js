// Test match_documents() function directly
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

async function testMatchDocuments() {
  console.log('=== Testing match_documents() Function ===\n')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to bypass RLS
  )
  
  // 1. Generate embedding for "secret code"
  console.log('1. Generating embedding for query: "secret code"...')
  const embeddingResponse = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: 'secret code ALPHA BRAVO 2025'
    })
  })
  
  const embeddingData = await embeddingResponse.json()
  const queryEmbedding = embeddingData.embedding
  
  console.log(`✅ Generated embedding (${queryEmbedding.length} dimensions)\n`)
  
  // 2. Test with different thresholds
  const thresholds = [0.0, 0.3, 0.5, 0.7]
  
  for (const threshold of thresholds) {
    console.log(`\n--- Testing with threshold ${threshold} ---`)
    
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_model_id: '353608a6-c981-4dfb-9e75-c70fcdeeba2b',
      match_count: 5,
      similarity_threshold: threshold
    })
    
    if (error) {
      console.error(`❌ Error:`, error)
      continue
    }
    
    console.log(`✅ Found ${data?.length || 0} matches`)
    
    if (data && data.length > 0) {
      data.forEach((match, i) => {
        console.log(`\nMatch ${i + 1}:`)
        console.log(`  Similarity: ${(match.similarity * 100).toFixed(1)}%`)
        console.log(`  Chunk: "${match.chunk_text.substring(0, 100)}..."`)
        
        // Check if this chunk contains the secret code
        if (match.chunk_text.includes('ALPHA-BRAVO-2025')) {
          console.log(`  🎯 CONTAINS SECRET CODE!`)
        }
      })
    } else {
      console.log(`  No matches found`)
    }
  }
  
  console.log('\n=== Test Complete ===')
}

testMatchDocuments().catch(console.error)
