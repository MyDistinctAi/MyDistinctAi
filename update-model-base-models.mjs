/**
 * Update Model Base Models
 * Replace broken model IDs with working ones
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Model replacements
const MODEL_REPLACEMENTS = {
  'google/gemini-flash-1.5-8b': 'deepseek/deepseek-chat-v3.1:free',
  'meta-llama/llama-3.3-70b-instruct:free': 'deepseek/deepseek-chat-v3.1:free',
}

async function updateModels() {
  console.log('🔄 Updating model base_model values...\n')

  // Get all models
  const { data: models, error } = await supabase
    .from('models')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !models) {
    console.error('❌ Error fetching models:', error)
    return
  }

  console.log(`📊 Found ${models.length} models\n`)

  let updatedCount = 0
  let skippedCount = 0

  for (const model of models) {
    const oldBaseModel = model.base_model
    const newBaseModel = MODEL_REPLACEMENTS[oldBaseModel]

    if (newBaseModel) {
      console.log(`📝 Model: ${model.name}`)
      console.log(`   Old: ${oldBaseModel}`)
      console.log(`   New: ${newBaseModel}`)

      const { error: updateError } = await supabase
        .from('models')
        .update({ base_model: newBaseModel })
        .eq('id', model.id)

      if (updateError) {
        console.error(`   ❌ Failed to update: ${updateError.message}`)
      } else {
        console.log(`   ✅ Updated successfully`)
        updatedCount++
      }
      console.log('')
    } else {
      console.log(`⏭️  Skipping: ${model.name} (${oldBaseModel})`)
      skippedCount++
    }
  }

  console.log('='.repeat(60))
  console.log('📊 Update Summary')
  console.log('='.repeat(60))
  console.log(`✅ Updated: ${updatedCount} models`)
  console.log(`⏭️  Skipped: ${skippedCount} models (already using valid models)`)
  console.log('')

  if (updatedCount > 0) {
    console.log('🎉 Models updated successfully!')
    console.log('💡 Refresh your browser to see the changes')
  }
}

updateModels().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
