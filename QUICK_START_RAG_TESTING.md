# Quick Start - OpenRouter RAG Testing

**Time Required:** 15-20 minutes
**Goal:** Test RAG with OpenAI embeddings (1536 dimensions)

---

## 🚀 Fast Track (4 Steps)

### STEP 1: Clean Database (2 min)
Open Supabase SQL Editor and run:
```sql
DELETE FROM document_embeddings WHERE array_length(embedding, 1) = 768;
DELETE FROM training_data WHERE file_name LIKE '%handbook%';
SELECT COUNT(*) FROM document_embeddings; -- Should be 0
```

### STEP 2: Upload File (2 min)
1. Go to: http://localhost:4000/dashboard/data
2. Upload: `test-data/company-handbook.txt`
3. Wait for "✅ File processing complete" in server logs

### STEP 3: Verify Embeddings (1 min)
Run in Supabase SQL Editor:
```sql
SELECT model_id, COUNT(*), array_length(embedding, 1) as dim
FROM document_embeddings GROUP BY model_id, dim;
-- Should show 1536 dimensions
```

### STEP 4: Test Questions (10 min)
Go to: http://localhost:4000/dashboard/chat/[model-id]

Ask these 7 questions:

1. ✅ **"Who is the CEO of ACME Corporation?"**
   Expected: Sarah Johnson

2. ✅ **"How many vacation days do I get in my first year?"**
   Expected: 15 days (year 1-2)

3. ✅ **"What is the company 401k match?"**
   Expected: 100% match up to 6%

4. ✅ **"Can I work remotely? What are the requirements?"**
   Expected: 3 requirements (6+ months, good rating, suitable role)

5. ✅ **"What's the difference between birth parent and non-birth parent leave?"**
   Expected: 16 weeks vs 8 weeks, both paid

6. ✅ **"If I'm 52 years old, what's the maximum I can contribute to my 401k in 2024?"**
   Expected: $30,500 ($23,000 + $7,500 catch-up)

7. ✅ **"What's the dress code?"**
   Expected: "Not in handbook" (should NOT make up an answer)

---

## ✅ Success Criteria

**RAG is working if:**
- All embeddings are 1536 dimensions ✅
- Server logs show "Retrieved X context chunks" ✅
- 6-7 out of 7 questions answered correctly ✅
- No hallucination on dress code question ✅

---

## 🐛 Troubleshooting

**If answers are wrong:**
```sql
-- Check embeddings exist
SELECT COUNT(*) FROM document_embeddings;

-- Check dimensions
SELECT array_length(embedding, 1), COUNT(*)
FROM document_embeddings GROUP BY 1;
```

**If "No context retrieved":**
- Check server logs for errors
- Verify OPENROUTER_API_KEY in .env.local
- Restart server: `npm run dev`

---

## 📝 Record Results

After testing, fill in: `OPENROUTER_RAG_TEST_RESULTS.md`
- Mark each question ✅ PASS or ❌ FAIL
- Paste AI responses
- Note any issues

---

**For detailed instructions:** See `OPENROUTER_RAG_TESTING_GUIDE.md`

**Ready? Let's test! 🚀**
