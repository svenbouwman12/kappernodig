-- Direct admin setup - No functions needed
-- This is the simplest way to add an admin user

-- Step 1: First, check what roles are allowed
SELECT DISTINCT role FROM public.profiles;

-- Step 2: Add missing columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 3: Create user in Supabase Auth UI first
-- Go to: Supabase Dashboard > Authentication > Users > Add user
-- Email: admin@kappernodig.nl
-- Password: admin123

-- Step 4: After creating the auth user, get the user ID and run this:
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID from auth.users

-- Method 1: Try with 'admin' role
INSERT INTO public.profiles (
    id,
    naam,
    email,
    role,
    created_at
) VALUES (
    'YOUR_USER_ID_HERE', -- Replace with actual user ID
    'Admin',
    'admin@kappernodig.nl',
    'admin',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

-- Method 2: If 'admin' doesn't work, try with existing role and update manually
-- INSERT INTO public.profiles (
--     id,
--     naam,
--     email,
--     role,
--     created_at
-- ) VALUES (
--     'YOUR_USER_ID_HERE', -- Replace with actual user ID
--     'Admin',
--     'admin@kappernodig.nl',
--     'kapper', -- Use existing role first
--     NOW()
-- ) ON CONFLICT (id) DO UPDATE SET
--     naam = 'Admin',
--     email = 'admin@kappernodig.nl',
--     updated_at = NOW();

-- Step 5: If you used method 2, manually update the role:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@kappernodig.nl';

-- Step 6: Verify the admin user was created
SELECT id, naam, email, role, is_active FROM public.profiles WHERE email = 'admin@kappernodig.nl';
