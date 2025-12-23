import { test, expect } from '../fixtures'

/**
 * Test login functionality using xray dev route
 */

test.describe('Xray Login Test', () => {
  test('should login using xray route with dsaq', async ({ page }) => {
    // Navigate to xray route (using actual user from database)
    await page.goto('/api/xray/dsaq')

    // Wait for redirect and page load
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Check if we successfully authenticated and landed on dashboard
    const currentURL = page.url()
    console.log('Current URL after xray:', currentURL)

    // Should be on dashboard (indicating successful auth and redirect)
    expect(currentURL).toContain('/dashboard')
  })

  test('should login and access dashboard', async ({ page }) => {
    // Navigate to xray API route
    await page.goto('/api/xray/dsaq')

    // Wait for redirect and auth to complete
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Now navigate to dashboard
    await page.goto('/dashboard')

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Should be on dashboard (not redirected to login)
    const currentURL = page.url()
    console.log('Current URL after dashboard navigation:', currentURL)

    // If we're on dashboard, great! If redirected to login, that's also informative
    const isOnDashboard = currentURL.includes('/dashboard')
    const isOnLogin = currentURL.includes('/login')

    console.log('Is on dashboard:', isOnDashboard)
    console.log('Is on login:', isOnLogin)

    // Take screenshot for visual verification
    await page.screenshot({ path: 'dashboard-after-xray-login.png', fullPage: true })

    // We should be on dashboard, not login
    expect(isOnDashboard).toBe(true)
  })

  test('should show user not found for invalid username', async ({ page }) => {
    // Navigate to xray route with invalid user
    await page.goto('/xray/invaliduser99999')

    // Wait for page load
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Should show error message
    await expect(page.getByText(/user not found/i)).toBeVisible()
  })

  test('should work with different test users', async ({ page }) => {
    const testUsers = ['sadq', 'John']

    for (const username of testUsers) {
      await page.goto(`/api/xray/${username}`)
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      const currentURL = page.url()

      // Should be on dashboard (not on xray or login)
      expect(currentURL).toContain('/dashboard')
      console.log(`✓ ${username} login successful`)
    }
  })
})
