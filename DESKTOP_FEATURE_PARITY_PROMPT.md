# Desktop Feature Parity Implementation Prompt

## Objective

Add all missing web app features to the desktop app to achieve **100% UI/functionality parity**. The desktop app should look and feel identical to the web app while maintaining offline capability.

---

## 🛡️ CRITICAL RULES - DO NOT VIOLATE

### ❌ DO NOT TOUCH (These are working and sensitive)
1. **RAG System** - `src/lib/desktop/chat-service.ts` embedding/retrieval logic
2. **LanceDB Storage** - `src-tauri/src/lancedb.rs` - recently fixed, working
3. **Ollama Generate** - `src-tauri/src/ollama.rs` generate/embeddings functions
4. **Database CRUD** - `src-tauri/src/database.rs` - all working
5. **File Processing** - `src-tauri/src/file_processor.rs`
6. **Existing Chat Page** - `src/app/desktop/dashboard/chat/page.tsx` - RAG integration working
7. **Existing Data Page** - `src/app/desktop/dashboard/data/page.tsx` - file upload working

### ✅ SAFE TO MODIFY
1. Navigation/Sidebar components
2. New pages (Analytics, Documentation)
3. Visual styling and UX enhancements
4. Favicon and app icons
5. Loading states and animations
6. Error handling UI

---

## Phase 1: Logo & Favicon Updates

### 1.1 Update Desktop App Icon
**Location:** `src-tauri/icons/`

Current icons are default Tauri icons. Replace with MyDistinctAI logo:
- Generate all required sizes from `public/images/logo.jpg`:
  - `32x32.png`, `128x128.png`, `128x128@2x.png`
  - `icon.icns` (macOS)
  - `icon.ico` (Windows)
  - `icon.png` (Linux)
  - `Square30x30Logo.png`, `Square44x44Logo.png`, etc. (Windows Store)

**Tool:** Use a tool like `tauri-icon` or manually generate:
```bash
npm install -g @aspect-dev/tauri-icon
tauri-icon public/images/logo.jpg
```

### 1.2 Update Web Favicon
**Location:** Create `src/app/favicon.ico` from `public/images/logo.jpg`

---

## Phase 2: Missing Desktop Pages

### 2.1 Analytics Page
**Create:** `src/app/desktop/dashboard/analytics/page.tsx`

**Reference:** `src/app/dashboard/analytics/page.tsx` (237 lines)

**Key Features to Clone (with LOCAL data):**
- Stats Cards (Total Models, Sessions, Messages, Response Time)
- Usage Overview (Messages sent, Storage used progress bars)
- Performance Metrics (Avg/P95/P99 response time, Error rate)
- Training Data Info (File count, processed count, size)
- Message Activity Chart placeholder

**Data Sources (use LOCAL SQLite, NOT Supabase):**
```typescript
// Use desktop services - DO NOT use Supabase
import { listModels } from '@/lib/desktop/models-service'
import { listChatSessions, getChatMessages } from '@/lib/desktop/chat-service'
import { listTrainingData } from '@/lib/desktop/training-data-service'
```

**Important Changes:**
- Replace `createClient()` Supabase calls with Tauri `invoke()` calls
- Calculate all metrics from local SQLite data
- Add "Offline" badge/indicator
- Remove Export CSV (or implement local export)

---

### 2.2 Documentation Page
**Create:** `src/app/desktop/dashboard/docs/page.tsx`

**Reference:** `src/app/dashboard/docs/page.tsx` (879 lines)

**Key Features to Clone:**
- Sidebar navigation with doc sections
- Search functionality
- Collapsible sections with icons:
  1. Getting Started (Book icon)
  2. Features Guide (Settings icon)
  3. API Documentation (Code icon) - Update for desktop/offline context
  4. Self-Hosting Guide (Server icon) - Keep as-is
  5. FAQs (MessageSquare icon)
- Code block with copy functionality
- Markdown rendering (headings, lists, tables)
- Helpful/Not helpful feedback buttons

**Desktop-Specific Changes:**
- Update API docs section to explain local Ollama API
- Add "Desktop Mode" section explaining offline features
- Remove cloud-specific billing/plan information
- Add troubleshooting for Ollama/LanceDB issues

---

## Phase 3: Navigation Updates

### 3.1 Update Desktop Sidebar
**File:** `src/components/desktop/DesktopSidebar.tsx`

**Current Navigation (5 items):**
```typescript
const navigation = [
    { name: 'Dashboard', href: '/desktop/dashboard', icon: Home },
    { name: 'My Models', href: '/desktop/dashboard/models', icon: Brain },
    { name: 'Training Data', href: '/desktop/dashboard/data', icon: Database },
    { name: 'Chat', href: '/desktop/dashboard/chat', icon: MessageSquare },
    { name: 'Settings', href: '/desktop/dashboard/settings', icon: Settings },
]
```

**Updated Navigation (7 items - match web):**
```typescript
import { BarChart3, BookOpen } from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/desktop/dashboard', icon: Home },
    { name: 'Analytics', href: '/desktop/dashboard/analytics', icon: BarChart3 },
    { name: 'My Models', href: '/desktop/dashboard/models', icon: Brain },
    { name: 'Chat', href: '/desktop/dashboard/chat', icon: MessageSquare },
    { name: 'Training Data', href: '/desktop/dashboard/data', icon: Database },
    { name: 'Settings', href: '/desktop/dashboard/settings', icon: Settings },
    { name: 'Documentation', href: '/desktop/dashboard/docs', icon: BookOpen },
]
```

---

## Phase 4: UX Enhancements

### 4.1 Loading States
Add consistent loading states across all pages:
- Skeleton loaders for data grids
- Spinner for async operations
- Progress bars for file processing

**Component:** Create `src/components/desktop/LoadingStates.tsx`
```typescript
export function TableSkeleton({ rows = 5 }: { rows?: number })
export function CardSkeleton()
export function PageLoader()
```

### 4.2 Error Handling
Create user-friendly error displays:
- Toast notifications for errors
- Retry buttons for failed operations
- Clear error messages

**Component:** Create `src/components/desktop/ErrorDisplay.tsx`

### 4.3 Empty States
Add helpful empty states when no data exists:
- "No models yet" with Create button
- "No training data" with Upload button
- "No chat sessions" with New Chat button

### 4.4 Enhanced Dashboard Stats
**File:** `src/app/desktop/dashboard/page.tsx`

Add more visual appeal:
- Animated stat cards
- Trend indicators (↑ ↓)
- Quick action buttons
- Recent activity feed

### 4.5 Settings Page Enhancement
**File:** `src/app/desktop/dashboard/settings/page.tsx`

Add missing sections from web:
- Ollama model management (list installed, pull new)
- Storage statistics (SQLite size, LanceDB size)
- Clear data options
- About section with version info

---

## Phase 5: Visual Consistency

### 5.1 Color Scheme
Ensure desktop matches web color scheme:
- Primary: Blue (#3B82F6)
- Sidebar: Dark gray (#1F2937)
- Background: Light gray (#F9FAFB)
- Accent colors for stats

### 5.2 Typography
Use consistent font sizing:
- Headings: text-3xl font-bold
- Subheadings: text-xl font-semibold
- Body: text-sm
- Labels: text-xs uppercase

### 5.3 Spacing
Maintain consistent spacing:
- Card padding: p-6
- Grid gaps: gap-6
- Section margins: space-y-6

---

## Implementation Order

1. **Phase 1:** Logo/Favicon (quick wins, visual impact)
2. **Phase 3:** Navigation (enables new pages)
3. **Phase 2.1:** Analytics page (high value feature)
4. **Phase 2.2:** Documentation page (user help)
5. **Phase 4:** UX enhancements (polish)
6. **Phase 5:** Visual consistency (final touches)

---

## Testing Checklist

After implementation, verify:
- [ ] App icon shows correctly in taskbar/dock
- [ ] Favicon shows in browser tab (dev mode)
- [ ] All 7 nav items visible and clickable
- [ ] Analytics page loads data from local DB
- [ ] Analytics shows accurate stats
- [ ] Documentation page renders correctly
- [ ] Doc search filters sections
- [ ] Code copy buttons work
- [ ] Loading states appear during data fetch
- [ ] Empty states show when no data
- [ ] No Supabase errors in console
- [ ] Web app still works without changes (regression)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/desktop/dashboard/analytics/page.tsx` | Analytics dashboard |
| `src/app/desktop/dashboard/docs/page.tsx` | Documentation viewer |
| `src/components/desktop/LoadingStates.tsx` | Shared loading components |
| `src/components/desktop/ErrorDisplay.tsx` | Error handling components |
| `src/components/desktop/EmptyState.tsx` | Empty state components |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/desktop/DesktopSidebar.tsx` | Add Analytics + Docs nav items |
| `src/app/desktop/dashboard/page.tsx` | Enhanced stats + quick actions |
| `src/app/desktop/dashboard/settings/page.tsx` | Add Ollama management |
| `src-tauri/icons/*` | Replace with app logo |
| `src/app/favicon.ico` | Update favicon |

---

## Notes

- All new pages must be `'use client'` components
- All data must come from Tauri `invoke()` calls, NOT Supabase
- Test offline functionality after each change
- Keep code modular and reusable
- Follow existing code patterns and naming conventions
