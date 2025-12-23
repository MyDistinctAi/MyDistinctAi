import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

/**
 * Supabase client for use in Server Components
 *
 * This creates a Supabase client configured to work with Next.js Server Components.
 * It requires the cookies() function from next/headers to manage authentication.
 *
 * @example
 * ```tsx
 * import { createClient } from '@/lib/supabase/server'
 *
 * export default async function ServerComponent() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('users').select()
 *   // Use data...
 * }
 * ```
 */
export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Get the current authenticated user from Server Components
 *
 * @returns The user object or null if not authenticated
 *
 * @example
 * ```tsx
 * import { getUser } from '@/lib/supabase/server'
 *
 * export default async function ServerComponent() {
 *   const user = await getUser()
 *   if (!user) {
 *     // Handle unauthenticated state
 *   }
 * }
 * ```
 */
export const getUser = async () => {
  const supabase = await createClient()
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error('Error fetching user:', error.message)
      return null
    }

    return user
  } catch (error) {
    console.error('Unexpected error fetching user:', error)
    return null
  }
}

/**
 * Get the current session from Server Components
 *
 * @returns The session object or null if not authenticated
 *
 * @example
 * ```tsx
 * import { getSession } from '@/lib/supabase/server'
 *
 * export default async function ServerComponent() {
 *   const session = await getSession()
 *   if (!session) {
 *     // Handle unauthenticated state
 *   }
 * }
 * ```
 */
export const getSession = async () => {
  const supabase = await createClient()
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Error fetching session:', error.message)
      return null
    }

    return session
  } catch (error) {
    console.error('Unexpected error fetching session:', error)
    return null
  }
}
