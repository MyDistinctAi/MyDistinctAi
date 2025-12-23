# Development Guide

Quick reference for developing MyDistinctAI.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run tauri:dev` | Start desktop app (dev) |
| `npm run tauri:build` | Build desktop installers |

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── (auth)/         # Auth pages (login, register)
│   ├── (dashboard)/    # Dashboard pages
│   ├── api/            # API routes
│   └── desktop-*/      # Desktop-specific pages
├── components/         # React components
│   ├── auth/           # Auth components
│   ├── dashboard/      # Dashboard components
│   ├── landing/        # Landing page components
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and services
│   ├── supabase/       # Supabase client
│   ├── openrouter/     # AI provider
│   └── rag/            # RAG implementation
└── types/              # TypeScript types
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

## Testing

```bash
# E2E tests
npm run test:e2e

# With UI
npm run test:e2e:ui
```

## Common Tasks

### Add new API route
Create file in `src/app/api/[route]/route.ts`

### Add new page
Create folder in `src/app/(dashboard)/[page]/page.tsx`

### Add new component
Create in `src/components/[category]/ComponentName.tsx`
