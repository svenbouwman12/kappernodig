-- Fix RLS policies for anonymous booking
-- This migration ensures anonymous users can create appointments

-- 1. Drop all existing appointment policies to start fresh
DROP POLICY IF EXISTS "Appointments insert for all" ON public.appointments;
DROP POLICY IF EXISTS "Appointments insert anonymous" ON public.appointments;
DROP POLICY IF EXISTS "Appointments insert authenticated" ON public.appointments;
DROP POLICY IF EXISTS "Appointments select by salon owner" ON public.appointments;
DROP POLICY IF EXISTS "Appointments select by client email" ON public.appointments;
DROP POLICY IF EXISTS "Appointments update by salon owner" ON public.appointments;
DROP POLICY IF EXISTS "Appointments update by client email" ON public.appointments;

-- 2. Create new policies that explicitly allow anonymous users
-- Allow anonymous users to insert appointments (for booking without account)
CREATE POLICY "Appointments insert anonymous" ON public.appointments
  FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated users to insert appointments
CREATE POLICY "Appointments insert authenticated" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow salon owners to see appointments for their salons
CREATE POLICY "Appointments select by salon owner" ON public.appointments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.barbers 
      WHERE barbers.id = appointments.salon_id 
      AND barbers.owner_id = auth.uid()
    )
  );

-- Allow clients to see their own appointments (by email match)
CREATE POLICY "Appointments select by client email" ON public.appointments
  FOR SELECT TO authenticated USING (
    client_email = auth.jwt() ->> 'email'
  );

-- Allow salon owners to update appointments for their salons
CREATE POLICY "Appointments update by salon owner" ON public.appointments
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.barbers 
      WHERE barbers.id = appointments.salon_id 
      AND barbers.owner_id = auth.uid()
    )
  );

-- Allow clients to update their own appointments (by email match)
CREATE POLICY "Appointments update by client email" ON public.appointments
  FOR UPDATE TO authenticated USING (
    client_email = auth.jwt() ->> 'email'
  );

-- 3. Ensure RLS is enabled on appointments table
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 4. Allow anonymous users to read salon hours and services
DROP POLICY IF EXISTS "Salon hours select for anonymous" ON public.salon_hours;
DROP POLICY IF EXISTS "Services select for anonymous" ON public.services;
DROP POLICY IF EXISTS "Barbers select for anonymous" ON public.barbers;

CREATE POLICY "Salon hours select for anonymous" ON public.salon_hours
  FOR SELECT TO anon USING (true);

CREATE POLICY "Services select for anonymous" ON public.services
  FOR SELECT TO anon USING (true);

CREATE POLICY "Barbers select for anonymous" ON public.barbers
  FOR SELECT TO anon USING (true);
