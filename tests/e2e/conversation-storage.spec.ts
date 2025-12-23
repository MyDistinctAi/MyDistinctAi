/**
 * Conversation Storage System E2E Tests
 * Tests conversation management APIs with authentication
 */

import { test, expect } from '@playwright/test'

test.describe('Conversation Storage System', () => {
  test.beforeEach(async ({ page }) => {
    // Login using xray route
    await page.goto('http://localhost:4000/api/xray/mytest@testmail.app')
    await page.waitForURL('**/dashboard', { timeout: 30000 })
  })

  test('should list conversations', async ({ page }) => {
    // Make API request to list conversations
    const response = await page.request.get('http://localhost:4000/api/conversations', {
      headers: {
        'Cookie': await page.context().cookies().then(cookies =>
          cookies.map(c => `${c.name}=${c.value}`).join('; ')
        )
      }
    })

    expect(response.status()).toBe(200)
    const data = await response.json()

    // Verify response structure
    expect(data).toHaveProperty('conversations')
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('limit')
    expect(data).toHaveProperty('offset')
    expect(Array.isArray(data.conversations)).toBe(true)

    console.log(`✅ Found ${data.total} conversations`)
  })

  test('should get single conversation with messages', async ({ page }) => {
    // First get list of conversations
    const listResponse = await page.request.get('http://localhost:4000/api/conversations', {
      headers: {
        'Cookie': await page.context().cookies().then(cookies =>
          cookies.map(c => `${c.name}=${c.value}`).join('; ')
        )
      }
    })

    const listData = await listResponse.json()

    if (listData.conversations.length === 0) {
      console.log('⏭️  No conversations found - skipping test')
      test.skip()
      return
    }

    const conversationId = listData.conversations[0].id

    // Get conversation details
    const response = await page.request.get(
      `http://localhost:4000/api/conversations/${conversationId}`,
      {
        headers: {
          'Cookie': await page.context().cookies().then(cookies =>
            cookies.map(c => `${c.name}=${c.value}`).join('; ')
          )
        }
      }
    )

    expect(response.status()).toBe(200)
    const data = await response.json()

    // Verify response structure
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('title')
    expect(data).toHaveProperty('messages')
    expect(Array.isArray(data.messages)).toBe(true)

    console.log(`✅ Conversation: "${data.title}" has ${data.messages.length} messages`)
  })

  test('should create new conversation', async ({ page }) => {
    // First get a model ID
    const modelsResponse = await page.request.get('http://localhost:4000/api/models', {
      headers: {
        'Cookie': await page.context().cookies().then(cookies =>
          cookies.map(c => `${c.name}=${c.value}`).join('; ')
        )
      }
    })

    const modelsData = await modelsResponse.json()

    if (modelsData.length === 0) {
      console.log('⏭️  No models found - skipping test')
      test.skip()
      return
    }

    const modelId = modelsData[0].id

    // Create new conversation
    const response = await page.request.post('http://localhost:4000/api/conversations', {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': await page.context().cookies().then(cookies =>
          cookies.map(c => `${c.name}=${c.value}`).join('; ')
        )
      },
      data: {
        modelId,
        title: 'Test Conversation from E2E'
      }
    })

    expect(response.status()).toBe(201)
    const data = await response.json()

    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('title')
    expect(data.title).toBe('Test Conversation from E2E')

    console.log(`✅ Created conversation: ${data.id}`)

    // Clean up - delete the test conversation
    const deleteResponse = await page.request.delete(
      `http://localhost:4000/api/conversations/${data.id}`,
      {
        headers: {
          'Cookie': await page.context().cookies().then(cookies =>
            cookies.map(c => `${c.name}=${c.value}`).join('; ')
          )
        }
      }
    )

    expect(deleteResponse.status()).toBe(200)
    console.log(`✅ Cleaned up test conversation`)
  })

  test('should update conversation title', async ({ page }) => {
    // First get list of conversations
    const listResponse = await page.request.get('http://localhost:4000/api/conversations', {
      headers: {
        'Cookie': await page.context().cookies().then(cookies =>
          cookies.map(c => `${c.name}=${c.value}`).join('; ')
        )
      }
    })

    const listData = await listResponse.json()

    if (listData.conversations.length === 0) {
      console.log('⏭️  No conversations found - skipping test')
      test.skip()
      return
    }

    const conversationId = listData.conversations[0].id
    const originalTitle = listData.conversations[0].title

    // Update title
    const response = await page.request.patch(
      `http://localhost:4000/api/conversations/${conversationId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': await page.context().cookies().then(cookies =>
            cookies.map(c => `${c.name}=${c.value}`).join('; ')
          )
        },
        data: {
          title: 'Updated Title from E2E'
        }
      }
    )

    expect(response.status()).toBe(200)
    const data = await response.json()

    expect(data.title).toBe('Updated Title from E2E')
    console.log(`✅ Updated conversation title`)

    // Restore original title
    await page.request.patch(
      `http://localhost:4000/api/conversations/${conversationId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': await page.context().cookies().then(cookies =>
            cookies.map(c => `${c.name}=${c.value}`).join('; ')
          )
        },
        data: {
          title: originalTitle
        }
      }
    )

    console.log(`✅ Restored original title`)
  })

  test('should export conversation as JSON', async ({ page }) => {
    // First get list of conversations
    const listResponse = await page.request.get('http://localhost:4000/api/conversations', {
      headers: {
        'Cookie': await page.context().cookies().then(cookies =>
          cookies.map(c => `${c.name}=${c.value}`).join('; ')
        )
      }
    })

    const listData = await listResponse.json()

    if (listData.conversations.length === 0) {
      console.log('⏭️  No conversations found - skipping test')
      test.skip()
      return
    }

    const conversationId = listData.conversations[0].id

    // Export as JSON
    const response = await page.request.get(
      `http://localhost:4000/api/conversations/${conversationId}/export?format=json`,
      {
        headers: {
          'Cookie': await page.context().cookies().then(cookies =>
            cookies.map(c => `${c.name}=${c.value}`).join('; ')
          )
        }
      }
    )

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/json')

    const data = await response.json()
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('title')
    expect(data).toHaveProperty('messages')

    console.log(`✅ Exported conversation as JSON (${data.messages.length} messages)`)
  })

  test('should export conversation as Markdown', async ({ page }) => {
    // First get list of conversations
    const listResponse = await page.request.get('http://localhost:4000/api/conversations', {
      headers: {
        'Cookie': await page.context().cookies().then(cookies =>
          cookies.map(c => `${c.name}=${c.value}`).join('; ')
        )
      }
    })

    const listData = await listResponse.json()

    if (listData.conversations.length === 0) {
      console.log('⏭️  No conversations found - skipping test')
      test.skip()
      return
    }

    const conversationId = listData.conversations[0].id

    // Export as Markdown
    const response = await page.request.get(
      `http://localhost:4000/api/conversations/${conversationId}/export?format=md`,
      {
        headers: {
          'Cookie': await page.context().cookies().then(cookies =>
            cookies.map(c => `${c.name}=${c.value}`).join('; ')
          )
        }
      }
    )

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/markdown')

    const markdown = await response.text()
    expect(markdown).toContain('#') // Should have markdown headings
    expect(markdown).toContain('**') // Should have bold text
    expect(markdown.length).toBeGreaterThan(0)

    console.log(`✅ Exported conversation as Markdown (${markdown.length} characters)`)
  })

  test('should export conversation as plain text', async ({ page }) => {
    // First get list of conversations
    const listResponse = await page.request.get('http://localhost:4000/api/conversations', {
      headers: {
        'Cookie': await page.context().cookies().then(cookies =>
          cookies.map(c => `${c.name}=${c.value}`).join('; ')
        )
      }
    })

    const listData = await listResponse.json()

    if (listData.conversations.length === 0) {
      console.log('⏭️  No conversations found - skipping test')
      test.skip()
      return
    }

    const conversationId = listData.conversations[0].id

    // Export as plain text
    const response = await page.request.get(
      `http://localhost:4000/api/conversations/${conversationId}/export?format=txt`,
      {
        headers: {
          'Cookie': await page.context().cookies().then(cookies =>
            cookies.map(c => `${c.name}=${c.value}`).join('; ')
          )
        }
      }
    )

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/plain')

    const text = await response.text()
    expect(text).toContain('Title:') // Should have title
    expect(text).toContain('Model:') // Should have model name
    expect(text.length).toBeGreaterThan(0)

    console.log(`✅ Exported conversation as plain text (${text.length} characters)`)
  })

  test('should delete conversation', async ({ page }) => {
    // First create a conversation to delete
    const modelsResponse = await page.request.get('http://localhost:4000/api/models', {
      headers: {
        'Cookie': await page.context().cookies().then(cookies =>
          cookies.map(c => `${c.name}=${c.value}`).join('; ')
        )
      }
    })

    const modelsData = await modelsResponse.json()

    if (modelsData.length === 0) {
      console.log('⏭️  No models found - skipping test')
      test.skip()
      return
    }

    const modelId = modelsData[0].id

    // Create conversation
    const createResponse = await page.request.post('http://localhost:4000/api/conversations', {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': await page.context().cookies().then(cookies =>
          cookies.map(c => `${c.name}=${c.value}`).join('; ')
        )
      },
      data: {
        modelId,
        title: 'Conversation to Delete'
      }
    })

    const createData = await createResponse.json()
    const conversationId = createData.id

    // Delete conversation
    const deleteResponse = await page.request.delete(
      `http://localhost:4000/api/conversations/${conversationId}`,
      {
        headers: {
          'Cookie': await page.context().cookies().then(cookies =>
            cookies.map(c => `${c.name}=${c.value}`).join('; ')
          )
        }
      }
    )

    expect(deleteResponse.status()).toBe(200)
    const deleteData = await deleteResponse.json()

    expect(deleteData.success).toBe(true)
    console.log(`✅ Deleted conversation successfully`)

    // Verify it's deleted
    const getResponse = await page.request.get(
      `http://localhost:4000/api/conversations/${conversationId}`,
      {
        headers: {
          'Cookie': await page.context().cookies().then(cookies =>
            cookies.map(c => `${c.name}=${c.value}`).join('; ')
          )
        }
      }
    )

    expect(getResponse.status()).toBe(404)
    console.log(`✅ Verified conversation is deleted`)
  })
})
