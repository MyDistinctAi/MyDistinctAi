# ⚠️ CRITICAL: RESTART SERVER TO FIX MOCK RESPONSES

## 🔴 **Problem**
You're getting mock responses because the server hasn't loaded the `OPENROUTER_API_KEY` environment variable yet.

## ✅ **Solution: Restart the Server**

### **Step 1: Stop the Current Server**

Find the terminal running the dev server and press:
```
Ctrl + C
```

Or if it's running in the background, kill the process:
```powershell
# Find the process
Get-Process -Name node | Where-Object {$_.Path -like "*MyDistinctAi*"}

# Kill it
Stop-Process -Name node -Force
```

### **Step 2: Start the Server Again**

```bash
npm run dev
```

The server will now load the `.env.local` file with `OPENROUTER_API_KEY`.

### **Step 3: Verify Environment Variable is Loaded**

After restart, check the server logs. You should see:
```
[Chat API] OpenRouter available: true
[Chat API] OPENROUTER_API_KEY set: true
```

---

## 🧪 **Test After Restart**

1. **Login:**
   ```
   http://localhost:4000/login
   Email: mytest@testmail.app
   Password: password123
   ```

2. **Create Model:**
   - Go to Models → Create New Model
   - Name: "Test Bot"
   - Base Model: "Gemini Flash 1.5 8B (FREE - Cloud)"
   - Click Create

3. **Chat:**
   - Go to Chat → Select "Test Bot"
   - Send: "Hello!"
   - **You should get REAL AI response now!**

---

## 📊 **Check Server Logs**

When you send a chat message, look for these logs:

### ✅ **Good (OpenRouter Working):**
```
[Chat API] OpenRouter available: true
[Chat API] OPENROUTER_API_KEY set: true
[Chat API] Model base_model: google/gemini-flash-1.5-8b
[Chat API] Selected model: google/gemini-flash-1.5-8b
[Chat API] ✅ Attempting OpenRouter with model: google/gemini-flash-1.5-8b
```

### ❌ **Bad (Still Using Mock):**
```
[Chat API] OpenRouter available: false
[Chat API] OPENROUTER_API_KEY set: false
[Chat API] ⚠️ OpenRouter not available, using Ollama
[Chat API] Ollama connection failed
```

---

## 🔍 **If Still Getting Mock Responses After Restart**

### Check 1: Verify .env.local exists
```powershell
Get-Content .env.local | Select-String "OPENROUTER_API_KEY"
```

Should show:
```
OPENROUTER_API_KEY=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
```

### Check 2: Verify model has OpenRouter base_model

Go to database and check your model:
```sql
SELECT id, name, base_model FROM models;
```

Should show:
```
base_model: google/gemini-flash-1.5-8b
```

### Check 3: Check server logs for errors

Look for:
```
[Chat API] ❌ OpenRouter failed: [error message]
```

---

## 💡 **Why This Happens**

Node.js loads environment variables when the process starts. If you:
1. Added `OPENROUTER_API_KEY` to `.env.local`
2. But didn't restart the server

Then the server is still running with the OLD environment (without the key).

**Solution:** Always restart after changing `.env.local`!

---

## 🚀 **Quick Restart Command**

```powershell
# Stop and restart in one command
Stop-Process -Name node -Force; npm run dev
```

---

**After restart, test immediately and you should see real AI responses! 🎉**
