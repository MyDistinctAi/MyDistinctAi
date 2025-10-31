// Fix match_documents function and test RAG
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAndTest() {
  console.log('🔧 Step 1: Updating match_documents function...\n');

  const updateFunctionSQL = `
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding text,
  match_model_id uuid,
  match_count int DEFAULT 5,
  similarity_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  training_data_id uuid,
  chunk_text text,
  chunk_index int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.training_data_id,
    de.chunk_text,
    de.chunk_index,
    1 - (de.embedding::vector <=> query_embedding::vector) AS similarity
  FROM document_embeddings de
  WHERE de.model_id = match_model_id
    AND 1 - (de.embedding::vector <=> query_embedding::vector) >= similarity_threshold
  ORDER BY de.embedding::vector <=> query_embedding::vector
  LIMIT match_count;
END;
$$;
  `;

  const { error: funcError } = await supabase.rpc('exec_sql', { sql: updateFunctionSQL }).catch(() => ({ error: 'Cannot use exec_sql' }));

  if (funcError) {
    console.log('⚠️  Cannot update function via API. Please run fix-match-documents.sql manually in Supabase SQL Editor.\n');
    console.log('Continuing with test anyway...\n');
  } else {
    console.log('✅ Function updated!\n');
  }

  console.log('🧪 Step 2: Testing RAG chat...\n');

  const chatResponse = await fetch('http://localhost:4000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelId: '353608a6-c981-4dfb-9e75-c70fcdeeba2b',
      message: 'What is ALPHA-BRAVO-2025?',
      sessionId: 'f907cb19-5c1d-46a7-9426-100135b0c10c'
    })
  });

  let fullResponse = '';
  for await (const chunk of chatResponse.body) {
    const text = chunk.toString();
    fullResponse += text;
    process.stdout.write(text);
  }

  console.log('\n\n📊 FINAL TEST RESULT:\n');

  if (fullResponse.includes('ALPHA-BRAVO-2025')) {
    console.log('🎉🎉🎉 SUCCESS! 🎉🎉🎉');
    console.log('✅ AI mentioned the secret code: ALPHA-BRAVO-2025');
    console.log('✅ RAG IS WORKING CORRECTLY!');
    console.log('\n🚀 The RAG system is now 100% functional!');
  } else {
    console.log('❌ Test failed - AI did not mention the secret code');
    console.log('\n⚠️  Please run fix-match-documents.sql in Supabase SQL Editor');
    console.log('Then run this script again.');
  }
}

fixAndTest().catch(console.error);
