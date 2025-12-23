/**
 * Xray Dev API Route - Quick Authentication for Testing
 *
 * ⚠️ DEV ONLY - This API route allows instant login without credentials
 * DO NOT USE IN PRODUCTION
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  console.log('[Xray] Route called, request URL:', request.url)

  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    console.log('[Xray] Production mode detected, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { username } = await params
  console.log('[Xray] Username parameter:', username)

  const adminClient = createAdminClient()

  // Find user by name or email
  const query = `name.ilike.%${username}%,email.ilike.%${username}%`
  console.log('[Xray] Searching for user with query:', query)

  const { data: users, error: queryError } = await adminClient
    .from('users')
    .select('*')
    .or(query)
    .limit(1)

  console.log('[Xray] Query result:', { users, queryError })

  if (!users || users.length === 0) {
    return new NextResponse(
      JSON.stringify({
        error: 'User not found',
        message: `No user found matching: ${username}`,
        availableUsers: ['dsaq', 'sadq', 'John', 'Alex', 'Michael']
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const user = users[0]

  // Get the auth user directly by ID from Supabase auth
  console.log('[Xray] Getting auth user by ID:', user.id)
  const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(user.id)

  console.log('[Xray] Auth user result:', { authUser: authUser?.user, authError })

  if (authError || !authUser || !authUser.user || !authUser.user.email) {
    return new NextResponse(
      JSON.stringify({
        error: 'Auth user not found',
        message: 'User profile exists but no auth user found',
        details: authError?.message
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Use admin API to create a session directly
    console.log('[Xray] Creating admin session for user:', authUser.user.email)

    // Create session using admin API - this generates real access/refresh tokens
    const {data: {session}, error: sessionError} = await adminClient.auth.admin.createSession({
      user_id: user.id
    })

    if (sessionError || !session) {
      console.error('[Xray] Session creation error:', sessionError)
      return new NextResponse(
        JSON.stringify({
          error: 'Failed to create session',
          details: sessionError?.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('[Xray] Session created successfully')

    // Create response with redirect
    const appUrl = new URL(request.url).origin
    const dashboardUrl = `${appUrl}/dashboard`
    const response = NextResponse.redirect(dashboardUrl)

    // Set session cookies manually
    const maxAge = 60 * 60 * 24 * 7 // 7 days
    const cookieOptions = {
      path: '/',
      maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const
    }

    // Set access token cookie
    response.cookies.set('sb-ekfdbotohslpalnyvdpk-auth-token', JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: 'bearer',
      user: session.user
    }), cookieOptions)

    console.log('[Xray] Redirecting to dashboard:', dashboardUrl)
    return response
  } catch (error) {
    console.error('Xray route error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Unexpected error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
