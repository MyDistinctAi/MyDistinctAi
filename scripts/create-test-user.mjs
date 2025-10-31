#!/usr/bin/env node

/**
 * Create a test user for development
 * Usage: node scripts/create-test-user.mjs
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const testUser = {
  email: 'demo@testmail.app',
  password: 'Demo123456!',
  name: 'Demo User',
  niche: 'Technology'
}

console.log('🔧 Creating test user...')
console.log(`📧 Email: ${testUser.email}`)
console.log(`🔑 Password: ${testUser.password}`)

try {
  // Create the auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testUser.email,
    password: testUser.password,
    email_confirm: true,
    user_metadata: {
      name: testUser.name,
      niche: testUser.niche
    }
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('⚠️  User already exists')
      console.log('\n✅ You can login with:')
      console.log(`   Email: ${testUser.email}`)
      console.log(`   Password: ${testUser.password}`)
      console.log(`\n🌐 Go to: http://localhost:3000/login`)
      process.exit(0)
    }
    throw authError
  }

  // Create the profile
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email: testUser.email,
      name: testUser.name,
      niche: testUser.niche,
      subscription_status: 'free'
    })

  if (profileError) {
    console.error('❌ Profile creation failed:', profileError.message)
    process.exit(1)
  }

  console.log('\n✅ Test user created successfully!')
  console.log('\n📝 Login credentials:')
  console.log(`   Email: ${testUser.email}`)
  console.log(`   Password: ${testUser.password}`)
  console.log(`\n🌐 Go to: http://localhost:3000/login`)

} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}
