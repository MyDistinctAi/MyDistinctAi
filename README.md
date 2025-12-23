# MyDistinctAI

**Privacy-first AI platform for building custom GPT models trained on your own data.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/mydistinctai)

---

## ✨ Features

- **🔒 Privacy-First** - All data processing can happen locally via Ollama
- **🎨 White-Label** - Full branding customization for each user/domain
- **📄 Multi-Format Support** - Train on PDF, DOCX, TXT, MD, CSV files
- **💬 Real-time Chat** - Streaming AI responses with RAG context
- **🖥️ Desktop App** - Fully offline desktop client (Windows, macOS, Linux)
- **🔐 Encryption** - AES-256-GCM encryption for sensitive data
- **☁️ Cloud Sync** - Optional Supabase sync for backup

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)
- OpenRouter API key (for cloud AI)
- Ollama (optional, for local AI)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mydistinctai.git
cd mydistinctai

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔧 Configuration

Create `.env.local` with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# OpenRouter (AI)
OPENROUTER_API_KEY=your-openrouter-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

See `.env.example` for all available options.

---

## 📁 Project Structure

```
mydistinctai/
├── docs/               # Documentation
│   ├── guides/         # Deployment, development guides
│   ├── architecture/   # System architecture docs
│   └── desktop/        # Desktop app documentation
├── public/             # Static assets
├── scripts/            # Build and migration scripts
├── src/                # Source code
│   ├── app/            # Next.js pages and API routes
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and services
│   └── types/          # TypeScript definitions
├── src-tauri/          # Desktop app (Rust/Tauri)
├── supabase/           # Database migrations
└── tests/              # Test files
```

---

## 🖥️ Desktop App

Build native desktop installers:

```bash
# Build for current platform
npm run tauri:build

# Platform-specific
npm run tauri:build:windows
npm run tauri:build:mac
npm run tauri:build:linux
```

See [Desktop Documentation](docs/desktop/DESKTOP_APP.md) for details.

---

## 📖 Documentation

- [Deployment Guide](docs/guides/DEPLOYMENT.md)
- [Development Guide](docs/guides/DEVELOPMENT.md)
- [RAG System](docs/architecture/RAG_SYSTEM.md)
- [API Reference](docs/architecture/API_REFERENCE.md)
- [Desktop App](docs/desktop/DESKTOP_APP.md)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 18, Tailwind CSS |
| Backend | Next.js API Routes, Supabase |
| Database | PostgreSQL (Supabase), pgvector |
| AI | OpenRouter (cloud), Ollama (local) |
| Desktop | Tauri 2.1, Rust, LanceDB |
| Auth | Supabase Auth |

---

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run tauri:dev` | Desktop app (development) |
| `npm run tauri:build` | Build desktop installers |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tauri](https://tauri.app/)
- [Ollama](https://ollama.ai/)
- [OpenRouter](https://openrouter.ai/)
