// Check what embeddings we have in the database
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmbeddings() {
  console.log('🔍 Checking embeddings in database...\n');

  // 1. Check which files were processed
  const { data: files } = await supabase
    .from('training_data')
    .select('id, file_name, status')
    .eq('model_id', '353608a6-c981-4dfb-9e75-c70fcdeeba2b');

  console.log('📁 Training files:');
  for (const file of files) {
    const { data: embeddings } = await supabase
      .from('document_embeddings')
      .select('id')
      .eq('training_data_id', file.id);
    
    console.log(`  - ${file.file_name}: ${embeddings.length} embeddings (${file.status})`);
  }

  // 2. Check if secret code is in database
  console.log('\n🔍 Searching for secret code...');
  const { data: secretCode } = await supabase
    .from('document_embeddings')
    .select('chunk_text, chunk_index')
    .ilike('chunk_text', '%ALPHA-BRAVO%');

  if (secretCode && secretCode.length > 0) {
    console.log('✅ Found secret code in database!');
    console.log('Text:', secretCode[0].chunk_text.substring(0, 200));
  } else {
    console.log('❌ Secret code NOT found in database!');
  }

  // 3. Get sample embeddings
  console.log('\n📊 Sample embeddings:');
  const { data: samples } = await supabase
    .from('document_embeddings')
    .select('id, chunk_text, embedding')
    .limit(3);

  for (const sample of samples) {
    console.log(`  - ID: ${sample.id.substring(0, 8)}...`);
    console.log(`    Text: ${sample.chunk_text.substring(0, 60)}...`);
    console.log(`    Embedding type: ${typeof sample.embedding}`);
    console.log(`    Embedding value: ${JSON.stringify(sample.embedding).substring(0, 100)}...`);
    
    if (typeof sample.embedding === 'string') {
      console.log(`    ⚠️  Embedding is stored as STRING!`);
      try {
        const parsed = JSON.parse(sample.embedding);
        console.log(`    Parsed length: ${parsed.length}`);
      } catch (e) {
        console.log(`    Cannot parse as JSON`);
      }
    } else if (Array.isArray(sample.embedding)) {
      console.log(`    ✅ Embedding is array with ${sample.embedding.length} elements`);
    }
  }

  // 4. Test if embeddings match themselves
  console.log('\n🧪 Testing self-similarity...');
  const { data: testEmb } = await supabase
    .from('document_embeddings')
    .select('embedding')
    .limit(1)
    .single();

  if (testEmb && testEmb.embedding) {
    const { data: matches } = await supabase.rpc('match_documents', {
      query_embedding: testEmb.embedding,
      match_model_id: '353608a6-c981-4dfb-9e75-c70fcdeeba2b',
      match_count: 5,
      similarity_threshold: 0.0
    });

    console.log(`Result: ${matches ? matches.length : 0} matches`);
    if (matches && matches.length > 0) {
      console.log('✅ Embeddings CAN match themselves!');
      console.log(`Top match similarity: ${matches[0].similarity}`);
    } else {
      console.log('❌ Embeddings CANNOT match themselves - CRITICAL BUG!');
    }
  }
}

checkEmbeddings().catch(console.error);
