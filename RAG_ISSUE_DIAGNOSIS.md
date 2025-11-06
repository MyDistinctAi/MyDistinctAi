# RAG Issue Diagnosis - November 6, 2025

**Issue**: Chat API logs show "⚠️ No RAG context retrieved (no error, but no results)"

---

## 🔍 Root Cause Identified

**Problem**: Training files are uploaded and marked as "processed", but **NO embeddings are stored in the database**.

### Evidence:
```
📁 Training data for model: Test File Upload Model
  Found 4 files:
    1. test-upload.txt - Status: processed ✅
    2. test-upload-2.txt - Status: processed ✅
    3. test-upload-3.txt - Status: processed ✅
    4. test-ai-knowledge.txt - Status: processed ✅

  🔢 Embeddings for model: Test File Upload Model
  ❌ NO EMBEDDINGS FOUND - This is the problem!
```

**Result**: When RAG tries to retrieve context, it finds no embeddings to search against, so it returns empty results.

---

## 🐛 Why This Happened

The file processing pipeline has these steps:
1. ✅ Upload file → `training_data` table (status: 'uploaded')
2. ✅ Extract text from file
3. ✅ Chunk text into smaller pieces
4. ✅ Generate embeddings for chunks
5. ❌ **Store embeddings in `document_embeddings` table** ← FAILING HERE
6. ✅ Update status to 'processed'

**The issue**: Step 5 is silently failing, but step 6 still runs, marking files as "processed" even though embeddings weren't stored.

---

## 🔧 Possible Causes

### 1. Database Schema Issue
The `document_embeddings` table might have:
- Missing columns
- Wrong column types
- Constraints that reject the data
- Permission issues

### 2. Embedding Format Issue
- Embeddings might be wrong dimensions (expecting 1536D for OpenAI)
- Embeddings might be null or malformed
- JSON serialization issue

### 3. Silent Error Handling
The code might be catching errors and continuing instead of failing:
```typescript
if (!storeResult.success) {
  // Should fail here, but might be continuing
}
```

---

## ✅ Solution Steps

### Step 1: Check Database Schema
```sql
-- Check if document_embeddings table exists and has correct structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'document_embeddings';

-- Expected columns:
-- id (uuid)
-- model_id (uuid)
-- training_data_id (uuid)
-- chunk_index (integer)
-- chunk_text (text)
-- embedding (vector(1536))
-- metadata (jsonb)
-- created_at (timestamp)
```

### Step 2: Check Vector Extension
```sql
-- Verify pgvector extension is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- If not installed:
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 3: Test Embedding Storage Manually
```javascript
// Try inserting a test embedding
const { data, error } = await supabase
  .from('document_embeddings')
  .insert({
    model_id: 'test-model-id',
    training_data_id: 'test-training-id',
    chunk_index: 0,
    chunk_text: 'Test chunk',
    embedding: new Array(1536).fill(0.1), // Test embedding
    metadata: {}
  })

console.log('Insert result:', { data, error })
```

### Step 4: Re-process Files
Once the storage issue is fixed:
```bash
# Re-process all files
node process-file-directly.mjs
```

---

## 🎯 Quick Fix (Temporary)

If you need RAG working immediately:

### Option 1: Use Ollama Embeddings (Local)
```bash
# Install Ollama
# Download embedding model
ollama pull nomic-embed-text

# Files will be processed with local embeddings
```

### Option 2: Add OpenAI API Key
```bash
# Add to .env.local
OPENAI_API_KEY=sk-...

# Re-process files
node process-file-directly.mjs
```

### Option 3: Use OpenRouter for Embeddings
```bash
# Already have OPENROUTER_API_KEY
# Should work, but verify it's being used correctly
```

---

## 📊 Verification Steps

After fixing, verify with:

```bash
# 1. Check embeddings exist
node check-rag-embeddings.mjs

# Expected output:
# ✅ Found X embeddings

# 2. Test RAG retrieval
# Send a chat message and check server logs for:
# [Chat API] ✅ Retrieved X context chunks
```

---

## 🔍 Debug Logging

Add to `src/lib/vector-store.ts` in `storeEmbeddings()`:

```typescript
console.log('[Vector Store] Attempting to store embeddings:', {
  modelId,
  trainingDataId,
  chunkCount: chunks.length,
  embeddingCount: embeddings.length,
  firstEmbeddingDimensions: embeddings[0]?.length
})

const { data, error } = await supabase
  .from('document_embeddings')
  .insert(embeddingsToStore)

console.log('[Vector Store] Insert result:', {
  success: !error,
  insertedCount: data?.length,
  error: error?.message,
  errorDetails: error
})
```

---

## 📝 Next Steps

1. **Immediate**: Check database schema for `document_embeddings` table
2. **Verify**: pgvector extension is installed
3. **Test**: Manual embedding insertion
4. **Fix**: Update storage code to handle errors properly
5. **Re-process**: All training files
6. **Verify**: RAG context retrieval works

---

## 🎓 Prevention

To prevent this in the future:

1. **Better Error Handling**
   - Don't mark files as "processed" if embedding storage fails
   - Log detailed error messages
   - Return errors to user

2. **Validation**
   - Verify embeddings are stored before updating status
   - Check embedding count matches chunk count
   - Validate embedding dimensions

3. **Monitoring**
   - Add metrics for embedding storage success rate
   - Alert on storage failures
   - Track embedding count per model

---

**Status**: Issue diagnosed, awaiting database schema verification and fix implementation.
