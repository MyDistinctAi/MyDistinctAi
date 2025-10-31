/**
 * Run Supabase Migration Script
 * Executes the user INSERT policy fix directly on the remote database
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SQL_QUERY = `
-- Add INSERT policy for users table
-- This allows authenticated users to create their own profile during registration
CREATE POLICY "Users can create own profile" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);
`;

async function runMigration() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing Supabase credentials in .env.local');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('🚀 Running migration on Supabase...');
  console.log(`📍 URL: ${SUPABASE_URL}`);
  console.log('');

  const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);

  const data = JSON.stringify({
    query: SQL_QUERY
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Migration completed successfully!');
          console.log('');
          console.log('Fixed: Added INSERT policy to users table');
          console.log('Users can now register and create their profiles');
          console.log('');
          console.log('Next step: Test user registration at http://localhost:3000/register');
          resolve();
        } else {
          console.error(`❌ Migration failed with status ${res.statusCode}`);
          console.error('Response:', responseData);

          if (res.statusCode === 404) {
            console.log('');
            console.log('⚠️  The exec_sql RPC function might not exist.');
            console.log('Please run the migration manually in Supabase Dashboard:');
            console.log('');
            console.log('1. Go to: https://supabase.com/dashboard');
            console.log('2. Open SQL Editor');
            console.log('3. Run this SQL:');
            console.log('');
            console.log(SQL_QUERY);
          }

          reject(new Error(`Migration failed: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Network error:', error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

runMigration().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});
