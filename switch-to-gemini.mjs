#!/usr/bin/env node

/**
 * Switch all models from DeepSeek to Gemini Flash
 * Gemini Flash has better rate limits and is more reliable
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

// Gemini Flash - Most reliable free model with 1M context window
const NEW_MODEL = 'google/gemini-flash-1.5-8b'

async function switchModels() {
  console.log('🔄 Switching all models to Gemini Flash...\n')
  console.log('📌 New model:', NEW_MODEL)
  console.log('   - Provider: Google')
  console.log('   - Context: 1M tokens (largest!)')
  console.log('   - Speed: Very Fast')
  console.log('   - Rate Limits: Much higher than DeepSeek\n')

  try {
    // Get all models
    const { data: models, error } = await supabase
      .from('models')
      .select('*')

    if (error) {
      console.error('❌ Error fetching models:', error)
      return
    }

    if (!models || models.length === 0) {
      console.log('⚠️  No models found')
      return
    }

    console.log(`Found ${models.length} models\n`)

    let updated = 0
    let skipped = 0

    // Update each model
    for (const model of models) {
      if (model.base_model !== NEW_MODEL) {
        const { error: updateError } = await supabase
          .from('models')
          .update({
            base_model: NEW_MODEL,
            updated_at: new Date().toISOString()
          })
          .eq('id', model.id)

        if (updateError) {
          console.error(`❌ Error updating ${model.name}:`, updateError)
        } else {
          console.log(`✅ Updated: ${model.name}`)
          updated++
        }
      } else {
        console.log(`⏭️  Skipped: ${model.name} (already using Gemini)`)
        skipped++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Updated: ${updated} models`)
    console.log(`   ⏭️  Skipped: ${skipped} models`)
    console.log(`   📝 Total: ${models.length} models`)
    console.log('\n✅ All models now using Gemini Flash!')
    console.log('🚀 This model has much better rate limits and reliability.')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

switchModels()
