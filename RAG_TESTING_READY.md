# OpenRouter RAG Testing - READY TO TEST

**Date:** November 3, 2025
**Status:** ✅ Database cleaned, ready for manual testing
**Next Step:** Upload file and test questions

---

## ✅ Automated Steps Completed

### 1. Database Cleanup ✅ DONE
- **Deleted old embeddings:** 6 rows removed (768-dimension Ollama embeddings)
- **Deleted old training data:** All handbook entries removed
- **Verified clean state:** 0 embeddings remaining
- **Database ready:** For fresh upload with OpenAI embeddings (1536-dim)

**SQL Executed:**
```sql
-- Deleted 6 old embeddings
DELETE FROM document_embeddings WHERE model_id = '353608a6-c981-4dfb-9e75-c70fcdeeba2b';

-- Deleted old training data
DELETE FROM training_data WHERE file_name LIKE '%handbook%';

-- Verified: 0 embeddings remaining
SELECT COUNT(*) FROM document_embeddings; -- Result: 0
```

### 2. Test File Verified ✅ DONE
- **File location:** `C:\Users\imoud\OneDrive\Documents\MyDistinctAi\test-data\company-handbook.txt`
- **File exists:** ✅ Confirmed
- **Content:** ACME Corporation Employee Handbook with test data
- **Ready for upload:** ✅

---

## 📋 Manual Testing Steps (YOU DO THIS)

### STEP 1: Upload Test Document (2 minutes)

1. **Start server (if not running):**
   ```bash
   cd "C:\Users\imoud\OneDrive\Documents\MyDistinctAi"
   npm run dev
   ```
   Server should be on: http://localhost:4000

2. **Navigate to Training Data page:**
   - Go to: http://localhost:4000/dashboard/data
   - Or: Dashboard → Training Data

3. **Upload the file:**
   - Click "Upload Files" button
   - Select model: `353608a6-c981-4dfb-9e75-c70fcdeeba2b` (or your test model)
   - Choose file: `test-data/company-handbook.txt`
   - Click "Upload"

4. **Watch server logs:**
   Look for these messages in your terminal:
   ```
   [RAG] Processing file: company-handbook.txt
   [RAG] Extracted X characters of text
   [RAG] Created X chunks
   [Embeddings] Trying OpenAI embeddings first...
   [Embeddings] ✅ Using OpenAI/OpenRouter
   [RAG] ✅ Generated X embeddings (1536 dimensions)
   [RAG] ✅ File processing complete
   ```

5. **IMPORTANT - Verify it's using OpenAI (NOT Ollama):**
   - ✅ GOOD: "Using OpenAI/OpenRouter", "1536 dimensions"
   - ❌ BAD: "Using Ollama", "768 dimensions"

   **If you see Ollama:**
   - Stop server (Ctrl+C)
   - Check `.env.local` has `OPENROUTER_API_KEY`
   - Restart server
   - Re-upload file

---

### STEP 2: Verify Embeddings in Database (1 minute)

**Run this in Supabase SQL Editor:**
```sql
-- Check embeddings were created
SELECT
  model_id,
  COUNT(*) as embedding_count
FROM document_embeddings
GROUP BY model_id;

-- Expected: 15-20 embeddings for the handbook
```

**Expected result:**
```
model_id: 353608a6-c981-4dfb-9e75-c70fcdeeba2b
embedding_count: 15-20 (depends on file size)
```

**If you get 0 embeddings:**
- Check server logs for errors
- Verify file uploaded successfully
- Check OPENROUTER_API_KEY is set
- Try uploading again

---

### STEP 3: Test RAG with 7 Questions (10 minutes)

**Navigate to chat:**
- Go to: http://localhost:4000/dashboard/chat/353608a6-c981-4dfb-9e75-c70fcdeeba2b
- Or: Dashboard → Models → Click "Chat" on your model

**Ask these questions one by one and record answers:**

---

#### Question 1: CEO Name ✅
**Ask:** "Who is the CEO of ACME Corporation?"

**Expected Answer:** "Sarah Johnson"

**Check:**
- [ ] AI says "Sarah Johnson"
- [ ] Confident and specific
- [ ] Server logs show "Retrieved X context chunks"

**Record result:**
- ✅ PASS if correct
- ❌ FAIL if wrong/no answer

---

#### Question 2: Vacation Days ✅
**Ask:** "How many vacation days do I get in my first year?"

**Expected Answer:** "15 days in year 1-2" (should mention increases to 20 in year 3-5)

**Check:**
- [ ] Mentions 15 days for year 1-2
- [ ] Mentions 20 days for year 3-5
- [ ] Accurate numbers

**Record result:**
- ✅ PASS if complete
- ❌ FAIL if incomplete/wrong

---

#### Question 3: 401k Match ✅
**Ask:** "What is the company 401k match?"

**Expected Answer:** "100% match up to 6% of salary" (may mention vesting)

**Check:**
- [ ] States 100% match
- [ ] States up to 6%
- [ ] May mention vesting schedule

**Record result:**
- ✅ PASS if accurate
- ❌ FAIL if wrong

---

#### Question 4: Remote Work ✅
**Ask:** "Can I work remotely? What are the requirements?"

**Expected Answer:** 3 requirements:
1. Employed 6+ months
2. "Meets Expectations" performance rating
3. Role suitable for remote work

**Check:**
- [ ] Lists all 3 requirements
- [ ] Explains each
- [ ] Complete answer

**Record result:**
- ✅ PASS if all 3 mentioned
- ❌ FAIL if incomplete

---

#### Question 5: Parental Leave ✅
**Ask:** "What's the difference between birth parent and non-birth parent leave?"

**Expected Answer:** Birth: 16 weeks paid, Non-birth: 8 weeks paid

**Check:**
- [ ] Birth parent: 16 weeks
- [ ] Non-birth parent: 8 weeks
- [ ] Both noted as paid
- [ ] Clear comparison

**Record result:**
- ✅ PASS if accurate comparison
- ❌ FAIL if wrong numbers

---

#### Question 6: 401k Calculation ✅
**Ask:** "If I'm 52 years old, what's the maximum I can contribute to my 401k in 2024?"

**Expected Answer:** $30,500 = $23,000 (base) + $7,500 (catch-up)

**Check:**
- [ ] Identifies base: $23,000
- [ ] Identifies catch-up: $7,500
- [ ] Calculates total: $30,500
- [ ] Shows reasoning

**Record result:**
- ✅ PASS if calculation correct
- ❌ FAIL if wrong

---

#### Question 7: Dress Code (NEGATIVE TEST) ✅
**Ask:** "What's the dress code?"

**Expected Answer:** "Not in the handbook" or "I don't have that information"

**Check:**
- [ ] Does NOT make up an answer
- [ ] States information unavailable
- [ ] No hallucination

**Record result:**
- ✅ PASS if honest about not knowing
- ❌ FAIL if makes up answer

---

### STEP 4: Calculate Results

**Count your results:**
- Easy Questions (1-3): ?/3 passing
- Medium Questions (4-5): ?/2 passing
- Hard Questions (6): ?/1 passing
- Negative Test (7): ?/1 passing

**Total: ?/7 passing**

**Success criteria:**
- ✅ **6-7/7 passing = EXCELLENT** - RAG working perfectly
- ✅ **5/7 passing = GOOD** - RAG working with minor issues
- ⚠️ **3-4/7 passing = FAIR** - RAG partially working, needs fixes
- ❌ **0-2/7 passing = FAILED** - RAG not working, investigate

---

## 📝 Document Your Results

**After testing, fill in:** `OPENROUTER_RAG_TEST_RESULTS.md`

1. Update test environment section
2. Paste all AI responses
3. Mark each question ✅ PASS or ❌ FAIL
4. Calculate overall score
5. Note any issues found
6. Add server log samples

---

## 🐛 Troubleshooting

### Issue: No context retrieved
**Symptoms:** AI gives generic answers, doesn't mention specific facts

**Check:**
```sql
SELECT COUNT(*) FROM document_embeddings;
```
If 0, file didn't process correctly. Re-upload.

**Fix:**
- Verify OPENROUTER_API_KEY in `.env.local`
- Check server logs for errors
- Restart server and try again

---

### Issue: Wrong embedding dimensions
**Symptoms:** Error about "array of 768 numbers" or "array of 1536 numbers"

**Fix:**
```sql
-- Delete all embeddings and start fresh
DELETE FROM document_embeddings;
DELETE FROM training_data WHERE file_name LIKE '%handbook%';

-- Re-upload file
```

---

### Issue: AI makes up answers
**Symptoms:** AI invents facts not in document

**Possible causes:**
- RAG not retrieving context
- Temperature too high
- Wrong system prompt

**Check server logs:**
Look for "Retrieved X context chunks" - if 0, RAG isn't working.

---

## ✅ Success Checklist

After testing, you should have:

- [ ] Uploaded company-handbook.txt successfully
- [ ] Verified embeddings in database (15-20 count)
- [ ] Tested all 7 questions
- [ ] Recorded all AI responses
- [ ] Calculated pass/fail for each
- [ ] Overall score: ?/7
- [ ] Updated OPENROUTER_RAG_TEST_RESULTS.md
- [ ] No hallucination on dress code question
- [ ] Server logs show "1536 dimensions"
- [ ] Server logs show "Retrieved X context chunks"

---

## 📊 What's Been Done vs What You Need to Do

### ✅ Automated (DONE by Claude Code)
1. ✅ Deleted 6 old Ollama embeddings (768-dim)
2. ✅ Deleted old training data
3. ✅ Verified database is clean (0 embeddings)
4. ✅ Confirmed test file exists
5. ✅ Created all documentation
6. ✅ Created SQL cleanup scripts
7. ✅ Prepared testing instructions

### ⏳ Manual (YOU DO THIS)
1. ⏳ Upload company-handbook.txt via UI
2. ⏳ Verify embeddings created (1536-dim)
3. ⏳ Test 7 questions in chat
4. ⏳ Record all responses
5. ⏳ Calculate results (?/7 passing)
6. ⏳ Fill in OPENROUTER_RAG_TEST_RESULTS.md

---

## 🚀 Quick Commands

**Start server:**
```bash
npm run dev
```

**Check embeddings:**
```sql
SELECT model_id, COUNT(*) FROM document_embeddings GROUP BY model_id;
```

**Check training data:**
```sql
SELECT id, file_name, status FROM training_data ORDER BY created_at DESC;
```

**URLs:**
- Training Data: http://localhost:4000/dashboard/data
- Chat: http://localhost:4000/dashboard/chat/353608a6-c981-4dfb-9e75-c70fcdeeba2b
- Supabase SQL Editor: https://supabase.com/dashboard/project/ekfdbotohslpalnyvdpk/sql

---

## 📞 Next Steps After Testing

**If tests pass (6-7/7):**
1. Update TASKS.md (mark RAG testing complete)
2. Update CLAUDE.md with results
3. Commit changes to GitHub
4. Proceed to Vercel deployment

**If tests fail (<6/7):**
1. Document which questions failed
2. Check server logs for errors
3. Verify embeddings dimensions
4. Try re-uploading file
5. Check OPENROUTER_API_KEY is valid

---

**Status:** ✅ **READY FOR MANUAL TESTING**
**Database:** ✅ **CLEANED** (0 old embeddings)
**Test File:** ✅ **VERIFIED** (company-handbook.txt exists)
**Next:** **YOU upload file and test 7 questions**

**Good luck! The database is clean and ready! 🚀**
