-- Simple admin setup - Check current constraints first
-- Run this to see what roles are allowed

-- Check current role constraints
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
AND conname LIKE '%role%';

-- Check current profiles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what roles currently exist
SELECT DISTINCT role FROM public.profiles;
