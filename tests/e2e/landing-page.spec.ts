import { test, expect } from '../fixtures'

test.describe('Landing Page', () => {
  test('should load and display all main sections', async ({ page }) => {
    await page.goto('/')

    // Check Hero section
    await expect(page.getByRole('heading', { name: /Build your own GPT/i })).toBeVisible()
    await expect(page.getByText(/offline, encrypted/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /Start Free Trial/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Book Demo/i })).toBeVisible()

    // Check trust badges
    await expect(page.getByText('AES-256')).toBeVisible()
    await expect(page.getByText('GDPR/HIPAA')).toBeVisible()
    await expect(page.getByText('Self-Hosted')).toBeVisible()

    // Check social proof
    await expect(page.getByText(/500\+/)).toBeVisible()
    await expect(page.getByText(/Enterprises Trust Us/i)).toBeVisible()
  })

  test('should display Features section with 3 key differentiators', async ({ page }) => {
    await page.goto('/')

    // Check section header
    await expect(page.getByRole('heading', { name: /Three Key Differentiators/i })).toBeVisible()

    // Check all 3 features
    await expect(page.getByRole('heading', { name: /Local-First AI/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Enterprise-Grade Security/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Deploy Your Way/i })).toBeVisible()

    // Check comparison table
    await expect(page.getByRole('heading', { name: /Local AI vs Cloud AI/i })).toBeVisible()
  })

  test('should display How It Works section with 3 steps', async ({ page }) => {
    await page.goto('/')

    // Check section header
    await expect(page.getByRole('heading', { name: /How It Works/i })).toBeVisible()

    // Check all 3 steps
    await expect(page.getByRole('heading', { name: /Upload Your Knowledge/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Customize Your Tone/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Launch Your Private GPT/i })).toBeVisible()
  })

  test('should display Audience Tabs and allow switching', async ({ page }) => {
    await page.goto('/')

    // Check section header
    await expect(
      page.getByRole('heading', { name: /Built for Professionals Who Value Privacy/i })
    ).toBeVisible()

    // Check tabs are visible
    await expect(page.getByRole('button', { name: /Creators/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Lawyers/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Hospitals/i })).toBeVisible()

    // Default tab (Creators) should show content
    await expect(page.getByRole('heading', { name: /Protect Your Creative IP/i })).toBeVisible()

    // Switch to Lawyers tab
    await page.getByRole('button', { name: /Lawyers/i }).click()
    await expect(
      page.getByRole('heading', { name: /Confidential Document Processing/i })
    ).toBeVisible()

    // Switch to Hospitals tab
    await page.getByRole('button', { name: /Hospitals/i }).click()
    await expect(
      page.getByRole('heading', { name: /HIPAA-Compliant Patient Data/i })
    ).toBeVisible()
  })

  test('should display and submit Waitlist Form', async ({ page }) => {
    await page.goto('/')

    // Check section header
    await expect(page.getByRole('heading', { name: /Join the Waitlist/i })).toBeVisible()

    // Check form fields are visible
    await expect(page.getByLabel(/Full Name/i)).toBeVisible()
    await expect(page.getByLabel(/Email Address/i)).toBeVisible()
    await expect(page.getByLabel(/What best describes you/i)).toBeVisible()

    // Fill out form
    await page.getByLabel(/Full Name/i).fill('Test User')
    await page.getByLabel(/Email Address/i).fill(`test${Date.now()}@example.com`)
    await page.getByLabel(/What best describes you/i).selectOption('creators')

    // Submit form
    await page.getByRole('button', { name: /Join Waitlist/i }).click()

    // Check success message
    await expect(page.getByRole('heading', { name: /You're on the list!/i })).toBeVisible({
      timeout: 10000,
    })
  })

  test('should display Footer with all sections', async ({ page }) => {
    await page.goto('/')

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Check brand name
    await expect(page.getByRole('heading', { name: /MyDistinctAI/i }).last()).toBeVisible()

    // Check footer sections
    await expect(page.getByText('Product')).toBeVisible()
    await expect(page.getByText('Company')).toBeVisible()
    await expect(page.getByText('Resources')).toBeVisible()
    await expect(page.getByText('Legal')).toBeVisible()

    // Check copyright
    await expect(page.getByText(/© \d{4} MyDistinctAI/)).toBeVisible()
  })

  test('CTAs should navigate to correct pages', async ({ page }) => {
    await page.goto('/')

    // Click "Start Free Trial" button
    const startTrialButton = page.getByRole('link', { name: /Start Free Trial/i }).first()
    await expect(startTrialButton).toHaveAttribute('href', '/register')

    // Check "Book Demo" button
    const bookDemoButton = page.getByRole('link', { name: /Book Demo/i })
    await expect(bookDemoButton).toHaveAttribute('href', '#demo')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check main sections are still visible on mobile
    await expect(page.getByRole('heading', { name: /Build your own GPT/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Three Key Differentiators/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /How It Works/i })).toBeVisible()
  })
})
