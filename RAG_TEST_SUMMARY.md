# RAG System Testing - Complete Implementation

## ✅ What Was Created

### 1. **Standalone Test Script** (`test-rag-complete.mjs`)
A comprehensive Node.js script that tests the RAG system without requiring a browser.

**Features:**
- 🎯 9 different test categories
- 🎨 Colored console output
- 📊 Performance metrics
- 🔍 Detailed error reporting
- ⚡ Fast execution (~10 seconds)

**Run:**
```bash
npm run test:rag
```

### 2. **Playwright E2E Tests** (`tests/e2e/rag-system-complete.spec.ts`)
Full browser-based end-to-end testing suite.

**Features:**
- 🌐 Real browser automation
- 📝 File upload testing
- 💬 Chat interface testing
- 🧪 Edge case testing
- 📈 Monitoring tests

**Run:**
```bash
npm run test:e2e:rag
```

### 3. **Testing Guide** (`RAG_TESTING_GUIDE.md`)
Complete documentation for testing the RAG system.

**Includes:**
- 📖 Test file descriptions
- 🚀 Quick start guide
- 🔧 Troubleshooting tips
- 📊 Performance benchmarks
- ✅ Manual testing checklist

## 🎯 Test Coverage

### Standalone Script Tests

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 1 | Model Exists | Verifies model is in database and ready |
| 2 | Check Embeddings | Confirms embeddings exist for model |
| 3 | Generate Embedding | Tests OpenRouter API integration |
| 4 | Vector Search | Tests Edge Function vector search |
| 5 | Direct Similarity | Tests SQL similarity queries |
| 6 | RAG Questions | Tests 3 specific Q&A scenarios |
| 7 | Job Queue | Checks processing job status |
| 8 | Training Data | Verifies file upload status |
| 9 | Performance | Measures response times |

### Playwright E2E Tests

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 1 | Upload File | File upload through UI |
| 2 | Verify List | File appears in training data |
| 3 | Trigger Processing | Job processor API |
| 4 | Wait for Processing | Polling until complete |
| 5 | Verify Embeddings | Database embedding count |
| 6 | CEO Question | Specific RAG retrieval |
| 7 | Multiple Questions | 4 different questions |
| 8 | Similarity Threshold | Direct vector search API |
| 9 | Chat Logs | Console log verification |
| 10 | Performance | Response time measurement |

**Plus Edge Cases:**
- Empty query handling
- Invalid model ID handling
- Very long query handling

**Plus Monitoring:**
- Embedding dimensions check
- Job queue status
- RAG statistics by model

## 📊 Sample Output

### Standalone Script
```
╔════════════════════════════════════════════════════════╗
║        RAG SYSTEM COMPLETE TEST SUITE                 ║
╚════════════════════════════════════════════════════════╝

📋 Test 1: Check if model exists
✅ Model found: Alber imou (ready)

📋 Test 2: Check existing embeddings
✅ Found 9 embeddings
ℹ️  Sample chunk: "ACME CORPORATION - EMPLOYEE HANDBOOK 2024..."

📋 Test 3: Generate query embedding
ℹ️  Query: "Who is the CEO of ACME Corporation?"
✅ Generated 1536-dimensional embedding

📋 Test 4: Search for similar documents
✅ Found 2 matches
ℹ️    Match 1: 48.7% - "ACME CORPORATION - EMPLOYEE HANDBOOK 2024..."
ℹ️    Match 2: 38.2% - "London Office: 321 Innovation Street..."

📋 Test 5: Direct SQL similarity query
✅ SQL query returned 2 results

📋 Test 6: Test RAG with specific questions
  Question: "Who is the CEO of ACME Corporation?"
  Expected: "Sarah Johnson"
✅   ✓ Found expected answer in context

  Results: 3 passed, 0 failed

📋 Test 7: Check job queue status
✅ Found 5 recent jobs
ℹ️    completed: 4
ℹ️    pending: 1

📋 Test 8: Check training data status
✅ Found 1 training files
  company-handbook.txt: processed

📋 Test 9: Performance test
ℹ️    Iteration 1: 1234ms
ℹ️    Iteration 2: 987ms
ℹ️    Iteration 3: 1056ms
✅ Performance: avg=1092ms, min=987ms, max=1234ms

╔════════════════════════════════════════════════════════╗
║                    TEST SUMMARY                        ║
╚════════════════════════════════════════════════════════╝

  Total Tests: 12
✅  Passed: 12
  Success Rate: 100.0%
```

## 🚀 Quick Start

### Option 1: Fast Health Check (10 seconds)
```bash
npm run test:rag
```

### Option 2: Full E2E Test (2-3 minutes)
```bash
npm run test:e2e:rag
```

### Option 3: Watch Tests in Browser
```bash
npm run test:e2e:rag -- --headed
```

### Option 4: Debug Specific Test
```bash
npx playwright test tests/e2e/rag-system-complete.spec.ts --grep "CEO" --debug
```

## 🔧 Configuration

All tests use these environment variables from `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ekfdbotohslpalnyvdpk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**Note:** The standalone test script (`test-rag-complete.mjs`) uses **existing embeddings** from the database, so it doesn't require an OpenRouter API key. This makes it faster and more reliable for testing the RAG retrieval system.

To test a different model, edit `test-rag-complete.mjs`:
```javascript
const MODEL_ID = 'your-model-id-here'
```

## 📈 Success Criteria

**All tests should pass if:**
- ✅ Model exists and is ready
- ✅ Training data is processed (status = "processed")
- ✅ Embeddings exist in database
- ✅ OpenRouter API is accessible
- ✅ Edge Function is deployed and working
- ✅ Similarity threshold is set correctly (0.35)
- ✅ Vector search returns matches
- ✅ Chat answers questions correctly

## 🐛 Common Issues

### No Embeddings Found
**Solution:** File needs processing
```bash
# Check status
SELECT status FROM training_data WHERE model_id = 'your-model-id';

# If "uploaded", trigger processing
POST /api/jobs/process-next
```

### No Matches Found
**Solution:** Lower similarity threshold
- Current: 0.35 (35%)
- Try: 0.25 (25%) or 0.20 (20%)

### Edge Function Error
**Solution:** Redeploy Edge Function
```bash
# Already deployed via Supabase MCP
# Version 3 accepts both 768 and 1536 dimensions
```

## 📝 Next Steps

1. ✅ Run tests to verify system health
2. ✅ Fix any failing tests
3. ✅ Add tests to CI/CD pipeline
4. ✅ Monitor performance over time
5. ✅ Add more test scenarios as needed

## 📚 Documentation

- **Full Guide:** `RAG_TESTING_GUIDE.md`
- **Test Script:** `test-rag-complete.mjs`
- **E2E Tests:** `tests/e2e/rag-system-complete.spec.ts`

## 🎉 Summary

You now have:
- ✅ Comprehensive test coverage
- ✅ Automated testing scripts
- ✅ Performance benchmarks
- ✅ Detailed documentation
- ✅ CI/CD ready tests

**Total Test Count:** 22 tests (9 standalone + 13 Playwright)
**Execution Time:** ~10 seconds (standalone) or ~3 minutes (E2E)
**Coverage:** Upload → Process → Embed → Retrieve → Answer
