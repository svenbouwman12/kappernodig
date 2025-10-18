-- Simple Database Check - Only essential info

-- 1. All tables and their RLS status
SELECT 
    tablename,
    rowsecurity,
    CASE WHEN rowsecurity THEN 'RLS ON' ELSE 'RLS OFF' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. All RLS policies
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Column info for main tables
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND table_name IN ('profiles', 'barbers', 'services', 'appointments', 'reviews')
ORDER BY table_name, ordinal_position;

-- 4. Row counts for each table
SELECT 'profiles' as table_name, count(*) as row_count FROM public.profiles
UNION ALL
SELECT 'barbers' as table_name, count(*) as row_count FROM public.barbers
UNION ALL
SELECT 'services' as table_name, count(*) as row_count FROM public.services
UNION ALL
SELECT 'appointments' as table_name, count(*) as row_count FROM public.appointments
UNION ALL
SELECT 'reviews' as table_name, count(*) as row_count FROM public.reviews
ORDER BY table_name;

-- 5. Sample data from profiles table
SELECT 'Sample profiles data:' as info;
SELECT id, naam, email, role FROM public.profiles LIMIT 3;

-- 6. Sample data from barbers table
SELECT 'Sample barbers data:' as info;
SELECT id, name, location, owner_id FROM public.barbers LIMIT 3;
