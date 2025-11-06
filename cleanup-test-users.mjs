/**
 * Cleanup Test Users
 * Remove all test users except the essential ones
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

// Keep these essential test users
const KEEP_USERS = [
  'johndoe@example.com',
  'janesmith@example.com',
  'bobwilson@example.com',
  'luluconcurseira@example.com',
  'danielbergholz@example.com',
  'imoujoker@gmail.com', // Your real account
  'abdalhadi19.cs@gmail.com', // Real account
]

async function cleanupTestUsers() {
  console.log('🧹 Cleaning up test users...\n')
  console.log('⚠️  WARNING: This will delete users permanently!')
  console.log('✅ Keeping essential test users:', KEEP_USERS.join(', '))
  console.log('')

  // Get all users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Error fetching users:', authError)
    return
  }

  // Find users to delete
  const usersToDelete = authUsers.users.filter(user => {
    const email = user.email?.toLowerCase()
    
    // Keep essential users
    if (KEEP_USERS.some(keepEmail => email === keepEmail.toLowerCase())) {
      return false
    }
    
    // Delete test users
    return email?.includes('@testmail.app') || 
           email?.includes('test@') ||
           email?.includes('@fantastu.com')
  })

  console.log(`📊 Total users: ${authUsers.users.length}`)
  console.log(`🗑️  Users to delete: ${usersToDelete.length}`)
  console.log(`✅ Users to keep: ${authUsers.users.length - usersToDelete.length}\n`)

  if (usersToDelete.length === 0) {
    console.log('✅ No users to delete!')
    return
  }

  console.log('⏳ Deleting users in batches...\n')

  let deletedCount = 0
  let failedCount = 0

  // Delete in batches of 10
  for (let i = 0; i < usersToDelete.length; i += 10) {
    const batch = usersToDelete.slice(i, i + 10)
    
    for (const user of batch) {
      try {
        const { error } = await supabase.auth.admin.deleteUser(user.id)
        
        if (error) {
          console.error(`   ❌ Failed to delete ${user.email}: ${error.message}`)
          failedCount++
        } else {
          deletedCount++
          if (deletedCount % 50 === 0) {
            console.log(`   ✅ Deleted ${deletedCount}/${usersToDelete.length} users...`)
          }
        }
      } catch (error) {
        console.error(`   ❌ Error deleting ${user.email}:`, error.message)
        failedCount++
      }
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Cleanup Summary')
  console.log('='.repeat(60))
  console.log(`✅ Deleted: ${deletedCount} users`)
  console.log(`❌ Failed: ${failedCount} users`)
  console.log(`✅ Kept: ${authUsers.users.length - usersToDelete.length} users`)
  console.log('')
  console.log('🎉 Cleanup complete!')
  console.log('💡 Your database is now much cleaner!')
}

cleanupTestUsers().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
