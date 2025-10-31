// Reset embeddings and test RAG system
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetAndTest() {
  console.log('🔄 Step 1: Deleting old embeddings...\n');
  
  const { error: deleteError } = await supabase
    .from('document_embeddings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (deleteError) {
    console.error('❌ Error deleting embeddings:', deleteError);
    return;
  }
  console.log('✅ Deleted all old embeddings\n');

  console.log('🔄 Step 2: Resetting training data status...\n');
  
  const { error: updateError } = await supabase
    .from('training_data')
    .update({ status: 'uploaded', processed_at: null })
    .eq('model_id', '353608a6-c981-4dfb-9e75-c70fcdeeba2b');
  
  if (updateError) {
    console.error('❌ Error updating training data:', updateError);
    return;
  }
  console.log('✅ Reset training data status\n');

  console.log('🔄 Step 3: Clearing old jobs...\n');
  
  const { error: deleteJobsError } = await supabase
    .from('job_queue')
    .delete()
    .eq('job_type', 'file_processing');
  
  if (deleteJobsError) {
    console.error('❌ Error deleting jobs:', deleteJobsError);
    return;
  }
  console.log('✅ Cleared old jobs\n');

  console.log('🔄 Step 4: Getting training data to process...\n');
  
  const { data: trainingData, error: fetchError } = await supabase
    .from('training_data')
    .select('id, file_url, file_name, file_type, model_id')
    .eq('model_id', '353608a6-c981-4dfb-9e75-c70fcdeeba2b')
    .eq('status', 'uploaded');
  
  if (fetchError) {
    console.error('❌ Error fetching training data:', fetchError);
    return;
  }

  console.log(`Found ${trainingData.length} files to process\n`);

  console.log('🔄 Step 5: Creating new jobs...\n');
  
  for (const file of trainingData) {
    const { error: insertError } = await supabase
      .from('job_queue')
      .insert({
        job_type: 'file_processing',
        payload: {
          training_data_id: file.id,
          file_url: file.file_url,
          file_name: file.file_name,
          file_type: file.file_type,
          model_id: file.model_id
        },
        priority: 1
      });
    
    if (insertError) {
      console.error('❌ Error creating job:', insertError);
    } else {
      console.log(`✅ Created job for file: ${file.file_name}`);
    }
  }

  console.log('\n🔄 Step 6: Processing files with worker...\n');
  
  const fetch = require('node-fetch');
  const response = await fetch('http://localhost:4000/api/jobs/worker');
  const result = await response.json();
  
  console.log('Worker response:', result);

  console.log('\n⏳ Waiting 10 seconds for processing...\n');
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('🔄 Step 7: Checking embeddings...\n');
  
  const { data: embeddings, error: embError } = await supabase
    .from('document_embeddings')
    .select('id, chunk_text')
    .eq('model_id', '353608a6-c981-4dfb-9e75-c70fcdeeba2b');
  
  if (embError) {
    console.error('❌ Error checking embeddings:', embError);
    return;
  }

  console.log(`✅ Found ${embeddings.length} new embeddings!\n`);
  
  if (embeddings.length > 0) {
    console.log('Sample embedding text:', embeddings[0].chunk_text.substring(0, 100) + '...\n');
  }

  console.log('🧪 Step 8: Testing RAG chat...\n');
  
  const chatResponse = await fetch('http://localhost:4000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelId: '353608a6-c981-4dfb-9e75-c70fcdeeba2b',
      message: 'What is the secret code for testing?',
      sessionId: 'f907cb19-5c1d-46a7-9426-100135b0c10c'
    })
  });

  let fullResponse = '';
  for await (const chunk of chatResponse.body) {
    fullResponse += chunk.toString();
  }

  console.log('\n📊 FINAL TEST RESULT:\n');
  
  if (fullResponse.includes('ALPHA-BRAVO-2025')) {
    console.log('🎉🎉🎉 SUCCESS! 🎉🎉🎉');
    console.log('✅ AI mentioned the secret code: ALPHA-BRAVO-2025');
    console.log('✅ RAG is working correctly!');
  } else {
    console.log('❌ Test failed - AI did not mention the secret code');
    console.log('Response preview:', fullResponse.substring(0, 300));
  }
}

resetAndTest().catch(console.error);
