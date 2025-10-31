/**
 * Models Management Page
 *
 * Display and manage all AI models
 */

import { createClient } from '@/lib/supabase/server'
import ModelsPageClient from '@/components/dashboard/ModelsPageClient'

export const dynamic = 'force-dynamic'

export default async function ModelsPage() {
  const supabase = await createClient()

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get models from database
  let models: any[] = []

  if (user) {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data && !error) {
      models = data
    }
  }

  return <ModelsPageClient initialModels={models} />
}
