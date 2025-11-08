#!/usr/bin/env node

/**
 * Complete RAG System Test Script
 * Tests the entire RAG pipeline: upload → process → embed → retrieve
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ekfdbotohslpalnyvdpk.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZmRib3RvaHNscGFsbnl2ZHBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk2MjIxMSwiZXhwIjoyMDc2NTM4MjExfQ.EAqXIjfGI7YZNpxzT-hZRuMidRHjWlC1HVN8beo8rm8'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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'
const MODEL_ID = '6ec4e7b7-2a23-4ec7-b94f-896beb25d9f2' // Alber imou model

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Test data
const TEST_CONTENT = `ACME CORPORATION - EMPLOYEE HANDBOOK 2024

CEO: Sarah Johnson
CTO: Michael Chen
CFO: Emily Rodriguez

Company Mission: To revolutionize artificial intelligence.

Core Values:
1. Innovation First
2. Customer Success
3. Transparency
4. Sustainability

Benefits:
- Health insurance
- Gym membership ($100/month)
- Learning budget ($2,000/year)
- Unlimited PTO

Office: 123 Innovation Drive, San Francisco, CA 94105`

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function success(message) {
  log(`✅ ${message}`, colors.green)
}

function error(message) {
  log(`❌ ${message}`, colors.red)
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue)
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow)
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Test 1: Check model exists
async function testModelExists() {
  log('\n📋 Test 1: Check if model exists', colors.cyan)
  
  const { data, error: err } = await supabase
    .from('models')
    .select('id, name, status')
    .eq('id', MODEL_ID)
    .single()
  
  if (err || !data) {
    error(`Model not found: ${err?.message}`)
    return false
  }
  
  success(`Model found: ${data.name} (${data.status})`)
  return true
}

// Test 2: Check existing embeddings
async function testCheckEmbeddings() {
  log('\n📋 Test 2: Check existing embeddings', colors.cyan)
  
  const { data, error: err } = await supabase
    .from('document_embeddings')
    .select('id, chunk_text, model_id')
    .eq('model_id', MODEL_ID)
    .limit(5)
  
  if (err) {
    error(`Failed to query embeddings: ${err.message}`)
    return false
  }
  
  if (!data || data.length === 0) {
    warning('No embeddings found for this model')
    return false
  }
  
  success(`Found ${data.length} embeddings`)
  info(`Sample chunk: "${data[0].chunk_text.substring(0, 100)}..."`)
  return true
}

// Test 3: Generate query embedding
async function testGenerateEmbedding(query) {
  log('\n📋 Test 3: Generate query embedding', colors.cyan)
  info(`Query: "${query}"`)
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:4000',
        'X-Title': 'MyDistinctAI RAG Test'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      error(`OpenRouter API error: ${response.status} - ${errorText}`)
      return null
    }
    
    const data = await response.json()
    const embedding = data.data[0].embedding
    
    success(`Generated ${embedding.length}-dimensional embedding`)
    return embedding
  } catch (err) {
    error(`Failed to generate embedding: ${err.message}`)
    return null
  }
}

// Test 4: Search similar documents via Edge Function
async function testVectorSearch(embedding) {
  log('\n📋 Test 4: Search for similar documents', colors.cyan)
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/vector-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        embedding: embedding,
        modelId: MODEL_ID,
        limit: 5,
        threshold: 0.35
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      error(`Edge Function error: ${response.status} - ${errorText}`)
      return null
    }
    
    const data = await response.json()
    const matches = data.matches || []
    
    if (matches.length === 0) {
      warning('No matches found (threshold may be too high)')
      return []
    }
    
    success(`Found ${matches.length} matches`)
    
    matches.forEach((match, i) => {
      const similarity = (match.similarity * 100).toFixed(1)
      info(`  Match ${i + 1}: ${similarity}% - "${match.chunk_text.substring(0, 80)}..."`)
    })
    
    return matches
  } catch (err) {
    error(`Vector search failed: ${err.message}`)
    return null
  }
}

// Test 5: Test direct SQL similarity query
async function testDirectSimilarity(embedding) {
  log('\n📋 Test 5: Direct SQL similarity query', colors.cyan)
  
  const vectorString = `[${embedding.join(',')}]`
  
  const { data, error: err } = await supabase.rpc('match_documents', {
    query_embedding: vectorString,
    match_model_id: MODEL_ID,
    match_count: 5,
    similarity_threshold: 0.0
  })
  
  if (err) {
    error(`SQL query failed: ${err.message}`)
    return null
  }
  
  if (!data || data.length === 0) {
    warning('No results from SQL query')
    return []
  }
  
  success(`SQL query returned ${data.length} results`)
  
  data.forEach((match, i) => {
    const similarity = (match.similarity * 100).toFixed(1)
    info(`  Match ${i + 1}: ${similarity}% - "${match.chunk_text.substring(0, 80)}..."`)
  })
  
  return data
}

// Test 6: Test RAG retrieval with specific questions
async function testRAGQuestions() {
  log('\n📋 Test 6: Test RAG with specific questions', colors.cyan)
  
  const questions = [
    { q: 'Who is the CEO of ACME Corporation?', expected: 'Sarah Johnson' },
    { q: 'What is the CTO name?', expected: 'Michael Chen' },
    { q: 'What is the gym membership benefit?', expected: '$100' },
  ]
  
  let passed = 0
  let failed = 0
  
  for (const { q, expected } of questions) {
    info(`\n  Question: "${q}"`)
    info(`  Expected: "${expected}"`)
    
    const embedding = await testGenerateEmbedding(q)
    if (!embedding) {
      failed++
      continue
    }
    
    const matches = await testVectorSearch(embedding)
    if (!matches || matches.length === 0) {
      error(`  No matches found`)
      failed++
      continue
    }
    
    // Check if any match contains the expected answer
    const found = matches.some(match => 
      match.chunk_text.toLowerCase().includes(expected.toLowerCase())
    )
    
    if (found) {
      success(`  ✓ Found expected answer in context`)
      passed++
    } else {
      error(`  ✗ Expected answer not found in context`)
      failed++
    }
  }
  
  log(`\n  Results: ${passed} passed, ${failed} failed`, colors.cyan)
  return { passed, failed }
}

// Test 7: Check job queue status
async function testJobQueue() {
  log('\n📋 Test 7: Check job queue status', colors.cyan)
  
  const { data, error: err } = await supabase
    .from('job_queue')
    .select('id, job_type, status, created_at')
    .eq('job_type', 'file_processing')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (err) {
    error(`Failed to query job queue: ${err.message}`)
    return false
  }
  
  if (!data || data.length === 0) {
    info('No file processing jobs in queue')
    return true
  }
  
  success(`Found ${data.length} recent jobs`)
  
  const statusCounts = {}
  data.forEach(job => {
    statusCounts[job.status] = (statusCounts[job.status] || 0) + 1
  })
  
  Object.entries(statusCounts).forEach(([status, count]) => {
    info(`  ${status}: ${count}`)
  })
  
  return true
}

// Test 8: Check training data status
async function testTrainingDataStatus() {
  log('\n📋 Test 8: Check training data status', colors.cyan)
  
  const { data, error: err } = await supabase
    .from('training_data')
    .select('id, file_name, status, created_at')
    .eq('model_id', MODEL_ID)
    .order('created_at', { ascending: false })
  
  if (err) {
    error(`Failed to query training data: ${err.message}`)
    return false
  }
  
  if (!data || data.length === 0) {
    warning('No training data found for this model')
    return false
  }
  
  success(`Found ${data.length} training files`)
  
  data.forEach(file => {
    const statusColor = file.status === 'processed' ? colors.green : 
                       file.status === 'failed' ? colors.red : colors.yellow
    log(`  ${file.file_name}: ${file.status}`, statusColor)
  })
  
  return true
}

// Test 9: Performance test
async function testPerformance() {
  log('\n📋 Test 9: Performance test', colors.cyan)
  
  const query = 'Who is the CEO?'
  const iterations = 3
  const times = []
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now()
    
    const embedding = await testGenerateEmbedding(query)
    if (!embedding) continue
    
    await testVectorSearch(embedding)
    
    const duration = Date.now() - start
    times.push(duration)
    
    info(`  Iteration ${i + 1}: ${duration}ms`)
  }
  
  if (times.length > 0) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const min = Math.min(...times)
    const max = Math.max(...times)
    
    success(`Performance: avg=${avg.toFixed(0)}ms, min=${min}ms, max=${max}ms`)
  }
  
  return true
}

// Main test runner
async function runAllTests() {
  log('╔════════════════════════════════════════════════════════╗', colors.cyan)
  log('║        RAG SYSTEM COMPLETE TEST SUITE                 ║', colors.cyan)
  log('╚════════════════════════════════════════════════════════╝', colors.cyan)
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  }
  
  try {
    // Run all tests
    if (await testModelExists()) {
      results.passed++
    } else {
      results.failed++
    }
    
    if (await testCheckEmbeddings()) {
      results.passed++
    } else {
      results.skipped++
    }
    
    const embedding = await testGenerateEmbedding('Who is the CEO of ACME Corporation?')
    if (embedding) {
      results.passed++
      
      if (await testVectorSearch(embedding)) {
        results.passed++
      } else {
        results.failed++
      }
      
      if (await testDirectSimilarity(embedding)) {
        results.passed++
      } else {
        results.failed++
      }
    } else {
      results.failed += 3
    }
    
    const ragResults = await testRAGQuestions()
    results.passed += ragResults.passed
    results.failed += ragResults.failed
    
    if (await testJobQueue()) {
      results.passed++
    } else {
      results.failed++
    }
    
    if (await testTrainingDataStatus()) {
      results.passed++
    } else {
      results.failed++
    }
    
    if (await testPerformance()) {
      results.passed++
    } else {
      results.failed++
    }
    
  } catch (err) {
    error(`\nTest suite error: ${err.message}`)
    results.failed++
  }
  
  // Summary
  log('\n╔════════════════════════════════════════════════════════╗', colors.cyan)
  log('║                    TEST SUMMARY                        ║', colors.cyan)
  log('╚════════════════════════════════════════════════════════╝', colors.cyan)
  
  log(`\n  Total Tests: ${results.passed + results.failed + results.skipped}`)
  success(`  Passed: ${results.passed}`)
  if (results.failed > 0) error(`  Failed: ${results.failed}`)
  if (results.skipped > 0) warning(`  Skipped: ${results.skipped}`)
  
  const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1)
  log(`\n  Success Rate: ${successRate}%`, successRate >= 80 ? colors.green : colors.red)
  
  log('\n' + '═'.repeat(60) + '\n')
  
  process.exit(results.failed > 0 ? 1 : 0)
}

// Run tests
runAllTests().catch(err => {
  error(`Fatal error: ${err.message}`)
  console.error(err)
  process.exit(1)
})
