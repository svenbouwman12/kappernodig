-- Add booking system tables and functionality
-- This migration adds the necessary tables for the booking system

-- 1. Add salon_hours table for opening hours
CREATE TABLE IF NOT EXISTS public.salon_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(salon_id, day_of_week)
);

-- 2. Add status column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'canceled', 'completed'));

-- 3. Add service_id column to appointments table (optional for now)
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id);

-- 4. Add barber_id column to appointments table (for future multi-barber support)
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES public.barbers(id);

-- 5. Add duration column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_salon_hours_salon_id ON public.salon_hours(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_hours_day_of_week ON public.salon_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON public.appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_barber_id ON public.appointments(barber_id);

-- 7. Enable RLS on salon_hours
ALTER TABLE public.salon_hours ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for salon_hours
CREATE POLICY "Salon hours select for all" ON public.salon_hours
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Salon hours insert by salon owner" ON public.salon_hours
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbers 
      WHERE barbers.id = salon_hours.salon_id 
      AND barbers.owner_id = auth.uid()
    )
  );

CREATE POLICY "Salon hours update by salon owner" ON public.salon_hours
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.barbers 
      WHERE barbers.id = salon_hours.salon_id 
      AND barbers.owner_id = auth.uid()
    )
  );

CREATE POLICY "Salon hours delete by salon owner" ON public.salon_hours
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.barbers 
      WHERE barbers.id = salon_hours.salon_id 
      AND barbers.owner_id = auth.uid()
    )
  );

-- 9. Update appointments RLS policies to allow clients to insert their own appointments
CREATE POLICY "Appointments insert by client" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (
    -- Allow clients to book appointments
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'client'
    )
  );

-- 10. Allow clients to view their own appointments
CREATE POLICY "Appointments select by client" ON public.appointments
  FOR SELECT TO authenticated USING (
    -- Allow clients to see appointments they booked
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'client'
    )
    OR
    -- Allow salon owners to see appointments for their salons
    EXISTS (
      SELECT 1 FROM public.barbers 
      WHERE barbers.id = appointments.salon_id 
      AND barbers.owner_id = auth.uid()
    )
  );

-- 11. Allow clients to update their own appointments (for cancellation)
CREATE POLICY "Appointments update by client" ON public.appointments
  FOR UPDATE TO authenticated USING (
    -- Allow clients to update their own appointments
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'client'
    )
    OR
    -- Allow salon owners to update appointments for their salons
    EXISTS (
      SELECT 1 FROM public.barbers 
      WHERE barbers.id = appointments.salon_id 
      AND barbers.owner_id = auth.uid()
    )
  );

-- 12. Create function to check for appointment conflicts
CREATE OR REPLACE FUNCTION public.check_appointment_conflict(
  p_salon_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if there are any overlapping appointments
  RETURN EXISTS (
    SELECT 1 FROM public.appointments 
    WHERE salon_id = p_salon_id
    AND status = 'confirmed'
    AND (id != p_exclude_id OR p_exclude_id IS NULL)
    AND (
      (start_tijd < p_end_time AND eind_tijd > p_start_time)
    )
  );
END;
$$ LANGUAGE plpgsql;

-- 13. Create function to check if appointment is within salon hours
CREATE OR REPLACE FUNCTION public.check_salon_hours(
  p_salon_id UUID,
  p_appointment_time TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
  day_of_week INTEGER;
  salon_hour RECORD;
BEGIN
  -- Get day of week (0 = Sunday, 6 = Saturday)
  day_of_week := EXTRACT(DOW FROM p_appointment_time);
  
  -- Get salon hours for this day
  SELECT * INTO salon_hour
  FROM public.salon_hours 
  WHERE salon_id = p_salon_id 
  AND salon_hours.day_of_week = day_of_week;
  
  -- If no hours set, assume salon is closed
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- If salon is closed on this day
  IF salon_hour.is_closed THEN
    RETURN FALSE;
  END IF;
  
  -- Check if appointment time is within opening hours
  RETURN p_appointment_time::TIME >= salon_hour.open_time 
    AND p_appointment_time::TIME <= salon_hour.close_time;
END;
$$ LANGUAGE plpgsql;

-- 14. Create trigger to validate appointments before insert/update
CREATE OR REPLACE FUNCTION public.validate_appointment()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for conflicts
  IF public.check_appointment_conflict(NEW.salon_id, NEW.start_tijd, NEW.eind_tijd, NEW.id) THEN
    RAISE EXCEPTION 'Tijdslot is niet beschikbaar - er is al een afspraak op dit tijdstip';
  END IF;
  
  -- Check salon hours
  IF NOT public.check_salon_hours(NEW.salon_id, NEW.start_tijd) THEN
    RAISE EXCEPTION 'Salon is gesloten op dit tijdstip';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS validate_appointment_trigger ON public.appointments;
CREATE TRIGGER validate_appointment_trigger
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_appointment();

-- 15. Insert default salon hours for existing barbers (9:00-18:00, Monday-Saturday)
INSERT INTO public.salon_hours (salon_id, day_of_week, open_time, close_time, is_closed)
SELECT 
  b.id,
  d.day_of_week,
  CASE WHEN d.day_of_week = 0 THEN '10:00' ELSE '09:00' END::TIME, -- Sunday starts at 10:00
  '18:00'::TIME,
  d.day_of_week = 0 -- Closed on Sunday
FROM public.barbers b
CROSS JOIN (
  SELECT 0 as day_of_week UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 
  UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
) d
ON CONFLICT (salon_id, day_of_week) DO NOTHING;
