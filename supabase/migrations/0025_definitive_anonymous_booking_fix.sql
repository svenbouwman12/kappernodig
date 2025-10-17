-- Definitive fix for anonymous booking RLS policies
-- This migration completely resets and recreates all appointment policies

-- 1. Completely disable RLS temporarily to reset everything
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies (including any that might have different names)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.appointments', pol.policyname);
    END LOOP;
END $$;

-- 3. Re-enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 4. Create the correct policies for anonymous booking
-- Allow anonymous users to insert appointments
CREATE POLICY "Allow anonymous appointment creation" ON public.appointments
  FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated users to insert appointments  
CREATE POLICY "Allow authenticated appointment creation" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow salon owners to view appointments for their salons
CREATE POLICY "Salon owners can view their appointments" ON public.appointments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.barbers 
      WHERE barbers.id = appointments.salon_id 
      AND barbers.owner_id = auth.uid()
    )
  );

-- Allow clients to view their own appointments by email
CREATE POLICY "Clients can view their appointments" ON public.appointments
  FOR SELECT TO authenticated USING (
    client_email = auth.jwt() ->> 'email'
  );

-- Allow salon owners to update appointments for their salons
CREATE POLICY "Salon owners can update their appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.barbers 
      WHERE barbers.id = appointments.salon_id 
      AND barbers.owner_id = auth.uid()
    )
  );

-- Allow clients to update their own appointments by email
CREATE POLICY "Clients can update their appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (
    client_email = auth.jwt() ->> 'email'
  );

-- 5. Ensure other tables allow anonymous access for booking
-- Drop and recreate policies for salon_hours
DROP POLICY IF EXISTS "Salon hours select for anonymous" ON public.salon_hours;
DROP POLICY IF EXISTS "Salon hours select for all" ON public.salon_hours;
CREATE POLICY "Allow anonymous salon hours access" ON public.salon_hours
  FOR SELECT TO anon, authenticated USING (true);

-- Drop and recreate policies for services  
DROP POLICY IF EXISTS "Services select for anonymous" ON public.services;
DROP POLICY IF EXISTS "Services select for all" ON public.services;
CREATE POLICY "Allow anonymous services access" ON public.services
  FOR SELECT TO anon, authenticated USING (true);

-- Drop and recreate policies for barbers
DROP POLICY IF EXISTS "Barbers select for anonymous" ON public.barbers;
DROP POLICY IF EXISTS "Barbers select for all" ON public.barbers;
CREATE POLICY "Allow anonymous barbers access" ON public.barbers
  FOR SELECT TO anon, authenticated USING (true);

-- 6. Verify RLS is enabled on all tables
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
