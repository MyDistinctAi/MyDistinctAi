/**
 * Playwright Test Fixtures
 *
 * Global fixtures and helper functions for all E2E tests
 */

import { test as base, Page } from '@playwright/test'

// Extend base test with custom fixtures
export const test = base.extend({
  // Custom page fixture that skips onboarding modal
  page: async ({ page }, use) => {
    // Set up: Mark onboarding as completed before each test
    await page.addInitScript(() => {
      window.localStorage.setItem('onboarding_completed', 'true')
    })

    // Use the page in the test
    await use(page)

    // Teardown (if needed)
  },
})

export { expect } from '@playwright/test'

/**
 * Wait for dashboard navigation with proper timeout handling
 *
 * Uses 'domcontentloaded' instead of 'load' to avoid waiting for all resources.
 * Dashboard page takes >15s for full 'load' event, but DOM is ready much faster.
 *
 * @param page - Playwright Page object
 * @param timeout - Optional timeout in ms (default: 60000)
 */
export async function waitForDashboard(page: Page, timeout = 60000) {
  await page.waitForURL('**/dashboard**', {
    timeout,
    waitUntil: 'domcontentloaded'
  })
  await page.waitForTimeout(2000) // Wait for DOM to render
}

/**
 * Login helper that waits for dashboard correctly
 *
 * @param page - Playwright Page object
 * @param email - User email
 * @param password - User password
 */
export async function loginAndWaitForDashboard(
  page: Page,
  email: string,
  password: string
) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)

  // Click login and wait for dashboard using domcontentloaded
  await Promise.all([
    waitForDashboard(page),
    page.getByRole('button', { name: 'Sign In', exact: true }).click(),
  ])
}

/**
 * Fast test authentication using API route
 *
 * This bypasses the login form and directly calls the test-auth API
 * which sets cookies server-side. Much faster than UI login for tests.
 *
 * @param page - Playwright Page object
 * @param username - Username to authenticate as (e.g., 'dsaq')
 */
export async function testAuthLogin(page: Page, username: string = 'dsaq') {
  // Call the test-auth API which sets cookies directly
  const response = await page.request.get(`/api/test-auth/${username}`)

  if (!response.ok()) {
    throw new Error(`Test auth failed: ${response.status()} ${await response.text()}`)
  }

  const data = await response.json()

  // Navigate to dashboard - cookies are already set
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1000) // Wait for DOM to render

  return data.user
}
