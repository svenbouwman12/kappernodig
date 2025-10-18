-- Fix RLS policies for admin access
-- This script fixes the 406 Not Acceptable errors

-- Drop existing problematic policies
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- Create simple policies that allow authenticated users to access profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE USING (auth.role() = 'authenticated');

-- Also fix other tables that might have similar issues
DROP POLICY IF EXISTS "barbers_select_policy" ON public.barbers;
DROP POLICY IF EXISTS "barbers_insert_policy" ON public.barbers;
DROP POLICY IF EXISTS "barbers_update_policy" ON public.barbers;
DROP POLICY IF EXISTS "barbers_delete_policy" ON public.barbers;

CREATE POLICY "barbers_select_policy" ON public.barbers
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "barbers_insert_policy" ON public.barbers
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "barbers_update_policy" ON public.barbers
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "barbers_delete_policy" ON public.barbers
FOR DELETE USING (auth.role() = 'authenticated');

-- Fix services table
DROP POLICY IF EXISTS "services_select_policy" ON public.services;
DROP POLICY IF EXISTS "services_insert_policy" ON public.services;
DROP POLICY IF EXISTS "services_update_policy" ON public.services;
DROP POLICY IF EXISTS "services_delete_policy" ON public.services;

CREATE POLICY "services_select_policy" ON public.services
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "services_insert_policy" ON public.services
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "services_update_policy" ON public.services
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "services_delete_policy" ON public.services
FOR DELETE USING (auth.role() = 'authenticated');

-- Fix appointments table
DROP POLICY IF EXISTS "appointments_select_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_policy" ON public.appointments;

CREATE POLICY "appointments_select_policy" ON public.appointments
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "appointments_insert_policy" ON public.appointments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "appointments_update_policy" ON public.appointments
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "appointments_delete_policy" ON public.appointments
FOR DELETE USING (auth.role() = 'authenticated');

-- Fix reviews table
DROP POLICY IF EXISTS "reviews_select_policy" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_policy" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_policy" ON public.reviews;
DROP POLICY IF EXISTS "reviews_delete_policy" ON public.reviews;

CREATE POLICY "reviews_select_policy" ON public.reviews
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "reviews_insert_policy" ON public.reviews
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "reviews_update_policy" ON public.reviews
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "reviews_delete_policy" ON public.reviews
FOR DELETE USING (auth.role() = 'authenticated');
