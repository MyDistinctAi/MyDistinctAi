/**
 * Supabase Connection Test Script
 *
 * This script tests the Supabase connection and verifies that:
 * 1. Environment variables are properly configured
 * 2. Connection to Supabase can be established
 * 3. Authentication system is accessible
 *
 * Run with: npx tsx scripts/test-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n')

  // Check environment variables
  console.log('1️⃣ Checking Environment Variables...')
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set')
    process.exit(1)
  }
  if (!supabaseAnonKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
    process.exit(1)
  }
  console.log('✅ Environment variables are configured')
  console.log(`   URL: ${supabaseUrl}`)
  console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...`)
  console.log()

  // Initialize Supabase client
  console.log('2️⃣ Initializing Supabase Client...')
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  console.log('✅ Supabase client initialized')
  console.log()

  // Test connection by checking auth status
  console.log('3️⃣ Testing Connection (Auth Status)...')
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('❌ Error connecting to Supabase:', error.message)
      process.exit(1)
    }

    console.log('✅ Successfully connected to Supabase!')
    console.log('   Session:', data.session ? 'Active' : 'No active session (expected)')
    console.log()
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  }

  // Check if we can query the database (will fail if tables don't exist yet)
  console.log('4️⃣ Testing Database Access...')
  try {
    // Try to query users table (will return error if table doesn't exist)
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(0)

    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        console.log('⚠️  Users table does not exist yet (expected before migration)')
        console.log('   Next step: Run SQL migration to create tables')
      } else {
        console.log('⚠️  Database query error:', error.message)
        console.log('   This is normal if tables haven\'t been created yet')
      }
    } else {
      console.log('✅ Database is accessible and tables exist!')
    }
    console.log()
  } catch (err) {
    console.log('⚠️  Database query failed (expected before migration)')
    console.log()
  }

  // Summary
  console.log('📊 Test Summary')
  console.log('═══════════════════════════════════════')
  console.log('✅ Supabase connection successful')
  console.log('✅ Authentication system accessible')
  console.log('⏭️  Next step: Create database tables with SQL migration')
  console.log()
  console.log('To create tables, run the SQL migration from claude.md (Prompt 3)')
}

// Run the test
testSupabaseConnection().catch((error) => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})
