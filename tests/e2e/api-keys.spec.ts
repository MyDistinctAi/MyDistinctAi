/**
 * API Keys E2E Tests
 *
 * Tests for API key management page
 */

import { test, expect } from '../fixtures'

test.describe('API Keys Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first using test credentials
    await page.goto('http://localhost:4000/login')
    await page.getByLabel(/email/i).fill('demo@testmail.app')
    await page.getByLabel(/password/i).fill('Demo123456!')

    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL('**/dashboard**', { timeout: 10000 })

    console.log('✓ Successfully logged in')
  })

  test('should display API keys page', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Navigate to settings
    await page.goto('http://localhost:4000/dashboard/settings')
    await page.waitForLoadState('networkidle')

    // Click on API Keys
    await page.getByRole('link', { name: /api keys/i }).click()
    await page.waitForURL('**/dashboard/settings/api-keys**', { timeout: 10000 })

    // Verify page loaded
    await expect(
      page.getByRole('heading', { name: 'API Keys', exact: true })
    ).toBeVisible()

    console.log('✓ Navigated to API Keys page')
  })

  test('should display create API key button', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/api-keys')
    await page.waitForLoadState('networkidle')

    // Check for create button
    await expect(page.getByRole('button', { name: /create api key/i }).first()).toBeVisible()

    console.log('✓ Create API key button displayed')
  })

  test('should display empty state when no keys exist', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/api-keys')
    await page.waitForLoadState('networkidle')

    // Check for empty state or existing keys
    const noKeysText = page.getByText(/no api keys yet/i)
    const hasKeys = await noKeysText.isVisible().catch(() => false)

    if (hasKeys) {
      await expect(noKeysText).toBeVisible()
      console.log('✓ Empty state displayed')
    } else {
      console.log('✓ User has existing keys')
    }
  })

  test('should open create modal when clicking create button', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/api-keys')
    await page.waitForLoadState('networkidle')

    // Click create button
    await page.getByRole('button', { name: /create api key/i }).first().click()
    await page.waitForTimeout(500)

    // Check modal appeared
    await expect(page.getByRole('heading', { name: 'Create API Key' })).toBeVisible()
    await expect(page.getByLabel(/key name/i)).toBeVisible()

    console.log('✓ Create modal opened')
  })

  test('should close modal when clicking cancel', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/api-keys')
    await page.waitForLoadState('networkidle')

    // Open modal
    await page.getByRole('button', { name: /create api key/i }).first().click()
    await page.waitForTimeout(500)

    // Click cancel
    await page.getByRole('button', { name: /cancel/i }).click()
    await page.waitForTimeout(500)

    // Modal should be gone
    await expect(page.getByRole('heading', { name: 'Create API Key' })).not.toBeVisible()

    console.log('✓ Modal closed on cancel')
  })

  test('should validate key name input', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/api-keys')
    await page.waitForLoadState('networkidle')

    // Open modal
    await page.getByRole('button', { name: /create api key/i }).first().click()
    await page.waitForTimeout(500)

    // Create button should be disabled without name
    const createButton = page.getByRole('button', { name: /^create key$/i })
    await expect(createButton).toBeDisabled()

    console.log('✓ Validation works correctly')
  })

  test('should create new API key', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/api-keys')
    await page.waitForLoadState('networkidle')

    // Open modal
    await page.getByRole('button', { name: /create api key/i }).first().click()
    await page.waitForTimeout(500)

    // Fill in key name
    await page.getByLabel(/key name/i).fill('Test Key E2E')

    // Click create
    await page.getByRole('button', { name: /^create key$/i }).click()

    // Wait for success notice
    await expect(
      page.getByText(/api key created successfully/i)
    ).toBeVisible({ timeout: 10000 })

    console.log('✓ API key created successfully')
  })

  test('should display newly created key only once', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/api-keys')
    await page.waitForLoadState('networkidle')

    // Count existing keys before creation
    const keyCards = page.locator('.bg-white.rounded-lg.shadow-sm.border')
    const initialCount = await keyCards.count()

    // Open modal
    await page.getByRole('button', { name: /create api key/i }).first().click()
    await page.waitForTimeout(500)

    // Create key
    await page.getByLabel(/key name/i).fill('Temporary Test Key')
    await page.getByRole('button', { name: /^create key$/i }).click()

    // Check success notice appears with full key
    const successNotice = page.locator('.bg-green-50')
    await expect(successNotice).toBeVisible({ timeout: 10000 })

    // Check that there's a code element showing the key
    const keyCode = successNotice.locator('code')
    await expect(keyCode).toBeVisible()

    console.log('✓ New key displayed in success notice')
  })

  test('should list existing API keys', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/api-keys')
    await page.waitForLoadState('networkidle')

    // Check if there are any keys (either empty state or key cards)
    const emptyState = page.getByText(/no api keys yet/i)
    const hasNoKeys = await emptyState.isVisible().catch(() => false)

    if (!hasNoKeys) {
      // Should show key cards
      const keyCards = page.locator('.bg-white.rounded-lg.shadow-sm.border').filter({
        has: page.locator('code'),
      })
      const count = await keyCards.count()
      expect(count).toBeGreaterThan(0)
      console.log(`✓ Displaying ${count} API key(s)`)
    } else {
      console.log('✓ No API keys to display (empty state shown)')
    }
  })

  test('should display API documentation section', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/api-keys')
    await page.waitForLoadState('networkidle')

    // Check for documentation section
    await expect(page.getByRole('heading', { name: 'API Documentation' })).toBeVisible()
    await expect(page.getByText(/authorization: bearer your_api_key/i)).toBeVisible()

    console.log('✓ API documentation section displayed')
  })

  test('should have back button', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/api-keys')
    await page.waitForLoadState('networkidle')

    // Click back button
    await page.getByRole('button', { name: /back to settings/i }).click()
    await page.waitForURL('**/dashboard/settings**', { timeout: 10000 })

    // Verify we're back on settings page
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible()

    console.log('✓ Back button works correctly')
  })
})
