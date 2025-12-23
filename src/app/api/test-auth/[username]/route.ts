/**
 * Test Authentication Route - Direct Login for E2E Tests
 *
 * ⚠️ DEV ONLY - Simplified authentication for Playwright tests
 * This route directly sets session cookies without multiple redirects
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { username } = await params
  const adminClient = createAdminClient()

  try {
    // Find user by name or email
    const { data: users } = await adminClient
      .from('users')
      .select('*')
      .or(`name.ilike.%${username}%,email.ilike.%${username}%`)
      .limit(1)

    if (!users || users.length === 0) {
      return NextResponse.json({
        error: 'User not found',
        message: `No user found matching: ${username}`,
      }, { status: 404 })
    }

    const user = users[0]

    // Get the auth user - try by user ID first
    const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(user.id)

    // If not found by ID, try to find by email in auth users list
    let userEmail = authUser?.email

    if (!userEmail) {
      // Try finding in all auth users
      const { data: authUsers } = await adminClient.auth.admin.listUsers()
      const foundAuthUser = authUsers.users.find(u =>
        u.email?.toLowerCase().includes(username.toLowerCase()) ||
        u.user_metadata?.name?.toLowerCase().includes(username.toLowerCase())
      )

      if (foundAuthUser) {
        userEmail = foundAuthUser.email
      }
    }

    if (!userEmail) {
      return NextResponse.json({
        error: 'Auth user not found',
        message: `No auth user found for: ${username}`,
        hint: 'Try using email address instead of username',
      }, { status: 404 })
    }

    // Generate session tokens
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    })

    if (linkError || !linkData) {
      return NextResponse.json({
        error: 'Failed to generate tokens',
        details: linkError?.message
      }, { status: 500 })
    }

    const accessToken = linkData.properties.access_token
    const refreshToken = linkData.properties.refresh_token

    if (!accessToken || !refreshToken) {
      return NextResponse.json({
        error: 'Failed to extract tokens'
      }, { status: 500 })
    }

    // Set cookies directly (this is the key difference from xray route)
    const cookieStore = await cookies()

    // Set Supabase auth cookies
    cookieStore.set({
      name: `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`,
      value: JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3600,
        token_type: 'bearer',
        user: authUser
      }),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Return success response with redirect instruction
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: authUser.email,
        name: user.name
      },
      redirect: '/dashboard'
    }, { status: 200 })

  } catch (error) {
    console.error('Test auth error:', error)
    return NextResponse.json({
      error: 'Unexpected error',
      details: String(error)
    }, { status: 500 })
  }
}
