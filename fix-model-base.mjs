#!/usr/bin/env node

/**
 * Fix Model Base Model
 * 
 * Updates all models to use a FREE OpenRouter model instead of DeepSeek
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Free models available on OpenRouter
const FREE_MODEL = 'google/gemini-flash-1.5-8b' // Fastest and largest context

async function fixModels() {
  console.log('🔧 Fixing model base_model to use FREE OpenRouter models...\n')

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

    // Update each model
    for (const model of models) {
      console.log(`📝 Model: ${model.name} (${model.id})`)
      console.log(`   Current base_model: ${model.base_model}`)

      // Check if it's using a paid model
      if (model.base_model && !model.base_model.includes(':free') && !model.base_model.includes('gemini-flash')) {
        console.log(`   ⚠️  Using PAID model - updating to FREE model...`)

        const { error: updateError } = await supabase
          .from('models')
          .update({
            base_model: FREE_MODEL,
            updated_at: new Date().toISOString()
          })
          .eq('id', model.id)

        if (updateError) {
          console.error(`   ❌ Error updating model:`, updateError)
        } else {
          console.log(`   ✅ Updated to: ${FREE_MODEL}`)
        }
      } else {
        console.log(`   ✅ Already using FREE model`)
      }
      console.log('')
    }

    console.log('✅ All models updated!\n')
    console.log('📋 Available FREE models:')
    console.log('   - google/gemini-flash-1.5-8b (Fastest, 1M context)')
    console.log('   - meta-llama/llama-3.3-70b-instruct:free (Best quality)')
    console.log('   - qwen/qwen-2.5-72b-instruct:free (Multilingual)')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixModels()
