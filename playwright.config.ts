import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Configuration for MyDistinctAI E2E Tests
 *
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run for
  timeout: 60 * 1000, // Increased to 60s for dashboard load times

  // Expect timeout for assertions
  expect: {
    timeout: 10 * 1000, // 10s for assertions
  },

  // Test configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html'],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:4000',

    // Action timeout (clicking, filling, etc.)
    actionTimeout: 15 * 1000, // 15s for actions

    // Navigation timeout (goto, waitForURL, etc.)
    navigationTimeout: 30 * 1000, // 30s for navigation/redirects

    // Wait until DOM is ready (not waiting for all resources to load)
    // This fixes dashboard redirect timeouts where page navigates but "load" event takes too long
    waitUntil: 'domcontentloaded',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Run your local dev server before starting the tests
  // webServer: {
  //   command: 'set PORT=4000 && npm run dev',
  //   url: 'http://localhost:4000',
  //   reuseExistingServer: true,
  //   timeout: 120 * 1000,
  // },
})
