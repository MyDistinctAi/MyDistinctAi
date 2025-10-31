/**
 * Training Data Page
 *
 * Upload and manage training data files for AI models
 */

import { createClient } from '@/lib/supabase/server'
import TrainingDataClient from '@/components/dashboard/TrainingDataClient'

export const dynamic = 'force-dynamic'

export default async function TrainingDataPage() {
  const supabase = await createClient()

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user's models
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

  return <TrainingDataClient models={models} />
}
