-- Fix admin role constraint
-- Het probleem: role check constraint staat alleen 'client' en 'kapper' toe
-- Oplossing: Voeg 'admin' toe aan de constraint

-- Stap 1: Drop de oude constraint
ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;

-- Stap 2: Maak nieuwe constraint met 'admin' erbij
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['client'::text, 'kapper'::text, 'admin'::text]));

-- Stap 3: Controleer of het gelukt is
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
AND conname = 'profiles_role_check';

-- Stap 4: Nu kun je admin maken!
-- Maak eerst een user aan in Supabase Auth UI, dan:
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@kappernodig.nl';

-- Stap 5: Controleer
SELECT id, naam, email, role FROM public.profiles WHERE email = 'admin@kappernodig.nl';
