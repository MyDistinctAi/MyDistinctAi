/**
 * Authentication Callback Route
 *
 * This route handles authentication callbacks from Supabase for:
 * - Email verification links
 * - Magic link authentication
 * - Password reset links
 *
 * It exchanges the auth code for a session and redirects appropriately
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = await createClient()

    try {
      // Exchange code for session
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Auth callback error:', error.message)
        // Redirect to login with error
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=Authentication failed. Please try again.`
        )
      }

      // Success - redirect to next URL or dashboard
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    } catch (error) {
      console.error('Unexpected auth callback error:', error)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=An unexpected error occurred`
      )
    }
  }

  // For xray route: hash params will be handled client-side
  // Return a simple HTML page that processes the hash and sets the session
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authenticating...</title>
        <script type="module">
          // Parse hash params (access_token, refresh_token)
          const hash = window.location.hash.substring(1)
          const params = new URLSearchParams(hash)
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')

          if (accessToken && refreshToken) {
            // Store tokens temporarily in sessionStorage
            sessionStorage.setItem('supabase_access_token', accessToken)
            sessionStorage.setItem('supabase_refresh_token', refreshToken)

            // Redirect to a page that will set the session server-side
            window.location.href = '/auth/set-session?next=${next}'
          } else {
            // No tokens, redirect to login
            window.location.href = '/login?error=Authentication failed'
          }
        </script>
      </head>
      <body>
        <p>Authenticating...</p>
      </body>
    </html>
  `

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  })
}
