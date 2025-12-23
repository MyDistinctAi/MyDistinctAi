/**
 * Settings E2E Tests
 *
 * Tests for user settings pages including profile and branding
 */

import { test, expect } from '../fixtures'

test.describe('Settings Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first using test credentials
    await page.goto('http://localhost:4000/login')
    await page.getByLabel(/email/i).fill('demo@testmail.app')
    await page.getByLabel(/password/i).fill('Demo123456!')

    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await page.waitForURL('**/dashboard**', { timeout: 10000 })

    console.log('✓ Successfully logged in')
  })

  test('should display settings page with all options', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Navigate to settings
    await page.goto('http://localhost:4000/dashboard/settings')
    await page.waitForLoadState('networkidle')

    // Check for settings header (use exact match to avoid multiple elements)
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible()

    // Check for all setting sections
    await expect(page.getByText('White-Label Branding')).toBeVisible()
    await expect(page.getByRole('link', { name: /profile settings/i })).toBeVisible()
    await expect(page.getByText('Notifications')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'API Keys' })).toBeVisible()

    console.log('✓ Settings page displays all options')
  })

  test('should navigate to profile settings', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Navigate to settings
    await page.goto('http://localhost:4000/dashboard/settings')
    await page.waitForLoadState('networkidle')

    // Click on Profile Settings
    await page.getByRole('link', { name: /profile settings/i }).click()
    await page.waitForURL('**/dashboard/settings/profile**', { timeout: 10000 })

    // Verify page loaded
    await expect(
      page.getByRole('heading', { name: 'Profile Settings' })
    ).toBeVisible()

    console.log('✓ Navigated to Profile Settings')
  })

  test('should display profile form with user data', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Navigate directly to profile settings
    await page.goto('http://localhost:4000/dashboard/settings/profile')
    await page.waitForLoadState('networkidle')

    // Check for form fields
    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.getByLabel(/email address/i)).toBeVisible()
    await expect(page.getByLabel(/industry\/niche/i)).toBeVisible()

    // Check that email is disabled
    const emailInput = page.getByLabel(/email address/i)
    await expect(emailInput).toBeDisabled()

    console.log('✓ Profile form displays correctly')
  })

  test('should update profile name', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Navigate to profile settings
    await page.goto('http://localhost:4000/dashboard/settings/profile')
    await page.waitForLoadState('networkidle')

    // Update name
    const nameInput = page.getByLabel(/full name/i)
    await nameInput.clear()
    await nameInput.fill('Test User Updated')

    // Save changes
    await page.getByRole('button', { name: /save changes/i }).click()

    // Wait for success message
    await expect(
      page.getByText(/changes saved successfully/i)
    ).toBeVisible({ timeout: 10000 })

    console.log('✓ Profile name updated successfully')
  })

  test('should update profile niche', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Navigate to profile settings
    await page.goto('http://localhost:4000/dashboard/settings/profile')
    await page.waitForLoadState('networkidle')

    // Select niche
    const nicheSelect = page.getByLabel(/industry\/niche/i)
    await nicheSelect.selectOption('technology')

    // Save changes
    await page.getByRole('button', { name: /save changes/i }).click()

    // Wait for success message
    await expect(
      page.getByText(/changes saved successfully/i)
    ).toBeVisible({ timeout: 10000 })

    console.log('✓ Profile niche updated successfully')
  })

  test('should validate password change form', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Navigate to profile settings
    await page.goto('http://localhost:4000/dashboard/settings/profile')
    await page.waitForLoadState('networkidle')

    // Find password section
    await expect(page.getByRole('heading', { name: 'Change Password' })).toBeVisible()

    // Check password fields (use first() to handle duplicates)
    await expect(page.getByLabel('New Password').first()).toBeVisible()
    await expect(page.getByLabel('Confirm New Password')).toBeVisible()

    // Password button should be disabled initially
    const updatePasswordButton = page.getByRole('button', { name: /update password/i })
    await expect(updatePasswordButton).toBeDisabled()

    console.log('✓ Password change form validated')
  })

  test('should show error for mismatched passwords', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Navigate to profile settings
    await page.goto('http://localhost:4000/dashboard/settings/profile')
    await page.waitForLoadState('networkidle')

    // Fill in mismatched passwords
    await page.getByLabel(/^new password/i).fill('NewPassword123!')
    await page.getByLabel(/confirm new password/i).fill('DifferentPassword123!')

    // Try to update
    await page.getByRole('button', { name: /update password/i }).click()

    // Should show error
    await expect(page.getByText(/passwords do not match/i)).toBeVisible()

    console.log('✓ Password mismatch error displayed')
  })

  test('should show error for short password', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Navigate to profile settings
    await page.goto('http://localhost:4000/dashboard/settings/profile')
    await page.waitForLoadState('networkidle')

    // Fill in short password
    await page.getByLabel(/^new password/i).fill('Short1!')
    await page.getByLabel(/confirm new password/i).fill('Short1!')

    // Try to update
    await page.getByRole('button', { name: /update password/i }).click()

    // Should show error
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible()

    console.log('✓ Short password error displayed')
  })

  test('should display account actions section', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Navigate to profile settings
    await page.goto('http://localhost:4000/dashboard/settings/profile')
    await page.waitForLoadState('networkidle')

    // Check for account actions
    await expect(page.getByRole('heading', { name: 'Account Actions' })).toBeVisible()
    await expect(page.getByText(/permanently delete your account/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /delete account/i })).toBeVisible()

    console.log('✓ Account actions section displayed')
  })

  test('should have back button on profile settings', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Navigate to profile settings
    await page.goto('http://localhost:4000/dashboard/settings/profile')
    await page.waitForLoadState('networkidle')

    // Click back button
    await page.getByRole('button', { name: /back to settings/i }).click()
    await page.waitForURL('**/dashboard/settings**', { timeout: 10000 })

    // Verify we're back on settings page
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible()

    console.log('✓ Back button works correctly')
  })
})
