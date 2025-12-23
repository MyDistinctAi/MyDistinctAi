Issue Summary
The cloud-based web app (deployed on Vercel) is incorrectly trying to connect to Ollama (local AI at http://localhost:11434) instead of using OpenRouter API (cloud AI). This causes the error: "Ollama is not running. Please start Ollama service at http://localhost:11434"
The app should ONLY use OpenRouter for the web version, and Ollama ONLY for the Tauri desktop app.

Task Requirements
1. Add Comprehensive Console Logging
Add detailed logging to these files to trace the AI routing and RAG pipeline:
Files to modify:

src/app/api/chat/route.ts - Main chat endpoint
src/lib/rag-service.ts - RAG orchestration
src/lib/openrouter/client.ts - OpenRouter API calls
src/lib/embeddings.ts - Embedding generation
src/lib/vector-store.ts - Vector similarity search

Logging requirements:
javascript// At the START of each function/endpoint
console.log('[COMPONENT_NAME] Starting with:', { 
  param1, 
  param2,
  environment: process.env.NODE_ENV,
  timestamp: new Date().toISOString()
});

// Before AI model selection
console.log('[CHAT] AI Model Selection:', {
  isTauriBuild: IS_TAURI_BUILD,
  desktopHeader: req.headers.get('x-desktop-app'),
  selectedProvider: 'openrouter' | 'ollama',
  apiKeyPresent: !!process.env.OPENROUTER_API_KEY
});

// Before RAG retrieval
console.log('[RAG] Vector Search:', {
  query: message,
  modelId: modelId,
  contextLimit: limit
});

// After RAG retrieval
console.log('[RAG] Retrieved Documents:', {
  count: documents.length,
  hasContext: documents.length > 0,
  topMatch: documents[0]?.similarity || 'none'
});

// Before API calls
console.log('[OPENROUTER] Sending request:', {
  model: 'deepseek/deepseek-chat',
  messageCount: messages.length,
  hasContext: !!contextText
});

// On errors
console.error('[COMPONENT_NAME] Error:', {
  error: error.message,
  stack: error.stack,
  context: { relevantData }
});
2. Fix Ollama Detection Logic
The current platform detection in src/app/api/chat/route.ts needs to be bulletproof:
javascript// CURRENT (possibly buggy)
const IS_TAURI_BUILD = process.env.NEXT_PUBLIC_IS_TAURI === 'true';
const isDesktopApp = req.headers.get('x-desktop-app') === 'true' || IS_TAURI_BUILD;

// SHOULD BE (explicit web enforcement)
const IS_TAURI_BUILD = process.env.NEXT_PUBLIC_IS_TAURI === 'true';
const isDesktopRequest = req.headers.get('x-desktop-app') === 'true';
const isWebApp = !IS_TAURI_BUILD && !isDesktopRequest;

// Force OpenRouter for web
if (isWebApp) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is required for web app');
  }
  // Use OpenRouter client
  console.log('[CHAT] Using OpenRouter (cloud AI)');
  aiClient = openRouterClient;
} else {
  // Use Ollama for desktop only
  console.log('[CHAT] Using Ollama (local AI)');
  aiClient = ollamaClient;
}
3. Add Environment Variable Validation
At the top of /api/chat/route.ts, add startup validation:
javascript// Validate required env vars on startup
const REQUIRED_ENV_VARS = {
  web: ['OPENROUTER_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL'],
  desktop: ['NEXT_PUBLIC_IS_TAURI']
};

function validateEnvironment() {
  const missing = [];
  
  if (!IS_TAURI_BUILD) {
    // Web app requirements
    if (!process.env.OPENROUTER_API_KEY) missing.push('OPENROUTER_API_KEY');
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  
  if (missing.length > 0) {
    console.error('[ENV] Missing required variables:', missing);
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  console.log('[ENV] Environment validated successfully');
}

DO's ✅
Code Changes

DO add console.log at EVERY major step (model selection, RAG retrieval, API calls)
DO explicitly check isWebApp and force OpenRouter when true
DO validate environment variables at runtime
DO log the full error stack when exceptions occur
DO include timestamps in all logs for debugging
DO log whether context was found and used in RAG

Testing

DO test on production URL immediately after deployment
DO check Vercel logs to see console output
DO verify OpenRouter API key is set in Vercel dashboard
DO test with a document uploaded and processed
DO test chat without documents to verify basic functionality

Deployment

DO commit changes with clear message: "Add debug logging + fix Ollama routing"
DO push to main branch to trigger Vercel auto-deploy
DO wait for build to complete before testing
DO keep backup of working code before major changes


DON'Ts ❌
Code Changes

DON'T remove existing error handling
DON'T change the RAG pipeline logic (chunking, embeddings)
DON'T modify database schema or migrations
DON'T change authentication flows
DON'T alter file upload/storage logic
DON'T remove the desktop app functionality (keep Ollama code)
DON'T change API endpoint routes or parameters
DON'T modify Supabase client initialization

Environment

DON'T hardcode API keys in the code
DON'T commit .env.local to GitHub
DON'T remove environment variables from Vercel
DON'T change NEXT_PUBLIC_SUPABASE_URL

Testing

DON'T test only on localhost - always verify production
DON'T skip checking Vercel deployment logs
DON'T assume it works without seeing successful RAG retrieval in logs

