import { test, expect } from '../fixtures'
import { createTestUser } from './utils/testData'

/**
 * Simple login test with email confirmation disabled
 */

test.describe('Simple Login Test', () => {
  const testUser = createTestUser()

  test('should register and login immediately', async ({ page }) => {
    // Step 1: Register
    await page.goto('/register')

    await page.getByLabel(/name/i).fill(testUser.name)
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/password/i).fill(testUser.password)

    const industrySelect = page.getByLabel(/industry/i)
    await industrySelect.selectOption({ index: 1 })

    await page.getByRole('button', { name: /sign up|create account/i }).click()

    // Wait for success or redirect
    await page.waitForTimeout(2000)

    // Step 2: Login (should work immediately with email confirmation disabled)
    await page.goto('/login')

    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/password/i).fill(testUser.password)

    // Click and wait for navigation to complete
    await Promise.all([
      page.waitForURL('**/dashboard**', { timeout: 10000 }),
      page.getByRole('button', { name: /^sign in$|^log in$|^login$/i }).click()
    ])

    // Should be on dashboard
    const currentURL = page.url()
    console.log('Current URL after login:', currentURL)

    expect(currentURL).toContain('/dashboard')

    // Verify we see the dashboard content
    await expect(page.getByText(/welcome/i)).toBeVisible({ timeout: 5000 })
  })
})
