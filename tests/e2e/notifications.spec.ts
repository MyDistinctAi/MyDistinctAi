/**
 * Notifications Settings E2E Tests
 *
 * Tests for notification preferences page
 */

import { test, expect } from '../fixtures'

test.describe('Notifications Settings Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first using test credentials
    await page.goto('http://localhost:4000/login')
    await page.getByLabel(/email/i).fill('demo@testmail.app')
    await page.getByLabel(/password/i).fill('Demo123456!')

    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL('**/dashboard**', { timeout: 10000 })

    console.log('✓ Successfully logged in')
  })

  test('should display notifications settings page', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Navigate to settings
    await page.goto('http://localhost:4000/dashboard/settings')
    await page.waitForLoadState('networkidle')

    // Click on Notifications
    await page.getByRole('link', { name: /notifications/i }).click()
    await page.waitForURL('**/dashboard/settings/notifications**', { timeout: 10000 })

    // Verify page loaded
    await expect(
      page.getByRole('heading', { name: 'Notification Settings' })
    ).toBeVisible()

    console.log('✓ Navigated to Notifications Settings')
  })

  test('should display all notification sections', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Navigate directly to notifications settings
    await page.goto('http://localhost:4000/dashboard/settings/notifications')
    await page.waitForLoadState('networkidle')

    // Check for all sections
    await expect(page.getByRole('heading', { name: 'Email Notifications' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'In-App Notifications' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Important Alerts' })).toBeVisible()

    console.log('✓ All notification sections displayed')
  })

  test('should display email notification toggles', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/notifications')
    await page.waitForLoadState('networkidle')

    // Check for email toggles
    await expect(page.getByText('Enable Email Notifications')).toBeVisible()
    await expect(page.getByText('Training Complete').first()).toBeVisible()
    await expect(page.getByText('New Messages').first()).toBeVisible()
    await expect(page.getByText('Weekly Report')).toBeVisible()

    console.log('✓ Email notification toggles displayed')
  })

  test('should display in-app notification toggles', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/notifications')
    await page.waitForLoadState('networkidle')

    // Check for in-app toggles
    await expect(page.getByText('Enable In-App Notifications')).toBeVisible()
    await expect(page.getByText('System Updates')).toBeVisible()

    console.log('✓ In-app notification toggles displayed')
  })

  test('should display important alerts section', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/notifications')
    await page.waitForLoadState('networkidle')

    // Check for important alerts
    await expect(page.getByText('Usage Limit Warnings')).toBeVisible()
    await expect(page.getByText('Security Alerts')).toBeVisible()

    console.log('✓ Important alerts section displayed')
  })

  test('should toggle email notifications master switch', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/notifications')
    await page.waitForLoadState('networkidle')

    // Find the master email toggle button (first toggle in the email section)
    const emailSection = page.locator('h2:has-text("Email Notifications")').locator('..')
    const masterToggle = emailSection.locator('button').first()

    // Get initial state
    const initialClass = await masterToggle.getAttribute('class')
    const initiallyEnabled = initialClass?.includes('bg-blue-600')

    // Click the toggle
    await masterToggle.click()
    await page.waitForTimeout(500)

    // Verify state changed
    const newClass = await masterToggle.getAttribute('class')
    const nowEnabled = newClass?.includes('bg-blue-600')

    expect(nowEnabled).toBe(!initiallyEnabled)

    console.log('✓ Email notifications master toggle works')
  })

  test('should toggle in-app notifications master switch', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/notifications')
    await page.waitForLoadState('networkidle')

    // Find the master in-app toggle button
    const inAppSection = page.locator('h2:has-text("In-App Notifications")').locator('..')
    const masterToggle = inAppSection.locator('button').first()

    // Get initial state
    const initialClass = await masterToggle.getAttribute('class')
    const initiallyEnabled = initialClass?.includes('bg-blue-600')

    // Click the toggle
    await masterToggle.click()
    await page.waitForTimeout(500)

    // Verify state changed
    const newClass = await masterToggle.getAttribute('class')
    const nowEnabled = newClass?.includes('bg-blue-600')

    expect(nowEnabled).toBe(!initiallyEnabled)

    console.log('✓ In-app notifications master toggle works')
  })

  test('should toggle usage limit warnings', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/notifications')
    await page.waitForLoadState('networkidle')

    // Find usage limit warnings toggle
    const alertsSection = page.locator('h2:has-text("Important Alerts")').locator('..')
    const usageToggle = alertsSection.locator('button').first()

    // Get initial state
    const initialClass = await usageToggle.getAttribute('class')
    const initiallyEnabled = initialClass?.includes('bg-blue-600')

    // Click the toggle
    await usageToggle.click()
    await page.waitForTimeout(500)

    // Verify state changed
    const newClass = await usageToggle.getAttribute('class')
    const nowEnabled = newClass?.includes('bg-blue-600')

    expect(nowEnabled).toBe(!initiallyEnabled)

    console.log('✓ Usage limit warnings toggle works')
  })

  test('should have save button', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/notifications')
    await page.waitForLoadState('networkidle')

    // Check for save button
    await expect(page.getByRole('button', { name: /save settings/i })).toBeVisible()

    console.log('✓ Save button visible')
  })

  test('should save notification settings', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/notifications')
    await page.waitForLoadState('networkidle')

    // Toggle a setting
    const emailSection = page.locator('h2:has-text("Email Notifications")').locator('..')
    const masterToggle = emailSection.locator('button').first()
    await masterToggle.click()
    await page.waitForTimeout(500)

    // Click save
    await page.getByRole('button', { name: /save settings/i }).click()

    // Wait for success message
    await expect(
      page.getByText(/settings saved successfully/i)
    ).toBeVisible({ timeout: 10000 })

    console.log('✓ Notification settings saved successfully')
  })

  test('should have back button', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await page.goto('http://localhost:4000/dashboard/settings/notifications')
    await page.waitForLoadState('networkidle')

    // Click back button
    await page.getByRole('button', { name: /back to settings/i }).click()
    await page.waitForURL('**/dashboard/settings**', { timeout: 10000 })

    // Verify we're back on settings page
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible()

    console.log('✓ Back button works correctly')
  })
})
