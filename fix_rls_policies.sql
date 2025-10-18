-- Fix infinite recursion in RLS policies
-- Het probleem: Admin policy veroorzaakt infinite recursion

-- Stap 1: Drop alle problematische admin policies
DROP POLICY IF EXISTS "Admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Admin reviews access" ON public.reviews;
DROP POLICY IF EXISTS "Admin appointments access" ON public.appointments;
DROP POLICY IF EXISTS "Admin barbers access" ON public.barbers;
DROP POLICY IF EXISTS "Admin services access" ON public.services;

-- Stap 2: Check welke policies er nog zijn
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Stap 3: Maak een eenvoudigere admin policy die geen recursion veroorzaakt
-- Voor profiles tabel - admin kan alles lezen en schrijven
CREATE POLICY "Admin profiles access" ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  ));

-- Stap 4: Test of de policies werken
-- Dit zou moeten werken zonder infinite recursion
SELECT COUNT(*) FROM public.profiles;
