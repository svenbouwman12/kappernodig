-- Complete admin setup SQL
-- Run this in your Supabase SQL Editor to set up the admin panel

-- Step 1: Add missing columns to profiles table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'last_login') THEN
        ALTER TABLE public.profiles ADD COLUMN last_login TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Step 2: Create admin functions
CREATE OR REPLACE FUNCTION create_admin_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT DEFAULT 'Admin'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    naam,
    email,
    role,
    created_at
  ) VALUES (
    user_id,
    user_name,
    user_email,
    'admin',
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET 
    role = 'admin',
    updated_at = NOW()
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create admin permissions
DROP POLICY IF EXISTS "Admin full access" ON public.profiles;
CREATE POLICY "Admin full access" ON public.profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Step 4: Instructions for creating admin account
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" and create a user with email: admin@kappernodig.nl
-- 3. Copy the User ID from the created user
-- 4. Run the following command with the actual User ID:

-- SELECT create_admin_profile('USER_ID_HERE', 'admin@kappernodig.nl', 'Admin');

-- Or promote an existing user:
-- SELECT promote_to_admin('existing@email.com');
