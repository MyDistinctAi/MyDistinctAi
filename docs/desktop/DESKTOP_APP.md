# MyDistinctAI Desktop Application

**Platform**: Windows, macOS, Linux  
**Framework**: Tauri 2.1.0 + Rust  
**Status**: ✅ Build Complete (November 19, 2025)

---

## Overview

The MyDistinctAI Desktop App is a privacy-first AI application that runs completely offline. It uses Tauri (Rust backend) with the same Next.js frontend as the web app, enabling full feature parity while keeping sensitive data local.

### Key Features

- **100% Offline AI** - All AI processing via local Ollama models
- **AES-256-GCM Encryption** - All data encrypted at rest
- **Local Vector Storage** - LanceDB for fast semantic search
- **File Processing** - PDF, DOCX, TXT support with chunking
- **Cloud Sync** - Optional Supabase sync for backup

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  MyDistinctAI Desktop                    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐     ┌─────────────────┐           │
│  │   Tauri Window  │     │  Next.js Server │           │
│  │   (WebView)     │────▶│  (localhost:4000)│           │
│  └─────────────────┘     └─────────────────┘           │
│           │                                              │
│           ▼                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Rust Backend (Tauri)                │   │
│  ├─────────────┬──────────────┬───────────────────┤   │
│  │   Ollama    │   LanceDB    │    Encryption     │   │
│  │  (AI Chat)  │  (Vectors)   │   (AES-256-GCM)   │   │
│  └─────────────┴──────────────┴───────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Window | Tauri 2.1.0 | Native desktop container |
| Backend | Rust | High-performance processing |
| Frontend | Next.js 15 | React-based UI |
| AI | Ollama | Local LLM inference |
| Vectors | LanceDB 0.9 | Embedding storage |
| Encryption | AES-256-GCM | Data security |

---

## Installation

### Prerequisites

1. **Rust** (1.80+)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Ollama** (for local AI)
   ```bash
   # Windows: Download from https://ollama.ai
   # macOS: brew install ollama
   # Linux: curl -fsSL https://ollama.ai/install.sh | sh
   ```

3. **Node.js** (18+)
   ```bash
   # Install via nvm or directly from nodejs.org
   ```

### Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/mydistinctai.git
cd mydistinctai

# Install dependencies
npm install

# Start development mode
npm run tauri:dev
```

### Production Build

```bash
# Build for current platform
npm run tauri:build

# Platform-specific builds
npm run tauri:build:windows  # Windows MSI + NSIS
npm run tauri:build:mac      # macOS DMG
npm run tauri:build:linux    # Linux AppImage + DEB
```

### Build Output

After building, installers are located in:
```
src-tauri/target/release/bundle/
├── msi/               # Windows MSI installer
│   └── MyDistinctAI_0.1.0_x64_en-US.msi
├── nsis/              # Windows NSIS installer
│   └── MyDistinctAI_0.1.0_x64-setup.exe
├── dmg/               # macOS DMG (if built on macOS)
└── appimage/          # Linux AppImage (if built on Linux)
```

---

## Rust Backend Modules

The desktop app includes 2,366 lines of Rust code across these modules:

### 1. Ollama Integration (`src-tauri/src/ollama.rs`)
**Lines**: 304

```rust
// Available Tauri Commands
check_ollama_status()     // Check if Ollama is running
list_ollama_models()      // List installed models
generate_embeddings()     // Generate text embeddings
generate_chat()          // Stream chat responses
install_model()          // Download new model
```

**Supported Models**:
- `mistral:7b` - General purpose
- `llama2:7b` / `llama2:13b` - Meta's Llama 2
- `phi-2` - Microsoft's compact model
- `codellama:7b` - Code generation
- `nomic-embed-text` - Embeddings

### 2. LanceDB Integration (`src-tauri/src/lancedb.rs`)
**Lines**: 505

```rust
// Available Tauri Commands
init_lancedb()           // Initialize database
store_embeddings()       // Store document embeddings
search_similar()         // Semantic similarity search
delete_model_embeddings() // Clean up embeddings
```

**Features**:
- Arrow 52.2 compatible
- 768-dimensional vectors
- Cosine similarity search
- Automatic table creation

### 3. Encryption Service (`src-tauri/src/encryption.rs`)
**Lines**: 183

```rust
// Available Tauri Commands
encrypt_text()           // AES-256-GCM encrypt
decrypt_text()           // AES-256-GCM decrypt
generate_key()           // Generate encryption key
save_credentials()       // Store encrypted credentials
load_credentials()       // Retrieve credentials
```

**Security**:
- AES-256-GCM encryption
- PBKDF2 key derivation
- OS keychain integration
- Zero plaintext storage

### 4. File Processing (`src-tauri/src/file_processor.rs`)
**Lines**: 289

```rust
// Available Tauri Commands
process_file()           // Extract text from files
chunk_text()             // Split into chunks
read_pdf()               // PDF extraction
read_docx()              // Word document extraction
read_txt()               // Plain text reading
```

**Supported Formats**:
- PDF (via pdf-extract)
- DOCX (via docx crate)
- TXT, MD, CSV (direct read)

---

## Desktop-Specific Pages

### `/desktop-startup` - Splash Screen
Animated loading screen with 4 status steps:
1. Starting application
2. Connecting to AI
3. Setting up workspace
4. Ready

Auto-redirects to `/login` after 10 seconds.

### `/desktop-settings` - Desktop Settings
Configuration panel with:
- **Ollama Config**: Server URL, status check
- **General**: Auto-update, start on boot
- **Security**: Encryption toggle, privacy settings
- **Advanced**: Chunk size, overlap configuration

### `/desktop-app` - Navigation Hub
Central hub linking to:
- Desktop Chat
- File Upload
- Model Management
- Settings

---

## Configuration Files

### `src-tauri/tauri.conf.json`

```json
{
  "productName": "MyDistinctAI",
  "version": "0.1.0",
  "identifier": "com.mydistinctai.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "",
    "devUrl": "http://localhost:4000"
  },
  "app": {
    "windows": [{
      "title": "MyDistinctAI",
      "width": 1200,
      "height": 800,
      "resizable": true,
      "url": "http://localhost:4000/desktop-startup"
    }]
  }
}
```

### `src-tauri/Cargo.toml` (Key Dependencies)

```toml
[dependencies]
tauri = { version = "2.1", features = ["shell-open"] }
lancedb = "0.9"
arrow = "52.2"
ollama-rs = "0.2"
aes-gcm = "0.10"
pdf-extract = "0.7"
docx = "1.1"
```

---

## Server-Based Architecture

The desktop app uses a **server-based architecture** rather than static export:

### Why Server-Based?
- Next.js app has 30+ API routes
- Static export doesn't support API routes
- Would require rewriting all API logic as Tauri commands

### How It Works
1. Desktop app launches
2. Bundled `scripts/start-server.js` starts Next.js dev server
3. Server runs on localhost:4000
4. Tauri window loads from local server
5. All API routes work normally

### Trade-offs
| Aspect | Server-Based | Static Export |
|--------|-------------|---------------|
| API Routes | ✅ All work | ❌ Not supported |
| Bundle Size | ~105 MB | ~50 MB |
| Startup Time | 3-5 seconds | Instant |
| Refactoring | None needed | Weeks of work |

---

## Troubleshooting

### "Starting server..." hangs
- **Cause**: Next.js server not starting
- **Fix**: Ensure Node.js is installed and accessible

### Ollama not connecting
- **Cause**: Ollama service not running
- **Fix**: Start Ollama: `ollama serve`

### Build errors with Arrow/LanceDB
- **Cause**: Version mismatch
- **Fix**: Use Arrow 52.2, not 53.x (see Cargo.toml)

### CMD window appearing (Windows)
- **Cause**: Debug build
- **Fix**: Build in release mode: `npm run tauri:build`

---

## Testing

### Manual Testing Checklist

- [ ] App launches without errors
- [ ] Splash screen displays 4 steps
- [ ] Redirects to login after 10 seconds
- [ ] Login saves session (desktop persistence)
- [ ] Chat works with Ollama models
- [ ] File upload processes documents
- [ ] Settings page saves preferences
- [ ] Desktop settings shows Ollama status

### Automated Tests

```bash
# Run Ollama integration tests
node test-desktop-ollama.mjs

# Run full desktop test suite
npm run test:desktop
```

---

## Build History

| Date | Version | Status | Notes |
|------|---------|--------|-------|
| Nov 19, 2025 | 0.1.0 | ✅ Success | Server-based architecture |
| Nov 17, 2025 | 0.0.9 | ✅ Success | Arrow/LanceDB fixes |
| Nov 15, 2025 | 0.0.8 | ❌ Failed | Arrow version conflict |

---

## Future Improvements

- [ ] Auto-update system (Tauri updater)
- [ ] Code signing certificates
- [ ] System tray integration
- [ ] Native notifications
- [ ] Ollama installation wizard
- [ ] Custom app icons

---

## Resources

- [Tauri Documentation](https://tauri.app/)
- [Ollama Documentation](https://ollama.ai/)
- [LanceDB Documentation](https://lancedb.com/)
- [Next.js Documentation](https://nextjs.org/)
