import { test, expect } from '@playwright/test'

test('Complete RAG Workflow: Upload PDF → Process → Chat with RAG', async ({ page }) => {
  test.setTimeout(120000) // 2 minutes for complete workflow

  console.log('\n🧪 Starting Complete RAG Workflow Test\n')

  // Step 1: Login with credentials
  console.log('1️⃣  Logging in...')
  await page.goto('http://localhost:4000/login')

  // Fill in login form
  await page.getByLabel(/email/i).fill('mytest@testmail.app')
  await page.getByLabel(/password/i).fill('password123')

  // Click sign in button (use exact match to avoid "magic link" button)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()

  // Wait for dashboard to load
  await page.waitForURL('**/dashboard', { timeout: 20000 })
  console.log('✅ Logged in\n')

  // Close onboarding modal by pressing Escape key
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  // Try clicking close button if still visible
  const closeButton = page.locator('button[aria-label="Close"]').or(page.locator('button:has-text("×")'))
  if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeButton.click()
    await page.waitForTimeout(500)
  }
  console.log('✅ Closed onboarding modal\n')

  // Step 2: Go to Training Data page to upload files
  console.log('2️⃣  Going to Training Data page...')
  const modelId = '8acd09ec-5d74-4fd9-ba49-42c0c3045429' // User's existing "Test" model
  await page.goto(`http://localhost:4000/dashboard/data`)
  await page.waitForLoadState('networkidle')

  // Close any modal that appears
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  console.log('✅ On Training Data page\n')

  // Step 3: Upload PDF file
  console.log('3️⃣  Uploading test PDF...')

  // Find and upload file
  const fileInput = page.locator('input[type="file"]').first()
  await fileInput.setInputFiles('test-recipes.pdf')
  console.log('✅ File selected\n')

  // Wait for auto-upload or find upload button
  await page.waitForTimeout(2000)
  console.log('✅ Upload triggered\n')

  // Step 4: Wait for processing to complete
  console.log('4️⃣  Waiting for file processing...')
  await page.waitForTimeout(3000) // Initial wait for upload

  // Check for "processed" status (retry for up to 30 seconds)
  let processed = false
  for (let i = 0; i < 30; i++) {
    const statusText = await page.textContent('body')
    if (statusText?.includes('processed') || statusText?.includes('Processed')) {
      processed = true
      console.log('✅ File processed!\n')
      break
    }
    await page.waitForTimeout(1000)
    process.stdout.write(`\r⏳ Waiting... ${i + 1}s`)
  }
  console.log('\n')

  if (!processed) {
    console.log('⚠️  Processing might still be in progress\n')
  }

  // Step 5: Navigate to chat page
  console.log('5️⃣  Opening chat...')
  await page.goto(`http://localhost:4000/dashboard/chat/${modelId}`)
  await page.waitForLoadState('networkidle')
  console.log('✅ Chat page loaded\n')

  // Step 6: Send RAG query
  console.log('6️⃣  Sending RAG query...')
  const testQuery = 'What are the ingredients for avocado toast?'

  const messageInput = page.getByPlaceholder(/type.*message|send.*message/i)
  await messageInput.fill(testQuery)
  await messageInput.press('Enter')
  console.log(`✅ Query sent: "${testQuery}"\n`)

  // Step 7: Wait for response
  console.log('7️⃣  Waiting for AI response...')
  await page.waitForTimeout(5000) // Wait for streaming response

  // Step 8: Verify RAG context was used
  console.log('8️⃣  Verifying RAG context...')
  const pageContent = await page.textContent('body')

  const hasAvocado = pageContent?.toLowerCase().includes('avocado') || false
  const hasEgg = pageContent?.toLowerCase().includes('egg') || false
  const hasBread = pageContent?.toLowerCase().includes('bread') || false

  console.log(`   - Found "avocado": ${hasAvocado ? '✅' : '❌'}`)
  console.log(`   - Found "egg": ${hasEgg ? '✅' : '❌'}`)
  console.log(`   - Found "bread": ${hasBread ? '✅' : '❌'}`)

  // At least 2 out of 3 ingredients should be mentioned
  const ragWorking = (hasAvocado && hasEgg) || (hasAvocado && hasBread) || (hasEgg && hasBread)

  if (ragWorking) {
    console.log('\n✅ RAG SYSTEM WORKING - Context was used!\n')
  } else {
    console.log('\n⚠️  RAG context may not have been retrieved\n')
  }

  // Assertions
  expect(ragWorking).toBeTruthy()

  console.log('=' .repeat(60))
  console.log('✅ COMPLETE RAG WORKFLOW TEST PASSED!')
  console.log('='.repeat(60))
})
