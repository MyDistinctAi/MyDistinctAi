// Test RAG retrieval directly via API
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testAPIDirectly() {
  console.log('🧪 Testing RAG retrieval via API...\n');

  // Test the vector store function directly
  const response = await fetch('http://localhost:4000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelId: '353608a6-c981-4dfb-9e75-c70fcdeeba2b',
      message: 'What is ALPHA-BRAVO-2025?',
      sessionId: 'test-' + Date.now()
    })
  });

  let fullResponse = '';
  for await (const chunk of response.body) {
    const text = chunk.toString();
    fullResponse += text;
    process.stdout.write(text);
  }

  console.log('\n\n📊 FINAL RESULT:\n');

  if (fullResponse.includes('ALPHA-BRAVO-2025')) {
    console.log('🎉🎉🎉 SUCCESS! 🎉🎉🎉');
    console.log('✅ AI mentioned the secret code: ALPHA-BRAVO-2025');
    console.log('✅ RAG IS WORKING CORRECTLY!');
  } else {
    console.log('❌ Test failed - AI did not mention the secret code');
    console.log('\n⚠️  The server may need to be restarted to load the updated code.');
    console.log('Try stopping the server (Ctrl+C) and running: npm run dev');
  }
}

testAPIDirectly().catch(console.error);
