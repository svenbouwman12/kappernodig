-- Fix booking system for both logged in and anonymous users
-- This migration adds client info fields to appointments and fixes RLS policies

-- 1. Add client info fields to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- 2. Update existing appointments to have client info if klant_id exists
UPDATE public.appointments 
SET 
  client_name = c.naam,
  client_email = c.email,
  client_phone = c.telefoon
FROM public.clients c
WHERE appointments.klant_id = c.id
AND appointments.client_name IS NULL;

-- 3. Drop and recreate RLS policies for appointments to allow anonymous bookings
DROP POLICY IF EXISTS "Appointments insert by client" ON public.appointments;
DROP POLICY IF EXISTS "Appointments select by client" ON public.appointments;
DROP POLICY IF EXISTS "Appointments update by client" ON public.appointments;

-- 4. New RLS policies for appointments
-- Allow anyone to insert appointments (for anonymous bookings)
CREATE POLICY "Appointments insert for all" ON public.appointments
  FOR INSERT TO anon, authenticated WITH CHECK (true);

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

-- 5. Fix clients table RLS policies to allow salon owners to manage clients
DROP POLICY IF EXISTS "Clients select for salon owner" ON public.clients;
DROP POLICY IF EXISTS "Clients insert for salon owner" ON public.clients;
DROP POLICY IF EXISTS "Clients update for salon owner" ON public.clients;
DROP POLICY IF EXISTS "Clients delete for salon owner" ON public.clients;

-- Allow salon owners to manage clients for their salons
CREATE POLICY "Clients select for salon owner" ON public.clients
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.barbers 
      WHERE barbers.id = clients.salon_id 
      AND barbers.owner_id = auth.uid()
    )
  );

CREATE POLICY "Clients insert for salon owner" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbers 
      WHERE barbers.id = clients.salon_id 
      AND barbers.owner_id = auth.uid()
    )
  );

CREATE POLICY "Clients update for salon owner" ON public.clients
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.barbers 
      WHERE barbers.id = clients.salon_id 
      AND barbers.owner_id = auth.uid()
    )
  );

CREATE POLICY "Clients delete for salon owner" ON public.clients
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.barbers 
      WHERE barbers.id = clients.salon_id 
      AND barbers.owner_id = auth.uid()
    )
  );

-- 6. Allow anonymous users to read salon hours and services
CREATE POLICY "Salon hours select for anonymous" ON public.salon_hours
  FOR SELECT TO anon USING (true);

CREATE POLICY "Services select for anonymous" ON public.services
  FOR SELECT TO anon USING (true);

-- 7. Allow anonymous users to read barber info
CREATE POLICY "Barbers select for anonymous" ON public.barbers
  FOR SELECT TO anon USING (true);
