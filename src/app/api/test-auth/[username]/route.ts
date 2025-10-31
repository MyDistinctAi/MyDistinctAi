/**
 * Test Authentication API Route
 *
 * ⚠️ DEV ONLY - Quick authentication for E2E testing
 * DO NOT USE IN PRODUCTION
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
    const { data: users, error: userError } = await adminClient
      .from('users')
      .select('*')
      .or(`name.ilike.%${username}%,email.ilike.%${username}%`)
      .limit(1)

    if (userError || !users || users.length === 0) {
      return NextResponse.json({ error: 'User not found', username }, { status: 404 })
    }

    const user = users[0]

    // Get the auth user from Supabase auth
    const { data: authData } = await adminClient.auth.admin.listUsers()
    const authUser = authData.users.find(u => u.id === user.id)

    if (!authUser || !authUser.email) {
      return NextResponse.json({ error: 'Auth user not found', user_id: user.id }, { status: 404 })
    }

    // Generate a session for this user
    const { data: sessionData, error: sessionError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.email,
    })

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { error: 'Failed to generate session', message: sessionError?.message },
        { status: 500 }
      )
    }

    // Extract token from the magic link
    const url = new URL(sessionData.properties.action_link)
    const token = url.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Failed to extract token' }, { status: 500 })
    }

    // Verify the token to get a session
    const { data: verifyData, error: verifyError } = await adminClient.auth.verifyOtp({
      token_hash: token,
      type: 'magiclink',
    })

    if (verifyError || !verifyData.session) {
      return NextResponse.json(
        { error: 'Failed to verify token', message: verifyError?.message },
        { status: 500 }
      )
    }

    // Create response with redirect to dashboard
    const response = NextResponse.redirect(new URL('/dashboard', request.url))

    // Set session cookies using Supabase's cookie names
    // Format: sb-<project-ref>-auth-token
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'localhost'

    response.cookies.set(`sb-${projectRef}-auth-token`, JSON.stringify({
      access_token: verifyData.session.access_token,
      refresh_token: verifyData.session.refresh_token,
      expires_in: verifyData.session.expires_in,
      expires_at: verifyData.session.expires_at,
      token_type: 'bearer',
      user: verifyData.user,
    }), {
      path: '/',
      maxAge: verifyData.session.expires_in || 3600,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    return response
  } catch (error: any) {
    console.error('Test auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
