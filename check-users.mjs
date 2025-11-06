/**
 * Check Users in Database
 * See how many users exist and their details
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

async function checkUsers() {
  console.log('👥 Checking Users in Database...\n')

  // Get all users from auth
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Error fetching auth users:', authError)
    return
  }

  console.log(`📊 Total Auth Users: ${authUsers.users.length}\n`)

  // Group by email pattern
  const testUsers = authUsers.users.filter(u => 
    u.email?.includes('test') || 
    u.email?.includes('example.com') ||
    u.email?.includes('john.doe') ||
    u.email?.includes('jane.smith')
  )

  const realUsers = authUsers.users.filter(u => 
    !u.email?.includes('test') && 
    !u.email?.includes('example.com') &&
    !u.email?.includes('john.doe') &&
    !u.email?.includes('jane.smith')
  )

  console.log(`🧪 Test Users: ${testUsers.length}`)
  testUsers.forEach((user, i) => {
    console.log(`   ${i + 1}. ${user.email} (${user.id})`)
    console.log(`      Created: ${new Date(user.created_at).toLocaleString()}`)
    console.log(`      Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`)
  })

  console.log(`\n👤 Real Users: ${realUsers.length}`)
  realUsers.forEach((user, i) => {
    console.log(`   ${i + 1}. ${user.email} (${user.id})`)
    console.log(`      Created: ${new Date(user.created_at).toLocaleString()}`)
    console.log(`      Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`)
  })

  // Check users table
  const { data: dbUsers, error: dbError } = await supabase
    .from('users')
    .select('*')

  if (!dbError && dbUsers) {
    console.log(`\n📊 Users in 'users' table: ${dbUsers.length}`)
    
    // Check for orphaned users (in users table but not in auth)
    const authUserIds = authUsers.users.map(u => u.id)
    const orphanedUsers = dbUsers.filter(u => !authUserIds.includes(u.id))
    
    if (orphanedUsers.length > 0) {
      console.log(`\n⚠️  Orphaned Users (in users table but not in auth): ${orphanedUsers.length}`)
      orphanedUsers.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email || user.id}`)
      })
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('💡 Recommendation:')
  console.log('='.repeat(60))
  
  if (testUsers.length > 5) {
    console.log(`⚠️  You have ${testUsers.length} test users`)
    console.log('   Consider keeping only the essential test users:')
    console.log('   - johndoe@example.com')
    console.log('   - janesmith@example.com')
    console.log('   - bobwilson@example.com')
    console.log('\n   Delete the rest to clean up the database')
  } else {
    console.log('✅ User count looks reasonable')
  }
}

checkUsers().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
