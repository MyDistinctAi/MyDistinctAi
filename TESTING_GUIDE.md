# Testing Guide - OpenRouter Integration

## ✅ Issues Fixed

### 1. **Base Model Dropdown** ✅
**Problem:** Model creation dropdown only showed Ollama models (Mistral, Llama 2, Phi-2)

**Solution:** Updated `CreateModelModal.tsx` to include OpenRouter models:
- ✅ Gemini Flash 1.5 8B (FREE - Cloud)
- ✅ Llama 3.3 70B (FREE - Cloud)
- ✅ Qwen 2.5 72B (FREE - Cloud)
- ✅ Kept Ollama models for desktop users (Local)

**Default:** Now defaults to Gemini Flash 1.5 8B instead of Mistral 7B

---

## 🧪 How to Test the Fixes

### **Test 1: Model Creation with OpenRouter Models**

1. **Navigate to Models Page:**
   ```
   http://localhost:4000/dashboard/models
   ```

2. **Click "Create New Model"**

3. **Check Base Model Dropdown:**
   - Should see OpenRouter models at the top (labeled "FREE - Cloud")
   - Should see Ollama models below (labeled "Local")
   - Default should be "Gemini Flash 1.5 8B (FREE - Cloud)"

4. **Create a Model:**
   - Name: "Test OpenRouter Model"
   - Description: "Testing Gemini Flash"
   - Base Model: Select "Gemini Flash 1.5 8B (FREE - Cloud)"
   - Click "Create Model"

5. **Verify:**
   - Model should be created successfully
   - Should appear in models list

---

### **Test 2: Chat with OpenRouter**

**IMPORTANT:** The server must be restarted to pick up the `OPENROUTER_API_KEY` environment variable.

**Steps:**

1. **Verify Environment Variable:**
   ```bash
   # Check .env.local has:
   OPENROUTER_API_KEY=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
   ```

2. **Restart Dev Server:**
   ```bash
   # Stop all node processes
   taskkill /F /IM node.exe
   
   # Start fresh
   npm run dev
   ```

3. **Navigate to Chat:**
   ```
   http://localhost:4000/dashboard/chat
   ```

4. **Select a Model:**
   - Choose a model created with OpenRouter base model
   - OR create a new one with Gemini Flash

5. **Send a Test Message:**
   ```
   "Hello! Can you tell me about yourself?"
   ```

6. **Expected Behavior:**
   - ✅ Should get a real AI response (NOT mock response)
   - ✅ Response should stream in real-time
   - ✅ Should NOT see "I'm a mock AI response because Ollama is not running"

7. **Check Console Logs:**
   ```
   [Chat API] OpenRouter available: true
   [Chat API] User preferred model: google/gemini-flash-1.5-8b
   [Chat API] Using OpenRouter with model: google/gemini-flash-1.5-8b
   ```

---

### **Test 3: AI Model Selection Settings**

1. **Navigate to Settings:**
   ```
   http://localhost:4000/dashboard/settings/ai-model
   ```

2. **Verify All Models Display:**
   - ✅ Gemini Flash 1.5 8B
   - ✅ Llama 3.3 70B Instruct
   - ✅ Qwen 2.5 72B Instruct
   - ✅ All have FREE badges

3. **Select a Model:**
   - Click on any model card
   - Should show checkmark
   - Click "Save Preference"

4. **Test in Chat:**
   - Go to chat
   - Send a message
   - Should use the selected model

---

## 🐛 Troubleshooting

### **Still Getting Mock Responses?**

**Possible Causes:**

1. **Server Not Restarted:**
   - Environment variables are only loaded on server start
   - Solution: Kill all node processes and restart `npm run dev`

2. **API Key Not Set:**
   - Check `.env.local` has `OPENROUTER_API_KEY`
   - Solution: Add the key and restart server

3. **Model Not Using OpenRouter:**
   - Old models might still use Ollama base models
   - Solution: Create a NEW model with OpenRouter base model

4. **Check Server Logs:**
   ```bash
   # Look for these logs in terminal:
   [Chat API] OpenRouter available: true
   [Chat API] Using OpenRouter with model: google/gemini-flash-1.5-8b
   ```

   If you see:
   ```bash
   [Chat API] OpenRouter available: false
   ```
   Then the API key is not being loaded. Restart the server.

---

## 🎯 Best Practices for Testing React Interfaces

### **1. Use Playwright for E2E Testing**

We created `tests/e2e/openrouter.spec.ts` for automated testing:

```bash
# Run OpenRouter tests
npx playwright test tests/e2e/openrouter.spec.ts --headed

# Run specific test
npx playwright test tests/e2e/openrouter.spec.ts -g "should display all 3 free AI models"
```

### **2. Use Browser DevTools**

**Network Tab:**
- Monitor API calls to `/api/chat`
- Check request/response payloads
- Verify streaming responses

**Console Tab:**
- Check for errors
- View `[Chat API]` logs
- Monitor React component logs

### **3. Use React DevTools**

Install React DevTools browser extension:
- Inspect component state
- Check props being passed
- Monitor re-renders

### **4. Manual Testing Checklist**

For each feature:
- ✅ Test happy path (everything works)
- ✅ Test error cases (API fails, network error)
- ✅ Test edge cases (empty input, special characters)
- ✅ Test on different browsers (Chrome, Firefox, Safari)
- ✅ Test responsive design (mobile, tablet, desktop)
- ✅ Test with real user data (not just test data)

---

## 🔍 Debugging Tips

### **1. Check API Response:**

```javascript
// In browser console
fetch('http://localhost:4000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    modelId: 'your-model-id',
    message: 'test',
    sessionId: 'test-session'
  })
}).then(r => r.text()).then(console.log)
```

### **2. Check Environment Variables:**

```javascript
// In server-side code, add:
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET')
console.log('USE_OPENROUTER:', !!process.env.OPENROUTER_API_KEY)
```

### **3. Test OpenRouter Directly:**

```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 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" \
  -d '{
    "model": "google/gemini-flash-1.5-8b",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

---

## 📊 Test Coverage

### **What's Tested:**
- ✅ AI Model Selection UI
- ✅ Model comparison table
- ✅ Model selection and saving
- ✅ All 3 OpenRouter models display
- ✅ FREE badges visible
- ✅ Pro tips section

### **What Needs Testing:**
- ⏳ Actual chat with OpenRouter (requires server restart)
- ⏳ Model creation with OpenRouter base models
- ⏳ Model editing functionality
- ⏳ Streaming responses
- ⏳ Error handling (API failures)
- ⏳ RAG with OpenRouter models

---

## 🚀 Next Steps

1. **Restart the dev server** to load the API key
2. **Create a new model** with Gemini Flash base model
3. **Test chat** with the new model
4. **Verify** you get real AI responses (not mock)
5. **Test** all 3 OpenRouter models
6. **Deploy to Vercel** and test in production

---

## ✨ Summary

**Fixed:**
- ✅ Added OpenRouter models to base model dropdown
- ✅ Set Gemini Flash as default
- ✅ Clear labeling (Cloud vs Local)
- ✅ Created comprehensive test suite

**To Test:**
1. Restart server
2. Create model with OpenRouter
3. Chat and verify real responses
4. Test model selection settings

**Expected Result:**
- No more mock responses
- Real AI chat with Gemini Flash, Llama 3.3, or Qwen 2.5
- Better UX with clear model options
