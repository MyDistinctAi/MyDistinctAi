# 🎯 Claude Prompt: Complete OpenRouter RAG Testing

## 📋 Context

We've successfully implemented OpenRouter integration with RAG (Retrieval Augmented Generation), but there's a critical issue preventing it from working:

**Problem**: Old training data was processed with Ollama embeddings (768 dimensions), but new queries use OpenAI embeddings (1536 dimensions), causing a mismatch error.

**Current Status**:
- ✅ OpenRouter chat working (Gemini, Llama, Qwen)
- ✅ OpenAI embeddings service created
- ✅ RAG service updated to use OpenAI
- ✅ File upload UI added to model creation
- ✅ AI model badge in chat header
- ❌ RAG not working due to embedding dimension mismatch

**Error Message**:
```
[Vector Store] Edge Function Error: {
  message: 'HTTP 400: {"error":"Embedding must be an array of 768 numbers"}'
}
```

---

## 🎯 Your Task

Complete the OpenRouter RAG implementation by fixing the embedding dimension issue and testing the complete flow.

### **Step 1: Clean Up Old Training Data**

1. **Check what's in the database:**
   ```sql
   -- Check document_embeddings table
   SELECT 
     model_id,
     COUNT(*) as embedding_count,
     array_length(embedding, 1) as dimension
   FROM document_embeddings
   GROUP BY model_id, array_length(embedding, 1);
   ```

2. **Delete old embeddings with wrong dimensions:**
   ```sql
   -- Delete 768-dimension embeddings (Ollama)
   DELETE FROM document_embeddings 
   WHERE array_length(embedding, 1) = 768;
   
   -- Verify deletion
   SELECT COUNT(*) FROM document_embeddings;
   ```

3. **Delete old training data entries:**
   ```sql
   -- Check training data
   SELECT id, file_name, status, model_id 
   FROM training_data 
   WHERE file_name = 'company-handbook.txt';
   
   -- Delete old entries
   DELETE FROM training_data 
   WHERE file_name = 'company-handbook.txt' 
   AND status = 'processed';
   ```

---

### **Step 2: Re-upload Test Document**

1. **Go to the model's training data page:**
   - URL: `http://localhost:4000/dashboard/models/[model-id]/training`
   - Or use the CreateModelModal file upload

2. **Upload the test document:**
   - File: `test-data/company-handbook.txt`
   - Wait for "File processing job enqueued successfully"

3. **Monitor server logs for processing:**
   ```
   Expected logs:
   [RAG] Processing file: company-handbook.txt
   [RAG] Generating embeddings for X chunks...
   [Embeddings] Generating X embeddings using OpenAI/OpenRouter
   ```

4. **Verify embeddings in database:**
   ```sql
   -- Check new embeddings
   SELECT 
     model_id,
     COUNT(*) as embedding_count,
     array_length(embedding, 1) as dimension
   FROM document_embeddings
   GROUP BY model_id, array_length(embedding, 1);
   
   -- Should show 1536 dimensions
   ```

---

### **Step 3: Test RAG with Questions**

Use the questions from `test-data/TEST-QUESTIONS.md`:

**Easy Questions (Should Answer Perfectly):**

1. **Question:** "Who is the CEO of ACME Corporation?"
   - **Expected:** "Sarah Johnson"
   - **Check:** AI should be confident and specific

2. **Question:** "How many vacation days do I get in my first year?"
   - **Expected:** "15 days paid vacation in year 1-2"
   - **Check:** Should mention it increases to 20 days in year 3-5

3. **Question:** "What is the company 401k match?"
   - **Expected:** "100% match up to 6% of salary"
   - **Check:** Should mention vesting schedule

**Medium Questions (Test Understanding):**

4. **Question:** "Can I work remotely? What are the requirements?"
   - **Expected:** Must be employed 6+ months, "Meets Expectations" rating, suitable role
   - **Check:** Should list all requirements

5. **Question:** "What's the difference between birth parent and non-birth parent leave?"
   - **Expected:** Birth parent: 16 weeks, Non-birth: 8 weeks, both paid
   - **Check:** Should compare both

**Hard Questions (Test RAG Accuracy):**

6. **Question:** "If I'm 52 years old, what's the maximum I can contribute to my 401k in 2024?"
   - **Expected:** $30,500 ($23,000 + $7,500 catch-up)
   - **Check:** Should do the calculation

**Negative Test (Hallucination Detection):**

7. **Question:** "What's the dress code?"
   - **Expected:** "This information is not in the handbook" or similar
   - **Check:** Should NOT make up an answer

---

### **Step 4: Verify Server Logs**

For each question, check the server logs show:

```
✅ Good (RAG Working):
[RAG] Generating query embedding...
[Embeddings] Generating embedding using OpenAI/OpenRouter
[RAG] ✅ Query embedding generated (1536 dimensions)
[RAG] Searching pgvector for similar documents...
[RAG] ✅ Retrieved 5 context chunks
[Chat API] Context preview: ACME CORPORATION - EMPLOYEE HANDBOOK...
```

```
❌ Bad (RAG Not Working):
[RAG] ❌ Failed to generate query embedding
[Vector Store] Edge Function Error: Embedding must be an array of 768 numbers
[Chat API] ⚠️ No RAG context retrieved
```

---

### **Step 5: Document Results**

Create a test results file:

**File:** `RAG_TEST_RESULTS.md`

**Template:**
```markdown
# RAG Testing Results - November 3, 2025

## Test Environment
- Server: http://localhost:4000
- Model: [Model Name]
- AI: [Gemini/Llama/Qwen]
- Document: company-handbook.txt
- Embeddings: OpenAI (1536 dimensions)

## Database Cleanup
- [ ] Old embeddings deleted (768 dim)
- [ ] Old training data deleted
- [ ] New embeddings verified (1536 dim)

## File Processing
- [ ] File uploaded successfully
- [ ] Processing job enqueued
- [ ] Embeddings generated with OpenAI
- [ ] Chunks stored in database

## RAG Tests

### Easy Questions (3/3 passing)
1. ✅ CEO Question - Answered "Sarah Johnson"
2. ✅ Vacation Days - Answered "15 days"
3. ✅ 401k Match - Answered "100% up to 6%"

### Medium Questions (2/2 passing)
4. ✅ Remote Work - Listed all requirements
5. ✅ Parental Leave - Compared both types

### Hard Questions (1/1 passing)
6. ✅ 401k Calculation - Calculated $30,500

### Negative Test (1/1 passing)
7. ✅ Dress Code - Said "not in handbook"

## Server Logs Analysis
- [ ] OpenAI embeddings used
- [ ] 1536 dimensions confirmed
- [ ] Context retrieved successfully
- [ ] No dimension mismatch errors

## Issues Found
[List any issues]

## Conclusion
- RAG Status: ✅ Working / ❌ Not Working
- Accuracy: X/7 questions correct
- Next Steps: [If any issues remain]
```

---

### **Step 6: Fix Any Issues Found**

If RAG still doesn't work:

**Issue 1: Embeddings not generating**
- Check OpenRouter API key is set
- Check server logs for OpenAI errors
- Verify `OPENROUTER_API_KEY` in `.env.local`

**Issue 2: No context retrieved**
- Check pgvector search is working
- Verify embeddings are in database
- Lower similarity threshold to 0.0

**Issue 3: Wrong answers**
- Check context is being passed to AI
- Verify prompt includes context
- Check AI is using the context

**Issue 4: Dimension mismatch persists**
- Verify all old embeddings deleted
- Check database has only 1536-dim embeddings
- Re-upload file if needed

---

## 📊 Success Criteria

**RAG is working if:**
1. ✅ All 7 test questions answered correctly
2. ✅ Answers are specific (mentions exact numbers, names)
3. ✅ Server logs show "Retrieved X context chunks"
4. ✅ No embedding dimension errors
5. ✅ AI says "not in document" for dress code question

**Complete when:**
- All tests pass
- Results documented in `RAG_TEST_RESULTS.md`
- No errors in server logs
- TASKS.md updated with test results

---

## 🔧 Troubleshooting Commands

**Check database:**
```sql
-- Check embeddings
SELECT model_id, COUNT(*), array_length(embedding, 1) as dim
FROM document_embeddings
GROUP BY model_id, dim;

-- Check training data
SELECT id, file_name, status, created_at
FROM training_data
ORDER BY created_at DESC
LIMIT 10;
```

**Restart server:**
```powershell
# Stop server
Stop-Process -Name node -Force

# Start server
npm run dev
```

**Check logs:**
```powershell
# Watch server logs in real-time
# Look for [RAG], [Embeddings], [Chat API] prefixes
```

---

## 📝 Deliverables

When complete, provide:
1. ✅ `RAG_TEST_RESULTS.md` with all test results
2. ✅ Screenshots of successful RAG responses
3. ✅ Server log snippets showing RAG working
4. ✅ Updated TASKS.md marking RAG testing complete
5. ✅ Updated CLAUDE.md with test results

---

## 🚀 Quick Start

```bash
# 1. Clean database (use Supabase SQL editor)
DELETE FROM document_embeddings WHERE array_length(embedding, 1) = 768;
DELETE FROM training_data WHERE file_name = 'company-handbook.txt';

# 2. Upload file
# Go to: http://localhost:4000/dashboard/models/[model-id]/training
# Upload: test-data/company-handbook.txt

# 3. Wait for processing (watch server logs)

# 4. Test questions
# Go to: http://localhost:4000/dashboard/chat/[model-id]
# Ask: "Who is the CEO of ACME Corporation?"

# 5. Verify logs show:
# [RAG] ✅ Retrieved 5 context chunks
# [Chat API] Context preview: ACME CORPORATION...
```

---

**Good luck! The RAG system is ready - just needs the old data cleaned up and retested! 🎉**
