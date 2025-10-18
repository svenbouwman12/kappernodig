-- Add additional profile fields for client profile management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telefoon TEXT,
ADD COLUMN IF NOT EXISTS adres TEXT,
ADD COLUMN IF NOT EXISTS stad TEXT,
ADD COLUMN IF NOT EXISTS postcode TEXT,
ADD COLUMN IF NOT EXISTS geboortedatum DATE,
ADD COLUMN IF NOT EXISTS geslacht TEXT CHECK (geslacht IN ('man', 'vrouw', 'anders')),
ADD COLUMN IF NOT EXISTS notities TEXT;

-- Add index for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_profiles_stad ON public.profiles(stad);
CREATE INDEX IF NOT EXISTS idx_profiles_geslacht ON public.profiles(geslacht);
