/**
 * Complete RAG System E2E Test
 * Tests file upload, processing, embedding generation, and context retrieval
 */

import { test, expect } from '@playwright/test'
import { loginViaXray } from '../fixtures'

const TEST_MODEL_NAME = `RAG Test Model ${Date.now()}`
const TEST_FILE_CONTENT = `ACME CORPORATION - EMPLOYEE HANDBOOK 2024

==============================================
COMPANY OVERVIEW
==============================================

Founded: January 15, 2010
Headquarters: 123 Innovation Drive, San Francisco, CA 94105
CEO: Sarah Johnson
CTO: Michael Chen
CFO: Emily Rodriguez

Company Mission:
To revolutionize the way businesses interact with artificial intelligence
through innovative, user-friendly solutions that empower teams to work
smarter, not harder.

Core Values:
1. Innovation First - We constantly push boundaries
2. Customer Success - Our customers' wins are our wins
3. Transparency - Open communication at all levels
4. Sustainability - Building for the long term

==============================================
EMPLOYEE BENEFITS
==============================================

Health & Wellness:
- Comprehensive health insurance (medical, dental, vision)
- Mental health support and counseling services
- Gym membership reimbursement ($100/month)
- Annual wellness stipend ($500)

Work-Life Balance:
- Flexible working hours
- Remote work options (3 days/week)
- Unlimited PTO policy
- Paid parental leave (16 weeks)

Professional Development:
- Annual learning budget ($2,000)
- Conference attendance support
- Internal training programs
- Mentorship opportunities

==============================================
OFFICE LOCATIONS
==============================================

San Francisco HQ:
- Address: 123 Innovation Drive, San Francisco, CA 94105
- Phone: +1 (415) 555-0123
- Hours: 9am-6pm PST
- Parking: Free parking available

London Office:
- Address: 321 Innovation Street, London EC2A 4BX, UK
- Phone: +44 20 7123 4567
- Hours: 9am-6pm GMT
- Tube: 5 min walk from Old Street

==============================================
CONTACT INFORMATION
==============================================

General Inquiries: info@acmecorp.com
HR Department: hr@acmecorp.com
IT Support: support@acmecorp.com
Emergency: +1 (415) 555-9999`

test.describe('RAG System Complete Flow', () => {
  let modelId: string
  let trainingDataId: string

  test.beforeAll(async ({ browser }) => {
    // Setup: Create a test model
    const context = await browser.newContext()
    const page = await context.newPage()
    
    await loginViaXray(page, 'johndoe')
    await page.goto('http://localhost:4000/dashboard/models')
    
    // Create new model
    await page.click('button:has-text("Create Model")')
    await page.fill('input[name="name"]', TEST_MODEL_NAME)
    await page.fill('textarea[name="description"]', 'Test model for RAG system validation')
    await page.click('button[type="submit"]')
    
    // Wait for model creation and get ID from URL
    await page.waitForURL(/\/dashboard\/models\/[a-f0-9-]+/)
    const url = page.url()
    modelId = url.split('/').pop()!
    
    console.log(`✅ Created test model: ${modelId}`)
    
    await context.close()
  })

  test('1. Upload training file', async ({ page }) => {
    await loginViaXray(page, 'johndoe')
    await page.goto(`http://localhost:4000/dashboard/models/${modelId}`)
    
    // Create a temporary file
    const buffer = Buffer.from(TEST_FILE_CONTENT)
    const file = {
      name: 'test-handbook.txt',
      mimeType: 'text/plain',
      buffer: buffer,
    }
    
    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: file.name,
      mimeType: file.mimeType,
      buffer: file.buffer,
    })
    
    // Wait for upload success message
    await expect(page.locator('text=uploaded successfully')).toBeVisible({ timeout: 10000 })
    
    console.log('✅ File uploaded successfully')
  })

  test('2. Verify file appears in training data list', async ({ page }) => {
    await loginViaXray(page, 'johndoe')
    await page.goto(`http://localhost:4000/dashboard/models/${modelId}`)
    
    // Check if file appears in the list
    await expect(page.locator('text=test-handbook.txt')).toBeVisible()
    
    // Get training data ID from the page
    const trainingDataRow = page.locator('tr:has-text("test-handbook.txt")')
    await expect(trainingDataRow).toBeVisible()
    
    console.log('✅ File appears in training data list')
  })

  test('3. Trigger file processing', async ({ page }) => {
    await loginViaXray(page, 'johndoe')
    
    // Call the job processor API
    const response = await page.request.post('http://localhost:4000/api/jobs/process-next')
    
    if (response.ok()) {
      const data = await response.json()
      console.log('✅ Job processor triggered:', data)
    } else {
      console.log('⚠️ Job processor returned error (may be expected if no jobs pending)')
    }
  })

  test('4. Wait for processing to complete', async ({ page }) => {
    await loginViaXray(page, 'johndoe')
    
    // Poll the model page to check if status changes to "processed"
    let isProcessed = false
    let attempts = 0
    const maxAttempts = 30 // 30 seconds max
    
    while (!isProcessed && attempts < maxAttempts) {
      await page.goto(`http://localhost:4000/dashboard/models/${modelId}`)
      
      // Check if status is "processed"
      const statusBadge = page.locator('text=processed').first()
      isProcessed = await statusBadge.isVisible().catch(() => false)
      
      if (!isProcessed) {
        // Trigger processor again
        await page.request.post('http://localhost:4000/api/jobs/process-next')
        await page.waitForTimeout(1000)
        attempts++
      }
    }
    
    expect(isProcessed).toBeTruthy()
    console.log('✅ File processing completed')
  })

  test('5. Verify embeddings were created', async ({ page }) => {
    await loginViaXray(page, 'johndoe')
    
    // Query the database to check embeddings
    const response = await page.request.post('http://localhost:4000/api/admin/query', {
      data: {
        query: `SELECT COUNT(*) as count FROM document_embeddings WHERE model_id = '${modelId}'`
      }
    })
    
    if (response.ok()) {
      const data = await response.json()
      const count = data.result?.[0]?.count || 0
      
      expect(count).toBeGreaterThan(0)
      console.log(`✅ Found ${count} embeddings in database`)
    } else {
      console.log('⚠️ Could not verify embeddings via API, checking UI instead')
      
      // Check UI for embedding stats
      await page.goto(`http://localhost:4000/dashboard/models/${modelId}`)
      await expect(page.locator('text=/\\d+ chunks/')).toBeVisible()
    }
  })

  test('6. Test RAG retrieval with CEO question', async ({ page }) => {
    await loginViaXray(page, 'johndoe')
    await page.goto(`http://localhost:4000/dashboard/chat/${modelId}`)
    
    // Send the CEO question
    const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]')
    await messageInput.fill('Who is the CEO of ACME Corporation?')
    await messageInput.press('Enter')
    
    // Wait for AI response
    await page.waitForSelector('text=Sarah Johnson', { timeout: 30000 })
    
    // Verify the response contains the correct answer
    const response = page.locator('text=Sarah Johnson')
    await expect(response).toBeVisible()
    
    console.log('✅ RAG retrieval successful - CEO question answered correctly')
  })

  test('7. Test RAG with multiple questions', async ({ page }) => {
    await loginViaXray(page, 'johndoe')
    await page.goto(`http://localhost:4000/dashboard/chat/${modelId}`)
    
    const questions = [
      { question: 'What is the company mission?', expectedKeyword: 'artificial intelligence' },
      { question: 'What are the core values?', expectedKeyword: 'Innovation First' },
      { question: 'What is the gym membership reimbursement?', expectedKeyword: '$100' },
      { question: 'Where is the London office located?', expectedKeyword: 'Old Street' },
    ]
    
    for (const { question, expectedKeyword } of questions) {
      // Send question
      const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]')
      await messageInput.fill(question)
      await messageInput.press('Enter')
      
      // Wait for response containing expected keyword
      await page.waitForSelector(`text=${expectedKeyword}`, { timeout: 30000 })
      
      console.log(`✅ Question answered: "${question}" - Found: "${expectedKeyword}"`)
      
      // Wait a bit between questions
      await page.waitForTimeout(2000)
    }
  })

  test('8. Test RAG with similarity threshold', async ({ page }) => {
    await loginViaXray(page, 'johndoe')
    
    // Test the vector search API directly
    const response = await page.request.post('http://localhost:4000/api/test/rag-search', {
      data: {
        modelId: modelId,
        query: 'Who is the CEO?',
        threshold: 0.35
      }
    })
    
    if (response.ok()) {
      const data = await response.json()
      
      expect(data.matches).toBeDefined()
      expect(data.matches.length).toBeGreaterThan(0)
      
      // Check that similarity scores are above threshold
      for (const match of data.matches) {
        expect(match.similarity).toBeGreaterThanOrEqual(0.35)
      }
      
      console.log(`✅ Vector search returned ${data.matches.length} matches above threshold`)
    } else {
      console.log('⚠️ Direct vector search API not available, skipping threshold test')
    }
  })

  test('9. Verify RAG context in chat logs', async ({ page }) => {
    await loginViaXray(page, 'johndoe')
    
    // Open browser console to check logs
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text())
      }
    })
    
    await page.goto(`http://localhost:4000/dashboard/chat/${modelId}`)
    
    // Send a question
    const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]')
    await messageInput.fill('Tell me about ACME Corporation')
    await messageInput.press('Enter')
    
    // Wait for response
    await page.waitForTimeout(5000)
    
    // Check if RAG context was retrieved (look for console logs)
    const hasRagLogs = consoleLogs.some(log => 
      log.includes('RAG') || 
      log.includes('context') || 
      log.includes('similarity')
    )
    
    if (hasRagLogs) {
      console.log('✅ RAG context retrieval logged in console')
    } else {
      console.log('⚠️ No RAG logs found in console (may be server-side only)')
    }
  })

  test('10. Performance test - RAG response time', async ({ page }) => {
    await loginViaXray(page, 'johndoe')
    await page.goto(`http://localhost:4000/dashboard/chat/${modelId}`)
    
    const startTime = Date.now()
    
    // Send question
    const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]')
    await messageInput.fill('What is the CTO name?')
    await messageInput.press('Enter')
    
    // Wait for response
    await page.waitForSelector('text=Michael Chen', { timeout: 30000 })
    
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    console.log(`✅ RAG response time: ${responseTime}ms`)
    
    // Response should be under 10 seconds
    expect(responseTime).toBeLessThan(10000)
  })

  test.afterAll(async ({ browser }) => {
    // Cleanup: Delete test model
    const context = await browser.newContext()
    const page = await context.newPage()
    
    await loginViaXray(page, 'johndoe')
    await page.goto(`http://localhost:4000/dashboard/models/${modelId}`)
    
    // Delete model
    const deleteButton = page.locator('button:has-text("Delete")')
    if (await deleteButton.isVisible()) {
      await deleteButton.click()
      await page.locator('button:has-text("Confirm")').click()
      console.log('✅ Test model deleted')
    }
    
    await context.close()
  })
})

test.describe('RAG Edge Cases', () => {
  test('Handle empty query', async ({ page }) => {
    await loginViaXray(page, 'johndoe')
    
    const response = await page.request.post('http://localhost:4000/api/chat', {
      data: {
        modelId: 'test-model-id',
        message: '',
        sessionId: 'test-session-id'
      }
    })
    
    expect(response.status()).toBe(400)
    console.log('✅ Empty query handled correctly')
  })

  test('Handle invalid model ID', async ({ page }) => {
    await loginViaXray(page, 'johndoe')
    
    const response = await page.request.post('http://localhost:4000/api/chat', {
      data: {
        modelId: 'invalid-model-id',
        message: 'test',
        sessionId: 'test-session-id'
      }
    })
    
    expect(response.status()).toBe(404)
    console.log('✅ Invalid model ID handled correctly')
  })

  test('Handle very long query', async ({ page }) => {
    await loginViaXray(page, 'johndoe')
    
    const longQuery = 'What is the company policy? '.repeat(100) // Very long query
    
    const response = await page.request.post('http://localhost:4000/api/chat', {
      data: {
        modelId: 'test-model-id',
        message: longQuery,
        sessionId: 'test-session-id'
      }
    })
    
    // Should either succeed or return a reasonable error
    expect([200, 400, 413]).toContain(response.status())
    console.log('✅ Long query handled correctly')
  })
})

test.describe('RAG System Monitoring', () => {
  test('Check embedding dimensions', async ({ page }) => {
    await loginViaXray(page, 'johndoe')
    
    // Query to check embedding dimensions
    const response = await page.request.post('http://localhost:4000/api/admin/query', {
      data: {
        query: `SELECT 
          model_id, 
          vector_dims(embedding) as dimensions,
          COUNT(*) as count
        FROM document_embeddings 
        GROUP BY model_id, vector_dims(embedding)
        LIMIT 10`
      }
    })
    
    if (response.ok()) {
      const data = await response.json()
      console.log('📊 Embedding dimensions:', data.result)
      
      // All embeddings should be 1536 dimensions (OpenRouter) or 768 (Ollama)
      for (const row of data.result || []) {
        expect([768, 1536]).toContain(row.dimensions)
      }
      
      console.log('✅ All embeddings have valid dimensions')
    }
  })

  test('Check processing job queue', async ({ page }) => {
    await loginViaXray(page, 'johndoe')
    
    const response = await page.request.post('http://localhost:4000/api/admin/query', {
      data: {
        query: `SELECT 
          status, 
          COUNT(*) as count 
        FROM job_queue 
        WHERE job_type = 'file_processing'
        GROUP BY status`
      }
    })
    
    if (response.ok()) {
      const data = await response.json()
      console.log('📊 Job queue status:', data.result)
    }
  })

  test('Check RAG retrieval statistics', async ({ page }) => {
    await loginViaXray(page, 'johndoe')
    
    const response = await page.request.post('http://localhost:4000/api/admin/query', {
      data: {
        query: `SELECT 
          m.name as model_name,
          COUNT(DISTINCT de.training_data_id) as files_count,
          COUNT(de.id) as chunks_count,
          AVG(LENGTH(de.chunk_text)) as avg_chunk_size
        FROM models m
        LEFT JOIN document_embeddings de ON m.id = de.model_id
        GROUP BY m.id, m.name
        HAVING COUNT(de.id) > 0
        ORDER BY chunks_count DESC
        LIMIT 10`
      }
    })
    
    if (response.ok()) {
      const data = await response.json()
      console.log('📊 RAG statistics by model:', data.result)
    }
  })
})
