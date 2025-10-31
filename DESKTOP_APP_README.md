# MyDistinctAI Desktop App

The MyDistinctAI desktop application provides a fully offline, encrypted, and locally-hosted AI experience using Tauri and Ollama.

## Features

- **100% Offline**: All processing happens locally on your machine
- **AES-256-GCM Encryption**: Military-grade encryption for all stored data
- **Local AI with Ollama**: Uses Ollama mistral:7b model for inference
- **Local Storage**: All data stored locally with in-memory caching
- **No Cloud Dependencies**: Complete privacy and data sovereignty

## Prerequisites

### 1. Install Rust

Download and install Rust from [https://rustup.rs/](https://rustup.rs/)

**Windows:**
```bash
# Download and run rustup-init.exe from the website
# Or use winget:
winget install Rustlang.Rustup
```

**macOS/Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Verify installation:
```bash
rustc --version
cargo --version
```

### 2. Install Ollama

Download and install Ollama from [https://ollama.ai/](https://ollama.ai/)

**Windows:**
- Download the installer from the Ollama website
- Run the installer
- Ollama will start automatically

**macOS:**
```bash
brew install ollama
ollama serve
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve
```

### 3. Pull the Mistral Model

After installing Ollama, pull the mistral:7b model:

```bash
ollama pull mistral:7b
```

Verify the model is available:
```bash
ollama list
```

You should see `mistral:7b` in the list.

## Development

### Install Dependencies

```bash
npm install
```

### Run Development Mode

This will start both the Next.js dev server and the Tauri development window:

```bash
npm run tauri:dev
```

The desktop app will open in a native window. Any changes to the frontend will hot-reload automatically.

### Test Ollama Integration

You can test if Ollama is running and the model is available:

```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Test generation
curl http://localhost:11434/api/generate -d '{
  "model": "mistral:7b",
  "prompt": "Hello, how are you?",
  "stream": false
}'
```

## Building for Production

### Build for Windows

```bash
npm run tauri:build:windows
```

The installer will be created in `src-tauri/target/release/bundle/`

### Build for macOS

```bash
npm run tauri:build:mac
```

The `.app` and `.dmg` will be created in `src-tauri/target/release/bundle/`

### Build for Linux

```bash
npm run tauri:build:linux
```

The `.deb` and `.AppImage` will be created in `src-tauri/target/release/bundle/`

## Architecture

### Frontend (Next.js)

The desktop app uses the same Next.js frontend as the web app, but with a static export configuration. The frontend communicates with the Rust backend via the Tauri IPC bridge.

### Backend (Rust)

The Tauri backend provides the following services:

1. **Ollama Service** (`ollama.rs`)
   - Communicates with Ollama API (localhost:11434)
   - Handles model listing, pulling, and inference
   - Supports streaming responses

2. **Encryption Service** (`encryption.rs`)
   - AES-256-GCM encryption/decryption
   - Argon2 password hashing
   - Secure key derivation

3. **Local Storage** (`storage.rs`)
   - File-based key-value storage
   - In-memory caching for performance
   - Automatic directory creation

4. **Main App** (`main.rs`)
   - Tauri command handlers
   - Application state management
   - Window configuration

### TypeScript Adapter

The `src/lib/tauri/tauri-adapter.ts` file provides a unified API that works in both web and desktop modes:

```typescript
import { TauriAPI } from '@/lib/tauri/tauri-adapter'

// Check if running in Tauri
if (TauriAPI.isTauri) {
  // Use Ollama through Tauri
  const response = await TauriAPI.ollama.generate('mistral:7b', 'Hello!')

  // Save data locally
  await TauriAPI.storage.save('key', JSON.stringify(data))

  // Encrypt sensitive data
  const encrypted = await TauriAPI.encryption.encrypt(data, password)
}
```

## Data Storage

### Location

Desktop app data is stored in the following directories:

**Windows:**
```
C:\Users\<USERNAME>\AppData\Local\MyDistinctAI\
```

**macOS:**
```
~/Library/Application Support/MyDistinctAI/
```

**Linux:**
```
~/.local/share/MyDistinctAI/
```

### Structure

```
MyDistinctAI/
├── models/           # Model configurations
├── chat_history/     # Chat session data
├── training_data/    # Training files
└── user_data/        # User preferences and settings
```

All data is stored as JSON files with optional encryption.

## Security

### Encryption

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: Argon2 (memory-hard, resistant to brute-force)
- **Salt**: 16 bytes of cryptographically secure random data
- **Nonce**: 12 bytes of cryptographically secure random data per encryption

### Password Hashing

- **Algorithm**: Argon2id (default parameters)
- **Salt**: Automatically generated per password
- **Format**: PHC string format for storage

### Data Protection

- All sensitive data is encrypted at rest
- Encryption keys are derived from user passwords
- Keys are never stored in plaintext
- Memory is wiped after use

## Troubleshooting

### Ollama Connection Failed

**Issue**: Desktop app shows "Ollama not available" error

**Solution**:
1. Verify Ollama is running: `ollama list`
2. Check Ollama is listening on port 11434: `netstat -an | findstr 11434`
3. Restart Ollama service
4. Pull the mistral:7b model again: `ollama pull mistral:7b`

### Build Errors

**Issue**: Rust compilation errors during `tauri build`

**Solution**:
1. Update Rust: `rustup update`
2. Clean build cache: `cargo clean` in `src-tauri/` directory
3. Reinstall dependencies: `npm install`
4. Try building again

### Model Not Found

**Issue**: "Model mistral:7b not found" error

**Solution**:
```bash
# List available models
ollama list

# Pull mistral:7b
ollama pull mistral:7b

# Verify it's available
ollama list
```

### Permission Errors

**Issue**: Cannot write to data directory

**Solution**:
- On Windows: Run as administrator
- On macOS/Linux: Check directory permissions
- Manually create the data directory with correct permissions

## Performance

### System Requirements

**Minimum:**
- CPU: 4-core processor
- RAM: 8 GB
- Storage: 10 GB free space
- OS: Windows 10+, macOS 11+, or Linux (modern distro)

**Recommended:**
- CPU: 8-core processor
- RAM: 16 GB
- Storage: 20 GB free space (for models and data)
- OS: Windows 11, macOS 13+, or Linux

### Optimization Tips

1. **Model Selection**: mistral:7b is a good balance. For faster inference, try smaller models like `phi` or `tinyllama`.

2. **Memory Usage**: Close other applications when running large models.

3. **Storage**: Use SSD for better file I/O performance.

4. **GPU Acceleration**: Ollama automatically uses GPU if available (NVIDIA, AMD, or Apple Silicon).

## Development Tips

### Hot Reload

The desktop app supports hot reload for frontend changes. Simply save a file and the UI will update automatically.

### Debugging

Enable Rust debugging:
```bash
# Run with debug logs
RUST_LOG=debug npm run tauri:dev
```

Open DevTools in the Tauri window:
- Windows/Linux: `Ctrl+Shift+I`
- macOS: `Cmd+Option+I`

### Testing Tauri Commands

You can test Tauri commands directly from the browser console:

```javascript
// In DevTools console
const { invoke } = window.__TAURI__.core

// Check Ollama status
await invoke('check_ollama_status')

// List models
await invoke('list_ollama_models')

// Generate response
await invoke('generate_response', {
  model: 'mistral:7b',
  prompt: 'Hello!',
  context: null
})
```

## Roadmap

- [ ] LanceDB integration for RAG (Retrieval-Augmented Generation)
- [ ] Model fine-tuning support
- [ ] System tray integration
- [ ] Auto-update functionality
- [ ] Multi-model support
- [ ] Custom model training UI
- [ ] Export/import data
- [ ] Dark mode support
- [ ] Keyboard shortcuts

## Support

For issues, questions, or feature requests:
- GitHub Issues: [github.com/yourusername/mydistinctai/issues](https://github.com/yourusername/mydistinctai/issues)
- Documentation: See `CLAUDE.md` for complete development guide
- Email: support@mydistinctai.com

## License

MIT License - see LICENSE file for details
