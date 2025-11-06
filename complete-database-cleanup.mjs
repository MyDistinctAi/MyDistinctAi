/**
 * Complete Database Cleanup
 * Delete all test data and start fresh
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

// Keep these real users
const KEEP_USERS = [
  'imoujoker@gmail.com',
  'abdalhadi19.cs@gmail.com',
]

async function cleanupDatabase() {
  console.log('🧹 COMPLETE DATABASE CLEANUP')
  console.log('='.repeat(60))
  console.log('⚠️  WARNING: This will delete:')
  console.log('   - All test users (~470 users)')
  console.log('   - All models')
  console.log('   - All training data files')
  console.log('   - All embeddings')
  console.log('   - All chat sessions and messages')
  console.log('')
  console.log('✅ Will keep:')
  console.log(`   - Real users: ${KEEP_USERS.join(', ')}`)
  console.log('='.repeat(60))
  console.log('')

  let stats = {
    usersDeleted: 0,
    modelsDeleted: 0,
    trainingFilesDeleted: 0,
    embeddingsDeleted: 0,
    chatSessionsDeleted: 0,
    chatMessagesDeleted: 0,
    storageFilesDeleted: 0,
  }

  // 1. Delete embeddings (no foreign key constraints)
  console.log('🗑️  Step 1: Deleting embeddings...')
  const { error: embeddingsError, count: embeddingsCount } = await supabase
    .from('document_embeddings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (embeddingsError) {
    console.error('   ❌ Error:', embeddingsError.message)
  } else {
    stats.embeddingsDeleted = embeddingsCount || 0
    console.log(`   ✅ Deleted ${stats.embeddingsDeleted} embeddings`)
  }

  // 2. Delete chat messages
  console.log('\n🗑️  Step 2: Deleting chat messages...')
  const { error: messagesError, count: messagesCount } = await supabase
    .from('chat_messages')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (messagesError) {
    console.error('   ❌ Error:', messagesError.message)
  } else {
    stats.chatMessagesDeleted = messagesCount || 0
    console.log(`   ✅ Deleted ${stats.chatMessagesDeleted} messages`)
  }

  // 3. Delete chat sessions
  console.log('\n🗑️  Step 3: Deleting chat sessions...')
  const { error: sessionsError, count: sessionsCount } = await supabase
    .from('chat_sessions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (sessionsError) {
    console.error('   ❌ Error:', sessionsError.message)
  } else {
    stats.chatSessionsDeleted = sessionsCount || 0
    console.log(`   ✅ Deleted ${stats.chatSessionsDeleted} sessions`)
  }

  // 4. Delete training data records
  console.log('\n🗑️  Step 4: Deleting training data records...')
  const { data: trainingFiles, error: trainingError } = await supabase
    .from('training_data')
    .select('*')

  if (!trainingError && trainingFiles) {
    console.log(`   Found ${trainingFiles.length} training files`)
    
    // Delete from storage
    for (const file of trainingFiles) {
      if (file.file_url) {
        try {
          const filePath = file.file_url.split('/training-data/')[1]
          if (filePath) {
            await supabase.storage.from('training-data').remove([filePath])
            stats.storageFilesDeleted++
          }
        } catch (err) {
          // Ignore storage errors
        }
      }
    }

    // Delete records
    const { error: deleteError, count } = await supabase
      .from('training_data')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (!deleteError) {
      stats.trainingFilesDeleted = count || 0
      console.log(`   ✅ Deleted ${stats.trainingFilesDeleted} training file records`)
      console.log(`   ✅ Deleted ${stats.storageFilesDeleted} files from storage`)
    }
  }

  // 5. Delete models
  console.log('\n🗑️  Step 5: Deleting models...')
  const { error: modelsError, count: modelsCount } = await supabase
    .from('models')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (modelsError) {
    console.error('   ❌ Error:', modelsError.message)
  } else {
    stats.modelsDeleted = modelsCount || 0
    console.log(`   ✅ Deleted ${stats.modelsDeleted} models`)
  }

  // 6. Delete test users
  console.log('\n🗑️  Step 6: Deleting test users...')
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (!authError && authUsers) {
    const usersToDelete = authUsers.users.filter(user => {
      const email = user.email?.toLowerCase()
      return !KEEP_USERS.some(keepEmail => email === keepEmail.toLowerCase())
    })

    console.log(`   Found ${usersToDelete.length} users to delete`)

    for (const user of usersToDelete) {
      try {
        await supabase.auth.admin.deleteUser(user.id)
        stats.usersDeleted++
        
        if (stats.usersDeleted % 50 === 0) {
          console.log(`   ✅ Deleted ${stats.usersDeleted}/${usersToDelete.length} users...`)
        }
      } catch (error) {
        // Continue on error
      }
      
      // Small delay to avoid rate limits
      if (stats.usersDeleted % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`   ✅ Deleted ${stats.usersDeleted} users`)
  }

  // 7. Update remaining users' preferred model
  console.log('\n🔄 Step 7: Updating remaining users...')
  const { error: updateError } = await supabase
    .from('users')
    .update({ preferred_ai_model: 'deepseek/deepseek-chat-v3.1:free' })
    .in('preferred_ai_model', [
      'google/gemini-flash-1.5-8b',
      'meta-llama/llama-3.3-70b-instruct:free'
    ])

  if (!updateError) {
    console.log('   ✅ Updated user preferences to DeepSeek')
  }

  // Final Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 CLEANUP SUMMARY')
  console.log('='.repeat(60))
  console.log(`🗑️  Users deleted: ${stats.usersDeleted}`)
  console.log(`🗑️  Models deleted: ${stats.modelsDeleted}`)
  console.log(`🗑️  Training files deleted: ${stats.trainingFilesDeleted}`)
  console.log(`🗑️  Storage files deleted: ${stats.storageFilesDeleted}`)
  console.log(`🗑️  Embeddings deleted: ${stats.embeddingsDeleted}`)
  console.log(`🗑️  Chat sessions deleted: ${stats.chatSessionsDeleted}`)
  console.log(`🗑️  Chat messages deleted: ${stats.chatMessagesDeleted}`)
  console.log('')
  console.log('✅ Remaining users:', KEEP_USERS.join(', '))
  console.log('')
  console.log('🎉 Database is now clean and ready for fresh testing!')
  console.log('💡 You can now create new models with the working AI models')
}

cleanupDatabase().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
