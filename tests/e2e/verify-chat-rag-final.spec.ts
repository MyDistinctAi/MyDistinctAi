import { test, expect } from '@playwright/test'

test.describe('Final Verification - Chat & RAG', () => {
  test('should login via xray, upload file, and test RAG chat', async ({ page }) => {
    // Step 1: Login via xray route
    console.log('Step 1: Logging in via xray route...')
    await page.goto('http://localhost:4000/api/xray/dsaq')
    await page.waitForURL('**/dashboard', { timeout: 30000 })
    console.log('✅ Logged in successfully')

    // Step 2: Navigate to models
    console.log('Step 2: Navigating to models...')
    await page.click('a[href="/dashboard/models"]')
    await page.waitForURL('**/models', { timeout: 10000 })
    console.log('✅ On models page')

    // Step 3: Create new model
    console.log('Step 3: Creating new test model...')
    await page.click('button:has-text("Create New Model")')
    await page.waitForSelector('input[name="name"]', { timeout: 5000 })

    const modelName = `Test RAG ${Date.now()}`
    await page.fill('input[name="name"]', modelName)
    await page.fill('textarea[name="description"]', 'Testing RAG functionality')

    // Verify default model is correct (no :free)
    const selectedModel = await page.inputValue('select[name="baseModel"]')
    console.log(`Selected model: ${selectedModel}`)
    expect(selectedModel).not.toContain(':free')
    expect(selectedModel).toBe('deepseek/deepseek-chat')
    console.log('✅ Default model is correct (no :free suffix)')

    // Step 4: Upload test file
    console.log('Step 4: Uploading test file...')
    const fileContent = `
# Test Document for RAG

This is a test document to verify RAG functionality.

## Important Information
- The secret code is: XRAY123
- The company name is: TestCorp Industries
- The product name is: SuperWidget 3000

## Contact
Email: test@testcorp.com
Phone: 555-0123
`

    const buffer = Buffer.from(fileContent)
    await page.setInputFiles('input[type="file"]', {
      name: 'test-rag-document.txt',
      mimeType: 'text/plain',
      buffer,
    })

    await page.waitForSelector('text=/test-rag-document.txt/', { timeout: 5000 })
    console.log('✅ File uploaded')

    // Submit form
    await page.click('button[type="submit"]:has-text("Create Model")')
    await page.waitForSelector(`text=/${modelName}/`, { timeout: 15000 })
    console.log('✅ Model created successfully')

    // Step 5: Wait for file processing
    console.log('Step 5: Waiting for file processing...')
    await page.waitForTimeout(5000) // Give time for processing
    console.log('✅ File should be processed')

    // Step 6: Open chat for the new model
    console.log('Step 6: Opening chat...')
    await page.click(`text=/${modelName}/`)
    await page.waitForURL('**/chat/**', { timeout: 10000 })
    console.log('✅ Chat page loaded')

    // Step 7: Test chat without RAG
    console.log('Step 7: Testing chat (basic response)...')
    await page.fill('textarea[placeholder*="message"]', 'Say hello')
    await page.click('button[type="submit"]')

    // Wait for response
    await page.waitForSelector('.message-assistant', { timeout: 30000 })
    console.log('✅ Chat response received')

    // Step 8: Test RAG - ask about document content
    console.log('Step 8: Testing RAG (document-based question)...')
    await page.fill('textarea[placeholder*="message"]', 'What is the secret code?')
    await page.click('button[type="submit"]')

    // Wait for RAG response
    await page.waitForSelector('.message-assistant:nth-of-type(2)', { timeout: 30000 })

    // Get response text
    const response = await page.textContent('.message-assistant:nth-of-type(2)')
    console.log(`Response: ${response}`)

    // Verify RAG worked - response should mention XRAY123
    expect(response).toContain('XRAY123')
    console.log('✅ RAG is working! AI retrieved info from uploaded document')

    // Step 9: Test another RAG question
    console.log('Step 9: Testing RAG (company name)...')
    await page.fill('textarea[placeholder*="message"]', 'What is the company name?')
    await page.click('button[type="submit"]')

    await page.waitForSelector('.message-assistant:nth-of-type(3)', { timeout: 30000 })
    const response2 = await page.textContent('.message-assistant:nth-of-type(3)')
    console.log(`Response: ${response2}`)

    expect(response2).toContain('TestCorp')
    console.log('✅ RAG retrieval confirmed! AI knows company name from document')

    // Step 10: Verify no :free suffix in any models
    console.log('Step 10: Checking all models for :free suffix...')
    await page.goto('http://localhost:4000/dashboard/models')
    await page.waitForURL('**/models')

    // Check if any model cards show :free
    const pageContent = await page.content()
    expect(pageContent).not.toContain(':free')
    console.log('✅ No :free suffix found in any models')

    console.log('')
    console.log('='.repeat(60))
    console.log('🎉 ALL TESTS PASSED!')
    console.log('✅ Chat functionality working')
    console.log('✅ RAG retrieval working')
    console.log('✅ File upload and processing working')
    console.log('✅ No :free suffix in models')
    console.log('='.repeat(60))
  })
})
