# OpenRouter RAG Testing Guide
**Complete Step-by-Step Instructions**

---

## 🎯 Goal
Test that RAG (Retrieval Augmented Generation) works with OpenRouter AI models using OpenAI embeddings (1536 dimensions).

---

## 📋 Prerequisites

✅ Code pushed to GitHub: https://github.com/MyDistinctAI/MyDistinctAi
✅ Server running on port 4000
✅ Supabase database accessible
✅ OpenRouter API key configured
✅ Test document ready: `test-data/company-handbook.txt`
✅ Test questions ready: `test-data/TEST-QUESTIONS.md`

---

## 🚀 Step-by-Step Instructions

### STEP 1: Clean Up Old Data (5 minutes)

**Why:** Old embeddings are 768 dimensions (Ollama), new ones will be 1536 (OpenAI). They're incompatible.

**How:**

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/ekfdbotohslpalnyvdpk/sql/new
   - Or: Supabase Dashboard → SQL Editor → New Query

2. **Check what's currently in the database:**
   ```sql
   -- Check embeddings
   SELECT
     model_id,
     COUNT(*) as count,
     array_length(embedding, 1) as dimensions
   FROM document_embeddings
   GROUP BY model_id, array_length(embedding, 1);
   ```

   **Expected output:**
   ```
   model_id                              | count | dimensions
   --------------------------------------|-------|------------
   353608a6-c981-4dfb-9e75-c70fcdeeba2b |   6   |    768
   ```

3. **Delete old 768-dimension embeddings:**
   ```sql
   DELETE FROM document_embeddings
   WHERE array_length(embedding, 1) = 768;
   ```

   **Expected:** 6 rows deleted

4. **Delete old training data:**
   ```sql
   DELETE FROM training_data
   WHERE file_name LIKE '%handbook%';
   ```

   **Expected:** 1-4 rows deleted

5. **Verify cleanup:**
   ```sql
   SELECT COUNT(*) FROM document_embeddings;
   ```

   **Expected:** 0

**✅ Step 1 Complete when:**
- Zero embeddings in database
- Zero training data for handbook files
- Ready for fresh upload

---

### STEP 2: Upload Test Document (2 minutes)

**Why:** We need to re-process the test document with OpenAI embeddings (1536 dimensions).

**How:**

1. **Make sure server is running:**
   ```powershell
   # Check if server is running
   netstat -ano | findstr :4000

   # If not running, start it:
   cd "C:\Users\imoud\OneDrive\Documents\MyDistinctAi"
   npm run dev
   ```

2. **Open browser and navigate to your model:**
   - Go to: http://localhost:4000/dashboard/models
   - Find your model (or create a new one)
   - Copy the model ID from URL

3. **Two ways to upload:**

   **Option A: Via Training Data Page**
   - Go to: http://localhost:4000/dashboard/data
   - Select your model from dropdown
   - Click "Upload Files"
   - Select: `test-data/company-handbook.txt`
   - Click "Upload"

   **Option B: Via Model Creation (if creating new model)**
   - Go to: http://localhost:4000/dashboard/models
   - Click "Create New Model"
   - Fill in details:
     - Name: "OpenRouter RAG Test"
     - Base Model: "google/gemini-flash-1.5-8b" (or any OpenRouter model)
   - Drag and drop: `test-data/company-handbook.txt`
   - Click "Create Model"

4. **Watch for success message:**
   ```
   ✅ File uploaded successfully
   ✅ File processing job enqueued
   ```

**✅ Step 2 Complete when:**
- File uploaded
- Success message shown
- Processing job enqueued

---

### STEP 3: Monitor Processing (2-5 minutes)

**Why:** We need to verify the file is processed correctly with OpenAI embeddings.

**How:**

1. **Watch server logs** (the terminal where `npm run dev` is running):

   **Look for these logs:**
   ```
   [RAG] Processing file: company-handbook.txt
   [RAG] Extracted X characters of text
   [RAG] Created X chunks (512 tokens each)
   [RAG] Generating embeddings for X chunks...
   [Embeddings] Trying OpenAI embeddings first...
   [Embeddings] ✅ Using OpenAI/OpenRouter for embeddings
   [Embeddings] Model: text-embedding-3-small
   [RAG] ✅ Generated X embeddings (1536 dimensions)
   [RAG] ✅ Stored X embeddings in pgvector
   [RAG] ✅ File processing complete
   ```

   **🚨 Bad logs (means it's using Ollama - WRONG):**
   ```
   [Embeddings] Using Ollama embeddings
   [Embeddings] ✅ Generated embedding (768 dimensions)
   ```

2. **If you see Ollama (768 dim):**
   - Stop server (Ctrl+C)
   - Check `.env.local` has `OPENROUTER_API_KEY`
   - Restart server
   - Re-upload file

3. **Wait for processing to complete:**
   - Usually takes 30-60 seconds
   - Watch for "File processing complete" message

**✅ Step 3 Complete when:**
- See "✅ File processing complete" in logs
- Embeddings are 1536 dimensions (OpenAI)
- No errors in logs

---

### STEP 4: Verify Database (1 minute)

**Why:** Double-check that embeddings are stored correctly with 1536 dimensions.

**How:**

1. **Run this query in Supabase SQL Editor:**
   ```sql
   SELECT
     model_id,
     COUNT(*) as embedding_count,
     array_length(embedding, 1) as dimensions
   FROM document_embeddings
   GROUP BY model_id, array_length(embedding, 1);
   ```

2. **Expected result:**
   ```
   model_id                              | embedding_count | dimensions
   --------------------------------------|-----------------|------------
   [your-model-id]                       |      15-20      |    1536
   ```

3. **Check content is indexed:**
   ```sql
   SELECT
     chunk_text
   FROM document_embeddings
   WHERE chunk_text LIKE '%CEO%'
   OR chunk_text LIKE '%Sarah Johnson%'
   LIMIT 1;
   ```

   **Expected:** Should return text mentioning "CEO: Sarah Johnson"

**✅ Step 4 Complete when:**
- All embeddings are 1536 dimensions
- Embedding count matches expectations (15-20)
- Content includes CEO information

---

### STEP 5: Test RAG with Questions (10-15 minutes)

**Why:** Verify RAG retrieves context correctly and AI answers based on documents.

**How:**

1. **Navigate to chat:**
   - Go to: http://localhost:4000/dashboard/chat/[your-model-id]
   - Or: Dashboard → Models → Click "Chat" on your model

2. **Ask each test question:**

---

#### Question 1: CEO Name (Easy)

**Ask:** "Who is the CEO of ACME Corporation?"

**Expected answer:** "Sarah Johnson"

**What to check:**
- [ ] AI says "Sarah Johnson"
- [ ] AI is confident and specific
- [ ] No hesitation or "I don't know"

**Server logs should show:**
```
[RAG] Generating query embedding...
[Embeddings] Using OpenAI/OpenRouter
[RAG] ✅ Query embedding: 1536 dimensions
[RAG] Searching pgvector...
[RAG] ✅ Retrieved 5 context chunks
[Chat API] Context: "CEO: Sarah Johnson"
```

**Record result in OPENROUTER_RAG_TEST_RESULTS.md**

---

#### Question 2: Vacation Days (Easy)

**Ask:** "How many vacation days do I get in my first year?"

**Expected answer:** "15 days in year 1-2, increases to 20 days in year 3-5"

**What to check:**
- [ ] Mentions 15 days for years 1-2
- [ ] Mentions increase to 20 days
- [ ] Accurate numbers

**Record result**

---

#### Question 3: 401k Match (Easy)

**Ask:** "What is the company 401k match?"

**Expected answer:** "100% match up to 6% of salary" + vesting schedule

**What to check:**
- [ ] States 100% match
- [ ] States up to 6%
- [ ] Mentions vesting

**Record result**

---

#### Question 4: Remote Work (Medium)

**Ask:** "Can I work remotely? What are the requirements?"

**Expected answer:** 3 requirements:
1. Employed 6+ months
2. "Meets Expectations" rating
3. Suitable role

**What to check:**
- [ ] Lists all 3 requirements
- [ ] Explains each one
- [ ] Complete answer

**Record result**

---

#### Question 5: Parental Leave (Medium)

**Ask:** "What's the difference between birth parent and non-birth parent leave?"

**Expected answer:** Birth: 16 weeks paid, Non-birth: 8 weeks paid

**What to check:**
- [ ] Compares both types
- [ ] Correct durations (16 vs 8 weeks)
- [ ] Notes both are paid

**Record result**

---

#### Question 6: 401k Calculation (Hard)

**Ask:** "If I'm 52 years old, what's the maximum I can contribute to my 401k in 2024?"

**Expected answer:** $30,500 = $23,000 base + $7,500 catch-up

**What to check:**
- [ ] Identifies base: $23,000
- [ ] Identifies catch-up: $7,500
- [ ] Calculates total: $30,500
- [ ] Shows math

**Record result**

---

#### Question 7: Dress Code (Negative Test)

**Ask:** "What's the dress code?"

**Expected answer:** "Not in the handbook" or "I don't have that information"

**What to check:**
- [ ] Does NOT make up an answer
- [ ] States info unavailable
- [ ] No hallucination

**Record result**

---

**✅ Step 5 Complete when:**
- All 7 questions asked
- All responses recorded in OPENROUTER_RAG_TEST_RESULTS.md
- Pass/fail status noted for each

---

### STEP 6: Analyze Results (5 minutes)

**Why:** Determine if RAG is working correctly and identify any issues.

**How:**

1. **Count passing tests:**
   - Easy questions: X/3
   - Medium questions: X/2
   - Hard questions: X/1
   - Negative test: X/1
   - **Total: X/7**

2. **Check server logs for patterns:**

   **Good pattern (RAG working):**
   ```
   [RAG] ✅ Retrieved 5 context chunks
   [Chat API] Context preview: ACME CORPORATION...
   ```

   **Bad pattern (RAG not working):**
   ```
   [RAG] ❌ No context retrieved
   [Chat API] ⚠️ No RAG context
   ```

3. **Update OPENROUTER_RAG_TEST_RESULTS.md:**
   - Fill in all "Actual Answer" sections
   - Mark each as ✅ PASS or ❌ FAIL
   - Update summary section
   - Note any issues found

4. **Determine overall status:**
   - **7/7 passing:** ✅ RAG WORKING PERFECTLY
   - **5-6/7 passing:** ✅ RAG WORKING (minor issues)
   - **3-4/7 passing:** ⚠️ RAG PARTIAL (needs fixes)
   - **0-2/7 passing:** ❌ RAG NOT WORKING (investigate)

**✅ Step 6 Complete when:**
- Test results file updated
- Pass/fail count determined
- Overall status decided

---

### STEP 7: Troubleshooting (If Needed)

**Only if tests failed. Skip if all passed.**

#### Issue A: No context retrieved

**Symptoms:**
- AI doesn't mention specific facts
- Server logs show "No context retrieved"
- Generic answers

**Fix:**
```sql
-- Check if embeddings exist
SELECT COUNT(*) FROM document_embeddings;

-- If 0, re-upload file
-- If >0, check similarity threshold

-- Try lowering threshold in match_documents function
```

#### Issue B: Wrong embedding dimensions

**Symptoms:**
- Error: "Embedding must be an array of 768 numbers"
- Or: "Embedding must be an array of 1536 numbers"

**Fix:**
```sql
-- Check dimensions
SELECT array_length(embedding, 1) as dim, COUNT(*)
FROM document_embeddings
GROUP BY dim;

-- If 768, delete and re-upload
DELETE FROM document_embeddings WHERE array_length(embedding, 1) = 768;
```

#### Issue C: Hallucination (made-up answers)

**Symptoms:**
- AI makes up facts not in document
- Confident but wrong answers

**Fix:**
- Check AI model settings
- Lower temperature
- Add system prompt: "Only answer based on provided context"

---

### STEP 8: Update Documentation (5 minutes)

**Why:** Record completion for future reference.

**How:**

1. **Update TASKS.md:**
   ```markdown
   ## OpenRouter RAG Testing
   - [x] Clean up old embeddings (768 dim)
   - [x] Upload test document with OpenAI embeddings
   - [x] Monitor processing logs
   - [x] Verify database (1536 dim)
   - [x] Test 7 questions
   - [x] Document results
   - [x] Status: ✅ WORKING (X/7 passing)
   ```

2. **Update CLAUDE.md:**
   Add session summary at top:
   ```markdown
   ## 📝 Session Summary (Nov 3, 2025 - Part 4) - OPENROUTER RAG COMPLETE

   ### What We Accomplished:
   1. ✅ **OpenRouter RAG Testing** (COMPLETE)
      - Cleaned up old Ollama embeddings (768 dim)
      - Re-uploaded test document with OpenAI embeddings (1536 dim)
      - Tested with 7 questions from TEST-QUESTIONS.md
      - Results: X/7 passing (X% accuracy)
      - RAG Status: ✅ WORKING

   ### Files Created:
   - OPENROUTER_RAG_TEST_RESULTS.md
   - OPENROUTER_RAG_TESTING_GUIDE.md
   - cleanup-old-embeddings.sql

   ### Current Status:
   - **RAG System**: ✅ 100% Functional with OpenRouter
   - **Embedding Provider**: ✅ OpenAI (1536 dimensions)
   - **Context Retrieval**: ✅ Working perfectly
   - **Answer Accuracy**: X/7 (X%)

   ### Milestones Completed:
   - ✅ OpenRouter Integration (100%)
   - ✅ RAG with OpenAI Embeddings (100%)
   - ✅ Complete Testing (100%)

   ### Next Priority:
   - Deploy to Vercel
   - Production testing
   ```

3. **Commit changes to Git:**
   ```bash
   cd "C:\Users\imoud\OneDrive\Documents\MyDistinctAi"
   git add .
   git commit -m "Complete OpenRouter RAG testing - X/7 tests passing

   - Cleaned up old Ollama embeddings (768 dim)
   - Re-uploaded with OpenAI embeddings (1536 dim)
   - Tested RAG with 7 questions
   - Results documented in OPENROUTER_RAG_TEST_RESULTS.md
   - Status: RAG working with OpenRouter"

   git push origin main
   ```

**✅ Step 8 Complete when:**
- TASKS.md updated
- CLAUDE.md updated
- Changes committed to GitHub
- Documentation complete

---

## 📊 Quick Reference

### Test Questions
1. CEO name → Sarah Johnson
2. Vacation days → 15 days (year 1-2)
3. 401k match → 100% up to 6%
4. Remote work → 3 requirements
5. Parental leave → 16 weeks vs 8 weeks
6. 401k calculation → $30,500
7. Dress code → Not in handbook

### SQL Commands
```sql
-- Clean up
DELETE FROM document_embeddings WHERE array_length(embedding, 1) = 768;
DELETE FROM training_data WHERE file_name LIKE '%handbook%';

-- Verify
SELECT model_id, COUNT(*), array_length(embedding, 1) as dim
FROM document_embeddings GROUP BY model_id, dim;
```

### Expected Logs
```
[RAG] ✅ Retrieved 5 context chunks
[Embeddings] ✅ Using OpenAI (1536 dim)
[Chat API] Context: ACME CORPORATION...
```

---

## ✅ Success Criteria

**RAG is working if:**
- ✅ All embeddings are 1536 dimensions
- ✅ Server logs show "Retrieved X context chunks"
- ✅ AI answers are specific and accurate
- ✅ 6-7 out of 7 questions pass
- ✅ No "dress code" hallucination

**Complete when:**
- All 7 questions tested
- Results documented
- TASKS.md and CLAUDE.md updated
- Changes committed to GitHub

---

**Good luck! 🚀 The system is ready to test!**
