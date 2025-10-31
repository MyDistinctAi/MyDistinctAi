# Desktop App Testing Guide - MyDistinctAI

**Last Updated**: October 30, 2025
**Desktop App Version**: 0.1.0
**Status**: ✅ Ready for Testing

---

## 🎯 Overview

This guide will help you test all the Tauri desktop app features, including Ollama integration, local storage, and encryption.

---

## 🚀 Prerequisites

### Required Software
1. **Ollama** (for AI features)
   ```bash
   # Download from: https://ollama.ai/
   # Or check if installed:
   ollama --version
   ```

2. **Mistral 7B Model** (recommended)
   ```bash
   ollama pull mistral:7b
   ```

3. **Desktop App Running**
   ```bash
   npm run tauri:dev
   ```

---

## 🧪 Testing Methods

### Method 1: Browser DevTools (Recommended)

1. Open the desktop app (it should already be running)
2. Press `F12` or `Ctrl+Shift+I` to open DevTools
3. Go to the Console tab
4. Run the test commands below

### Method 2: Create Test Page

Create a test page in your app at `/test-desktop` route.

---

## 📝 Test Commands

### ✅ Test 1: Check Tauri Availability

```javascript
// Verify Tauri is available
console.log('Tauri available:', '__TAURI__' in window);

// Check if invoke function exists
console.log('Invoke available:', typeof window.__TAURI__?.core?.invoke === 'function');
```

**Expected Output**:
```
Tauri available: true
Invoke available: true
```

---

### ✅ Test 2: Check Ollama Status

```javascript
const { invoke } = window.__TAURI__.core;

// Check if Ollama is running
invoke('check_ollama_status')
  .then(status => console.log('✅ Ollama Status:', status))
  .catch(err => console.error('❌ Ollama Error:', err));
```

**Expected Outputs**:
- ✅ `Ollama Status: true` - Ollama is running
- ❌ `Ollama Error: Connection refused` - Ollama is not running

**If Ollama is not running**:
```bash
# Start Ollama in a separate terminal
ollama serve
```

---

### ✅ Test 3: List Ollama Models

```javascript
const { invoke } = window.__TAURI__.core;

// List available models
invoke('list_ollama_models')
  .then(models => {
    console.log('✅ Available Models:', models);
    console.log(`Found ${models.length} model(s)`);
  })
  .catch(err => console.error('❌ Error:', err));
```

**Expected Output**:
```
✅ Available Models: ["mistral:7b", "llama2:latest", ...]
Found 2 model(s)
```

---

### ✅ Test 4: Generate AI Response

```javascript
const { invoke } = window.__TAURI__.core;

// Generate a simple response
invoke('generate_response', {
  model: 'mistral:7b',
  prompt: 'What is 2+2? Answer in one sentence.',
  context: null
})
  .then(response => {
    console.log('✅ AI Response:', response);
  })
  .catch(err => console.error('❌ Error:', err));
```

**Expected Output** (takes 5-10 seconds):
```
✅ AI Response: 2+2 equals 4.
```

---

### ✅ Test 5: Save Local Data

```javascript
const { invoke } = window.__TAURI__.core;

// Save some data
invoke('save_user_data', {
  key: 'test_setting',
  data: JSON.stringify({ theme: 'dark', fontSize: 14 })
})
  .then(() => console.log('✅ Data saved successfully'))
  .catch(err => console.error('❌ Error:', err));
```

**Expected Output**:
```
✅ Data saved successfully
```

---

### ✅ Test 6: Load Local Data

```javascript
const { invoke } = window.__TAURI__.core;

// Load the data we just saved
invoke('load_user_data', {
  key: 'test_setting'
})
  .then(data => {
    const parsed = JSON.parse(data);
    console.log('✅ Loaded Data:', parsed);
  })
  .catch(err => console.error('❌ Error:', err));
```

**Expected Output**:
```
✅ Loaded Data: {theme: 'dark', fontSize: 14}
```

---

### ✅ Test 7: List All Saved Keys

```javascript
const { invoke} = window.__TAURI__.core;

// List all saved keys
invoke('list_data_keys')
  .then(keys => {
    console.log('✅ Saved Keys:', keys);
    console.log(`Found ${keys.length} key(s)`);
  })
  .catch(err => console.error('❌ Error:', err));
```

**Expected Output**:
```
✅ Saved Keys: ["test_setting"]
Found 1 key(s)
```

---

### ✅ Test 8: Encrypt Data

```javascript
const { invoke } = window.__TAURI__.core;

// Encrypt a secret message
invoke('encrypt_data', {
  data: 'This is my secret message!',
  password: 'my_secure_password_123'
})
  .then(encrypted => {
    console.log('✅ Encrypted:', encrypted);
    console.log('Length:', encrypted.length);

    // Store for next test
    window.testEncrypted = encrypted;
  })
  .catch(err => console.error('❌ Error:', err));
```

**Expected Output**:
```
✅ Encrypted: [long encrypted string]
Length: 200+
```

---

### ✅ Test 9: Decrypt Data

```javascript
const { invoke } = window.__TAURI__.core;

// Decrypt the message from Test 8
invoke('decrypt_data', {
  encrypted: window.testEncrypted,
  password: 'my_secure_password_123'
})
  .then(decrypted => {
    console.log('✅ Decrypted:', decrypted);
  })
  .catch(err => console.error('❌ Error:', err));
```

**Expected Output**:
```
✅ Decrypted: This is my secret message!
```

---

### ✅ Test 10: Save Model Configuration

```javascript
const { invoke } = window.__TAURI__.core;

// Save a model configuration
invoke('save_model_config', {
  modelId: 'model-test-123',
  config: JSON.stringify({
    name: 'My Test Model',
    baseModel: 'mistral:7b',
    temperature: 0.7,
    maxTokens: 2000
  })
})
  .then(() => console.log('✅ Model config saved'))
  .catch(err => console.error('❌ Error:', err));
```

---

### ✅ Test 11: Load Model Configuration

```javascript
const { invoke } = window.__TAURI__.core;

// Load the model configuration
invoke('load_model_config', {
  modelId: 'model-test-123'
})
  .then(config => {
    const parsed = JSON.parse(config);
    console.log('✅ Model Config:', parsed);
  })
  .catch(err => console.error('❌ Error:', err));
```

**Expected Output**:
```
✅ Model Config: {name: 'My Test Model', baseModel: 'mistral:7b', ...}
```

---

### ✅ Test 12: Save Chat History

```javascript
const { invoke } = window.__TAURI__.core;

// Save chat history
invoke('save_chat_history', {
  sessionId: 'session-test-456',
  messages: JSON.stringify([
    { role: 'user', content: 'Hello!' },
    { role: 'assistant', content: 'Hi! How can I help you?' },
    { role: 'user', content: 'What is AI?' },
    { role: 'assistant', content: 'AI stands for Artificial Intelligence...' }
  ])
})
  .then(() => console.log('✅ Chat history saved'))
  .catch(err => console.error('❌ Error:', err));
```

---

### ✅ Test 13: Load Chat History

```javascript
const { invoke } = window.__TAURI__.core;

// Load chat history
invoke('load_chat_history', {
  sessionId: 'session-test-456'
})
  .then(messages => {
    const parsed = JSON.parse(messages);
    console.log('✅ Chat History:', parsed);
    console.log(`Found ${parsed.length} message(s)`);
  })
  .catch(err => console.error('❌ Error:', err));
```

**Expected Output**:
```
✅ Chat History: [{role: 'user', content: 'Hello!'}, ...]
Found 4 message(s)
```

---

### ✅ Test 14: Delete Data

```javascript
const { invoke } = window.__TAURI__.core;

// Delete test data
invoke('delete_user_data', {
  key: 'test_setting'
})
  .then(() => console.log('✅ Data deleted'))
  .catch(err => console.error('❌ Error:', err));
```

---

## 🎯 Complete Test Suite (Run All at Once)

```javascript
const { invoke } = window.__TAURI__.core;

async function runAllTests() {
  console.log('🧪 Starting Desktop App Test Suite...\n');

  try {
    // Test 1: Tauri availability
    console.log('✅ Test 1: Tauri available');

    // Test 2: Ollama status
    const ollamaStatus = await invoke('check_ollama_status');
    console.log(`✅ Test 2: Ollama ${ollamaStatus ? 'running' : 'not running'}`);

    if (!ollamaStatus) {
      console.log('⚠️  Skipping Ollama tests - please start Ollama');
    } else {
      // Test 3: List models
      const models = await invoke('list_ollama_models');
      console.log(`✅ Test 3: Found ${models.length} model(s):`, models);

      // Test 4: Generate response
      if (models.includes('mistral:7b')) {
        console.log('⏳ Test 4: Generating AI response (this may take 10s)...');
        const response = await invoke('generate_response', {
          model: 'mistral:7b',
          prompt: 'Say "Hello from desktop app!" and nothing else.',
          context: null
        });
        console.log(`✅ Test 4: AI said: "${response}"`);
      } else {
        console.log('⚠️  Skipping Test 4 - mistral:7b not installed');
      }
    }

    // Test 5: Save data
    await invoke('save_user_data', {
      key: 'test_data',
      data: JSON.stringify({ test: true, timestamp: Date.now() })
    });
    console.log('✅ Test 5: Data saved');

    // Test 6: Load data
    const loaded = await invoke('load_user_data', { key: 'test_data' });
    console.log('✅ Test 6: Data loaded:', JSON.parse(loaded));

    // Test 7: List keys
    const keys = await invoke('list_data_keys');
    console.log(`✅ Test 7: Found ${keys.length} key(s)`);

    // Test 8 & 9: Encryption
    const encrypted = await invoke('encrypt_data', {
      data: 'Secret message',
      password: 'test123'
    });
    console.log('✅ Test 8: Data encrypted');

    const decrypted = await invoke('decrypt_data', {
      encrypted,
      password: 'test123'
    });
    console.log(`✅ Test 9: Data decrypted: "${decrypted}"`);

    // Test 10 & 11: Model config
    await invoke('save_model_config', {
      modelId: 'test-model',
      config: JSON.stringify({ name: 'Test Model' })
    });
    console.log('✅ Test 10: Model config saved');

    const config = await invoke('load_model_config', { modelId: 'test-model' });
    console.log('✅ Test 11: Model config loaded:', JSON.parse(config));

    // Test 12 & 13: Chat history
    await invoke('save_chat_history', {
      sessionId: 'test-session',
      messages: JSON.stringify([{ role: 'user', content: 'Test' }])
    });
    console.log('✅ Test 12: Chat history saved');

    const history = await invoke('load_chat_history', { sessionId: 'test-session' });
    console.log('✅ Test 13: Chat history loaded');

    // Test 14: Delete
    await invoke('delete_user_data', { key: 'test_data' });
    console.log('✅ Test 14: Data deleted');

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
runAllTests();
```

---

## 📁 Data Storage Location

Your local data is stored at:
```
Windows: C:\Users\<username>\AppData\Local\MyDistinctAI\
macOS: ~/Library/Application Support/MyDistinctAI/
Linux: ~/.local/share/MyDistinctAI/
```

---

## 🔧 Troubleshooting

### Ollama Connection Issues

**Problem**: `Connection refused` or `Ollama Status: false`

**Solutions**:
1. Start Ollama service:
   ```bash
   ollama serve
   ```

2. Verify Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```

3. Check Ollama logs for errors

---

### Model Not Found

**Problem**: Model not in list

**Solution**:
```bash
# Pull the model
ollama pull mistral:7b

# Verify it's installed
ollama list
```

---

### Permission Errors

**Problem**: Cannot write to local storage

**Solution**:
- Check folder permissions in AppData
- Run app as administrator (Windows)
- Check disk space

---

### Encryption Errors

**Problem**: Decryption fails

**Common Causes**:
- Wrong password
- Corrupted encrypted data
- Different encryption key

**Solution**: Use the same password for encrypt/decrypt

---

## ✅ Success Criteria

All tests passing means:
- ✅ Tauri IPC communication works
- ✅ Ollama integration functional
- ✅ Local storage working
- ✅ Encryption/decryption working
- ✅ All 14 commands available

---

## 📊 Performance Benchmarks

### Expected Response Times
- `check_ollama_status`: < 100ms
- `list_ollama_models`: < 500ms
- `generate_response`: 5-15 seconds (depends on model)
- `save_user_data`: < 50ms
- `load_user_data`: < 50ms
- `encrypt_data`: < 100ms
- `decrypt_data`: < 100ms

---

## 🎯 Next Steps After Testing

Once all tests pass:
1. Integrate Tauri commands into your React components
2. Build offline chat functionality
3. Implement local vector storage (LanceDB)
4. Add desktop-specific UI features
5. Create production build

---

**Happy Testing! 🚀**

For issues or questions, check:
- `DESKTOP_APP_SUCCESS.md` - Success documentation
- `TAURI_BUILD_STATUS.md` - Build history
- `SESSION_OCT_30_TAURI_SETUP.md` - Setup session notes
