# MyDistinctAI

A privacy-first AI platform that runs locally on your machine, ensuring your data never leaves your control.

## Features

- **Local AI Processing**: Powered by Ollama and Mistral 7B
- **Privacy-First**: All AI processing happens locally
- **Secure Authentication**: Supabase Auth
- **Vector Storage**: LanceDB for efficient semantic search
- **Desktop Application**: Built with Tauri
- **Flexible Payments**: Stripe integration

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Deployment**: Vercel
- **Auth & Storage**: Supabase
- **AI**: Ollama + Mistral 7B (local)
- **Database**: Supabase PostgreSQL + LanceDB (vectors)
- **Payments**: Stripe
- **Desktop App**: Tauri

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Ollama installed locally ([Download here](https://ollama.ai))
- Supabase account ([Sign up](https://supabase.com))
- Stripe account (for payments)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env.local` and fill in your environment variables:

```bash
cp .env.example .env.local
```

4. Pull the Mistral 7B model with Ollama:

```bash
ollama pull mistral:7b
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Desktop App

To run the desktop application:

```bash
npm run tauri:dev
```

To build the desktop application:

```bash
npm run tauri:build
```

## Project Structure

```
MyDistinctAI/
├── src/
│   ├── app/                 # Next.js 14 App Router
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   └── features/       # Feature-specific components
│   ├── lib/                # Library configurations
│   │   ├── supabase/       # Supabase client
│   │   ├── ollama/         # Ollama integration
│   │   ├── lancedb/        # LanceDB setup
│   │   └── stripe/         # Stripe configuration
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Business logic and API calls
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── contexts/           # React contexts
├── src-tauri/              # Tauri desktop app source
├── public/                 # Static assets
├── tests/                  # Test files
├── config/                 # Configuration files
└── docs/                   # Documentation

```

## Documentation

- [Progress](./progress.md) - Development progress and status
- [Decisions](./decisions.md) - Architectural decisions and rationale
- [Tasks](./tasks.md) - Current and upcoming tasks

## License

MIT
