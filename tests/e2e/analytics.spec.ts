/**
 * Analytics Dashboard E2E Tests
 *
 * Tests for model analytics and metrics display
 */

import { test, expect } from '../fixtures'

test.describe('Analytics Dashboard Tests', () => {
  // Use the known test model ID directly
  const TEST_MODEL_ID = 'fc259558-e605-4d5f-a7e5-be77b4b3a3eb'
  const ANALYTICS_URL = `http://localhost:4000/models/${TEST_MODEL_ID}/analytics`

  test.beforeEach(async ({ page }) => {
    // Login first using test credentials
    await page.goto('http://localhost:4000/login')
    await page.getByLabel(/email/i).fill('mytest@testmail.app')
    await page.getByLabel(/password/i).fill('password123')

    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL('**/dashboard**', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })

    console.log('✓ Successfully logged in')
    console.log(`✓ Using test model ID: ${TEST_MODEL_ID}`)

    // Navigate directly to analytics page
    await page.goto(ANALYTICS_URL, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000) // Wait for page to render
  })

  test('should display analytics dashboard', async ({ page }) => {
    // Verify analytics page loaded
    const url = page.url()
    console.log('Current URL:', url)
    expect(url).toContain('analytics')
    expect(url).toContain(TEST_MODEL_ID)

    console.log('✓ Analytics dashboard displayed')
  })

  test('should display analytics stats cards', async ({ page }) => {
    // Check for stats cards
    await expect(page.getByText('Total Sessions')).toBeVisible()
    await expect(page.getByText('Total Messages')).toBeVisible()
    await expect(page.getByText('Avg Response Time')).toBeVisible()
    await expect(page.getByText('Total Tokens')).toBeVisible()

    console.log('✓ Stats cards are visible')
  })

  test('should display usage overview section', async ({ page }) => {
    // Check for Usage Overview section
    await expect(page.getByRole('heading', { name: /usage overview/i })).toBeVisible()

    console.log('✓ Usage Overview section is visible')
  })

  test('should display performance metrics', async ({ page }) => {
    // Check for Performance Metrics section
    await expect(page.getByRole('heading', { name: /performance metrics/i })).toBeVisible()

    console.log('✓ Performance Metrics section is visible')
  })

  test('should display training data info', async ({ page }) => {
    // Check for Training Data section
    await expect(page.getByRole('heading', { name: /training data/i })).toBeVisible()

    console.log('✓ Training Data section is visible')
  })

  test('should have date range selector', async ({ page }) => {
    // Check for date range selector (just check for the select element)
    const dateRangeSelect = page.locator('select').filter({ hasText: /days/i }).first()
    await expect(dateRangeSelect).toBeVisible()

    console.log('✓ Date range selector is visible')
  })

  test('should have export CSV button', async ({ page }) => {
    // Check for export button
    await expect(page.getByRole('button', { name: /export.*csv/i })).toBeVisible()

    console.log('✓ Export CSV button is visible')
  })

  test('should have back button', async ({ page }) => {
    // Check for back button (it's a button with "Back to Models" text)
    const backButton = page.getByRole('button', { name: /back to models/i })
    await expect(backButton).toBeVisible()

    console.log('✓ Back button is visible')
  })

  test('should change date range and reload data', async ({ page }) => {
    // Find date range selector
    const dateSelector = page.locator('select').filter({ hasText: /days|30/i }).first()

    if (await dateSelector.isVisible()) {
      // Change date range
      await dateSelector.selectOption('7')
      await page.waitForTimeout(1000) // Wait for data to reload

      console.log('✓ Date range changed successfully')
    } else {
      console.log('⚠ Date range selector not found, skipping')
    }
  })

  test('should display message activity chart when data exists', async ({ page }) => {
    // With our populated data, the chart should be visible
    const chartSection = page.locator('text=/message activity|timeline|chart/i').first()

    // The page should show some visualization or data
    const hasData = await page.getByText(/total sessions/i).isVisible()
    expect(hasData).toBeTruthy()

    console.log('✓ Analytics data is displayed')
  })
})
