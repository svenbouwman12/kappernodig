-- Complete fix for all RLS policies
-- This will disable RLS temporarily and create simple policies

-- Step 1: Disable RLS on all tables temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Admin can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin reviews access" ON public.reviews;
DROP POLICY IF EXISTS "Admin can do everything on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin appointments access" ON public.appointments;
DROP POLICY IF EXISTS "Admin can do everything on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin barbers access" ON public.barbers;
DROP POLICY IF EXISTS "Admin can do everything on barbers" ON public.barbers;
DROP POLICY IF EXISTS "Admin services access" ON public.services;
DROP POLICY IF EXISTS "Admin can do everything on services" ON public.services;

-- Step 3: Create simple policies that allow everything for authenticated users
CREATE POLICY "Allow all for authenticated users" ON public.profiles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON public.barbers
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON public.appointments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON public.services
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON public.reviews
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 4: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Step 5: Test
SELECT COUNT(*) FROM public.profiles;
SELECT COUNT(*) FROM public.barbers;
SELECT COUNT(*) FROM public.appointments;
SELECT COUNT(*) FROM public.services;
SELECT COUNT(*) FROM public.reviews;
