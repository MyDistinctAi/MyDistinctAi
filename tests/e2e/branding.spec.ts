import { test, expect } from '../fixtures'

test.describe('Branding Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:4000/login')

    // Login with existing test credentials
    await page.getByLabel(/email/i).fill('mytest@testmail.app')
    await page.getByLabel(/password/i).fill('password123')

    // Click and wait for navigation
    await Promise.all([
      page.waitForURL('**/dashboard**', { timeout: 10000 }),
      page.getByRole('button', { name: /^sign in$|^log in$|^login$/i }).click()
    ])
  })

  test('should navigate to branding settings page', async ({ page }) => {
    // Navigate to branding settings
    await page.goto('http://localhost:4000/dashboard/settings/branding')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check if branding settings page loaded
    await expect(page.locator('h1')).toContainText('White-Label Branding')
    await expect(page.locator('text=Customize your platform\'s appearance')).toBeVisible()
  })

  test('should display all branding form sections', async ({ page }) => {
    await page.goto('http://localhost:4000/dashboard/settings/branding')
    await page.waitForLoadState('networkidle')

    // Check for Logo section
    await expect(page.locator('text=Logo')).toBeVisible()
    await expect(page.locator('text=Upload Logo')).toBeVisible()

    // Check for Favicon section
    await expect(page.locator('text=Favicon')).toBeVisible()
    await expect(page.locator('text=Upload Favicon')).toBeVisible()

    // Check for Brand Colors section
    await expect(page.locator('text=Brand Colors')).toBeVisible()
    await expect(page.locator('label:has-text("Primary Color")')).toBeVisible()
    await expect(page.locator('label:has-text("Secondary Color")')).toBeVisible()

    // Check for Company Information section
    await expect(page.locator('text=Company Information')).toBeVisible()
    await expect(page.locator('label:has-text("Company Name")')).toBeVisible()
    await expect(page.locator('label:has-text("Custom Domain")')).toBeVisible()

    // Check for Live Preview section
    await expect(page.locator('text=Live Preview')).toBeVisible()
  })

  test('should update company name and see live preview', async ({ page }) => {
    await page.goto('http://localhost:4000/dashboard/settings/branding')
    await page.waitForLoadState('networkidle')

    // Find and fill company name input
    const companyNameInput = page.locator('input#companyName')
    await companyNameInput.fill('Test Company Inc')

    // Check if live preview updates
    const preview = page.locator('text=Test Company Inc').nth(1) // Second occurrence should be in preview
    await expect(preview).toBeVisible()
  })

  test('should update primary color and see live preview', async ({ page }) => {
    await page.goto('http://localhost:4000/dashboard/settings/branding')
    await page.waitForLoadState('networkidle')

    // Update primary color using text input
    const primaryColorInput = page.locator('input#primaryColor').nth(1) // Text input, not color picker
    await primaryColorInput.fill('#ff0000')

    // Wait a moment for preview to update
    await page.waitForTimeout(500)

    // Check if the color is applied in preview (checking style attribute)
    const previewButton = page.locator('button:has-text("Primary Button")')
    await expect(previewButton).toHaveAttribute('style', /background-color:\s*rgb\(255,\s*0,\s*0\)/)
  })

  test('should update secondary color and see live preview', async ({ page }) => {
    await page.goto('http://localhost:4000/dashboard/settings/branding')
    await page.waitForLoadState('networkidle')

    // Update secondary color using text input
    const secondaryColorInput = page.locator('input#secondaryColor').nth(1) // Text input, not color picker
    await secondaryColorInput.fill('#00ff00')

    // Wait a moment for preview to update
    await page.waitForTimeout(500)

    // Check if the color is applied in preview
    const previewText = page.locator('text=Secondary text color preview')
    await expect(previewText).toHaveAttribute('style', /color:\s*rgb\(0,\s*255,\s*0\)/)
  })

  test('should show DNS instructions modal', async ({ page }) => {
    await page.goto('http://localhost:4000/dashboard/settings/branding')
    await page.waitForLoadState('networkidle')

    // Click DNS setup instructions link
    await page.click('text=View DNS Setup Instructions')

    // Check if modal appears
    await expect(page.locator('text=DNS Setup Instructions')).toBeVisible()
    await expect(page.locator('text=Step 1: Add CNAME Record')).toBeVisible()
    await expect(page.locator('text=Step 2: Verify Domain')).toBeVisible()

    // Close modal
    await page.click('button:has-text("Got it")')

    // Modal should be closed
    await expect(page.locator('text=DNS Setup Instructions')).not.toBeVisible()
  })

  test('should validate company name is required', async ({ page }) => {
    await page.goto('http://localhost:4000/dashboard/settings/branding')
    await page.waitForLoadState('networkidle')

    // Clear company name if it has a value
    const companyNameInput = page.locator('input#companyName')
    await companyNameInput.clear()

    // Try to submit
    await page.click('button:has-text("Save Branding Settings")')

    // Check for HTML5 validation message
    const validationMessage = await companyNameInput.evaluate((el: HTMLInputElement) => el.validationMessage)
    expect(validationMessage).toBeTruthy()
  })

  test('should display custom domain in preview', async ({ page }) => {
    await page.goto('http://localhost:4000/dashboard/settings/branding')
    await page.waitForLoadState('networkidle')

    // Fill custom domain
    const domainInput = page.locator('input#domain')
    await domainInput.fill('app.testcompany.com')

    // Wait a moment for preview to update
    await page.waitForTimeout(500)

    // Check if domain appears in preview
    await expect(page.locator('text=https://app.testcompany.com')).toBeVisible()
  })

  test('should show save button', async ({ page }) => {
    await page.goto('http://localhost:4000/dashboard/settings/branding')
    await page.waitForLoadState('networkidle')

    // Check if save button exists
    const saveButton = page.locator('button[type="submit"]:has-text("Save Branding Settings")')
    await expect(saveButton).toBeVisible()
    await expect(saveButton).toBeEnabled()
  })

  test('should have upload buttons for logo and favicon', async ({ page }) => {
    await page.goto('http://localhost:4000/dashboard/settings/branding')
    await page.waitForLoadState('networkidle')

    // Check logo upload button
    const logoUploadButton = page.locator('button:has-text("Upload Logo")')
    await expect(logoUploadButton).toBeVisible()

    // Check favicon upload button
    const faviconUploadButton = page.locator('button:has-text("Upload Favicon")')
    await expect(faviconUploadButton).toBeVisible()
  })

  test('should show live preview section with sample elements', async ({ page }) => {
    await page.goto('http://localhost:4000/dashboard/settings/branding')
    await page.waitForLoadState('networkidle')

    // Check preview elements
    await expect(page.locator('text=Live Preview')).toBeVisible()
    await expect(page.locator('button:has-text("Primary Button")')).toBeVisible()
    await expect(page.locator('text=Secondary text color preview')).toBeVisible()
  })
})
