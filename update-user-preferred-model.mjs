/**
 * Update User Preferred AI Model
 * Replace broken model preferences with DeepSeek
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

const BROKEN_MODELS = [
  'google/gemini-flash-1.5-8b',
  'meta-llama/llama-3.3-70b-instruct:free',
]

const NEW_MODEL = 'deepseek/deepseek-chat-v3.1:free'

async function updateUserPreferences() {
  console.log('🔄 Updating user preferred AI models...\n')

  // Get all users
  const { data: users, error } = await supabase
    .from('users')
    .select('*')

  if (error || !users) {
    console.error('❌ Error fetching users:', error)
    return
  }

  console.log(`📊 Found ${users.length} users\n`)

  let updatedCount = 0
  let skippedCount = 0

  for (const user of users) {
    const preferredModel = user.preferred_ai_model

    if (BROKEN_MODELS.includes(preferredModel)) {
      console.log(`📝 User: ${user.email || user.id}`)
      console.log(`   Old: ${preferredModel}`)
      console.log(`   New: ${NEW_MODEL}`)

      const { error: updateError } = await supabase
        .from('users')
        .update({ preferred_ai_model: NEW_MODEL })
        .eq('id', user.id)

      if (updateError) {
        console.error(`   ❌ Failed to update: ${updateError.message}`)
      } else {
        console.log(`   ✅ Updated successfully`)
        updatedCount++
      }
      console.log('')
    } else {
      console.log(`⏭️  Skipping: ${user.email || user.id} (${preferredModel || 'no preference'})`)
      skippedCount++
    }
  }

  console.log('='.repeat(60))
  console.log('📊 Update Summary')
  console.log('='.repeat(60))
  console.log(`✅ Updated: ${updatedCount} users`)
  console.log(`⏭️  Skipped: ${skippedCount} users`)
  console.log('')

  if (updatedCount > 0) {
    console.log('🎉 User preferences updated!')
    console.log('💡 Users will now use DeepSeek by default')
  }
}

updateUserPreferences().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
