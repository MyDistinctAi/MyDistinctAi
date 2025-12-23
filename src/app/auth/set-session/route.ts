/**
 * Set Session Route
 *
 * This route receives tokens from the client (via POST) and sets the session cookies
 * Used by the xray authentication flow
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json()

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Missing tokens' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Set the session with the provided tokens
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token
    })

    if (error) {
      console.error('Failed to set session:', error)
      return NextResponse.json(
        { error: 'Failed to set session', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Set session error:', error)
    return NextResponse.json(
      { error: 'Unexpected error', details: String(error) },
      { status: 500 }
    )
  }
}

// Also handle GET requests from the client-side redirect
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get('next') || '/dashboard'

  // Return HTML that will POST the tokens from sessionStorage
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Setting up session...</title>
        <script>
          (async function() {
            const accessToken = sessionStorage.getItem('supabase_access_token')
            const refreshToken = sessionStorage.getItem('supabase_refresh_token')

            if (!accessToken || !refreshToken) {
              window.location.href = '/login?error=Authentication failed'
              return
            }

            // Clean up sessionStorage
            sessionStorage.removeItem('supabase_access_token')
            sessionStorage.removeItem('supabase_refresh_token')

            // POST tokens to set session
            try {
              const response = await fetch('/auth/set-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  access_token: accessToken,
                  refresh_token: refreshToken
                })
              })

              if (response.ok) {
                // Session set successfully, redirect to destination
                window.location.href = '${next}'
              } else {
                window.location.href = '/login?error=Failed to authenticate'
              }
            } catch (err) {
              console.error('Failed to set session:', err)
              window.location.href = '/login?error=An error occurred'
            }
          })()
        </script>
      </head>
      <body>
        <p>Setting up your session...</p>
      </body>
    </html>
  `

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  })
}
