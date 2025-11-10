#!/usr/bin/env node

/**
 * Cleanup Test Models
 * Removes test models created during testing that have no embeddings
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_USER_ID = '68df2d44-5377-471a-a121-2f4023131a5c' // johndoe

async function cleanupTestModels() {
  console.log('🧹 Cleaning up test models...\n')

  try {
    // Get all models with their embedding counts
    const { data: models, error } = await supabase
      .from('models')
      .select(`
        id,
        name,
        base_model,
        status,
        created_at
      `)
      .eq('user_id', TEST_USER_ID)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching models:', error)
      return
    }

    console.log(`Found ${models.length} models\n`)

    // Check each model for embeddings
    for (const model of models) {
      const { count } = await supabase
        .from('document_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('model_id', model.id)

      const embeddingCount = count || 0

      if (embeddingCount === 0 && model.name.startsWith('Test ')) {
        console.log(`🗑️  Deleting: ${model.name} (${model.id})`)
        console.log(`   Created: ${new Date(model.created_at).toLocaleString()}`)
        console.log(`   Embeddings: ${embeddingCount}`)

        // Delete the model
        const { error: deleteError } = await supabase
          .from('models')
          .delete()
          .eq('id', model.id)

        if (deleteError) {
          console.error(`   ❌ Failed to delete: ${deleteError.message}`)
        } else {
          console.log(`   ✅ Deleted successfully\n`)
        }
      } else {
        console.log(`✅ Keeping: ${model.name}`)
        console.log(`   Embeddings: ${embeddingCount}`)
        console.log(`   Created: ${new Date(model.created_at).toLocaleString()}\n`)
      }
    }

    console.log('✅ Cleanup complete!')

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
  }
}

cleanupTestModels()
