-- Add RLS policy to allow kappers to read bookmarks for their own barbers
-- This allows kappers to see how many favorites their barbers have

-- First, let's check if we need to add a policy for kappers to read bookmarks
-- Kappers should be able to see bookmarks for barbers they own

-- Create a policy that allows kappers to read bookmarks for their own barbers
CREATE POLICY "Kappers can view bookmarks for their barbers" ON public.bookmarks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.barbers 
      WHERE barbers.id = bookmarks.salon_id 
      AND barbers.owner_id = auth.uid()
    )
  );

-- Also allow kappers to see the count of bookmarks for their barbers
-- This is needed for the dashboard statistics
