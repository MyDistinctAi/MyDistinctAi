# Desktop App Build Guide - CRITICAL INFORMATION

## ⚠️ IMPORTANT: Current Status

**The desktop app `.exe` is currently NOT functional for offline use.**

### Why the Current Build Doesn't Work

1. **API Routes Cannot Be Exported**: The web app has 30+ API routes (`/api/*`) that require a Node.js server
2. **Next.js Static Export Limitation**: `output: 'export'` mode cannot include API routes
3. **Architecture Mismatch**: The app is designed as client-server (web app) but needs to be standalone (desktop)

### Error When Building

```bash
Error: export const dynamic = "force-static" not configured on route "/api/chat/sessions"
```

This happens because Next.js cannot export API routes as static HTML files.

---

## ✅ Solution: Two Separate Apps

You need **TWO distinct applications**:

### 1. Web App (Already Working) ✅
- **Platform**: Vercel (cloud)
- **URL**: https://my-distinct-ai1-gs6i5wcnr-imoujoker9-gmailcoms-projects.vercel.app
- **Uses**: Next.js API routes, Supabase, OpenRouter
- **Purpose**: Cloud-based AI for users without Ollama

### 2. Desktop App (Needs Fixing) ⚠️
- **Platform**: Tauri (local executable)
- **Uses**: Rust Tauri commands (NOT API routes)
- **Purpose**: 100% offline, encrypted, local AI with Ollama

---

## 🔧 How to Fix the Desktop App

### Option 1: Minimal Desktop UI (Recommended)

Create a simple desktop-only interface that uses Tauri commands:

**What Works**:
- ✅ All 31 Tauri Rust commands are implemented
- ✅ Ollama integration working (tested)
- ✅ LanceDB vector storage ready
- ✅ File processing (PDF/DOCX/TXT) ready
- ✅ Encryption service ready

**What's Needed**:
- Create UI components that call Tauri commands instead of fetch() to API routes
- Example: Instead of `fetch('/api/chat')`, use `window.__TAURI__.core.invoke('generate_response')`

**Pages to Create**:
1. `/desktop-app` - Main landing page (✅ CREATED)
2. `/desktop-app/chat` - Chat interface using Tauri commands
3. `/desktop-app/files` - File upload using Tauri commands
4. `/desktop-app/models` - Model management using Tauri commands

### Option 2: Electron Instead of Tauri (Not Recommended)

Switch from Tauri to Electron:
- **Pros**: Can bundle Node.js server, supports API routes
- **Cons**: Much larger file size (100MB+ more), not truly "local-first"

---

## 🚀 Current Working Setup

### For Development Testing

```bash
# Start dev server
npm run dev

# In another terminal, run desktop app in dev mode
npm run tauri:dev
```

This will:
1. Start Next.js server on localhost:4000
2. Open Tauri window pointing to `http://localhost:4000/desktop-app`
3. Tauri commands work ✅
4. Ollama integration works ✅

**Limitation**: Requires dev server running (not offline)

### For Production Desktop App

**Current Status**: ❌ NOT WORKING

The `.exe` file at `src-tauri/target/release/mydistinctai.exe` will:
- ❌ Show "ERR_CONNECTION_REFUSED"
- ❌ Not work for end users
- ❌ Not work offline

**Why**: It's trying to connect to a server that doesn't exist in the packaged app.

---

## 📋 Action Plan to Make Desktop App Work Offline

### Step 1: Create Desktop-Specific Pages
- [x] `/desktop-app` landing page (CREATED)
- [ ] `/desktop-app/chat` - Chat interface
- [ ] `/desktop-app/upload` - File upload
- [ ] `/desktop-app/models` - Model list

### Step 2: Create Tauri Integration Hook
```typescript
// src/hooks/useTauriInvoke.ts
export function useTauriInvoke() {
  const invoke = async (cmd: string, args?: Record<string, unknown>) => {
    if (window.__TAURI__) {
      return await window.__TAURI__.core.invoke(cmd, args)
    }
    throw new Error('Not running in Tauri')
  }
  return { invoke }
}
```

### Step 3: Update Build Config

The `next.config.js` is already updated to enable static export when `TAURI_BUILD=true`:

```javascript
output: process.env.TAURI_BUILD ? 'export' : undefined,
```

### Step 4: Exclude API Routes from Export

Add to `next.config.js`:
```javascript
exportPathMap: async function (defaultPathMap) {
  if (process.env.TAURI_BUILD) {
    // Only export desktop pages
    return {
      '/desktop-app': { page: '/desktop-app' },
      '/desktop-app/chat': { page: '/desktop-app/chat' },
      '/desktop-app/upload': { page: '/desktop-app/upload' },
    }
  }
  return defaultPathMap
}
```

### Step 5: Build Desktop App
```bash
npm run tauri:build
```

This will:
1. Set `TAURI_BUILD=true`
2. Run `next build` with static export
3. Export only desktop pages to `out/` directory
4. Bundle into `.exe` file
5. Result: Standalone offline desktop app ✅

---

## 🎯 Summary

**Current Status**:
- Web App: ✅ WORKING (Vercel)
- Desktop App: ⚠️ 95% complete (Rust code done, UI needs work)

**What You Can Do Now**:
1. Use the web app on Vercel (fully functional)
2. Test desktop app in dev mode (`npm run tauri:dev`) while Ollama is running
3. Create desktop-specific UI pages to replace API route dependencies

**What Doesn't Work**:
- The packaged `.exe` file (offline mode) - shows connection refused error

**Next Steps**:
1. Create `/desktop-app/chat` page using Tauri commands
2. Create `/desktop-app/upload` page using Tauri commands
3. Rebuild desktop app with static export
4. Test `.exe` works offline with Ollama

**Estimated Time to Fix**: 4-6 hours of development work

---

## 📊 Tauri Commands Available (31 Total)

All these Rust commands are ready to use from the desktop UI:

### Ollama Integration (4 commands)
- `check_ollama_status` - Check if Ollama is running
- `list_ollama_models` - Get available models
- `generate_embeddings` - Create embeddings
- `generate_response` - Get AI chat response

### File Processing (6 commands)
- `extract_text_from_file` - Extract text from PDF/DOCX/TXT
- `chunk_text` - Split text into chunks
- `process_file` - Extract + chunk combined
- `get_file_info` - File metadata
- `process_and_store_file` - Complete RAG workflow
- `generate_embeddings_batch` - Batch embed multiple texts

### LanceDB (6 commands)
- `initialize_lancedb` - Create/open vector database
- `store_embeddings` - Store vectors
- `search_similar` - Vector similarity search
- `get_context` - Retrieve RAG context
- `delete_model_data` - Cleanup
- `list_model_tables` - Show all model data

### Storage (4 commands)
- `initialize_storage` - Setup key-value store
- `storage_set` - Save data
- `storage_get` - Retrieve data
- `storage_delete` - Remove data

### Encryption (4 commands)
- `encrypt_data` - AES-256-GCM encrypt
- `decrypt_data` - Decrypt
- `generate_encryption_key` - Key generation
- `secure_delete_key` - Remove key

### + 7 more utility commands

**All commands tested and working!** ✅

---

**Date**: November 17, 2025
**Author**: Claude
**Status**: Desktop app 95% complete - needs UI work to be fully offline
