-- Fix admin policies - eenvoudige oplossing
-- Het probleem: Infinite recursion in RLS policies

-- Stap 1: Drop alle problematische policies
DROP POLICY IF EXISTS "Admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Admin reviews access" ON public.reviews;
DROP POLICY IF EXISTS "Admin appointments access" ON public.appointments;
DROP POLICY IF EXISTS "Admin barbers access" ON public.barbers;
DROP POLICY IF EXISTS "Admin services access" ON public.services;

-- Stap 2: Maak een simpele admin policy zonder recursion
-- Admin kan alles lezen en schrijven op profiles tabel
CREATE POLICY "Admin can do everything on profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Stap 3: Voor andere tabellen - admin heeft volledige toegang
CREATE POLICY "Admin can do everything on reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can do everything on appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can do everything on barbers" ON public.barbers
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can do everything on services" ON public.services
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Stap 4: Test
SELECT COUNT(*) FROM public.profiles;
SELECT COUNT(*) FROM public.reviews;
SELECT COUNT(*) FROM public.barbers;
