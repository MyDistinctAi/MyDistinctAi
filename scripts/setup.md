# Setup Instructions for MyDistinctAI

## Prerequisites

### 1. Install Node.js
Download and install Node.js 18 or higher from [nodejs.org](https://nodejs.org/)

### 2. Install Ollama
Download from [ollama.ai](https://ollama.ai) and install.

After installation, pull the Mistral model:
```bash
ollama pull mistral:7b
```

Verify it's running:
```bash
ollama list
```

### 3. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready
4. Go to Settings > API to get your keys

### 4. Create Stripe Account (Optional for development)
1. Go to [stripe.com](https://stripe.com)
2. Create an account
3. Get test API keys from the dashboard

---

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your actual values
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (keep secret!)
- `OLLAMA_BASE_URL`: Usually `http://localhost:11434`
- `STRIPE_SECRET_KEY`: Your Stripe secret key (optional for dev)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key (optional)

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verify Installation

### Check Ollama
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "mistral:7b",
  "prompt": "Hello, world!"
}'
```

### Check Next.js
Visit http://localhost:3000 - you should see the MyDistinctAI landing page.

---

## Troubleshooting

### Ollama not responding
- Make sure Ollama is running: `ollama serve`
- Check if the model is pulled: `ollama list`
- Verify the port: `curl http://localhost:11434/`

### Module not found errors
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf .next`

### Supabase connection issues
- Verify your Supabase URL and keys in `.env.local`
- Check if your Supabase project is active
- Make sure you're using the correct keys (anon key vs service role)

---

## Next Steps

After setup is complete:
1. Review the [progress.md](../progress.md) file for current status
2. Check [decisions.md](../decisions.md) for architectural decisions
3. Start building features according to the roadmap
4. See [README.md](../README.md) for development guidelines
