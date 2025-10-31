// Test match_documents function directly with existing embeddings
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFunctionDirectly() {
  console.log('🧪 Testing match_documents function directly...\n');

  // Step 1: Get a sample embedding
  console.log('📥 Getting sample embedding...');
  const { data: sample, error: sampleError } = await supabase
    .from('document_embeddings')
    .select('id, embedding, chunk_text')
    .limit(1)
    .single();

  if (sampleError || !sample) {
    console.error('❌ Failed to get sample:', sampleError);
    return;
  }

  console.log('✅ Got sample embedding:');
  console.log('  - ID:', sample.id.substring(0, 8) + '...');
  console.log('  - Text:', sample.chunk_text.substring(0, 60) + '...');
  console.log('  - Type:', typeof sample.embedding);
  console.log('  - Length:', sample.embedding.length);
  console.log('');

  // Step 2: Test if it matches itself
  console.log('🔍 Testing self-similarity (should match with 1.0 similarity)...');
  
  const { data: matches, error: matchError } = await supabase.rpc('match_documents', {
    query_embedding: sample.embedding, // Use as-is (string)
    match_model_id: '353608a6-c981-4dfb-9e75-c70fcdeeba2b',
    match_count: 5,
    similarity_threshold: 0.0
  });

  if (matchError) {
    console.error('❌ Function error:', matchError);
    return;
  }

  console.log('✅ Function executed successfully');
  console.log(`📊 Found ${matches.length} matches`);
  
  if (matches.length > 0) {
    console.log('🎉 SUCCESS! Embeddings CAN match!');
    console.log('Top match:');
    console.log('  - ID:', matches[0].id.substring(0, 8) + '...');
    console.log('  - Similarity:', matches[0].similarity);
    console.log('  - Text:', matches[0].chunk_text.substring(0, 100) + '...');
    
    // Step 3: Test with actual query
    console.log('\n🔍 Testing with actual query: "secret code"...');
    
    // Get query embedding from Ollama
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: 'What is the secret code for testing?'
      })
    });
    
    const embeddingData = await response.json();
    const queryEmbedding = JSON.stringify(embeddingData.embedding);
    
    console.log('✅ Generated query embedding:', embeddingData.embedding.length, 'dimensions');
    
    const { data: queryMatches, error: queryError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_model_id: '353608a6-c981-4dfb-9e75-c70fcdeeba2b',
      match_count: 5,
      similarity_threshold: 0.0
    });
    
    if (queryError) {
      console.error('❌ Query error:', queryError);
    } else {
      console.log(`📊 Found ${queryMatches.length} matches for query`);
      if (queryMatches.length > 0) {
        console.log('✅ Query found matches! Check RAG now.');
        queryMatches.forEach((match, i) => {
          console.log(`  ${i+1}. Similarity: ${match.similarity.toFixed(4)}`);
          console.log(`     Text: ${match.chunk_text.substring(0, 80)}...`);
        });
      }
    }
  } else {
    console.log('❌ NO MATCHES - Even self-similarity failed!');
    console.log('This means the function is still not working correctly.');
  }
}

testFunctionDirectly().catch(console.error);
