import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔧 Fixing ALL models to use DeepSeek...\n')

// Get all models
const { data: models } = await supabase
  .from('models')
  .select('*')

console.log(`Found ${models.length} models\n`)

for (const model of models) {
  console.log(`Model: ${model.name}`)
  console.log(`  Current: ${model.base_model}`)
  
  if (model.base_model !== 'deepseek/deepseek-chat-v3.1:free') {
    await supabase
      .from('models')
      .update({ base_model: 'deepseek/deepseek-chat-v3.1:free' })
      .eq('id', model.id)
    
    console.log(`  ✅ Updated to: deepseek/deepseek-chat-v3.1:free`)
  } else {
    console.log(`  ✅ Already using DeepSeek`)
  }
  console.log('')
}

console.log('🎉 All models updated!')
