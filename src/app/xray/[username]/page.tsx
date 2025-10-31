/**
 * Xray Dev Route - Quick Authentication for Testing
 *
 * ⚠️ DEV ONLY - This route allows instant login without credentials
 * DO NOT USE IN PRODUCTION
 * 
 * Usage: /xray/johndoe (or any test username)
 * Available users: johndoe, janesmith, bobwilson, luluconcurseira, danielbergholz
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function XrayPage({
  params
}: {
  params: Promise<{ username: string }>
}) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    redirect('/login')
  }

  const { username } = await params
  const supabase = await createClient()

  // Map of test usernames to emails (these should exist in your database)
  const testUsers: Record<string, string> = {
    filetest: 'filetest@example.com', // Our existing test user
    johndoe: 'john.doe@example.com',
    janesmith: 'jane.smith@example.com',
    bobwilson: 'bob.wilson@example.com',
    luluconcurseira: 'lulu@example.com',
    danielbergholz: 'daniel@example.com',
  }

  const email = testUsers[username.toLowerCase()]

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">User Not Found</h1>
          <p className="text-gray-700 mb-4">
            No test user found matching: <strong>{username}</strong>
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Available test users: {Object.keys(testUsers).join(', ')}
          </p>
          <a
            href="/login"
            className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  // Sign in using the test user's email with a dev-only password
  // Note: In production, you'd use admin.createUser or similar
  // For dev, we'll use a known password or create the user if needed
  const devPassword = 'password123456' // Dev-only password (matches our test users)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: devPassword,
  })

  if (error) {
    // If user doesn't exist or password is wrong, show error
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Login Failed</h1>
          <p className="text-gray-700 mb-4">
            Could not sign in as <strong>{username}</strong>
          </p>
          <p className="text-sm text-gray-600 mb-2">Error: {error.message}</p>
          <p className="text-sm text-gray-600 mb-6">
            Make sure the test user exists in Supabase with email: {email}
          </p>
          <div className="space-y-2">
            <a
              href="/register"
              className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded hover:bg-green-700 transition"
            >
              Create Test User
            </a>
            <a
              href="/login"
              className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Successfully logged in - redirect to dashboard
  console.log(`✅ Xray login successful for ${username} (${email})`)
  redirect('/dashboard')
}
