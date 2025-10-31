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
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { username } = await params
  const adminClient = createAdminClient()

  // Find user by name or email
  const { data: users } = await adminClient
    .from('users')
    .select('*')
    .or(`name.ilike.%${username}%,email.ilike.%${username}%`)
    .limit(1)

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

  // Get the auth user from Supabase auth
  const { data: authUsers } = await adminClient.auth.admin.listUsers()
  const authUser = authUsers.users.find(u => u.id === user.id)

  if (!authUser || !authUser.email) {
    return new NextResponse(
      JSON.stringify({
        error: 'Auth user not found',
        message: 'User profile exists but no auth user found'
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Generate a magic link for the user (which contains the tokens)
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.email,
    })

    if (linkError || !linkData) {
      console.error('Link generation error:', linkError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to generate link', details: linkError?.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Extract tokens from the properties
    const accessToken = linkData.properties.access_token
    const refreshToken = linkData.properties.refresh_token

    if (!accessToken || !refreshToken) {
      return new NextResponse(
        JSON.stringify({ error: 'Failed to extract tokens from link' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Instead of using the server client to set the session (which doesn't work with cookies),
    // redirect to a callback URL with the tokens as hash params
    // This mimics the magic link flow and will properly set cookies
    const callbackUrl = new URL('/auth/callback', request.url)
    callbackUrl.hash = `access_token=${accessToken}&refresh_token=${refreshToken}&type=magiclink`

    return NextResponse.redirect(callbackUrl)
  } catch (error) {
    console.error('Xray route error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Unexpected error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
