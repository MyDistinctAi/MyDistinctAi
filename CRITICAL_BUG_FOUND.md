# CRITICAL BUG FOUND - RAG System

**Date**: October 28, 2025, 2:10 PM  
**Status**: 🔴 **CRITICAL BUG IDENTIFIED**

---

## 🎯 THE PROBLEM

### Server Logs Show:
```
[Vector Store] Calling match_documents with:
  - Model ID: 353608a6-c981-4dfb-9e75-c70fcdeeba2b
  - Embedding length: 768
  - Limit: 5
  - Threshold: 0
[Vector Store] RPC result: { data: [], error: null }
[Vector Store] ✅ Found 0 matches
```

**The `match_documents` function returns 0 matches even with threshold 0.0!**

---

## 🔍 Root Cause

### What We Know:
1. ✅ Ollama is running
2. ✅ Query embedding is generated (768 dimensions)
3. ✅ RPC call succeeds (no error)
4. ❌ Returns 0 matches

### But Earlier We Verified:
When calling `match_documents` directly with SQL using an existing embedding from the database, it returned **3 matches** including the secret code!

```sql
SELECT * FROM match_documents(
  (SELECT embedding FROM document_embeddings LIMIT 1),
  '353608a6-c981-4dfb-9e75-c70fcdeeba2b'::uuid,
  5,
  0.0
);
-- Returns 3 matches! ✅
```

---

## 💡 The Issue

**The embeddings in the database were created with a DIFFERENT embedding model than the one being used for queries!**

### Stored Embeddings:
- Created during file processing
- Used the embedding service at that time
- Might have used a different model or version

### Query Embeddings:
- Created NOW with Ollama's `nomic-embed-text`
- 768 dimensions
- Different vector space!

**Result**: The query embedding and stored embeddings are in different vector spaces, so cosine similarity returns very low scores (below even threshold 0.0).

---

## 🔧 Solution

### Option 1: Re-process All Files (RECOMMENDED)
Delete all embeddings and re-process files with the current Ollama model:

```sql
-- Delete all embeddings
DELETE FROM document_embeddings;

-- Reset training data status
UPDATE training_data SET status = 'uploaded', processed_at = NULL;

-- Re-enqueue jobs
INSERT INTO job_queue (job_type, payload)
SELECT 'process_training_data', 
       jsonb_build_object('trainingDataId', id::text)
FROM training_data
WHERE status = 'uploaded';
```

Then run the worker:
```bash
curl http://localhost:4000/api/jobs/worker
```

### Option 2: Check What Model Was Used
Query the metadata to see what model created the embeddings:

```sql
SELECT metadata FROM document_embeddings LIMIT 1;
```

If it shows a different model, we need to either:
- Use that model for queries, OR
- Re-generate all embeddings with `nomic-embed-text`

---

## 📊 Evidence

### Test 1: Direct SQL Call
```sql
-- Using existing embedding from DB
SELECT * FROM match_documents(...);
-- Result: 3 matches ✅
```

### Test 2: Chat API Call
```
-- Using NEW embedding from Ollama
[Vector Store] RPC result: { data: [], error: null }
-- Result: 0 matches ❌
```

**Conclusion**: The embeddings are incompatible!

---

## 🎯 Next Steps

1. **Check embedding metadata** to confirm model mismatch
2. **Delete all embeddings** from database
3. **Re-process files** with current Ollama model
4. **Test again** - should work!

---

## 📝 Technical Details

### Why This Happens:
- Different embedding models create different vector spaces
- Even if dimensions match (768), the vectors are not comparable
- Cosine similarity between incompatible embeddings is meaningless
- This is why we get 0 matches even with threshold 0.0

### How to Prevent:
- Store embedding model info in metadata
- Validate model compatibility before search
- Use consistent embedding model throughout

---

## ✅ Fix Implementation

Run this SQL to reset and re-process:

```sql
BEGIN;

-- 1. Delete all embeddings
DELETE FROM document_embeddings;

-- 2. Reset training data
UPDATE training_data 
SET status = 'uploaded', processed_at = NULL
WHERE model_id = '353608a6-c981-4dfb-9e75-c70fcdeeba2b';

-- 3. Clear old jobs
DELETE FROM job_queue 
WHERE job_type = 'process_training_data';

-- 4. Create new jobs
INSERT INTO job_queue (job_type, payload, priority)
SELECT 
  'process_training_data',
  jsonb_build_object('trainingDataId', id::text),
  1
FROM training_data
WHERE status = 'uploaded'
  AND model_id = '353608a6-c981-4dfb-9e75-c70fcdeeba2b';

COMMIT;
```

Then process:
```bash
curl http://localhost:4000/api/jobs/worker
```

**After this, RAG should work perfectly!** 🎉
