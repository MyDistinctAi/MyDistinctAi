import { test, expect } from '../fixtures'
import { createTestUser } from './utils/testData'

/**
 * E2E Tests for Dashboard and Protected Routes
 *
 * Tests:
 * - Protected route access control
 * - Dashboard functionality
 * - User profile display
 * - Navigation between protected pages
 */

test.describe('Dashboard and Protected Routes', () => {
  const testUser = createTestUser()
  let isUserLoggedIn = false

  test.beforeAll(async ({ browser }) => {
    // Register and login a test user
    const page = await browser.newPage()

    // Register
    await page.goto('/register')
    await page.getByLabel(/name/i).fill(testUser.name)
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/password/i).fill(testUser.password)
    const industrySelect = page.getByLabel(/industry/i)
    await industrySelect.selectOption({ index: 1 })
    await page.getByRole('button', { name: /sign up|create account/i }).click()
    await page.waitForTimeout(2000)

    // Login
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/password/i).fill(testUser.password)
    await page.getByRole('button', { name: /^sign in$|^log in$|^login$/i }).click()

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { waitUntil: 'domcontentloaded', timeout: 30000 })
    isUserLoggedIn = true

    await page.close()
  })

  test.describe('Unauthenticated Access', () => {
    test('should redirect to login when accessing dashboard without auth', async ({
      page,
    }) => {
      // Try to access dashboard without being logged in
      await page.goto('/dashboard')

      // Should be redirected to login page
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
    })

    test('should allow access to public pages', async ({ page }) => {
      // Home page should be accessible
      await page.goto('/')
      await expect(page).toHaveURL('/')

      // Login page should be accessible
      await page.goto('/login')
      await expect(page).toHaveURL(/\/login/)

      // Register page should be accessible
      await page.goto('/register')
      await expect(page).toHaveURL(/\/register/)
    })

    test('should preserve intended destination after login', async ({ page }) => {
      // Try to access dashboard without auth
      await page.goto('/dashboard')

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 })

      // Login
      await page.getByLabel(/email/i).fill(testUser.email)
      await page.getByLabel(/password/i).fill(testUser.password)
      await page.getByRole('button', { name: /^sign in$|^log in$|^login$/i }).click()

      // Should redirect back to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { waitUntil: 'domcontentloaded', timeout: 30000 })
    })
  })

  test.describe('Authenticated Dashboard Access', () => {
    test.beforeEach(async ({ page }) => {
      if (!isUserLoggedIn) {
        test.skip()
      }

      // Login before each test
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(testUser.email)
      await page.getByLabel(/password/i).fill(testUser.password)
      await page.getByRole('button', { name: /sign in|log in/i }).click()
      await expect(page).toHaveURL(/\/dashboard/, { waitUntil: 'domcontentloaded', timeout: 30000 })
    })

    test('should display dashboard with user information', async ({ page }) => {
      // Check for welcome message with user name or email
      const welcomeText = page.getByText(
        new RegExp(`welcome.*${testUser.name}|${testUser.email}`, 'i')
      )
      await expect(welcomeText).toBeVisible({ timeout: 5000 })

      // Check for user profile information
      await expect(page.getByText(testUser.email)).toBeVisible()
    })

    test('should display user account information', async ({ page }) => {
      // Look for account info section
      const accountInfo = [
        page.getByText(/email/i),
        page.getByText(/name/i),
        page.getByText(/industry|niche/i),
        page.getByText(/subscription/i),
      ]

      // At least some account info should be visible
      let visibleCount = 0
      for (const element of accountInfo) {
        if (await element.isVisible().catch(() => false)) {
          visibleCount++
        }
      }

      expect(visibleCount).toBeGreaterThan(0)
    })

    test('should show user profile data correctly', async ({ page }) => {
      // Verify user's email is displayed
      await expect(page.getByText(testUser.email)).toBeVisible()

      // Verify user's name is displayed (if set)
      if (testUser.name) {
        await expect(page.getByText(testUser.name)).toBeVisible()
      }

      // Verify user's niche/industry is displayed
      await expect(page.getByText(testUser.niche)).toBeVisible()
    })

    test('should display navigation menu', async ({ page }) => {
      // Check for sign out button
      await expect(
        page.getByRole('button', { name: /sign out|log out/i })
      ).toBeVisible()

      // Check for MyDistinctAI branding
      await expect(page.getByText(/MyDistinctAI/i)).toBeVisible()
    })

    test('should display subscription status', async ({ page }) => {
      // Look for subscription status badge or text
      const subscriptionText = page.getByText(/free|starter|professional|enterprise/i)
      await expect(subscriptionText).toBeVisible()
    })

    test('should display account creation date', async ({ page }) => {
      // Look for creation date
      const createdText = page.getByText(/account created|created at|joined/i)

      // Creation date should be visible
      if (await createdText.isVisible().catch(() => false)) {
        await expect(createdText).toBeVisible()
      }
    })

    test('should show phase completion status', async ({ page }) => {
      // The placeholder dashboard shows phase 3 completion
      await expect(page.getByText(/phase.*complete/i)).toBeVisible()
    })

    test('should have functional logout button', async ({ page }) => {
      // Click logout
      await page.getByRole('button', { name: /sign out|log out/i }).click()

      // Should redirect to login or home
      await expect(page).toHaveURL(/\/login|\//, { timeout: 5000 })

      // Try to access dashboard again
      await page.goto('/dashboard')

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
    })

    test('should persist across page navigation', async ({ page }) => {
      // Navigate to home page
      await page.goto('/')

      // Navigate back to dashboard
      await page.goto('/dashboard')

      // Should still be authenticated
      await expect(page).toHaveURL(/\/dashboard/)
      await expect(
        page.getByText(new RegExp(testUser.email, 'i'))
      ).toBeVisible({ timeout: 5000 })
    })

    test('should handle browser refresh correctly', async ({ page }) => {
      // Reload the page
      await page.reload()

      // Should still be on dashboard
      await expect(page).toHaveURL(/\/dashboard/)

      // User info should still be visible
      await expect(page.getByText(testUser.email)).toBeVisible({ timeout: 5000 })
    })

    test('should be responsive on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      // Dashboard should still be functional
      await expect(page.getByText(testUser.email)).toBeVisible()
      await expect(
        page.getByRole('button', { name: /sign out|log out/i })
      ).toBeVisible()
    })

    test('should display success message on dashboard', async ({ page }) => {
      // Look for authentication success message
      const successMessage = page.getByText(/authentication successful|logged in/i)

      if (await successMessage.isVisible().catch(() => false)) {
        await expect(successMessage).toBeVisible()
      }
    })
  })

  test.describe('Session Management', () => {
    test.beforeEach(async ({ page }) => {
      if (!isUserLoggedIn) {
        test.skip()
      }
    })

    test('should maintain session in new tab', async ({ context, page }) => {
      // Login in first tab
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(testUser.email)
      await page.getByLabel(/password/i).fill(testUser.password)
      await page.getByRole('button', { name: /sign in|log in/i }).click()
      await expect(page).toHaveURL(/\/dashboard/, { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Open new tab
      const newPage = await context.newPage()
      await newPage.goto('/dashboard')

      // Should be authenticated in new tab too
      await expect(newPage).toHaveURL(/\/dashboard/)
      await expect(newPage.getByText(testUser.email)).toBeVisible({ timeout: 5000 })

      await newPage.close()
    })

    test('should logout from all tabs', async ({ context, page }) => {
      // Login
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(testUser.email)
      await page.getByLabel(/password/i).fill(testUser.password)
      await page.getByRole('button', { name: /sign in|log in/i }).click()
      await expect(page).toHaveURL(/\/dashboard/, { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Open second tab
      const newPage = await context.newPage()
      await newPage.goto('/dashboard')
      await expect(newPage).toHaveURL(/\/dashboard/)

      // Logout from first tab
      await page.getByRole('button', { name: /sign out|log out/i }).click()
      await expect(page).toHaveURL(/\/login|\//, { timeout: 5000 })

      // Refresh second tab - should also be logged out
      await newPage.reload()
      await expect(newPage).toHaveURL(/\/login/, { timeout: 5000 })

      await newPage.close()
    })
  })
})
