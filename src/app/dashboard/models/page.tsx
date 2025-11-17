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

      // Fetch document counts and names for each model
      for (const model of models) {
        const { data: docs, count } = await supabase
          .from('training_data')
          .select('id, file_name, status, file_size, chunk_count, file_type', { count: 'exact' })
          .eq('model_id', model.id)
          .eq('status', 'processed')

        model.documents = docs || []
        model.documentCount = count || 0
      }
    }
  }

  return <ModelsPageClient initialModels={models} />
}
