/**
 * Playwright Test Fixtures
 *
 * Global fixtures for all E2E tests
 */

import { test as base } from '@playwright/test'

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
