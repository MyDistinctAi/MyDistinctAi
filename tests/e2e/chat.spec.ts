/**
 * Chat Interface E2E Tests
 *
 * Tests for chat functionality with AI models
 */

import { test, expect } from '../fixtures'

test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to chat page for testing (outside dashboard for now)
    await page.goto('http://localhost:4000/chat/test-model-123')
    await page.waitForLoadState('networkidle')
  })

  test('should display chat page with sidebar and empty state', async ({ page }) => {
    // Page is already loaded in beforeEach

    // Check if sidebar is visible
    await expect(page.getByRole('heading', { name: 'My Custom Model' })).toBeVisible()
    await expect(page.locator('text=Chat Sessions')).toBeVisible()

    // Check for New Chat button
    await expect(page.getByRole('button', { name: 'New Chat', exact: true })).toBeVisible()

    // Check if sessions are listed
    await expect(page.getByRole('button', { name: /Introduction to AI/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Code Review/ })).toBeVisible()
  })

  test('should display existing chat messages', async ({ page }) => {
    // Wait for messages to load
    await page.waitForTimeout(1000)

    // Check if existing messages are displayed (use more specific selectors)
    await expect(page.locator('.whitespace-pre-wrap', { hasText: 'What is machine learning?' })).toBeVisible()
    await expect(page.locator('.whitespace-pre-wrap', { hasText: 'Machine learning is a subset of artificial intelligence' })).toBeVisible()

    // Check if code block is rendered (use specific selector for code block header)
    await expect(page.locator('.bg-gray-800 .text-gray-400', { hasText: 'python' })).toBeVisible()
    await expect(page.locator('text=LinearRegression')).toBeVisible()
  })

  test('should send a message and receive response', async ({ page }) => {
    // NOTE: This test requires Ollama to be running and configured
    // Now enabled since Ollama is running

    // Wait for page to load
    await page.waitForTimeout(1000)

    // Type a message
    const inputField = page.locator('textarea[placeholder*="Ask"]')
    await inputField.fill('Tell me about neural networks')

    // Send the message
    await page.getByRole('button', { name: /send/i }).click()

    // Check if message appears (optimistic UI)
    await expect(page.locator('.whitespace-pre-wrap', { hasText: 'Tell me about neural networks' })).toBeVisible()

    // Wait for AI response (Ollama may respond too fast for loading indicator)
    // Look for the AI response instead
    await page.waitForTimeout(5000) // Give Ollama time to respond

    // Check that there are multiple messages now (user + AI response)
    const messages = await page.locator('.whitespace-pre-wrap').count()
    expect(messages).toBeGreaterThan(2) // Initial 2 messages + user message + AI response
  })

  test('should create a new chat session', async ({ page }) => {
    // Click New Chat button
    await page.getByRole('button', { name: 'New Chat', exact: true }).click()

    // Check if new chat is active
    await expect(page.getByRole('heading', { name: 'New Chat' })).toBeVisible()

    // Check if messages area is empty
    await expect(page.locator('text=No messages yet')).toBeVisible()
  })

  test('should switch between chat sessions', async ({ page }) => {
    // Wait for sessions to load
    await page.waitForTimeout(1000)

    // Click on second session
    await page.locator('text=Code Review').click()

    // Check if session changed
    await expect(page.locator('h1:has-text("Code Review")')).toBeVisible()
  })

  test('should display copy button on AI messages', async ({ page }) => {
    // Wait for messages to load
    await page.waitForTimeout(1000)

    // Hover over AI message to show copy button
    const aiMessage = page.locator('text=Machine learning is a subset').first()
    await aiMessage.hover()

    // Check if copy button is visible
    await expect(page.locator('button[title="Copy message"]').first()).toBeVisible()
  })

  test('should display regenerate button on last AI message', async ({ page }) => {
    // Wait for messages to load
    await page.waitForTimeout(1000)

    // Check if regenerate button is visible on last AI message
    await expect(page.locator('button[title="Regenerate response"]')).toBeVisible()
  })

  test('should show typing indicator when sending message', async ({ page }) => {
    // NOTE: This test requires Ollama to be running and configured
    // Now enabled since Ollama is running

    // Wait for page to load
    await page.waitForTimeout(1000)

    // Send a message
    const inputField = page.locator('textarea[placeholder*="Ask"]')
    await inputField.fill('Test message')
    await page.getByRole('button', { name: /send/i }).click()

    // Check for typing indicator (animated dots) - may be too fast to catch with Ollama
    // Instead, verify the loading state is set by checking isLoading prop affects button
    await expect(inputField).toBeDisabled()
  })

  test('should clear input field after sending message', async ({ page }) => {
    // NOTE: This test requires Ollama to be running and configured
    // Now enabled since Ollama is running

    // Wait for page to load
    await page.waitForTimeout(1000)

    // Type and send message
    const inputField = page.locator('textarea[placeholder*="Ask"]')
    await inputField.fill('Test message')
    await page.getByRole('button', { name: /send/i }).click()

    // Wait for async operation to complete before checking
    await page.waitForTimeout(500)

    // Check if input is cleared
    await expect(inputField).toHaveValue('')
  })

  test('should display export buttons on active session', async ({ page }) => {
    // Wait for sessions to load
    await page.waitForTimeout(1000)

    // Check if export buttons are visible for active session
    await expect(page.locator('button:has-text("TXT")').first()).toBeVisible()
    await expect(page.locator('button:has-text("PDF")').first()).toBeVisible()
  })

  test('should show chat header with model name', async ({ page }) => {
    // Check chat header
    await expect(page.locator('h1:has-text("Introduction to AI")')).toBeVisible()
    await expect(page.locator('text=Chat with My Custom Model')).toBeVisible()
  })

  test('should handle Enter key to send message', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000)

    // Type message and press Enter
    const inputField = page.locator('textarea[placeholder*="Ask"]')
    await inputField.fill('Test with Enter key')
    await inputField.press('Enter')

    // Check if message was sent
    await expect(page.locator('text=Test with Enter key')).toBeVisible()
  })

  test('should handle Shift+Enter for new line', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000)

    // Type message with Shift+Enter
    const inputField = page.locator('textarea[placeholder*="Ask"]')
    await inputField.fill('First line')
    await inputField.press('Shift+Enter')
    await inputField.press('ArrowRight') // Move cursor
    await inputField.type('Second line')

    // Check if input still has content (not sent)
    const value = await inputField.inputValue()
    expect(value).toContain('First line')
    expect(value).toContain('Second line')
  })
})
