#!/usr/bin/env node

/**
 * Desktop App Server Startup Script
 * 
 * This script is bundled with the desktop app and starts the Next.js server
 * when the app launches. It runs in the background and serves the web app
 * on localhost:4000.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const PORT = 4000;
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000;

console.log('🚀 Starting MyDistinctAI server...\n');

// Determine the correct paths based on environment
const isDev = process.env.NODE_ENV === 'development';
const appRoot = isDev 
  ? path.join(__dirname, '..')
  : path.join(process.resourcesPath, 'app');

console.log(`📁 App root: ${appRoot}`);
console.log(`🔧 Environment: ${isDev ? 'development' : 'production'}\n`);

// Check if server is already running
function checkServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}`, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Wait for server to be ready
async function waitForServer() {
  console.log(`⏳ Waiting for server on http://localhost:${PORT}...`);
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    const isRunning = await checkServerRunning();
    
    if (isRunning) {
      console.log(`✅ Server is ready!\n`);
      return true;
    }
    
    process.stdout.write('.');
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  }
  
  console.error(`\n❌ Server failed to start after ${MAX_RETRIES} seconds`);
  return false;
}

// Start the Next.js server
async function startServer() {
  // Check if already running
  const alreadyRunning = await checkServerRunning();
  if (alreadyRunning) {
    console.log('✅ Server is already running!\n');
    return true;
  }

  console.log('📦 Starting Next.js server...\n');

  const serverProcess = spawn(
    'npm',
    ['run', 'dev'],
    {
      cwd: appRoot,
      stdio: 'inherit',
      shell: true,
      detached: false,
      env: {
        ...process.env,
        PORT: PORT.toString(),
        NODE_ENV: 'production'
      }
    }
  );

  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Server exited with code ${code}`);
    }
  });

  // Wait for server to be ready
  const isReady = await waitForServer();
  
  if (!isReady) {
    console.error('❌ Server startup failed');
    process.exit(1);
  }

  return true;
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});

// Main execution
(async () => {
  try {
    const success = await startServer();
    
    if (success) {
      console.log('🎉 MyDistinctAI is ready!');
      console.log(`🌐 Open http://localhost:${PORT} in your browser\n`);
      
      // Keep the process alive
      setInterval(() => {}, 1000);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Startup error:', error);
    process.exit(1);
  }
})();
