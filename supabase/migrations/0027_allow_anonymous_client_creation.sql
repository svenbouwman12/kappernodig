-- Allow anonymous users to create client records for booking
-- This enables anonymous users to create client records when booking appointments

-- Drop existing policies for clients table
DROP POLICY IF EXISTS "Clients select for salon owner" ON public.clients;
DROP POLICY IF EXISTS "Clients insert for salon owner" ON public.clients;
DROP POLICY IF EXISTS "Clients update for salon owner" ON public.clients;
DROP POLICY IF EXISTS "Clients delete for salon owner" ON public.clients;

-- Create new policies that allow anonymous users to create clients
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

-- Allow anonymous users to create clients (for booking)
CREATE POLICY "Clients insert anonymous" ON public.clients
  FOR INSERT TO anon WITH CHECK (true);

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

-- Ensure RLS is enabled on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
