/**
 * Branding Settings Page
 *
 * Configure white-label branding for custom domains
 */

import { createClient } from '@/lib/supabase/server'
import { getUserBranding } from '@/lib/branding/getBranding'
import BrandingSettingsClient from '@/components/settings/BrandingSettingsClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function BrandingSettingsPage() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get existing branding config
  const brandingConfig = await getUserBranding(user.id)

  return <BrandingSettingsClient initialBranding={brandingConfig} userId={user.id} />
}
