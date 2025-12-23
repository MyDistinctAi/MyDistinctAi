/**
 * OpenRouter Integration E2E Tests
 * 
 * Tests the new AI model selection and OpenRouter chat functionality
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:4000'

test.describe('OpenRouter Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Use xray login for quick authentication
    await page.goto(`${BASE_URL}/xray/johndoe`)
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 })
  })

  test('should display AI Model Selection in settings', async ({ page }) => {
    // Navigate to Settings
    await page.goto(`${BASE_URL}/dashboard/settings`)
    
    // Check if AI Model Selection option exists
    const aiModelOption = page.locator('text=AI Model Selection')
    await expect(aiModelOption).toBeVisible({ timeout: 10000 })
    
    // Verify description
    await expect(page.locator('text=Choose your preferred AI model for chat')).toBeVisible()
  })

  test('should navigate to AI Model Selection page', async ({ page }) => {
    // Navigate to AI Model Selection
    await page.goto(`${BASE_URL}/dashboard/settings/ai-model`)
    
    // Wait for page to load
    await page.waitForTimeout(2000) // Wait for page to render
    
    // Check page title
    await expect(page.locator('h1:has-text("AI Model Settings")')).toBeVisible({ timeout: 10000 })
    
    // Check description
    await expect(page.locator('text=Choose your preferred AI model for chat')).toBeVisible()
  })

  test('should display all 3 free AI models', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings/ai-model`)
    await page.waitForTimeout(2000) // Wait for page to render
    
    // Check for Gemini Flash 1.5 8B
    await expect(page.locator('text=Gemini Flash 1.5 8B')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Best for long documents and fast responses')).toBeVisible()
    
    // Check for Llama 3.3 70B
    await expect(page.locator('text=Llama 3.3 70B Instruct')).toBeVisible()
    await expect(page.locator('text=Best for complex reasoning and quality')).toBeVisible()
    
    // Check for Qwen 2.5 72B
    await expect(page.locator('text=Qwen 2.5 72B Instruct')).toBeVisible()
    await expect(page.locator('text=Best for multilingual support')).toBeVisible()
  })

  test('should display FREE badges on all models', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings/ai-model`)
    await page.waitForTimeout(2000) // Wait for page to render
    
    // Check for FREE badges (should be 3)
    const freeBadges = page.locator('text=FREE')
    await expect(freeBadges).toHaveCount(3, { timeout: 10000 })
  })

  test('should display model comparison table', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings/ai-model`)
    await page.waitForTimeout(2000) // Wait for page to render
    
    // Check for comparison table
    await expect(page.locator('h2:has-text("Model Comparison")')).toBeVisible({ timeout: 10000 })
    
    // Check table headers
    await expect(page.locator('th:has-text("Model")')).toBeVisible()
    await expect(page.locator('th:has-text("Context Window")')).toBeVisible()
    await expect(page.locator('th:has-text("Speed")')).toBeVisible()
    await expect(page.locator('th:has-text("Best For")')).toBeVisible()
  })

  test('should select a model and save preference', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings/ai-model`)
    await page.waitForTimeout(2000) // Wait for page to render
    
    // Click on Llama 3.3 70B model card
    const llamaCard = page.locator('button:has-text("Llama 3.3 70B Instruct")').first()
    await llamaCard.click()
    
    // Wait a moment for selection to register
    await page.waitForTimeout(500)
    
    // Click Save Preference button
    const saveButton = page.locator('button:has-text("Save Preference")')
    await saveButton.click()
    
    // Wait for success toast
    await expect(page.locator('text=AI model preference saved!')).toBeVisible({ timeout: 5000 })
  })

  test('should persist selected model after page reload', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings/ai-model`)
    await page.waitForTimeout(2000) // Wait for page to render
    
    // Select Qwen model
    const qwenCard = page.locator('button:has-text("Qwen 2.5 72B Instruct")').first()
    await qwenCard.click()
    await page.waitForTimeout(500)
    
    // Save
    await page.locator('button:has-text("Save Preference")').click()
    await expect(page.locator('text=AI model preference saved!')).toBeVisible({ timeout: 5000 })
    
    // Reload page
    await page.reload()
    await page.waitForTimeout(2000) // Wait for page to render
    
    // Check if Qwen is still selected (should have check mark or be highlighted)
    const selectedQwen = page.locator('button:has-text("Qwen 2.5 72B Instruct")').first()
    await expect(selectedQwen).toHaveClass(/border-blue-600|bg-blue-50/)
  })

  test('should display model specifications', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings/ai-model`)
    await page.waitForTimeout(2000) // Wait for page to render
    
    // Check for speed indicators
    await expect(page.locator('text=Speed:').first()).toBeVisible({ timeout: 10000 })
    
    // Check for quality indicators
    await expect(page.locator('text=Quality:').first()).toBeVisible()
    
    // Check for context window info
    await expect(page.locator('text=Context:').first()).toBeVisible()
    
    // Check for provider info
    await expect(page.locator('text=Provider:').first()).toBeVisible()
  })

  test('should display pro tips section', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings/ai-model`)
    await page.waitForTimeout(2000) // Wait for page to render
    
    // Check for pro tip box
    await expect(page.locator('h3:has-text("💡 Pro Tip")')).toBeVisible({ timeout: 10000 })
    
    // Check for tip content
    await expect(page.locator('text=All models are completely free with no usage limits')).toBeVisible()
  })

  test('should have working chat with OpenRouter', async ({ page }) => {
    // First, make sure a model is selected
    await page.goto(`${BASE_URL}/dashboard/settings/ai-model`)
    await page.waitForTimeout(2000) // Wait for page to render
    
    // Select Gemini Flash (default)
    const geminiCard = page.locator('button:has-text("Gemini Flash 1.5 8B")').first()
    await geminiCard.click()
    await page.waitForTimeout(500)
    await page.locator('button:has-text("Save Preference")').click()
    await page.waitForTimeout(1000)
    
    // Navigate to chat
    await page.goto(`${BASE_URL}/dashboard/chat`)
    await page.waitForTimeout(2000) // Wait for page to render
    
    // Check if chat interface is visible
    const chatInput = page.locator('textarea[placeholder*="Type your message"]').or(page.locator('input[placeholder*="Type"]'))
    await expect(chatInput.first()).toBeVisible({ timeout: 10000 })
  })

  test('should show model info in comparison table', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings/ai-model`)
    await page.waitForTimeout(2000) // Wait for page to render
    
    // Check Gemini Flash context window
    await expect(page.locator('text=1,000K').or(page.locator('text=1000K'))).toBeVisible({ timeout: 10000 })
    
    // Check Llama context window  
    await expect(page.locator('text=128K')).toBeVisible()
  })
})

test.describe('OpenRouter Integration - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto(`${BASE_URL}/xray/johndoe`)
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 })
    
    await page.goto(`${BASE_URL}/dashboard/settings/ai-model`)
    await page.waitForTimeout(2000) // Wait for page to render
    
    // Check if page loads and models are visible
    await expect(page.locator('h1:has-text("AI Model Settings")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Gemini Flash 1.5 8B')).toBeVisible()
  })
})
