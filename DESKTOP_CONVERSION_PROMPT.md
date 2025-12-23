# Convert Web App to Offline Desktop App - Implementation Prompt

## Objective
Convert the existing MyDistinctAI web application to a fully offline desktop application using keep using Tauri, maintaining **100% of the UI and functionality** while replacing all cloud dependencies with local alternatives.

## Critical Rules - DO's and DON'Ts

### ✅ DO's
1. **Preserve ALL existing UI components** - Copy, don't modify web app components
2. **Clone routes and pages** - Create desktop-specific versions (e.g., `/desktop/dashboard` mirrors `/dashboard`)
3. **Maintain exact same functionality** - Every feature in web app must work offline in desktop
4. **Use Tauri commands** for local storage instead of Supabase
5. **Use Ollama** for all AI inference (already configured)
6. **Keep web app intact** - Web app should continue working exactly as before
7. **Use LanceDB** for local vector storage (already integrated)
8. **Test both apps** - Ensure web app still works AND desktop app works offline

### ❌ DON'Ts
1. **DON'T modify existing web app code** - Create separate desktop routes/components
2. **DON'T remove Supabase** - Web app still needs it
3. **DON'T break existing API routes** - Add desktop detection, don't replace
4. **DON'T change UI/UX** - Desktop should look identical to web
5. **DON'T skip features** - If web has it, desktop must have it
6. **DON'T use external APIs** in desktop mode (except Ollama locally)

## Architecture Overview

### Current Web App Stack
- **Frontend**: Next.js 15 (App Router)
- **Auth**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **AI**: OpenRouter (cloud) + Ollama (local)
- **Vectors**: Supabase pgvector

### Target Desktop Stack
- **Frontend**: Same Next.js components (cloned)
- **Auth**: Local user storage (Tauri)
- **Database**: SQLite via Tauri
- **Storage**: Local filesystem (Tauri)
- **AI**: Ollama only (local)
- **Vectors**: LanceDB (already integrated)

## Implementation Strategy

### Phase 1: Local Data Layer
**Goal**: Create local alternatives for all Supabase operations

#### 1.1 Create Desktop Data Service
```typescript
// src/lib/desktop/data-service.ts
// Handles all local data operations via Tauri commands
```

**Features needed**:
- User profile storage (local JSON)
- Models CRUD (SQLite via Tauri)
- Training data storage (local files + SQLite metadata)
- Chat sessions (SQLite)
- File uploads (local filesystem)

#### 1.2 Extend Tauri Commands
```rust
// src-tauri/src/main.rs
// Add commands for:
```
- `save_model`, `load_models`, `delete_model`
- `save_training_data`, `load_training_data`
- `save_chat_session`, `load_chat_sessions`
- `save_file`, `load_file`, `delete_file`
- `init_local_db` (SQLite setup)

#### 1.3 Create Desktop Detection Utility
```typescript
// src/lib/desktop/utils.ts
export function isDesktopMode(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}
```

### Phase 2: Clone UI Components
**Goal**: Create desktop-specific versions of all pages

#### 2.1 Directory Structure
```
src/app/
├── (web)/                    # Existing web app (unchanged)
│   ├── dashboard/
│   ├── login/
│   └── ...
├── desktop/                  # New desktop app (cloned from web)
│   ├── dashboard/
│   │   ├── page.tsx         # Cloned from web, uses desktop data service
│   │   ├── models/
│   │   ├── data/
│   │   ├── chat/
│   │   └── settings/
│   ├── layout.tsx           # Desktop layout (no Supabase auth)
│   └── ...
```

#### 2.2 Cloning Process
For each web page:
1. **Copy** the entire component file
2. **Replace** Supabase calls with desktop data service calls
3. **Keep** all UI/styling exactly the same
4. **Test** that it renders identically

Example:
```typescript
// WEB: src/app/dashboard/models/page.tsx
const { data: models } = await supabase.from('models').select('*')

// DESKTOP: src/app/desktop/dashboard/models/page.tsx
const models = await getLocalModels() // Uses Tauri
```

### Phase 3: API Route Adaptation
**Goal**: Make API routes work for both web and desktop

#### 3.1 Add Desktop Detection to API Routes
```typescript
// src/app/api/models/route.ts
export async function GET(request: Request) {
  const isDesktop = request.headers.get('X-Desktop-Mode') === 'true'
  
  if (isDesktop) {
    // Use local data service
    const models = await getLocalModels()
    return Response.json(models)
  } else {
    // Use Supabase (existing code)
    const supabase = await createClient()
    const { data } = await supabase.from('models').select('*')
    return Response.json(data)
  }
}
```

#### 3.2 Desktop API Client
```typescript
// src/lib/desktop/api-client.ts
// Wrapper that adds desktop headers and handles local calls
export async function desktopFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'X-Desktop-Mode': 'true',
    },
  })
}
```

### Phase 4: Feature Parity Checklist

#### Authentication
- [x] Login (offline user storage) ✅ Already implemented
- [ ] Logout (clear local data)
- [ ] User profile management

#### Models
- [ ] Create model
- [ ] List models
- [ ] View model details
- [ ] Edit model
- [ ] Delete model
- [ ] Model training status

#### Training Data
- [ ] Upload files (PDF, DOCX, TXT)
- [ ] Process files (chunking, embeddings)
- [ ] List training data
- [ ] View document content
- [ ] Delete training data
- [ ] Embedding generation (Ollama)
- [ ] Vector storage (LanceDB)

#### Chat
- [ ] Create chat session
- [ ] Send messages
- [ ] Receive AI responses (Ollama)
- [ ] RAG context retrieval (LanceDB)
- [ ] Chat history
- [ ] Export chat

#### Settings
- [ ] User preferences
- [ ] Model configuration
- [ ] Ollama connection settings
- [ ] Data export/import

### Phase 5: Routing Strategy

#### 5.1 Desktop Startup Flow
```
App Launch
  ↓
/desktop-startup (splash screen)
  ↓
Check offline user
  ↓
Found? → /desktop/dashboard
Not found? → /desktop/login
```

#### 5.2 Navigation Updates
```typescript
// Desktop components should use desktop routes
<Link href="/desktop/dashboard/models">  // Desktop
<Link href="/dashboard/models">          // Web
```

## File-by-File Conversion Guide

### Example: Dashboard Page

#### Step 1: Copy Web Component
```bash
cp src/app/dashboard/page.tsx src/app/desktop/dashboard/page.tsx
```

#### Step 2: Mark as Client Component
```typescript
'use client'  // Add at top if server component
```

#### Step 3: Replace Data Fetching
```typescript
// BEFORE (Web - Server Component)
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: models } = await supabase.from('models').select('*')
  // ...
}

// AFTER (Desktop - Client Component)
'use client'
import { useEffect, useState } from 'react'
import { getLocalModels } from '@/lib/desktop/data-service'

export default function DesktopDashboardPage() {
  const [models, setModels] = useState([])
  
  useEffect(() => {
    async function loadData() {
      const data = await getLocalModels()
      setModels(data)
    }
    loadData()
  }, [])
  
  // Rest of UI code stays EXACTLY the same
}
```

#### Step 4: Update Links
```typescript
// Change all internal links to desktop routes
<Link href="/dashboard/models">        // Web
<Link href="/desktop/dashboard/models"> // Desktop
```

### Example: Models Page

```typescript
// src/app/desktop/dashboard/models/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { getLocalModels, deleteLocalModel } from '@/lib/desktop/data-service'
// Import SAME UI components as web version
import { ModelCard } from '@/components/models/ModelCard'
import { CreateModelButton } from '@/components/models/CreateModelButton'

export default function DesktopModelsPage() {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadModels()
  }, [])

  async function loadModels() {
    try {
      const data = await getLocalModels()
      setModels(data)
    } catch (error) {
      console.error('Failed to load models:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(modelId: string) {
    await deleteLocalModel(modelId)
    await loadModels() // Refresh
  }

  // UI code is IDENTICAL to web version
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Models</h1>
        <CreateModelButton onSuccess={loadModels} />
      </div>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map(model => (
            <ModelCard
              key={model.id}
              model={model}
              onDelete={() => handleDelete(model.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

## Data Service Implementation

### Core Desktop Data Service
```typescript
// src/lib/desktop/data-service.ts
import { invoke } from '@tauri-apps/api/core'

// Models
export async function getLocalModels() {
  return await invoke('get_models')
}

export async function saveLocalModel(model: Model) {
  return await invoke('save_model', { model })
}

export async function deleteLocalModel(modelId: string) {
  return await invoke('delete_model', { modelId })
}

// Training Data
export async function saveTrainingData(data: TrainingData) {
  return await invoke('save_training_data', { data })
}

export async function getTrainingData(modelId: string) {
  return await invoke('get_training_data', { modelId })
}

// File Operations
export async function saveFile(path: string, content: Uint8Array) {
  return await invoke('save_file', { path, content: Array.from(content) })
}

export async function loadFile(path: string): Promise<Uint8Array> {
  const data = await invoke<number[]>('load_file', { path })
  return new Uint8Array(data)
}

// Chat Sessions
export async function saveChatSession(session: ChatSession) {
  return await invoke('save_chat_session', { session })
}

export async function getChatSessions(modelId: string) {
  return await invoke('get_chat_sessions', { modelId })
}
```

## Testing Checklist

### Desktop App Tests
- [ ] Launch app offline
- [ ] Login works offline (after first online login)
- [ ] Create model offline
- [ ] Upload training data offline
- [ ] Process documents offline (embeddings via Ollama)
- [ ] Chat with model offline (RAG + Ollama)
- [ ] All UI elements render correctly
- [ ] Navigation works
- [ ] Data persists after app restart

### Web App Tests (Regression)
- [ ] Login still works
- [ ] All features unchanged
- [ ] Supabase integration intact
- [ ] No broken links
- [ ] No missing functionality

## Common Pitfalls to Avoid

1. **Server Components in Desktop**: Desktop routes must be client components
2. **Hardcoded Web Routes**: Update all links to desktop routes
3. **Missing Error Handling**: Tauri calls can fail, always try-catch
4. **Forgetting to Copy Styles**: Desktop should look identical
5. **Breaking Web App**: Always test web app after changes
6. **Incomplete Feature Parity**: Every web feature needs desktop equivalent

## Success Criteria

✅ Desktop app works 100% offline
✅ Web app continues working exactly as before
✅ Desktop UI is pixel-perfect match of web UI
✅ All features available in both versions
✅ Data persists locally in desktop
✅ No Supabase calls in desktop mode
✅ Ollama integration working for all AI features
✅ LanceDB storing vectors locally

## Next Steps

1. Start with Phase 1: Create desktop data service
2. Implement Tauri commands for data operations
3. Clone one page at a time (start with dashboard)
4. Test each page thoroughly before moving to next
5. Update navigation and routing
6. Final end-to-end testing

## Notes
- This is a **cloning** operation, not a migration
- Both apps should coexist
- Desktop app is a separate route tree under `/desktop`
- Shared components can be reused (they're UI only)
- Data layer is completely separate (Supabase vs Tauri)
