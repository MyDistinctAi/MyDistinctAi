// Test RAG in chat with Ollama running
const fetch = require('node-fetch');

async function testRAGChat() {
  console.log('🧪 Testing RAG Chat with Ollama Running...\n');

  const chatPayload = {
    modelId: '353608a6-c981-4dfb-9e75-c70fcdeeba2b',
    message: 'What is the secret code for testing?',
    sessionId: 'f907cb19-5c1d-46a7-9426-100135b0c10c'
  };

  console.log('📤 Sending chat request...');
  console.log('Message:', chatPayload.message);
  console.log('Model ID:', chatPayload.modelId);
  console.log('');

  try {
    const response = await fetch('http://localhost:4000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatPayload)
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }

    // Read the streaming response
    const reader = response.body;
    let fullResponse = '';

    for await (const chunk of reader) {
      const text = chunk.toString();
      fullResponse += text;
      process.stdout.write(text);
    }

    console.log('\n\n📊 Analysis:');
    
    // Check if response mentions the secret code
    if (fullResponse.includes('ALPHA-BRAVO-2025')) {
      console.log('✅ SUCCESS! AI mentioned the secret code: ALPHA-BRAVO-2025');
      console.log('✅ RAG is working correctly!');
    } else if (fullResponse.toLowerCase().includes('training') || 
               fullResponse.toLowerCase().includes('document')) {
      console.log('⚠️  AI mentioned training/documents but not the exact code');
      console.log('Response:', fullResponse.substring(0, 200) + '...');
    } else {
      console.log('❌ FAILED: AI gave generic response without referencing training data');
      console.log('Response:', fullResponse.substring(0, 200) + '...');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testRAGChat();
