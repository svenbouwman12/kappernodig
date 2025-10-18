-- Add business registration fields to barbers table
-- This migration adds KVK and BTW number fields for business registration

-- Add KVK (Chamber of Commerce) and BTW (VAT) number fields to barbers table
ALTER TABLE public.barbers
  ADD COLUMN IF NOT EXISTS kvk_number TEXT,
  ADD COLUMN IF NOT EXISTS btw_number TEXT;

-- Create indexes for better performance on business fields
CREATE INDEX IF NOT EXISTS idx_barbers_kvk_number ON public.barbers(kvk_number);
CREATE INDEX IF NOT EXISTS idx_barbers_btw_number ON public.barbers(btw_number);

-- Add comments for documentation
COMMENT ON COLUMN public.barbers.kvk_number IS 'KVK (Kamer van Koophandel) registration number';
COMMENT ON COLUMN public.barbers.btw_number IS 'BTW (Belasting Toegevoegde Waarde) VAT number';
