# Desktop App Testing Plan

**Date**: November 6, 2025, 11:03 PM  
**Platform**: Tauri Desktop App  
**Status**: Ready for Testing

---

## 📋 Desktop App Features

### **Core Features:**
1. ✅ **Ollama Integration** - Local AI models
2. ✅ **Local Storage** - Encrypted data storage
3. ✅ **LanceDB** - Vector database for embeddings
4. ✅ **File Processing** - PDF, DOCX, TXT extraction
5. ✅ **Encryption** - AES-256 encryption
6. ✅ **RAG System** - Local RAG with embeddings
7. ✅ **Chat** - Streaming responses
8. ✅ **Model Management** - Pull and manage models

---

## 🧪 Test Categories

### **1. Ollama Integration Tests**
Test the local AI model functionality:

#### **Test 1.1: Check Ollama Status**
- **Command**: `check_ollama_status`
- **Expected**: Returns `true` if Ollama is running
- **Verify**: 
  - Ollama service is accessible
  - Connection established
  - No errors

#### **Test 1.2: List Ollama Models**
- **Command**: `list_ollama_models`
- **Expected**: Returns array of installed models
- **Verify**:
  - Models list is not empty
  - Model names are valid
  - Common models present (llama2, mistral, etc.)

#### **Test 1.3: Pull Ollama Model**
- **Command**: `pull_ollama_model`
- **Model**: `llama2:latest` or `mistral:latest`
- **Expected**: Model downloads successfully
- **Verify**:
  - Download progress
  - Model appears in list
  - No errors

#### **Test 1.4: Generate Response**
- **Command**: `generate_response`
- **Prompt**: "Hello, how are you?"
- **Expected**: AI response received
- **Verify**:
  - Response is coherent
  - Response length > 0
  - No errors

#### **Test 1.5: Stream Response**
- **Command**: `stream_response`
- **Prompt**: "Write a short poem"
- **Expected**: Streaming response chunks
- **Verify**:
  - Multiple chunks received
  - Chunks form coherent text
  - Stream completes

---

### **2. Local Storage Tests**
Test encrypted local data storage:

#### **Test 2.1: Save User Data**
- **Command**: `save_user_data`
- **Key**: `test_key`
- **Data**: `{"name": "Test User", "age": 30}`
- **Expected**: Data saved successfully
- **Verify**:
  - No errors
  - Data persists

#### **Test 2.2: Load User Data**
- **Command**: `load_user_data`
- **Key**: `test_key`
- **Expected**: Returns saved data
- **Verify**:
  - Data matches saved data
  - JSON is valid
  - No corruption

#### **Test 2.3: Delete User Data**
- **Command**: `delete_user_data`
- **Key**: `test_key`
- **Expected**: Data deleted
- **Verify**:
  - Data no longer exists
  - Load returns error/null

#### **Test 2.4: List Data Keys**
- **Command**: `list_data_keys`
- **Expected**: Returns array of keys
- **Verify**:
  - All saved keys present
  - No duplicates

---

### **3. Encryption Tests**
Test AES-256 encryption:

#### **Test 3.1: Encrypt Data**
- **Command**: `encrypt_data`
- **Data**: "Sensitive information"
- **Password**: "test_password_123"
- **Expected**: Encrypted string
- **Verify**:
  - Output is encrypted (not readable)
  - Output length > input length
  - Consistent encryption

#### **Test 3.2: Decrypt Data**
- **Command**: `decrypt_data`
- **Encrypted**: (from Test 3.1)
- **Password**: "test_password_123"
- **Expected**: Original data
- **Verify**:
  - Decrypted matches original
  - No data loss
  - Correct password required

#### **Test 3.3: Wrong Password**
- **Command**: `decrypt_data`
- **Password**: "wrong_password"
- **Expected**: Error
- **Verify**:
  - Decryption fails
  - Error message clear
  - No data leakage

---

### **4. File Processing Tests**
Test file extraction and chunking:

#### **Test 4.1: Extract Text from TXT**
- **Command**: `extract_text_from_file`
- **File**: `test-data/sample-document.txt`
- **Expected**: Text content
- **Verify**:
  - All text extracted
  - Formatting preserved
  - No errors

#### **Test 4.2: Extract Text from PDF**
- **Command**: `extract_text_from_file`
- **File**: `test-data/sample.pdf`
- **Expected**: PDF text content
- **Verify**:
  - Text extracted correctly
  - No garbled characters
  - Reasonable accuracy

#### **Test 4.3: Chunk Text**
- **Command**: `chunk_text`
- **Text**: (long text)
- **Chunk Size**: 500
- **Expected**: Array of chunks
- **Verify**:
  - Chunks are ~500 chars
  - No text loss
  - Proper boundaries

#### **Test 4.4: Process File**
- **Command**: `process_file`
- **File**: `test-data/sample-document.txt`
- **Expected**: Extracted and chunked text
- **Verify**:
  - Text extracted
  - Chunks created
  - Metadata included

#### **Test 4.5: Get File Info**
- **Command**: `get_file_info`
- **File**: `test-data/sample-document.txt`
- **Expected**: File metadata
- **Verify**:
  - File size correct
  - File type detected
  - Path correct

---

### **5. LanceDB & Embeddings Tests**
Test vector database and embeddings:

#### **Test 5.1: Generate Embeddings**
- **Command**: `generate_embeddings`
- **Model**: `nomic-embed-text`
- **Text**: "This is a test document"
- **Expected**: Vector embedding
- **Verify**:
  - Vector length correct (768 or 1536)
  - All values are floats
  - No NaN values

#### **Test 5.2: Generate Batch Embeddings**
- **Command**: `generate_embeddings_batch`
- **Texts**: ["Text 1", "Text 2", "Text 3"]
- **Expected**: Array of embeddings
- **Verify**:
  - 3 embeddings returned
  - All same dimension
  - No errors

#### **Test 5.3: Store Embeddings**
- **Command**: `store_embeddings`
- **Model ID**: `test_model_123`
- **Chunks**: (from file processing)
- **Expected**: Embeddings stored
- **Verify**:
  - No errors
  - Data persists
  - Can be retrieved

#### **Test 5.4: Search Similar**
- **Command**: `search_similar`
- **Query**: (embedding vector)
- **Expected**: Similar chunks
- **Verify**:
  - Results returned
  - Similarity scores present
  - Ordered by relevance

#### **Test 5.5: Get RAG Context**
- **Command**: `get_rag_context`
- **Query**: "What is this document about?"
- **Expected**: Relevant context
- **Verify**:
  - Context is relevant
  - Multiple chunks returned
  - Similarity > 0.5

#### **Test 5.6: Get Embedding Stats**
- **Command**: `get_embedding_stats`
- **Model ID**: `test_model_123`
- **Expected**: Statistics
- **Verify**:
  - Total count correct
  - Average similarity calculated
  - No errors

#### **Test 5.7: List Embedding Models**
- **Command**: `list_embedding_models`
- **Expected**: Array of model IDs
- **Verify**:
  - All models with embeddings listed
  - No duplicates

#### **Test 5.8: Delete Model Embeddings**
- **Command**: `delete_model_embeddings`
- **Model ID**: `test_model_123`
- **Expected**: Embeddings deleted
- **Verify**:
  - Model no longer in list
  - Stats return 0
  - No errors

---

### **6. Model Configuration Tests**
Test model config storage:

#### **Test 6.1: Save Model Config**
- **Command**: `save_model_config`
- **Model ID**: `test_model_123`
- **Config**: `{"temperature": 0.7, "max_tokens": 2000}`
- **Expected**: Config saved
- **Verify**:
  - No errors
  - Config persists

#### **Test 6.2: Load Model Config**
- **Command**: `load_model_config`
- **Model ID**: `test_model_123`
- **Expected**: Config returned
- **Verify**:
  - Config matches saved
  - JSON valid
  - All fields present

---

### **7. Chat History Tests**
Test chat session storage:

#### **Test 7.1: Save Chat History**
- **Command**: `save_chat_history`
- **Session ID**: `session_123`
- **Messages**: `[{"role": "user", "content": "Hello"}]`
- **Expected**: History saved
- **Verify**:
  - No errors
  - History persists

#### **Test 7.2: Load Chat History**
- **Command**: `load_chat_history`
- **Session ID**: `session_123`
- **Expected**: Messages returned
- **Verify**:
  - Messages match saved
  - Order preserved
  - All messages present

---

### **8. Complete RAG Workflow Test**
Test end-to-end RAG functionality:

#### **Test 8.1: Process and Store File**
- **Command**: `process_and_store_file`
- **Model ID**: `rag_test_model`
- **File**: `test-data/sample-document.txt`
- **Expected**: Complete workflow
- **Verify**:
  1. File extracted
  2. Text chunked
  3. Embeddings generated
  4. Stored in LanceDB
  5. Searchable

#### **Test 8.2: RAG Query**
- **Query**: "What is the main topic?"
- **Expected**: Relevant response
- **Verify**:
  1. Context retrieved
  2. AI generates response
  3. Response uses context
  4. Accurate information

---

## 🚀 Running the Tests

### **Prerequisites:**
1. ✅ Ollama installed and running
2. ✅ Rust and Cargo installed
3. ✅ Node.js and npm installed
4. ✅ Test data files created

### **Setup:**
```bash
# 1. Install dependencies
npm install

# 2. Build the app
npm run tauri build

# 3. Run in dev mode
npm run tauri dev
```

### **Manual Testing:**
1. Open the desktop app
2. Test each feature manually
3. Check console for errors
4. Verify data persistence

### **Automated Testing:**
Create test scripts that:
1. Call Tauri commands via IPC
2. Verify responses
3. Check error handling
4. Measure performance

---

## 📊 Test Checklist

### **Ollama Integration:**
- [ ] Check Ollama status
- [ ] List models
- [ ] Pull model
- [ ] Generate response
- [ ] Stream response

### **Local Storage:**
- [ ] Save data
- [ ] Load data
- [ ] Delete data
- [ ] List keys

### **Encryption:**
- [ ] Encrypt data
- [ ] Decrypt data
- [ ] Wrong password handling

### **File Processing:**
- [ ] Extract TXT
- [ ] Extract PDF
- [ ] Chunk text
- [ ] Process file
- [ ] Get file info

### **LanceDB & Embeddings:**
- [ ] Generate embeddings
- [ ] Batch embeddings
- [ ] Store embeddings
- [ ] Search similar
- [ ] Get RAG context
- [ ] Get stats
- [ ] List models
- [ ] Delete embeddings

### **Model Config:**
- [ ] Save config
- [ ] Load config

### **Chat History:**
- [ ] Save history
- [ ] Load history

### **Complete Workflow:**
- [ ] Process and store file
- [ ] RAG query with context

---

## 🎯 Success Criteria

### **Must Pass:**
1. ✅ Ollama connection works
2. ✅ Local storage persists
3. ✅ Encryption/decryption works
4. ✅ File extraction works
5. ✅ Embeddings generation works
6. ✅ Vector search works
7. ✅ RAG retrieval works
8. ✅ Chat responses work

### **Performance:**
- Embedding generation: < 5s per chunk
- Vector search: < 1s
- File processing: < 10s for 10 pages
- Chat response: < 5s

### **Reliability:**
- No crashes
- No data loss
- Proper error handling
- Graceful degradation

---

## 📝 Test Results Template

```markdown
## Test Results - [Date]

### Test: [Test Name]
- **Status**: ✅ PASS / ❌ FAIL
- **Duration**: [time]
- **Notes**: [observations]
- **Errors**: [if any]

### Performance:
- **Response Time**: [ms]
- **Memory Usage**: [MB]
- **CPU Usage**: [%]

### Issues Found:
1. [Issue description]
2. [Issue description]

### Recommendations:
1. [Recommendation]
2. [Recommendation]
```

---

## 🐛 Known Issues

### **To Investigate:**
1. Ollama connection timeout handling
2. Large file processing performance
3. Memory usage with many embeddings
4. Encryption key management

---

## 🔧 Next Steps

1. **Create test data files**
2. **Install Ollama** (if not installed)
3. **Pull test models** (llama2, mistral)
4. **Run manual tests**
5. **Create automated test scripts**
6. **Document results**
7. **Fix any issues found**

---

**Ready to start testing!** 🚀
