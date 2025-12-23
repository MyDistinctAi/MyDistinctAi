# MyDistinctAI - Project Documentation

> **Last Updated**: December 15, 2025  
> **Production URL**: https://my-distinct-ai-psi.vercel.app/  
> **Repository**: https://github.com/MyDistinctAi/MyDistinctAi

---

## Overview

MyDistinctAI is a web application that allows users to create AI-powered assistants trained on their own documents. Users can upload files, which are processed into embeddings, and then chat with an AI that uses RAG (Retrieval-Augmented Generation) to answer questions based on the uploaded content.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 15)                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐    │
│  │ Landing │  │  Auth   │  │Dashboard│  │  Chat Interface │    │
│  │  Page   │  │  Pages  │  │  Pages  │  │  (Real-time)    │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes (Next.js)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ /api/chat│  │/api/train│  │/api/model│  │ /api/worker  │    │
│  │  (POST)  │  │ (upload) │  │   CRUD   │  │ (process-job)│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
          │                │                         │
          ▼                ▼                         ▼
┌─────────────────┐  ┌─────────────┐  ┌────────────────────────┐
│   OpenRouter    │  │  Supabase   │  │     RAG Pipeline       │
│  (Cloud AI)     │  │  - Auth     │  │  - Text Extraction     │
│  deepseek-chat  │  │  - Database │  │  - Chunking            │
│                 │  │  - Storage  │  │  - OpenAI Embeddings   │
└─────────────────┘  └─────────────┘  │  - Vector Search       │
                                      └────────────────────────┘
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15.5.9, React 19, TailwindCSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Cloud AI | OpenRouter API (deepseek-chat) |
| Local AI | Ollama (for desktop app) |
| Embeddings | OpenAI text-embedding-3-small |
| Deployment | Vercel |

---

## Key Files & Directories

```
src/
├── app/
│   ├── (auth)/              # Auth layout (login, signup)
│   ├── api/
│   │   ├── chat/route.ts    # Main chat API with AI routing
│   │   ├── training/
│   │   │   ├── upload/      # File upload handler
│   │   │   └── process-manual/ # Manual processing trigger
│   │   ├── worker/          # Background job processor
│   │   └── debug/           # Debug endpoints
│   ├── dashboard/           # Main app pages
│   └── desktop-app/         # Tauri desktop app pages
├── lib/
│   ├── supabase/            # Supabase clients (client, server, admin)
│   ├── embeddings.ts        # Embedding generation (OpenAI/Ollama)
│   ├── file-extraction.ts   # Text extraction from files
│   ├── text-chunking.ts     # Document chunking
│   ├── vector-store.ts      # Vector similarity search
│   ├── rag-service.ts       # RAG orchestration
│   └── openrouter/          # OpenRouter API client
└── components/
    ├── dashboard/           # Dashboard UI components
    └── landing/             # Landing page components
```

---

## Tasks Completed

### 1. Logo Update ✅
Updated application logo to fingerprint image across 6 files with zoom effect.

### 2. AI Model Routing Fix ✅
**Problem**: Web app was trying to use Ollama (local AI) instead of OpenRouter (cloud AI).

**Solution**: Modified `src/app/api/chat/route.ts`:
- Added `IS_TAURI_BUILD` and `x-desktop-app` header detection
- Web app → OpenRouter (always)
- Desktop app (Tauri) → Ollama (local)
- Added clear error when `OPENROUTER_API_KEY` is missing

### 3. RAG Document Retrieval Fix ✅
**Problem**: Uploaded documents weren't being used for chat responses.

**Root Causes**:
1. `WORKER_API_KEY` not set → worker never triggered
2. `extractTextFromURL` missing filename parameter
3. Embeddings result not properly extracted from `BatchEmbeddingResult`

**Solution**: 
- Created `/api/training/process-manual` endpoint
- Fixed file extraction to pass `filename` and `mimeType`
- Fixed embeddings handling: `embeddingResult.embeddings`

### 4. Signup Error Handling ✅
Enhanced error messages in `src/lib/auth/actions.ts` to show Supabase error codes and details.

---

## Issues Encountered & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Ollama is not running" on web | Web app defaulting to local Ollama | Detect desktop via `x-desktop-app` header, force OpenRouter for web |
| RAG returns 0 matches | Files uploaded but never processed | Create manual processing endpoint, fix filename param |
| "fileName is required" error | `extractTextFromURL` missing param | Pass `td.file_name, td.file_type` to extraction |
| Embeddings type error | `generateEmbeddings` returns object | Extract `embeddingResult.embeddings` array |
| Signup profile creation fails | Missing `SUPABASE_SERVICE_ROLE_KEY` on Vercel | Add env var to Vercel dashboard |

---

## Environment Variables

### Required for Development (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ekfdbotohslpalnyvdpk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# OpenRouter (Cloud AI)
OPENROUTER_API_KEY=sk-or-v1-xxx

# Worker
WORKER_API_KEY=dev-worker-key-change-in-production

# App
NEXT_PUBLIC_APP_URL=http://localhost:4000
```

### Required for Production (Vercel)
```env
OPENROUTER_API_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>
WORKER_API_KEY=<secure_random_string>
NEXT_PUBLIC_APP_URL=https://my-distinct-ai-psi.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://ekfdbotohslpalnyvdpk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
```

---

## Workflow

### Document Upload & Processing Flow
```
1. User uploads file → POST /api/training/upload
2. File saved to Supabase Storage
3. training_data record created (status: "uploaded")
4. Job enqueued in job_queue table
5. Worker triggered → POST /api/worker/process-jobs
6. Worker downloads file, extracts text, chunks, generates embeddings
7. Embeddings stored in document_embeddings table
8. training_data updated (status: "processed")
9. Original file deleted from storage (save costs)
```

### Chat Flow with RAG
```
1. User sends message → POST /api/chat
2. Detect platform (web/desktop)
3. Web: Use OpenRouter | Desktop: Use Ollama
4. Generate query embedding (OpenAI text-embedding-3-small)
5. Vector search in document_embeddings via Edge Function
6. Retrieve relevant context chunks
7. Build prompt with context + system instructions
8. Stream response from AI
9. Save messages to chat_messages table
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Main chat endpoint with RAG |
| `/api/training/upload` | POST | Upload training documents |
| `/api/training/process-manual` | POST | Manually trigger document processing |
| `/api/worker/process-jobs` | POST | Background job processor |
| `/api/debug/embeddings` | GET | Debug: check embeddings count |
| `/api/models` | GET/POST | Model CRUD operations |
| `/api/conversations` | GET/POST | Chat session management |

---

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `users` | User profiles |
| `models` | AI models/assistants created by users |
| `training_data` | Uploaded files metadata |
| `document_embeddings` | Vector embeddings for RAG |
| `chat_sessions` | Chat conversations |
| `chat_messages` | Individual messages |
| `job_queue` | Background job queue |

---

## Current Status

| Feature | Status |
|---------|--------|
| Landing Page | ✅ Working |
| Auth (Login/Signup) | ✅ Working |
| Dashboard | ✅ Working |
| Chat with AI (OpenRouter) | ✅ Working |
| Document Upload | ✅ Working |
| Manual Doc Processing | ✅ Working |
| RAG Retrieval | ✅ Working |
| Auto-Processing on Upload | ⚠️ Needs WORKER_API_KEY in Vercel |
| Desktop App (Tauri) | 🔧 Available but uses Ollama |

---

## Deployment

### Vercel
- **URL**: https://my-distinct-ai-psi.vercel.app/
- **Auto-deploy**: Triggered on push to `main` branch
- **Cron Job**: Worker runs daily at midnight (`vercel.json`)

### GitHub
- **Repo**: https://github.com/MyDistinctAi/MyDistinctAi
- **Latest Commits**:
  - `4fc0d66` - Fix RAG document processing
  - `30ce903` - Fix AI model detection
  - `27aba31` - Update logo and improve signup

---

## Next Steps

1. **Add Vercel Env Vars**: Set all required environment variables
2. **Test Production Chat**: Verify RAG works on production
3. **Improve Auto-Processing**: Consider using Vercel Cron for continuous processing
4. **Add Error Monitoring**: Integrate Sentry or similar
5. **Rate Limiting**: Implement proper rate limiting for API endpoints
