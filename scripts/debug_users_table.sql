-- Check the actual structure of the users table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing RLS policies on users table
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';

-- Check if service role can insert
-- Try a test insert (will rollback)
BEGIN;
INSERT INTO users (id, email, name, niche, subscription_status)
VALUES ('00000000-0000-0000-0000-000000000001', 'test@test.com', 'Test', NULL, 'free');
ROLLBACK;
