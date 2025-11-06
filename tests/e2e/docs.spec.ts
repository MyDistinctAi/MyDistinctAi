/**
 * E2E Tests for User Documentation Site
 */

import { test, expect } from '../fixtures'

test.beforeEach(async ({ page }) => {
  // Login using test auth API
  await page.goto('http://localhost:4000/api/xray/dsaq')
  await page.waitForTimeout(3000) // Increased wait for page to render

  // Navigate to docs page
  await page.goto('http://localhost:4000/dashboard/docs')
  await page.waitForTimeout(3000) // Increased wait for page to render

  // Close onboarding modal if it appears
  try {
    const closeButton = page.getByLabel('Close onboarding')
    await closeButton.click({ timeout: 3000 })
    await page.waitForTimeout(800)
  } catch (error) {
    // Onboarding modal not present, continue
  }
})

test.describe('Documentation Site', () => {
  test('should load documentation page', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Check title
    await expect(page.getByRole('heading', { name: 'Documentation', exact: true })).toBeVisible()

    // Check sidebar sections
    await expect(page.getByText('Getting Started')).toBeVisible()
    await expect(page.getByText('Features Guide')).toBeVisible()
    await expect(page.getByText('API Documentation')).toBeVisible()
    await expect(page.getByText('Self-Hosting Guide')).toBeVisible()
    await expect(page.getByText('FAQs')).toBeVisible()
  })

  test('should display search bar', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    const searchInput = page.getByPlaceholder('Search documentation...')
    await expect(searchInput).toBeVisible()
  })

  test('should navigate between sections', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Click Features Guide
    await page.getByText('Features Guide').click()
    await page.waitForTimeout(1000)

    // Check content changed
    await expect(page.getByRole('heading', { name: 'Features Guide' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Model Management')).toBeVisible()

    // Click API Documentation
    await page.getByText('API Documentation').click()
    await page.waitForTimeout(1000)

    await expect(page.getByRole('heading', { name: 'API Documentation' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Authentication' })).toBeVisible()
  })

  test('should show Getting Started content by default', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Check default content
    await expect(page.getByRole('heading', { name: 'Quick Start Guide' })).toBeVisible()
    await expect(page.getByText('Upload Your First Data')).toBeVisible()
    await expect(page.getByText('Train Your First Model')).toBeVisible()
    await expect(page.getByText('Chat with Your AI')).toBeVisible()
  })

  test('should display code blocks with copy button', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Navigate to API Documentation
    await page.getByText('API Documentation').click()
    await page.waitForTimeout(1000)

    // Check for code block
    const codeBlock = page.locator('pre code').first()
    await expect(codeBlock).toBeVisible({ timeout: 10000 })

    // Check for copy button
    const copyButton = page.getByRole('button', { name: /copy/i }).first()
    await expect(copyButton).toBeVisible({ timeout: 10000 })
  })

  test('should copy code to clipboard', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Navigate to API Documentation
    await page.getByText('API Documentation').click()
    await page.waitForTimeout(1000)

    // Click copy button
    const copyButton = page.getByRole('button', { name: /copy/i }).first()
    await copyButton.click()
    await page.waitForTimeout(1000)

    // Check for "Copied" confirmation
    await expect(page.getByText('Copied')).toBeVisible({ timeout: 5000 })
  })

  test('should search documentation', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Search for "API"
    const searchInput = page.getByPlaceholder('Search documentation...')
    await searchInput.fill('API')
    await page.waitForTimeout(1000)

    // Should show API-related sections
    await expect(page.getByText('API Documentation')).toBeVisible({ timeout: 10000 })
  })

  test('should filter sections based on search', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Search for specific term
    const searchInput = page.getByPlaceholder('Search documentation...')
    await searchInput.fill('self-hosting')
    await page.waitForTimeout(1000)

    // Should show Self-Hosting Guide
    await expect(page.getByText('Self-Hosting Guide')).toBeVisible({ timeout: 10000 })
  })

  test('should show feedback buttons', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)

    // Check for feedback section
    await expect(page.getByText('Was this helpful?')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /yes/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /no/i })).toBeVisible()
  })

  test('should submit helpful feedback', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)

    // Click Yes button
    await page.getByRole('button', { name: /yes/i }).click()
    await page.waitForTimeout(1000)

    // Check for thank you message
    await expect(page.getByText('Thank you for your feedback!')).toBeVisible({ timeout: 10000 })
  })

  test('should submit not helpful feedback', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)

    // Click No button
    await page.getByRole('button', { name: /no/i }).click()
    await page.waitForTimeout(1000)

    // Check for thank you message
    await expect(page.getByText('Thank you for your feedback!')).toBeVisible({ timeout: 10000 })
  })

  test('should navigate back to dashboard', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Click back button
    await page.getByRole('button', { name: /back to dashboard/i }).click()
    await page.waitForTimeout(3000) // Increased wait for navigation

    // Should be on dashboard
    expect(page.url()).toContain('/dashboard')
  })

  test('should display all sections in sidebar', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Check all 5 sections
    const sections = [
      'Getting Started',
      'Features Guide',
      'API Documentation',
      'Self-Hosting Guide',
      'FAQs',
    ]

    for (const section of sections) {
      await expect(page.getByText(section)).toBeVisible()
    }
  })

  test('should highlight active section', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Getting Started should be active by default
    const gettingStartedButton = page.locator('button', { hasText: 'Getting Started' })
    const classList = await gettingStartedButton.getAttribute('class')
    expect(classList).toContain('bg-blue-50')

    // Click Features Guide
    await page.getByText('Features Guide').click()
    await page.waitForTimeout(1000)

    // Features Guide should now be active
    const featuresButton = page.locator('button', { hasText: 'Features Guide' })
    const featuresClassList = await featuresButton.getAttribute('class')
    expect(featuresClassList).toContain('bg-blue-50')
  })

  test('should display FAQs content', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Navigate to FAQs
    await page.getByText('FAQs').click()
    await page.waitForTimeout(1000)

    // Check FAQ content
    await expect(page.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('General Questions')).toBeVisible()
    await expect(page.getByText('Privacy & Security')).toBeVisible()
    await expect(page.getByText('Technical Questions')).toBeVisible()
  })

  test('should display self-hosting content', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Navigate to Self-Hosting Guide
    await page.getByText('Self-Hosting Guide').click()
    await page.waitForTimeout(1000)

    // Check self-hosting content
    await expect(page.getByRole('heading', { name: 'Self-Hosting Guide' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('System Requirements')).toBeVisible()
    await expect(page.getByText('Installation Steps')).toBeVisible()
  })
})
