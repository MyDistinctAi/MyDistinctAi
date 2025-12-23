import { test, expect } from '../fixtures'

/**
 * Dashboard E2E Tests
 *
 * Tests the dashboard layout and navigation
 */

test.describe('Dashboard Tests', () => {
  test('should login and verify dashboard layout', async ({ page }) => {
    // Login
    await page.goto('http://localhost:4000/login')

    await page.getByLabel(/email/i).fill('demo@testmail.app')
    await page.getByLabel(/password/i).fill('Demo123456!')

    // Click login button and wait for navigation
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    // Wait for URL to contain /dashboard (simpler approach)
    await page.waitForURL('**/dashboard**', { timeout: 10000 })

    // Wait a bit for page to render
    await page.waitForTimeout(1000)

    console.log('✓ Successfully logged in')

    // Verify sidebar navigation exists (use first() to avoid strict mode violation)
    await expect(page.getByText('MyDistinctAI').first()).toBeVisible()

    // Verify sidebar links (use first() to get sidebar link, not stats card link)
    await expect(page.getByRole('link', { name: /dashboard/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /my models/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /chat/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /training data/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /settings/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /documentation/i }).first()).toBeVisible()

    console.log('✓ Sidebar navigation is visible')

    // Verify welcome message
    await expect(page.getByText(/Welcome back/i)).toBeVisible()
    console.log('✓ Welcome message is visible')

    // Verify Quick Actions section
    await expect(page.getByText('Quick Actions')).toBeVisible()
    console.log('✓ Quick Actions section is visible')

    // Take screenshot of dashboard
    await page.screenshot({ path: 'test-results/dashboard-home.png', fullPage: true })
    console.log('✓ Screenshot saved: dashboard-home.png')
  })

  test('should navigate to models page', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:4000/login')
    await page.getByLabel(/email/i).fill('demo@testmail.app')
    await page.getByLabel(/password/i).fill('Demo123456!')

    // Click login button and wait for navigation
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    // Wait for URL to contain /dashboard (simpler approach)
    await page.waitForURL('**/dashboard**', { timeout: 10000 })

    // Wait a bit for page to render
    await page.waitForTimeout(1000)

    // Navigate to Models page using sidebar (use first() to get sidebar link)
    await page.getByRole('link', { name: /my models/i }).first().click()
    await page.waitForURL('**/dashboard/models**', { timeout: 10000 })
    await page.waitForTimeout(1000)

    console.log('✓ Navigated to Models page')

    // Verify models page content
    await expect(page.getByText('Manage your custom AI models')).toBeVisible()
    await expect(page.getByRole('button', { name: /create new model/i })).toBeVisible()

    // Check if models exist or empty state shown
    const noModelsVisible = await page.getByText('No models yet').isVisible().catch(() => false)
    const hasModels = await page.locator('.bg-white.rounded-lg.shadow-sm').count() > 0

    if (noModelsVisible) {
      console.log('✓ Empty state visible - no models yet')
    } else if (hasModels) {
      console.log('✓ Models list visible - models already exist')
    }

    console.log('✓ Models page content is visible')

    // Take screenshot
    await page.screenshot({ path: 'test-results/dashboard-models.png', fullPage: true })
    console.log('✓ Screenshot saved: dashboard-models.png')
  })

  test('should have functional search bar in header', async ({ page }) => {
    // Login
    await page.goto('http://localhost:4000/login')
    await page.getByLabel(/email/i).fill('demo@testmail.app')
    await page.getByLabel(/password/i).fill('Demo123456!')

    // Click login button and wait for navigation
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    // Wait for URL to contain /dashboard (simpler approach)
    await page.waitForURL('**/dashboard**', { timeout: 10000 })

    // Wait a bit for page to render
    await page.waitForTimeout(1000)

    // Verify search bar exists
    const searchInput = page.getByPlaceholder(/search models/i)
    await expect(searchInput).toBeVisible()

    // Type in search bar
    await searchInput.fill('test model')
    await expect(searchInput).toHaveValue('test model')

    console.log('✓ Search bar is functional')
  })

  test('should create a new model successfully', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:4000/login')
    await page.getByLabel(/email/i).fill('demo@testmail.app')
    await page.getByLabel(/password/i).fill('Demo123456!')

    // Click login button and wait for navigation
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    // Wait for URL to contain /dashboard (simpler approach)
    await page.waitForURL('**/dashboard**', { timeout: 10000 })

    // Wait a bit for page to render
    await page.waitForTimeout(1000)

    console.log('✓ Successfully logged in')

    // Wait for dashboard to fully load
    await page.waitForTimeout(1000)

    // Navigate to Models page
    await page.getByRole('link', { name: /my models/i }).first().click()
    await page.waitForURL('**/dashboard/models**', { timeout: 10000 })
    await page.waitForTimeout(1000)

    console.log('✓ Navigated to Models page')

    // Click "Create New Model" button
    await page.getByRole('button', { name: /create new model/i }).click()

    // Wait for modal to appear (use heading role to be more specific)
    await expect(page.getByRole('heading', { name: 'Create New Model' })).toBeVisible()
    console.log('✓ Create Model modal opened')

    // Fill in the form
    await page.getByLabel(/model name/i).fill('Test AI Model')
    await page.locator('#description').fill('This is a test model for automated testing')

    // Select base model
    await page.locator('#baseModel').selectOption('llama-2-7b')

    // Select training mode - Standard
    await page.getByRole('button', { name: /standard/i }).click()

    // Add personality
    await page.locator('#personality').fill('Professional and helpful assistant')

    console.log('✓ Form filled successfully')

    // Submit the form
    await page.getByRole('button', { name: /create model/i, exact: true }).click()

    // Wait for modal to close and model to appear in list
    await page.waitForTimeout(2000)

    // Verify model was created (use first() to avoid strict mode violation)
    await expect(page.getByText('Test AI Model').first()).toBeVisible()
    await expect(page.getByText('This is a test model for automated testing').first()).toBeVisible()

    console.log('✓ Model created successfully and appears in list')

    // Take screenshot
    await page.screenshot({ path: 'test-results/model-created.png', fullPage: true })
    console.log('✓ Screenshot saved: model-created.png')
  })
})
