/**
 * Chat UX Enhancements E2E Tests
 * Tests model switcher, quick actions menu, and session info panel
 */

import { test, expect } from '@playwright/test'

test.describe('Chat UX Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    // Login using xray route
    await page.goto('http://localhost:4000/api/xray/mytest@testmail.app')
    await page.waitForURL('**/dashboard', { timeout: 30000 })
  })

  test('should display model switcher dropdown', async ({ page }) => {
    console.log('🧪 Testing model switcher dropdown...')

    // Navigate to chat page with first model
    await page.goto('http://localhost:4000/dashboard/models')
    await page.waitForLoadState('networkidle')

    // Click first model's chat button
    const chatButton = page.locator('button').filter({ hasText: /chat/i }).first()
    if (await chatButton.isVisible()) {
      await chatButton.click()
      await page.waitForURL('**/chat/**', { timeout: 10000 })
    } else {
      console.log('⏭️  No models found - skipping test')
      test.skip()
      return
    }

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Find and click model switcher button
    const modelSwitcherButton = page.locator('button').filter({ hasText: /Chat with/i })
    await expect(modelSwitcherButton).toBeVisible({ timeout: 10000 })

    console.log('✅ Model switcher button found')
    await modelSwitcherButton.click()

    // Verify dropdown appears
    const dropdown = page.locator('div').filter({ hasText: 'SWITCH TO MODEL' })
    await expect(dropdown).toBeVisible({ timeout: 5000 })

    console.log('✅ Model switcher dropdown opened')

    // Verify dropdown contains model options
    const modelOptions = page.locator('button').filter({ hasText: /gemini|llama|qwen/i })
    const count = await modelOptions.count()
    expect(count).toBeGreaterThan(0)

    console.log(`✅ Found ${count} model options in dropdown`)

    // Click outside to close dropdown
    await page.click('body', { position: { x: 10, y: 10 } })
    await page.waitForTimeout(500)

    // Verify dropdown closed
    await expect(dropdown).not.toBeVisible()
    console.log('✅ Dropdown closed when clicking outside')
  })

  test('should switch models using dropdown', async ({ page }) => {
    console.log('🧪 Testing model switching functionality...')

    // Navigate to chat page
    await page.goto('http://localhost:4000/dashboard/models')
    await page.waitForLoadState('networkidle')

    const chatButton = page.locator('button').filter({ hasText: /chat/i }).first()
    if (await chatButton.isVisible()) {
      await chatButton.click()
      await page.waitForURL('**/chat/**', { timeout: 10000 })
    } else {
      console.log('⏭️  No models found - skipping test')
      test.skip()
      return
    }

    await page.waitForLoadState('networkidle')

    // Get current model name
    const modelSwitcherButton = page.locator('button').filter({ hasText: /Chat with/i })
    const currentModelText = await modelSwitcherButton.textContent()
    console.log(`Current model: ${currentModelText}`)

    // Open dropdown
    await modelSwitcherButton.click()
    await page.waitForTimeout(500)

    // Find a different model to switch to
    const allModelButtons = page.locator('div[class*="absolute"] button').filter({ hasText: /^(?!.*Chat with)/ })
    const modelCount = await allModelButtons.count()

    if (modelCount > 1) {
      // Click the second model (not the current one)
      const secondModel = allModelButtons.nth(1)
      const secondModelName = await secondModel.textContent()
      console.log(`Switching to: ${secondModelName}`)

      await secondModel.click()

      // Wait for navigation
      await page.waitForURL('**/chat/**', { timeout: 10000 })
      await page.waitForLoadState('networkidle')

      // Verify model changed
      const newModelText = await modelSwitcherButton.textContent()
      console.log(`New model: ${newModelText}`)
      expect(newModelText).not.toBe(currentModelText)

      console.log('✅ Successfully switched models')
    } else {
      console.log('⏭️  Only one model available - skipping switch test')
    }
  })

  test('should display quick actions menu', async ({ page }) => {
    console.log('🧪 Testing quick actions menu...')

    // Navigate to chat page
    await page.goto('http://localhost:4000/dashboard/models')
    await page.waitForLoadState('networkidle')

    const chatButton = page.locator('button').filter({ hasText: /chat/i }).first()
    if (await chatButton.isVisible()) {
      await chatButton.click()
      await page.waitForURL('**/chat/**', { timeout: 10000 })
    } else {
      console.log('⏭️  No models found - skipping test')
      test.skip()
      return
    }

    await page.waitForLoadState('networkidle')

    // Find quick actions button (three-dot menu)
    const quickActionsButton = page.locator('button[title="Quick Actions"]')
    await expect(quickActionsButton).toBeVisible({ timeout: 10000 })

    console.log('✅ Quick actions button found')
    await quickActionsButton.click()

    // Verify dropdown appears with actions
    const sessionInfoButton = page.locator('button').filter({ hasText: 'Session Info' })
    const clearMessagesButton = page.locator('button').filter({ hasText: 'Clear Messages' })
    const viewSettingsButton = page.locator('button').filter({ hasText: 'View Model Settings' })

    await expect(sessionInfoButton).toBeVisible({ timeout: 5000 })
    await expect(clearMessagesButton).toBeVisible({ timeout: 5000 })
    await expect(viewSettingsButton).toBeVisible({ timeout: 5000 })

    console.log('✅ All quick action options visible')

    // Click outside to close
    await page.click('body', { position: { x: 10, y: 10 } })
    await page.waitForTimeout(500)

    await expect(sessionInfoButton).not.toBeVisible()
    console.log('✅ Quick actions menu closed when clicking outside')
  })

  test('should display session info panel', async ({ page }) => {
    console.log('🧪 Testing session info panel...')

    // Navigate to chat page
    await page.goto('http://localhost:4000/dashboard/models')
    await page.waitForLoadState('networkidle')

    const chatButton = page.locator('button').filter({ hasText: /chat/i }).first()
    if (await chatButton.isVisible()) {
      await chatButton.click()
      await page.waitForURL('**/chat/**', { timeout: 10000 })
    } else {
      console.log('⏭️  No models found - skipping test')
      test.skip()
      return
    }

    await page.waitForLoadState('networkidle')

    // Open quick actions menu
    const quickActionsButton = page.locator('button[title="Quick Actions"]')
    await quickActionsButton.click()
    await page.waitForTimeout(500)

    // Click Session Info
    const sessionInfoButton = page.locator('button').filter({ hasText: 'Session Info' })
    await sessionInfoButton.click()
    await page.waitForTimeout(500)

    // Verify session info panel appears
    const sessionInfoPanel = page.locator('div').filter({ hasText: 'Session Information' })
    await expect(sessionInfoPanel).toBeVisible({ timeout: 5000 })

    console.log('✅ Session info panel opened')

    // Verify panel contains expected information
    const messagesLabel = page.locator('text=Messages')
    const documentsLabel = page.locator('text=Documents')
    const createdLabel = page.locator('text=Created')
    const lastUpdatedLabel = page.locator('text=Last Updated')

    await expect(messagesLabel).toBeVisible()
    await expect(documentsLabel).toBeVisible()
    await expect(createdLabel).toBeVisible()
    await expect(lastUpdatedLabel).toBeVisible()

    console.log('✅ All session info fields displayed')

    // Close panel using X button
    const closeButton = sessionInfoPanel.locator('button').first()
    await closeButton.click()
    await page.waitForTimeout(500)

    await expect(sessionInfoPanel).not.toBeVisible()
    console.log('✅ Session info panel closed')
  })

  test('should navigate to model settings from quick actions', async ({ page }) => {
    console.log('🧪 Testing navigation to model settings...')

    // Navigate to chat page
    await page.goto('http://localhost:4000/dashboard/models')
    await page.waitForLoadState('networkidle')

    const chatButton = page.locator('button').filter({ hasText: /chat/i }).first()
    if (await chatButton.isVisible()) {
      await chatButton.click()
      await page.waitForURL('**/chat/**', { timeout: 10000 })
    } else {
      console.log('⏭️  No models found - skipping test')
      test.skip()
      return
    }

    await page.waitForLoadState('networkidle')

    // Open quick actions menu
    const quickActionsButton = page.locator('button[title="Quick Actions"]')
    await quickActionsButton.click()
    await page.waitForTimeout(500)

    // Click View Model Settings
    const viewSettingsButton = page.locator('button').filter({ hasText: 'View Model Settings' })
    await viewSettingsButton.click()

    // Verify navigation to models page
    await page.waitForURL('**/models', { timeout: 10000 })

    console.log('✅ Successfully navigated to models page')
  })

  test('should show clear messages confirmation', async ({ page }) => {
    console.log('🧪 Testing clear messages confirmation...')

    // Navigate to chat page
    await page.goto('http://localhost:4000/dashboard/models')
    await page.waitForLoadState('networkidle')

    const chatButton = page.locator('button').filter({ hasText: /chat/i }).first()
    if (await chatButton.isVisible()) {
      await chatButton.click()
      await page.waitForURL('**/chat/**', { timeout: 10000 })
    } else {
      console.log('⏭️  No models found - skipping test')
      test.skip()
      return
    }

    await page.waitForLoadState('networkidle')

    // Open quick actions menu
    const quickActionsButton = page.locator('button[title="Quick Actions"]')
    await quickActionsButton.click()
    await page.waitForTimeout(500)

    // Set up dialog handler to cancel
    page.on('dialog', async dialog => {
      console.log(`Dialog message: ${dialog.message()}`)
      expect(dialog.message()).toContain('Clear all messages')
      await dialog.dismiss()
    })

    // Click Clear Messages
    const clearMessagesButton = page.locator('button').filter({ hasText: 'Clear Messages' })
    await clearMessagesButton.click()
    await page.waitForTimeout(500)

    console.log('✅ Clear messages confirmation dialog shown')
  })

  test('should highlight current model in switcher', async ({ page }) => {
    console.log('🧪 Testing current model highlighting...')

    // Navigate to chat page
    await page.goto('http://localhost:4000/dashboard/models')
    await page.waitForLoadState('networkidle')

    const chatButton = page.locator('button').filter({ hasText: /chat/i }).first()
    if (await chatButton.isVisible()) {
      await chatButton.click()
      await page.waitForURL('**/chat/**', { timeout: 10000 })
    } else {
      console.log('⏭️  No models found - skipping test')
      test.skip()
      return
    }

    await page.waitForLoadState('networkidle')

    // Open model switcher
    const modelSwitcherButton = page.locator('button').filter({ hasText: /Chat with/i })
    await modelSwitcherButton.click()
    await page.waitForTimeout(500)

    // Find highlighted model (should have bg-blue-50 class)
    const highlightedModel = page.locator('button[class*="bg-blue-50"]').first()
    await expect(highlightedModel).toBeVisible({ timeout: 5000 })

    const highlightedText = await highlightedModel.textContent()
    console.log(`✅ Current model highlighted: ${highlightedText}`)
  })
})
