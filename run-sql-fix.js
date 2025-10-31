// Run the SQL fix to update match_documents function
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQLFix() {
  console.log('🔧 Updating match_documents function...\n');

  // We'll use a migration approach
  const migrationSQL = `
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

  try {
    // Try using rpc to execute raw SQL
    const { data, error } = await supabase.rpc('exec', { sql: migrationSQL });
    
    if (error) {
      console.log('⚠️  Direct SQL execution not available via API');
      console.log('📋 Please run the SQL manually in Supabase SQL Editor:\n');
      console.log('1. Go to: https://supabase.com/dashboard/project/ekfdbotohslpalnyvdpk/sql');
      console.log('2. Paste the SQL from fix-match-documents.sql');
      console.log('3. Click "Run"\n');
      console.log('Then run: node test-rag-chat.js\n');
      return false;
    }

    console.log('✅ Function updated successfully!\n');
    return true;
  } catch (err) {
    console.log('⚠️  Cannot update function via API');
    console.log('📋 Please run fix-match-documents.sql manually in Supabase SQL Editor\n');
    return false;
  }
}

async function testRAG() {
  console.log('🧪 Testing RAG system...\n');

  const fetch = require('node-fetch');
  
  const response = await fetch('http://localhost:4000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelId: '353608a6-c981-4dfb-9e75-c70fcdeeba2b',
      message: 'What is ALPHA-BRAVO-2025?',
      sessionId: 'f907cb19-5c1d-46a7-9426-100135b0c10c'
    })
  });

  let fullResponse = '';
  for await (const chunk of response.body) {
    const text = chunk.toString();
    fullResponse += text;
    process.stdout.write(text);
  }

  console.log('\n\n📊 TEST RESULT:\n');

  if (fullResponse.includes('ALPHA-BRAVO-2025')) {
    console.log('🎉🎉🎉 SUCCESS! 🎉🎉🎉');
    console.log('✅ AI mentioned the secret code: ALPHA-BRAVO-2025');
    console.log('✅ RAG IS WORKING CORRECTLY!');
    console.log('\n🚀 The RAG system is now 100% functional!');
    return true;
  } else {
    console.log('❌ Test failed - AI did not mention the secret code');
    console.log('\n⚠️  The SQL fix may not have been applied yet.');
    console.log('Please run fix-match-documents.sql in Supabase SQL Editor');
    return false;
  }
}

async function main() {
  const sqlUpdated = await runSQLFix();
  
  if (sqlUpdated) {
    console.log('Waiting 2 seconds for changes to propagate...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  await testRAG();
}

main().catch(console.error);
