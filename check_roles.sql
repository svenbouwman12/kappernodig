-- Check welke rollen er mogelijk zijn in de profiles tabel
-- Voer deze SQL uit om te zien wat er allemaal kan

-- Stap 1: Check welke rollen er al bestaan
SELECT DISTINCT role, COUNT(*) as aantal 
FROM public.profiles 
GROUP BY role 
ORDER BY aantal DESC;

-- Stap 2: Check de table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Stap 3: Check of er constraints zijn op de role kolom
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
AND conname LIKE '%role%';

-- Stap 4: Check alle users in auth.users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Stap 5: Check alle profiles
SELECT id, naam, email, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- Stap 6: Check of er een check constraint is
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'profiles' 
AND tc.table_schema = 'public'
AND tc.constraint_type = 'CHECK';
