import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

/**
 * Supabase client for use in Client Components
 *
 * This creates a Supabase client configured to work with Next.js Client Components.
 * It automatically handles authentication state and cookies.
 *
 * @example
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 *
 * export default function ClientComponent() {
 *   const supabase = createClient()
 *   // Use supabase client...
 * }
 * ```
 */
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
