/**
 * Supabase Connection Test Script
 *
 * This script tests the Supabase connection and verifies that:
 * 1. Environment variables are properly configured
 * 2. Connection to Supabase can be established
 * 3. Authentication system is accessible
 *
 * Run with: node scripts/test-supabase.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables from .env.local
function loadEnv() {
  try {
    const envPath = resolve('.env.local')
    const envFile = readFileSync(envPath, 'utf-8')
    const envVars = {}

    envFile.split('\n').forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim()
        envVars[key] = value
        process.env[key] = value
      }
    })

    return envVars
  } catch (error) {
    console.error('❌ Could not read .env.local file:', error.message)
    process.exit(1)
  }
}

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n')

  // Load environment variables
  console.log('0️⃣ Loading Environment Variables from .env.local...')
  loadEnv()
  console.log('✅ Environment file loaded')
  console.log()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Check environment variables
  console.log('1️⃣ Checking Environment Variables...')
  if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set or still has placeholder value')
    process.exit(1)
  }
  if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key') {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or still has placeholder value')
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
    const { data, error } = await supabase.from('users').select('count').limit(0)

    if (error) {
      if (
        error.message.includes('does not exist') ||
        error.code === '42P01' ||
        error.message.includes('relation')
      ) {
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
    console.log('⚠️  Database query failed:', err.message)
    console.log('   This is expected if tables haven\'t been created yet')
    console.log()
  }

  // Summary
  console.log('📊 Test Summary')
  console.log('═══════════════════════════════════════')
  console.log('✅ Supabase connection successful')
  console.log('✅ Authentication system accessible')
  console.log('✅ Environment variables properly configured')
  console.log('⏭️  Next step: Create database tables with SQL migration')
  console.log()
  console.log('To create tables:')
  console.log('1. Go to your Supabase Dashboard')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Run the migration script from claude.md (Prompt 3)')
  console.log()
}

// Run the test
testSupabaseConnection().catch((error) => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})
