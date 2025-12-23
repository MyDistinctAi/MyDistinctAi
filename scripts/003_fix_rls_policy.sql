-- =====================================================
-- MyDistinctAI Database Migration
-- Version: 003 - Fix RLS Policy for User Registration
-- Description: Drop and recreate INSERT policy correctly
-- Issue: Policy exists but still violates RLS
-- =====================================================

-- First, drop the existing policy if it exists (won't error if it doesn't)
DROP POLICY IF EXISTS "Users can create own profile" ON users;

-- Create the INSERT policy with the correct check
CREATE POLICY "Users can create own profile" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Verify RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Check all policies on users table
DO $$
BEGIN
    RAISE NOTICE '✅ Policy recreated successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Current policies on users table:';
END $$;

SELECT
    policyname,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd;
