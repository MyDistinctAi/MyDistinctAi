# RAG System Testing Guide

This guide explains how to test the complete RAG (Retrieval-Augmented Generation) system.

## Test Files

### 1. `test-rag-complete.mjs` - Standalone Test Script
A comprehensive Node.js script that tests the entire RAG pipeline without requiring a browser.

**What it tests:**
- ✅ Model existence
- ✅ Existing embeddings
- ✅ Query embedding generation (OpenRouter)
- ✅ Vector search via Edge Function
- ✅ Direct SQL similarity queries
- ✅ RAG retrieval with specific questions
- ✅ Job queue status
- ✅ Training data status
- ✅ Performance metrics

**Run it:**
```bash
npm run test:rag
```

Or directly:
```bash
node test-rag-complete.mjs
```

### 2. `tests/e2e/rag-system-complete.spec.ts` - Playwright E2E Tests
Full end-to-end tests using Playwright that simulate real user interactions.

**What it tests:**
- ✅ File upload through UI
- ✅ File processing workflow
- ✅ Embedding generation
- ✅ Chat interface with RAG
- ✅ Multiple question answering
- ✅ Response time performance
- ✅ Edge cases (empty queries, invalid IDs, long queries)
- ✅ System monitoring (dimensions, queue, statistics)

**Run it:**
```bash
npm run test:e2e:rag
```

Or with UI:
```bash
npx playwright test tests/e2e/rag-system-complete.spec.ts --ui
```

Or in headed mode (see browser):
```bash
npx playwright test tests/e2e/rag-system-complete.spec.ts --headed
```

## Quick Start

### Prerequisites
1. Server running on `http://localhost:4000`
2. Environment variables set in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENROUTER_API_KEY`

### Run All Tests

**Standalone script (fast, no browser):**
```bash
npm run test:rag
```

**Playwright E2E (full UI testing):**
```bash
npm run test:e2e:rag
```

## Test Scenarios

### Scenario 1: Quick Health Check
```bash
node test-rag-complete.mjs
```
This runs all 9 tests in ~10 seconds and gives you a complete health report.

### Scenario 2: Full E2E with Browser
```bash
npm run test:e2e:rag -- --headed
```
Watch the browser automatically:
1. Create a test model
2. Upload a file
3. Process the file
4. Generate embeddings
5. Ask questions and get answers
6. Clean up

### Scenario 3: Debug Specific Test
```bash
npx playwright test tests/e2e/rag-system-complete.spec.ts --grep "CEO question" --debug
```

## Understanding Test Results

### Standalone Script Output

```
✅ Model found: Alber imou (ready)
✅ Found 9 embeddings
✅ Generated 1536-dimensional embedding
✅ Found 2 matches
  Match 1: 48.7% - "ACME CORPORATION - EMPLOYEE HANDBOOK 2024..."
  Match 2: 38.2% - "London Office: 321 Innovation Street..."
```

**What this means:**
- ✅ Model is ready
- ✅ Embeddings exist (9 chunks)
- ✅ OpenRouter API working (1536 dims = text-embedding-3-small)
- ✅ Vector search working (found 2 relevant chunks)
- ✅ Similarity scores above threshold (48.7% and 38.2% > 35%)

### Playwright Test Output

```
  ✓ 1. Upload training file (2.3s)
  ✓ 2. Verify file appears in training data list (1.1s)
  ✓ 3. Trigger file processing (0.5s)
  ✓ 4. Wait for processing to complete (8.2s)
  ✓ 5. Verify embeddings were created (1.0s)
  ✓ 6. Test RAG retrieval with CEO question (3.5s)
  ✓ 7. Test RAG with multiple questions (12.1s)
  ✓ 8. Test RAG with similarity threshold (0.8s)
  ✓ 9. Verify RAG context in chat logs (5.0s)
  ✓ 10. Performance test - RAG response time (2.8s)
```

## Troubleshooting

### Issue: "No embeddings found"
**Cause:** File hasn't been processed yet
**Fix:** 
1. Check job queue: `SELECT * FROM job_queue WHERE job_type = 'file_processing'`
2. Trigger processor: `POST /api/jobs/process-next`
3. Wait for status to change to "processed"

### Issue: "No matches found"
**Cause:** Similarity threshold too high
**Fix:** Lower threshold in:
- `src/lib/vector-store.ts` (default: 0.35)
- `src/lib/rag-service.ts` (default: 0.35)
- `src/app/api/chat/route.ts` (default: 0.35)

### Issue: "Edge Function error: 400"
**Cause:** Wrong embedding dimensions
**Fix:** Edge Function should accept both 768 and 1536 dimensions
- Check: `supabase/functions/vector-search/index.ts`
- Should have: `embedding.length !== 768 && embedding.length !== 1536`

### Issue: "OpenRouter API error: 401"
**Cause:** Invalid API key
**Fix:** Check `.env.local` has correct `OPENROUTER_API_KEY`

## Test Data

The tests use this sample data:

```
ACME CORPORATION - EMPLOYEE HANDBOOK 2024

CEO: Sarah Johnson
CTO: Michael Chen
CFO: Emily Rodriguez

Company Mission: To revolutionize artificial intelligence.

Benefits:
- Health insurance
- Gym membership ($100/month)
- Learning budget ($2,000/year)
```

**Test Questions:**
1. "Who is the CEO of ACME Corporation?" → Expected: "Sarah Johnson"
2. "What is the CTO name?" → Expected: "Michael Chen"
3. "What is the gym membership benefit?" → Expected: "$100"

## Performance Benchmarks

**Expected performance:**
- Embedding generation: ~500ms
- Vector search: ~300ms
- Total RAG retrieval: ~1000ms
- Chat response (with RAG): <5000ms

**If slower:**
- Check OpenRouter API latency
- Check Supabase Edge Function performance
- Check database query performance

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/test-rag.yml
name: RAG System Tests

on: [push, pull_request]

jobs:
  test-rag:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:rag
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

## Manual Testing Checklist

- [ ] Upload a file through UI
- [ ] Check file appears in training data list
- [ ] Verify status changes to "processing"
- [ ] Wait for status to change to "processed"
- [ ] Check embeddings exist in database
- [ ] Ask a question in chat
- [ ] Verify answer contains correct information
- [ ] Check response time is acceptable
- [ ] Test with different file types (PDF, DOCX, TXT)
- [ ] Test with large files (>1MB)

## Advanced Testing

### Test with Different Models

```javascript
// In test-rag-complete.mjs, change:
const MODEL_ID = 'your-model-id-here'
```

### Test with Different Thresholds

```javascript
// In test scripts, adjust:
threshold: 0.35  // Try 0.2, 0.3, 0.4, 0.5
```

### Test with Different Embedding Models

```javascript
// In OpenRouter API call, change:
model: 'text-embedding-3-small'  // or 'text-embedding-3-large'
```

## Support

If tests fail:
1. Check server logs
2. Check Supabase logs
3. Check OpenRouter API status
4. Review this guide's troubleshooting section
5. Check `console errors.md` for known issues

## Next Steps

After all tests pass:
1. ✅ Deploy to production
2. ✅ Set up monitoring
3. ✅ Configure cron jobs for processing
4. ✅ Add more test cases
5. ✅ Optimize performance
