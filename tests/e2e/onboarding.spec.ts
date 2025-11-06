/**
 * E2E Tests for Onboarding Flow
 */

import { test, expect } from '../fixtures'

test.beforeEach(async ({ page }) => {
  // Clear localStorage BEFORE login to ensure onboarding triggers
  await page.goto('http://localhost:4000')
  await page.evaluate(() => localStorage.clear())

  // Login using xray API
  await page.goto('http://localhost:4000/api/xray/johndoe')
  await page.waitForTimeout(3000) // Increased wait for page to render

  // Wait for redirect to dashboard to complete
  await page.waitForURL('**/dashboard**', { timeout: 15000 })

  // Wait for onboarding modal to render (OnboardingWrapper has 500ms delay + animation)
  await page.waitForTimeout(1500)
})

test.describe('Onboarding Flow', () => {
  test('should display onboarding modal for first-time users', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    // Wait for onboarding modal to appear with increased timeout
    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible({ timeout: 15000 })

    // Check modal elements
    await expect(page.getByText('Step 1 of 5')).toBeVisible()
    await expect(page.getByRole('button', { name: /skip tour/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeVisible()
  })

  test('should show correct content for step 1', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible({ timeout: 10000 })

    // Check step 1 content
    await expect(
      page.getByText('Your private AI studio where you can create custom AI models')
    ).toBeVisible()
    await expect(page.getByText('Your data never leaves your device')).toBeVisible()
    await expect(page.getByText('GDPR and HIPAA compliant')).toBeVisible()
  })

  test('should navigate to next step', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible({ timeout: 10000 })

    // Click next button
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.waitForTimeout(800)

    // Check step 2 content
    await expect(page.getByText('Step 2 of 5')).toBeVisible()
    await expect(page.getByText('Upload Your Knowledge')).toBeVisible()
    await expect(page.getByText('Supported formats: PDF, DOCX, TXT, MD, CSV')).toBeVisible()
  })

  test('should navigate to previous step', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible({ timeout: 10000 })

    // Go to step 2
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.waitForTimeout(800)
    await expect(page.getByText('Step 2 of 5')).toBeVisible()

    // Go back to step 1
    await page.getByRole('button', { name: /previous/i }).click()
    await page.waitForTimeout(800)

    // Check we're back to step 1
    await expect(page.getByText('Step 1 of 5')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible()
  })

  test('should disable previous button on first step', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible({ timeout: 10000 })

    // Previous button should be disabled
    const previousButton = page.getByRole('button', { name: /previous/i })
    await expect(previousButton).toBeDisabled()
  })

  test('should show progress bar', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible({ timeout: 10000 })

    // Progress bar should be visible and show 20% (step 1 of 5)
    const progressBar = page.locator('.h-2.bg-blue-600')
    await expect(progressBar).toBeVisible()

    // Check progress increases when moving to next step
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.waitForTimeout(800)

    // Now should show 40% (step 2 of 5)
    await expect(page.getByText('Step 2 of 5')).toBeVisible()
  })

  test('should show step indicators', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible({ timeout: 10000 })

    // Step indicators should be visible (5 dots)
    const indicators = page.locator('button[aria-label^="Go to step"]')
    await expect(indicators).toHaveCount(5)
  })

  test('should allow clicking on step indicators', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible({ timeout: 10000 })

    // Click on step 3 indicator
    await page.getByLabel('Go to step 3').click()
    await page.waitForTimeout(800)

    // Should be on step 3
    await expect(page.getByText('Step 3 of 5')).toBeVisible()
    await expect(page.getByText('Create Your Model')).toBeVisible()
  })

  test('should navigate through all steps', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible({ timeout: 10000 })

    // Step 1
    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.waitForTimeout(800)

    // Step 2
    await expect(page.getByText('Upload Your Knowledge')).toBeVisible()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.waitForTimeout(800)

    // Step 3
    await expect(page.getByText('Create Your Model')).toBeVisible()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.waitForTimeout(800)

    // Step 4
    await expect(page.getByRole('heading', { name: 'Start Chatting' })).toBeVisible()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.waitForTimeout(800)

    // Step 5
    await expect(page.getByText('Explore Features')).toBeVisible()
  })

  test('should show complete button on last step', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible({ timeout: 10000 })

    // Navigate to last step
    await page.getByLabel('Go to step 5').click()
    await page.waitForTimeout(500)

    // Should show "Complete" button instead of "Next"
    await expect(page.getByRole('button', { name: /complete/i })).toBeVisible()
  })

  test('should close modal on skip', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible({ timeout: 10000 })

    // Click skip tour
    await page.getByRole('button', { name: /skip tour/i }).click()
    await page.waitForTimeout(800)

    // Modal should be closed
    await expect(page.getByText('Welcome to MyDistinctAI')).not.toBeVisible()
  })

  test('should close modal on X button click', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible({ timeout: 10000 })

    // Click close button
    await page.getByLabel('Close onboarding').click()
    await page.waitForTimeout(800)

    // Modal should be closed
    await expect(page.getByText('Welcome to MyDistinctAI')).not.toBeVisible()
  })

  test('should complete onboarding and close modal', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible({ timeout: 10000 })

    // Navigate to last step
    await page.getByLabel('Go to step 5').click()
    await page.waitForTimeout(800)

    // Click complete
    await page.getByRole('button', { name: /complete/i }).click()
    await page.waitForTimeout(1200)

    // Modal should be closed
    await expect(page.getByText('Welcome to MyDistinctAI')).not.toBeVisible()
  })

  test('should not show onboarding on subsequent visits', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible({ timeout: 10000 })

    // Complete onboarding
    await page.getByLabel('Go to step 5').click()
    await page.waitForTimeout(800)
    await page.getByRole('button', { name: /complete/i }).click()
    await page.waitForTimeout(1200)

    // Reload page
    await page.reload()
    await page.waitForTimeout(3000) // Wait for page to render

    // Onboarding should not appear
    await expect(page.getByText('Welcome to MyDistinctAI')).not.toBeVisible({
      timeout: 5000,
    })
  })

  test('should display all 5 steps with correct titles', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible({ timeout: 10000 })

    const steps = [
      { step: 1, title: 'Welcome to MyDistinctAI' },
      { step: 2, title: 'Upload Your Knowledge' },
      { step: 3, title: 'Create Your Model' },
      { step: 4, title: 'Start Chatting' },
      { step: 5, title: 'Explore Features' },
    ]

    for (const { step, title } of steps) {
      await page.getByLabel(`Go to step ${step}`).click()
      await page.waitForTimeout(800)
      // Use .first() for titles that might match multiple headings
      await expect(page.getByText(title).first()).toBeVisible()
    }
  })

  test('should show tips for each step', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000)

    await expect(page.getByRole('heading', { name: 'Welcome to MyDistinctAI' }).first()).toBeVisible({ timeout: 10000 })

    // Step 1 - Key Benefits
    await expect(page.getByText('Key Benefits')).toBeVisible()

    // Step 2 - Tips
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.waitForTimeout(800)
    await expect(page.getByText('Tips')).toBeVisible()

    // Step 3 - Tips
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.waitForTimeout(800)
    await expect(page.getByText('Tips')).toBeVisible()
  })
})
