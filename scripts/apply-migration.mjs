/**
 * Apply Migration: Fix User Registration
 * Adds missing INSERT policy to users table
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function applyMigration() {
  console.log('🚀 MyDistinctAI - Database Migration Tool');
  console.log('━'.repeat(50));
  console.log('');

  // Validate credentials
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('');
    console.error('Please ensure these are set in .env.local:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('🔑 Using Service Role Key');
  console.log('');

  // Create Supabase admin client
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Read migration SQL
  const migrationPath = join(__dirname, '002_fix_user_insert_policy.sql');
  let sqlContent;

  try {
    sqlContent = readFileSync(migrationPath, 'utf-8');
  } catch (error) {
    console.error('❌ Error: Could not read migration file');
    console.error(`Expected: ${migrationPath}`);
    console.error(error.message);
    process.exit(1);
  }

  console.log('📄 Migration File: 002_fix_user_insert_policy.sql');
  console.log('');
  console.log('Running SQL:');
  console.log('━'.repeat(50));
  console.log(sqlContent.split('\n').slice(7, 13).join('\n'));
  console.log('━'.repeat(50));
  console.log('');

  try {
    // Execute the SQL using Supabase RPC
    const { data, error } = await supabase.rpc('exec', {
      sql: `
        CREATE POLICY "Users can create own profile" ON users
          FOR INSERT
          WITH CHECK (auth.uid() = id);
      `
    });

    if (error) {
      // If RPC doesn't exist, try direct query
      console.log('⚠️  RPC method not available, trying direct SQL execution...');
      console.log('');

      // Note: Supabase client doesn't support raw SQL execution
      // We need to use PostgREST or psql
      throw new Error('Direct SQL execution not supported via Supabase client. Please use Dashboard SQL Editor.');
    }

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('✓ Added INSERT policy to users table');
    console.log('✓ Users can now register and create profiles');
    console.log('');
    console.log('━'.repeat(50));
    console.log('📝 Next Steps:');
    console.log('  1. Test user registration at http://localhost:3000/register');
    console.log('  2. Verify no more "profile setup failed" errors');
    console.log('━'.repeat(50));

  } catch (error) {
    console.error('❌ Migration failed!');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.log('━'.repeat(50));
    console.log('📋 Manual Steps Required:');
    console.log('');
    console.log('Please run this SQL manually in Supabase Dashboard:');
    console.log('');
    console.log('1. Go to: https://supabase.com/dashboard/project/ekfdbotohslpalnyvdpk/sql');
    console.log('2. Click "New Query"');
    console.log('3. Paste and run this SQL:');
    console.log('');
    console.log('   CREATE POLICY "Users can create own profile" ON users');
    console.log('     FOR INSERT');
    console.log('     WITH CHECK (auth.uid() = id);');
    console.log('');
    console.log('━'.repeat(50));
    process.exit(1);
  }
}

applyMigration();
