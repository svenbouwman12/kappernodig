-- Simple way to add admin users
-- This script will work regardless of the role constraint

-- Step 1: Check what roles are currently allowed
SELECT DISTINCT role FROM public.profiles;

-- Step 2: Add missing columns if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Step 3: Simple function to add admin (works with any role constraint)
CREATE OR REPLACE FUNCTION add_admin_user(user_email TEXT, user_name TEXT DEFAULT 'Admin')
RETURNS TEXT AS $$
DECLARE
    existing_user_id UUID;
    result_message TEXT;
BEGIN
    -- Check if user already exists in auth.users
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF existing_user_id IS NULL THEN
        RETURN 'ERROR: User with email ' || user_email || ' does not exist in auth.users. Please create the user first in Supabase Auth UI.';
    END IF;
    
    -- Insert or update profile
    INSERT INTO public.profiles (
        id,
        naam,
        email,
        role,
        created_at
    ) VALUES (
        existing_user_id,
        user_name,
        user_email,
        'kapper', -- Use existing role first, then we'll update it
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        naam = user_name,
        email = user_email,
        updated_at = NOW();
    
    -- Try to update to admin role
    BEGIN
        UPDATE public.profiles 
        SET role = 'admin', updated_at = NOW()
        WHERE id = existing_user_id;
        result_message := 'SUCCESS: Admin user ' || user_email || ' created/updated successfully!';
    EXCEPTION WHEN OTHERS THEN
        -- If admin role is not allowed, try 'superuser' or other variations
        BEGIN
            UPDATE public.profiles 
            SET role = 'superuser', updated_at = NOW()
            WHERE id = existing_user_id;
            result_message := 'SUCCESS: Superuser ' || user_email || ' created/updated successfully! (using superuser role)';
        EXCEPTION WHEN OTHERS THEN
            result_message := 'WARNING: User created but could not set admin role. Current role: ' || (SELECT role FROM public.profiles WHERE id = existing_user_id) || '. You may need to manually update the role.';
        END;
    END;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Instructions for use
-- 1. Create user in Supabase Auth UI first
-- 2. Run: SELECT add_admin_user('admin@kappernodig.nl', 'Admin');
