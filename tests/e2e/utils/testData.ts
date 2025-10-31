/**
 * Test Data Generator for E2E Tests
 *
 * Provides utilities for generating random test data
 */

/**
 * Generate a random email address for testing
 * Using a valid test email domain that Supabase will accept
 */
export function generateTestEmail(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  // Use a realistic-looking email format that Supabase accepts
  return `test${timestamp}${random}@testmail.app`
}

/**
 * Generate a random name for testing
 */
export function generateTestName(): string {
  const firstNames = ['John', 'Jane', 'Alex', 'Sarah', 'Michael', 'Emily']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia']

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]

  return `${firstName} ${lastName}`
}

/**
 * Generate a random password for testing (meets requirements)
 */
export function generateTestPassword(): string {
  const timestamp = Date.now()
  return `TestPass123!${timestamp}`
}

/**
 * Test user credentials
 */
export interface TestUser {
  email: string
  password: string
  name: string
  niche: string
}

/**
 * Create a complete test user object
 */
export function createTestUser(): TestUser {
  return {
    email: generateTestEmail(),
    password: generateTestPassword(),
    name: generateTestName(),
    niche: 'Creators',
  }
}

/**
 * Common test credentials (for reuse across tests)
 */
export const TEST_CREDENTIALS = {
  validPassword: 'TestPassword123!',
  weakPassword: '123',
  niches: ['Creators', 'Lawyers', 'Hospitals', 'Other'],
}
