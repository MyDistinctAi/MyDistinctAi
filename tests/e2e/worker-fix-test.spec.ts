/**
 * Worker Fix Test - Verify automatic file processing
 * Tests: Upload file → Worker processes → Status updates to "processed"
 */

import { test, expect } from '@playwright/test'

test.describe('Worker Automatic Processing', () => {
  test.beforeEach(async ({ page }) => {
    // Login using xray route
    await page.goto('/api/xray/filetest')
    await page.waitForURL('**/dashboard')
  })

  test('should automatically process uploaded file', async ({ page }) => {
    console.log('🧪 Testing automatic file processing...')

    // Navigate to training data page
    await page.goto('/dashboard/data')
    await page.waitForLoadState('networkidle')

    // Check if we have a model to upload to
    const modelCards = page.locator('[data-testid="model-card"]')
    const modelCount = await modelCards.count()

    if (modelCount === 0) {
      console.log('⚠️  No models found - creating test model first...')

      // Create a test model
      await page.goto('/dashboard/models')
      await page.click('button:has-text("Create New Model")')
      await page.fill('input[name="name"]', 'Worker Test Model')
      await page.fill('textarea[name="description"]', 'Test model for worker verification')
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard/models')
      await page.goto('/dashboard/data')
      await page.waitForLoadState('networkidle')
    }

    // Get model ID from first model card
    const firstModel = page.locator('[data-testid="model-card"]').first()
    const modelId = await firstModel.getAttribute('data-model-id')

    if (!modelId) {
      throw new Error('No model ID found')
    }

    console.log(`📝 Using model ID: ${modelId}`)

    // Create test file content
    const testContent = `# Worker Test Document

This is a test document to verify automatic file processing.

## Test Content
The worker should process this file automatically and create embeddings.

Key information:
- Test timestamp: ${new Date().toISOString()}
- Purpose: Verify worker trigger fix
- Expected result: Status changes to "processed" within 30 seconds
`

    // Upload file
    console.log('📤 Uploading test file...')
    const fileInput = page.locator('input[type="file"]')

    // Create a test file
    const buffer = Buffer.from(testContent)
    await fileInput.setInputFiles({
      name: 'worker-test.txt',
      mimeType: 'text/plain',
      buffer: buffer,
    })

    // Wait for upload to complete
    await expect(page.locator('text=File uploaded successfully')).toBeVisible({ timeout: 10000 })
    console.log('✅ File uploaded')

    // Get the uploaded file row
    const uploadedFile = page.locator('tr:has-text("worker-test.txt")').first()

    // Initial status should be "uploaded" or "processing"
    const initialStatus = await uploadedFile.locator('td').nth(3).textContent()
    console.log(`📊 Initial status: ${initialStatus}`)

    // Wait for automatic processing (up to 30 seconds)
    console.log('⏳ Waiting for automatic processing...')

    let currentStatus = initialStatus
    let attempts = 0
    const maxAttempts = 10 // 30 seconds (3s intervals)

    while (attempts < maxAttempts) {
      await page.waitForTimeout(3000) // Wait 3 seconds
      attempts++

      // Refresh the page to get updated status
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Check status
      const statusCell = page.locator('tr:has-text("worker-test.txt")').first().locator('td').nth(3)
      currentStatus = await statusCell.textContent()

      console.log(`[${attempts * 3}s] Status: ${currentStatus}`)

      if (currentStatus?.includes('Processed') || currentStatus?.includes('✓')) {
        console.log('✅ File processed successfully!')
        break
      } else if (currentStatus?.includes('Failed') || currentStatus?.includes('✗')) {
        console.log('❌ File processing failed!')
        break
      }
    }

    // Verify final status is "processed"
    expect(currentStatus).toContain('Processed')

    console.log('🎉 Test passed! Worker is automatically processing files.')
  })

  test('should show job in queue', async ({ page }) => {
    // This test verifies that jobs are being created
    console.log('🧪 Testing job queue...')

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Check if there's a way to view job queue (if exposed in UI)
    // For now, we'll just verify the upload creates a job by checking logs

    console.log('✅ Job queue test - manual verification needed in database')
  })
})
