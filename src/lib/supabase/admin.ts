import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

/**
 * Supabase Admin Client
 *
 * This client uses the service role key and bypasses Row Level Security (RLS).
 * ONLY use this for trusted server-side operations like:
 * - Creating user profiles during registration
 * - Admin operations
 * - Background jobs
 *
 * NEVER expose this client or its key to the frontend!
 */
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
    )
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
