-- Setup admin users and permissions
-- This migration helps set up admin accounts for the admin panel

-- Function to create admin user profile (to be called after creating auth user)
CREATE OR REPLACE FUNCTION create_admin_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT DEFAULT 'Admin'
)
RETURNS VOID AS $$
BEGIN
  -- Insert or update profile with admin role
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

-- Function to promote existing user to admin
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

-- Create admin permissions policy
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

-- Grant admin permissions on other tables
DROP POLICY IF EXISTS "Admin reviews access" ON public.reviews;
CREATE POLICY "Admin reviews access" ON public.reviews
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin appointments access" ON public.appointments;
CREATE POLICY "Admin appointments access" ON public.appointments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin barbers access" ON public.barbers;
CREATE POLICY "Admin barbers access" ON public.barbers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin services access" ON public.services;
CREATE POLICY "Admin services access" ON public.services
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Add helpful comments
COMMENT ON FUNCTION create_admin_profile(UUID, TEXT, TEXT) IS 'Creates an admin profile for a given user ID and email';
COMMENT ON FUNCTION promote_to_admin(TEXT) IS 'Promotes an existing user to admin role by email';

-- Instructions for creating admin accounts:
-- 1. Create user in Supabase Auth UI (Authentication > Users > Add user)
-- 2. Copy the user ID from the created user
-- 3. Run: SELECT create_admin_profile('USER_ID_HERE', 'admin@yourdomain.com', 'Admin Name');
-- 4. Or promote existing user: SELECT promote_to_admin('existing@email.com');
