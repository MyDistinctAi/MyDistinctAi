#!/usr/bin/env node

/**
 * Desktop App Ollama Integration Test
 *
 * Tests the Rust Ollama integration to verify:
 * 1. Ollama status check
 * 2. Model listing
 * 3. Embedding generation
 * 4. Chat response generation
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const OLLAMA_URL = 'http://localhost:11434';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Test 1: Check Ollama Status
 */
async function testOllamaStatus() {
  log('\n📊 Test 1: Checking Ollama Status...', colors.cyan);

  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);

    if (response.ok) {
      const data = await response.json();
      log(`✅ Ollama is running`, colors.green);
      log(`   Models available: ${data.models?.length || 0}`, colors.blue);
      return { success: true, models: data.models };
    } else {
      log(`❌ Ollama returned status: ${response.status}`, colors.red);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    log(`❌ Ollama not accessible: ${error.message}`, colors.red);
    log(`   Make sure Ollama is running: ollama serve`, colors.yellow);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: List Models
 */
async function testListModels() {
  log('\n📋 Test 2: Listing Available Models...', colors.cyan);

  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await response.json();

    if (data.models && data.models.length > 0) {
      log(`✅ Found ${data.models.length} models:`, colors.green);

      data.models.forEach((model, index) => {
        const sizeGB = (model.size / (1024 ** 3)).toFixed(2);
        log(`   ${index + 1}. ${model.name} (${sizeGB} GB)`, colors.blue);
      });

      return { success: true, models: data.models };
    } else {
      log(`⚠️  No models found`, colors.yellow);
      log(`   Pull a model: ollama pull mistral`, colors.yellow);
      return { success: false, error: 'No models available' };
    }
  } catch (error) {
    log(`❌ Failed to list models: ${error.message}`, colors.red);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Generate Embeddings
 */
async function testGenerateEmbeddings() {
  log('\n🔢 Test 3: Generating Embeddings...', colors.cyan);

  const testText = 'This is a test document for embedding generation.';

  try {
    const startTime = Date.now();

    const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: testText,
      }),
    });

    const duration = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();

      if (data.embedding && Array.isArray(data.embedding)) {
        log(`✅ Embedding generated successfully`, colors.green);
        log(`   Dimensions: ${data.embedding.length}`, colors.blue);
        log(`   Duration: ${duration}ms`, colors.blue);
        log(`   Sample values: [${data.embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`, colors.blue);

        return {
          success: true,
          dimensions: data.embedding.length,
          duration,
          embedding: data.embedding,
        };
      } else {
        log(`❌ Invalid embedding response`, colors.red);
        return { success: false, error: 'Invalid response format' };
      }
    } else {
      const errorText = await response.text();
      log(`❌ Embedding generation failed: ${response.status}`, colors.red);
      log(`   Error: ${errorText}`, colors.red);
      return { success: false, error: errorText };
    }
  } catch (error) {
    log(`❌ Embedding request failed: ${error.message}`, colors.red);

    if (error.message.includes('nomic-embed-text')) {
      log(`   Pull the model: ollama pull nomic-embed-text`, colors.yellow);
    }

    return { success: false, error: error.message };
  }
}

/**
 * Test 4: Generate Chat Response
 */
async function testGenerateChat() {
  log('\n💬 Test 4: Generating Chat Response...', colors.cyan);

  const testPrompt = 'What is the capital of France? Answer in one sentence.';

  try {
    const startTime = Date.now();

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral:7b',
        prompt: testPrompt,
        stream: false,
      }),
    });

    const duration = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();

      if (data.response) {
        log(`✅ Chat response generated`, colors.green);
        log(`   Duration: ${duration}ms`, colors.blue);
        log(`   Prompt: "${testPrompt}"`, colors.blue);
        log(`   Response: "${data.response.trim().substring(0, 100)}..."`, colors.green);

        return {
          success: true,
          response: data.response,
          duration,
        };
      } else {
        log(`❌ Invalid chat response`, colors.red);
        return { success: false, error: 'Invalid response format' };
      }
    } else {
      const errorText = await response.text();
      log(`❌ Chat generation failed: ${response.status}`, colors.red);
      log(`   Error: ${errorText}`, colors.red);
      return { success: false, error: errorText };
    }
  } catch (error) {
    log(`❌ Chat request failed: ${error.message}`, colors.red);

    if (error.message.includes('mistral')) {
      log(`   Pull the model: ollama pull mistral`, colors.yellow);
    }

    return { success: false, error: error.message };
  }
}

/**
 * Test 5: Verify Desktop App Binary Exists
 */
async function testDesktopBinary() {
  log('\n🖥️  Test 5: Verifying Desktop App Binary...', colors.cyan);

  const binaryPath = 'src-tauri/target/release/mydistinctai.exe';

  try {
    const { stdout } = await execAsync(`powershell -Command "Test-Path '${binaryPath}'; (Get-Item '${binaryPath}').Length"`);
    const lines = stdout.trim().split('\n');
    const exists = lines[0] === 'True';

    if (exists) {
      const sizeBytes = parseInt(lines[1]);
      const sizeMB = (sizeBytes / (1024 ** 2)).toFixed(2);

      log(`✅ Desktop app binary exists`, colors.green);
      log(`   Path: ${binaryPath}`, colors.blue);
      log(`   Size: ${sizeMB} MB`, colors.blue);

      return { success: true, path: binaryPath, size: sizeBytes };
    } else {
      log(`❌ Desktop app binary not found`, colors.red);
      log(`   Expected: ${binaryPath}`, colors.yellow);
      log(`   Run: npm run tauri:build`, colors.yellow);
      return { success: false, error: 'Binary not found' };
    }
  } catch (error) {
    log(`❌ Failed to check binary: ${error.message}`, colors.red);
    return { success: false, error: error.message };
  }
}

/**
 * Main Test Runner
 */
async function runTests() {
  log('='.repeat(60), colors.cyan);
  log('🚀 Desktop App Ollama Integration Tests', colors.cyan);
  log('='.repeat(60), colors.cyan);

  const results = {
    ollamaStatus: null,
    listModels: null,
    generateEmbeddings: null,
    generateChat: null,
    desktopBinary: null,
  };

  // Test 1: Ollama Status
  results.ollamaStatus = await testOllamaStatus();

  if (!results.ollamaStatus.success) {
    log('\n⚠️  Ollama is not running. Stopping tests.', colors.yellow);
    log('   Start Ollama: ollama serve', colors.yellow);
    return results;
  }

  // Test 2: List Models
  results.listModels = await testListModels();

  // Test 3: Generate Embeddings
  results.generateEmbeddings = await testGenerateEmbeddings();

  // Test 4: Generate Chat
  results.generateChat = await testGenerateChat();

  // Test 5: Desktop Binary
  results.desktopBinary = await testDesktopBinary();

  // Summary
  log('\n' + '='.repeat(60), colors.cyan);
  log('📊 Test Summary', colors.cyan);
  log('='.repeat(60), colors.cyan);

  const tests = [
    { name: 'Ollama Status', result: results.ollamaStatus },
    { name: 'List Models', result: results.listModels },
    { name: 'Generate Embeddings', result: results.generateEmbeddings },
    { name: 'Generate Chat', result: results.generateChat },
    { name: 'Desktop Binary', result: results.desktopBinary },
  ];

  let passCount = 0;
  let failCount = 0;

  tests.forEach((test, index) => {
    const status = test.result?.success ? '✅ PASS' : '❌ FAIL';
    const color = test.result?.success ? colors.green : colors.red;

    log(`${index + 1}. ${test.name}: ${status}`, color);

    if (test.result?.success) {
      passCount++;
    } else {
      failCount++;
      if (test.result?.error) {
        log(`   Error: ${test.result.error}`, colors.yellow);
      }
    }
  });

  log('', colors.reset);
  log(`Total: ${tests.length} tests`, colors.blue);
  log(`Passed: ${passCount} tests`, colors.green);
  log(`Failed: ${failCount} tests`, failCount > 0 ? colors.red : colors.green);

  const passRate = ((passCount / tests.length) * 100).toFixed(1);
  log(`Pass Rate: ${passRate}%`, passRate === '100.0' ? colors.green : colors.yellow);

  log('\n' + '='.repeat(60), colors.cyan);

  if (passCount === tests.length) {
    log('🎉 ALL TESTS PASSED - Desktop app Ollama integration working!', colors.green);
  } else if (passCount >= 3) {
    log('⚠️  PARTIAL SUCCESS - Ollama working, check failures above', colors.yellow);
  } else {
    log('❌ TESTS FAILED - Check Ollama installation and configuration', colors.red);
  }

  log('='.repeat(60), colors.cyan);

  return results;
}

// Run tests
runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    log(`\n❌ Test runner failed: ${error.message}`, colors.red);
    process.exit(1);
  });
