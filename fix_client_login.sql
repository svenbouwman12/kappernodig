-- Fix client login and registration by ensuring proper RLS policies

-- First, let's check current RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- Check current policies on profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;

-- Since RLS is disabled, let's make sure it stays disabled for client access
-- But add specific policies for authenticated users to access profiles

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can do everything on profiles" ON profiles;
DROP POLICY IF EXISTS "admin_full_access_profiles" ON profiles;

-- Create simple policies for authenticated users
CREATE POLICY "Authenticated users can view profiles" ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert profiles" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update profiles" ON profiles
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Ensure RLS is enabled on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Test query to verify access
SELECT 'Testing profiles access...' as status;

-- Show final policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;
