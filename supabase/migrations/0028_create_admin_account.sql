-- Create admin account for the admin panel
-- This migration creates a default admin user for accessing the admin panel

-- Insert admin user into auth.users (this would normally be done through Supabase Auth UI)
-- For development/testing purposes, we'll create the profile entry
-- Note: You'll need to create the actual auth user through Supabase Auth UI first

-- Create admin profile
-- Note: Run migration 0030_add_profiles_columns.sql first to add missing columns
INSERT INTO public.profiles (
  id,
  naam,
  email,
  role,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID from auth.users
  'Admin',
  'admin@kappernodig.nl',
  'admin',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- Add some sample data for testing if needed
-- You can uncomment these if you want sample data for testing

-- Sample kapper account (if not exists)
INSERT INTO public.profiles (
  id,
  naam,
  email,
  role,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Test Kapper',
  'kapper@kappernodig.nl',
  'kapper',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Sample client account (if not exists)
INSERT INTO public.profiles (
  id,
  naam,
  email,
  role,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Test Klant',
  'klant@kappernodig.nl',
  'client',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles with role-based access control';
COMMENT ON COLUMN public.profiles.role IS 'User role: admin, kapper, or client';
COMMENT ON COLUMN public.profiles.is_active IS 'Whether the user account is active';
