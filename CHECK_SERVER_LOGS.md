# How to Check Server Logs for RAG Execution

## 🔍 What to Look For

When you send a chat message, your **server console** (where `npm run dev` is running) should show these logs:

### Expected Logs (if RAG is working):

```
[Chat API] ===== NEW CHAT REQUEST =====
[Chat API] Model ID: 353608a6-c981-4dfb-9e75-c70fcdeeba2b
[Chat API] Message: "What is the secret testing code?"
[Chat API] useRAG from body: undefined
[Chat API] useRAG (with default): true
[Chat API] Retrieving RAG context for model: 353608a6-c981-4dfb-9e75-c70fcdeeba2b
[RAG] Retrieving context for query: "What is the secret testing code?"
[RAG] Model ID: 353608a6-c981-4dfb-9e75-c70fcdeeba2b
[RAG] Settings: topK=5, threshold=0.0
[RAG] Ollama connected, generating query embedding...
[RAG] Query embedding generated (768 dimensions)
[RAG] Searching pgvector for similar documents...
[RAG] ✅ Found 3 relevant chunks
[RAG]   Match 1: 79.0% - "MyDistinctAI Project - AI Training Test Document..."
[RAG]   Match 2: 64.1% - "...SECRET CODE FOR TESTING: ALPHA-BRAVO-2025..."
[RAG]   Match 3: 57.9% - "...ad and understood this training document!..."
[Chat API] Retrieved 3 context chunks
```

### If RAG is NOT working, you'll see:

```
[Chat API] ===== NEW CHAT REQUEST =====
[Chat API] Model ID: 353608a6-c981-4dfb-9e75-c70fcdeeba2b
[Chat API] Message: "What is the secret testing code?"
[Chat API] useRAG from body: undefined
[Chat API] useRAG (with default): false  ← THIS IS THE PROBLEM
```

OR you might not see any `[RAG]` logs at all.

---

## 📋 Steps to Check

1. **Find your server console**
   - The terminal where you ran `npm run dev`
   - Should show Next.js compilation messages

2. **Send a test message**
   - Go to chat: http://localhost:4000/dashboard/chat/353608a6-c981-4dfb-9e75-c70fcdeeba2b
   - Type: "What is the secret code?"
   - Press Enter

3. **Check the console output**
   - Look for `[Chat API]` logs
   - Look for `[RAG]` logs
   - Check the `useRAG` value

4. **Report back what you see**

---

## 🔧 Quick Fixes Based on Logs

### If you see: `useRAG (with default): false`

**Fix**: Force useRAG to true in `src/app/api/chat/route.ts` line 49:

```typescript
// Change from:
const { modelId, message, sessionId, useRAG = true } = body

// To:
const useRAG = true // FORCE for testing
const { modelId, message, sessionId } = body
```

### If you see NO `[RAG]` logs at all

**Fix**: The if statement might not be executing. Add this after line 55:

```typescript
console.log('[Chat API] About to check useRAG:', useRAG)
if (useRAG) {
  console.log('[Chat API] INSIDE useRAG block!')
  // ... rest of code
}
```

### If you see `[RAG]` logs but "No relevant context found"

**Fix**: Threshold might be too high (though we set it to 0.0). Check line 173 in `src/lib/rag-service.ts`

---

## 🎯 What Should Happen

**When RAG is working correctly**:

1. Server logs show `[RAG]` messages
2. Server logs show "Found 3 relevant chunks"
3. AI response includes: "ALPHA-BRAVO-2025"
4. AI references the training documents

**Current Status**:
- AI giving generic responses = RAG not executing
- Need to check server logs to see why

---

## 📸 Screenshot Your Server Console

Take a screenshot of your server console output after sending a chat message and share it. This will tell us exactly what's happening!

---

## 🚀 Alternative: Force RAG On

If you want to skip debugging and just make it work:

**Edit `src/app/api/chat/route.ts`**:

Around line 160, change:
```typescript
if (useRAG) {
```

To:
```typescript
if (true) { // FORCE RAG ON
```

This will bypass the useRAG check entirely and force RAG to execute.

Then test again!
