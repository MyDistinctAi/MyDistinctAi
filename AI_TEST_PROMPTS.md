# AI Chat Test Prompts - File Context Verification

**File Uploaded**: `test-ai-knowledge.txt` (1.99 KB)  
**Purpose**: Test if the AI can access and reference uploaded training data

---

## 🎯 Test Prompts to Use

### Test 1: Secret Code (BEST TEST)
**Prompt**: 
```
What is the secret code mentioned in the training documents?
```

**Expected Response**: 
The AI should mention **"ALPHA-BRAVO-2025"**

**Why this works**: This is a unique code that only exists in the uploaded file, not in the AI's general knowledge.

---

### Test 2: Project-Specific Details
**Prompt**:
```
What port does the MyDistinctAI server run on?
```

**Expected Response**: 
The AI should say **port 4000**

---

### Test 3: Job Queue Specifics
**Prompt**:
```
How many jobs does the worker process per run according to the documentation?
```

**Expected Response**: 
The AI should say **10 jobs per run**

---

### Test 4: Test User Information
**Prompt**:
```
What is the test user's email address in this project?
```

**Expected Response**: 
The AI should mention **filetest@example.com**

---

### Test 5: Recent Fixes
**Prompt**:
```
What recent fixes were made to the Ollama connection?
```

**Expected Response**: 
The AI should mention changing **"mistral-7b" to "mistral:7b"** (hyphen to colon)

---

### Test 6: Dashboard Stats
**Prompt**:
```
According to the training data, what do the dashboard stats currently show?
```

**Expected Response**: 
The AI should mention **1 model, 3 training files, 1 chat session**

---

### Test 7: Worker Schedule
**Prompt**:
```
How often does the background worker run?
```

**Expected Response**: 
The AI should say **every 60 seconds**

---

### Test 8: File Upload Limits
**Prompt**:
```
What is the maximum file size for uploads?
```

**Expected Response**: 
The AI should say **10MB**

---

### Test 9: Session Timeout
**Prompt**:
```
How long do user sessions last?
```

**Expected Response**: 
The AI should say **7 days**

---

### Test 10: Technology Stack
**Prompt**:
```
What technologies are used in the MyDistinctAI stack?
```

**Expected Response**: 
The AI should mention **Next.js 16, Supabase, Ollama, LanceDB**

---

## 🔍 How to Verify RAG is Working

**Signs that RAG (Retrieval Augmented Generation) is working**:
1. ✅ AI mentions specific details from the uploaded file
2. ✅ AI references exact numbers (port 4000, 10 jobs, 60 seconds, etc.)
3. ✅ AI mentions the secret code "ALPHA-BRAVO-2025"
4. ✅ AI provides project-specific information not in its general training

**Signs that RAG is NOT working**:
1. ❌ AI gives generic answers
2. ❌ AI says "I don't have information about that"
3. ❌ AI doesn't mention the secret code
4. ❌ AI provides incorrect or made-up details

---

## 📊 Test Results Template

After testing, record your results:

| Test # | Prompt | Expected | Actual | Pass/Fail |
|--------|--------|----------|--------|-----------|
| 1 | Secret code | ALPHA-BRAVO-2025 | ___ | ⬜ |
| 2 | Server port | 4000 | ___ | ⬜ |
| 3 | Jobs per run | 10 | ___ | ⬜ |
| 4 | Test user email | filetest@example.com | ___ | ⬜ |
| 5 | Ollama fix | mistral-7b → mistral:7b | ___ | ⬜ |
| 6 | Dashboard stats | 1, 3, 1 | ___ | ⬜ |
| 7 | Worker schedule | 60 seconds | ___ | ⬜ |
| 8 | Max file size | 10MB | ___ | ⬜ |
| 9 | Session timeout | 7 days | ___ | ⬜ |
| 10 | Tech stack | Next.js 16, Supabase, etc. | ___ | ⬜ |

---

## 🎯 RECOMMENDED FIRST TEST

**Start with Test #1 (Secret Code)** - This is the most definitive test because:
- The code "ALPHA-BRAVO-2025" is unique to your uploaded file
- It's not something the AI would know from general training
- If the AI mentions it, RAG is definitely working
- If the AI doesn't mention it, RAG needs debugging

**Example conversation**:
```
You: What is the secret code mentioned in the training documents?

AI (if RAG works): The secret code mentioned in the training documents is ALPHA-BRAVO-2025.

AI (if RAG doesn't work): I don't see any secret code in the information provided. Could you clarify what you're referring to?
```

---

## 🔧 If Tests Fail

If the AI doesn't reference the uploaded file:

1. **Check if file was processed**:
   - Look for "File processing job enqueued successfully" in console
   - Check job_queue table for processing status

2. **Run the background worker**:
   ```powershell
   curl http://localhost:4000/api/jobs/worker
   ```

3. **Check RAG service**:
   - Verify LanceDB is set up
   - Check if embeddings were created
   - Look for RAG-related errors in server logs

4. **Verify model has training data**:
   - Check training_data table
   - Ensure files are linked to correct model_id

---

## ✅ Success Criteria

**RAG is working if**:
- AI correctly answers at least 7/10 test questions
- AI mentions the secret code "ALPHA-BRAVO-2025"
- AI provides specific numbers from the document
- AI references project-specific details

**Status**: Ready to test! 🚀

Go to the chat interface and start with Test #1!
