-- =====================================================
-- MyDistinctAI Database Migration
-- Version: 002 - Fix User Registration
-- Description: Add missing INSERT policy for users table
-- Issue: Users couldn't register because RLS blocked profile creation
-- =====================================================

-- Add INSERT policy for users table
-- This allows authenticated users to create their own profile during registration
CREATE POLICY "Users can create own profile" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 002 completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Fixed: Added INSERT policy to users table';
    RAISE NOTICE 'Users can now register and create their profiles';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Test user registration';
END $$;
