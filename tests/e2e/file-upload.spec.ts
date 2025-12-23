/**
 * File Upload E2E Tests
 *
 * Tests for the training data file upload functionality
 */

import { test, expect } from '../fixtures'
import path from 'path'
import fs from 'fs'

test.describe('File Upload Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:4000/login')
    await page.getByLabel(/email/i).fill('demo@testmail.app')
    await page.getByLabel(/password/i).fill('Demo123456!')

    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL('**/dashboard**', { timeout: 10000 })

    console.log('✓ Successfully logged in')

    // Ensure user has at least one model
    // Navigate to models page
    await page.goto('http://localhost:4000/dashboard/models')
    await page.waitForLoadState('networkidle')

    // Check if "No models yet" message is visible
    const noModelsVisible = await page.getByText('No models yet').isVisible().catch(() => false)

    if (noModelsVisible) {
      console.log('ℹ No models found, creating test model...')

      // Click "Create New Model" button
      await page.getByRole('button', { name: /create new model/i }).click()
      await page.waitForTimeout(1000)

      // Fill in the form
      await page.getByLabel(/model name/i).fill('Test Upload Model')
      await page.locator('#description').fill('Model for file upload testing')
      await page.locator('#baseModel').selectOption('llama-2-7b')
      await page.getByRole('button', { name: /standard/i }).click()
      await page.locator('#personality').fill('Helpful assistant')

      // Submit the form
      await page.getByRole('button', { name: /create model/i, exact: true }).click()
      await page.waitForTimeout(2000)

      console.log('✓ Test model created')
    } else {
      console.log('✓ User already has models')
    }
  })

  test('should navigate to training data page', async ({ page }) => {
    // Click on Training Data link in sidebar
    await page.getByRole('link', { name: /training data/i }).first().click()
    await page.waitForURL('**/dashboard/data**', { timeout: 10000 })

    console.log('✓ Navigated to Training Data page')

    // Verify page title
    await expect(page.getByRole('heading', { name: 'Training Data' })).toBeVisible()

    // Verify upload zone is visible
    await expect(page.getByText(/drag and drop files here/i)).toBeVisible()

    console.log('✓ Training Data page loaded successfully')
  })

  test('should display file upload interface', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)
    await page.goto('http://localhost:4000/dashboard/data', { timeout: 20000 })
    await page.waitForLoadState('networkidle', { timeout: 20000 })

    // Check for model selector
    await expect(page.getByText('Select Model')).toBeVisible()

    // Check for upload zone
    await expect(page.getByText(/drag and drop files here/i)).toBeVisible()
    await expect(page.getByText(/supported formats/i)).toBeVisible()

    console.log('✓ File upload interface is visible')
  })

  test('should upload a text file', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000) // 60 seconds for this test
    await page.goto('http://localhost:4000/dashboard/data', { timeout: 20000 })
    await page.waitForLoadState('networkidle', { timeout: 20000 })

    // Create a temporary test file
    const testFilePath = path.join(process.cwd(), 'test-data.txt')
    fs.writeFileSync(testFilePath, 'This is test training data for the AI model.\nIt contains multiple lines.\nAnd some sample text.')

    try {
      // Upload the file
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(testFilePath)

      console.log('✓ File selected for upload')

      // Wait a moment for the file to appear in the list
      await page.waitForTimeout(1000)

      // Check if file appears in the list (use first() to handle duplicate selectors)
      await expect(page.getByText('test-data.txt').first()).toBeVisible()

      console.log('✓ File appears in upload list')

      // Click "Upload All" button if it exists
      const uploadButton = page.getByRole('button', { name: /upload all/i })
      if (await uploadButton.isVisible()) {
        await uploadButton.click()
        console.log('✓ Clicked Upload All button')

        // Wait for upload to complete (look for success indicator)
        await page.waitForTimeout(3000)

        // Check for success message or icon
        const successIcon = page.locator('.text-green-500, .text-green-600')
        await expect(successIcon.first()).toBeVisible({ timeout: 10000 })

        console.log('✓ File uploaded successfully')
      }
    } finally {
      // Clean up: delete the test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    }
  })

  test('should show validation error for large file', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)
    await page.goto('http://localhost:4000/dashboard/data', { timeout: 20000 })
    await page.waitForLoadState('networkidle', { timeout: 20000 })

    // Create a file larger than 10MB
    const testFilePath = path.join(process.cwd(), 'large-file.txt')
    const largeContent = 'X'.repeat(11 * 1024 * 1024) // 11MB of X's
    fs.writeFileSync(testFilePath, largeContent)

    try {
      // Try to upload the file
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(testFilePath)

      console.log('✓ Large file selected')

      // Wait for validation error
      await page.waitForTimeout(1000)

      // Check for error message about file size
      await expect(page.getByText(/file size exceeds|too large/i)).toBeVisible()

      console.log('✓ File size validation error displayed')
    } finally {
      // Clean up
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    }
  })

  test('should display uploaded files in table', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)
    await page.goto('http://localhost:4000/dashboard/data', { timeout: 20000 })
    await page.waitForLoadState('networkidle', { timeout: 20000 })

    // Check if there are uploaded files in the table
    const uploadedFilesSection = page.getByText(/uploaded files \(\d+\)/i)
    await expect(uploadedFilesSection).toBeVisible()
    console.log('✓ Uploaded files section is visible')

    // Check if there are files by looking for either the table or the empty state
    const hasTable = await page.locator('table thead').isVisible().catch(() => false)
    const hasEmptyState = await page.getByText(/no training data uploaded yet/i).isVisible().catch(() => false)

    if (hasTable) {
      // Check for table headers with proper role
      const headers = page.locator('table thead th')
      await expect(headers).toHaveCount(5) // File Name, Size, Status, Uploaded, Actions

      // Check specific headers exist
      await expect(headers.filter({ hasText: 'File Name' })).toBeVisible()
      await expect(headers.filter({ hasText: 'Size' })).toBeVisible()
      await expect(headers.filter({ hasText: 'Status' })).toBeVisible()

      console.log('✓ Files table is properly formatted')
    } else if (hasEmptyState) {
      console.log('ℹ No uploaded files yet (expected for fresh database)')
      await expect(page.getByText(/no training data uploaded yet/i)).toBeVisible()
    } else {
      throw new Error('Neither table nor empty state found')
    }
  })

  test('should have functional model selector', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)
    await page.goto('http://localhost:4000/dashboard/data', { timeout: 20000 })
    await page.waitForLoadState('networkidle', { timeout: 20000 })

    // Find the model selector dropdown
    const modelSelect = page.locator('select').first()
    await expect(modelSelect).toBeVisible()

    // Check if it has options
    const options = await modelSelect.locator('option').count()
    expect(options).toBeGreaterThan(0)

    console.log(`✓ Model selector has ${options} model(s)`)

    // Try changing the selection
    if (options > 1) {
      await modelSelect.selectOption({ index: 1 })
      console.log('✓ Model selector is functional')
    }
  })

  test('should show drag and drop zone with correct styling', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)
    await page.goto('http://localhost:4000/dashboard/data', { timeout: 20000 })
    await page.waitForLoadState('networkidle', { timeout: 20000 })

    // Find the drop zone
    const dropZone = page.locator('text=Drag and drop files here').locator('..')
    await expect(dropZone).toBeVisible()

    // Check for upload icon
    await expect(page.locator('svg').first()).toBeVisible()

    // Check for supported formats text
    await expect(page.getByText(/PDF, DOCX, TXT, MD, CSV/i)).toBeVisible()
    await expect(page.getByText(/maximum file size.*10MB/i)).toBeVisible()

    console.log('✓ Drop zone UI is correctly displayed')
  })

  test('should allow file removal before upload', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)
    await page.goto('http://localhost:4000/dashboard/data', { timeout: 20000 })
    await page.waitForLoadState('networkidle', { timeout: 20000 })

    // Create a test file
    const testFilePath = path.join(process.cwd(), 'test-remove.txt')
    fs.writeFileSync(testFilePath, 'Test file for removal')

    try {
      // Upload the file
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(testFilePath)

      console.log('✓ File selected')

      // Wait for file to appear
      await page.waitForTimeout(1000)

      // Find and click the remove button (X icon)
      const removeButton = page.locator('button[aria-label="Remove file"], button:has-text("×")').first()

      if (await removeButton.isVisible()) {
        await removeButton.click()
        console.log('✓ Clicked remove button')

        // Verify file is removed from list
        await expect(page.getByText('test-remove.txt')).not.toBeVisible()
        console.log('✓ File successfully removed from upload list')
      }
    } finally {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    }
  })

  test('should handle multiple file selection', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)
    await page.goto('http://localhost:4000/dashboard/data', { timeout: 20000 })
    await page.waitForLoadState('networkidle', { timeout: 20000 })

    // Create multiple test files
    const testFile1 = path.join(process.cwd(), 'test-1.txt')
    const testFile2 = path.join(process.cwd(), 'test-2.txt')

    fs.writeFileSync(testFile1, 'Test file 1')
    fs.writeFileSync(testFile2, 'Test file 2')

    try {
      // Select multiple files
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles([testFile1, testFile2])

      console.log('✓ Multiple files selected')

      // Wait for files to appear
      await page.waitForTimeout(1000)

      // Check both files are in the list
      await expect(page.getByText('test-1.txt')).toBeVisible()
      await expect(page.getByText('test-2.txt')).toBeVisible()

      console.log('✓ Multiple files appear in upload list')
    } finally {
      if (fs.existsSync(testFile1)) fs.unlinkSync(testFile1)
      if (fs.existsSync(testFile2)) fs.unlinkSync(testFile2)
    }
  })
})
