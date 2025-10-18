-- Add duration column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30 CHECK (duration_minutes > 0);

-- Update existing services with default duration of 30 minutes
UPDATE public.services 
SET duration_minutes = 30 
WHERE duration_minutes IS NULL;

-- Add index for duration queries
CREATE INDEX IF NOT EXISTS idx_services_duration ON public.services(duration_minutes);
