-- NOG EENVOUDIGER: Admin maken met alleen email
-- Voer deze SQL uit in je Supabase SQL Editor

-- Stap 1: Maak user aan in Supabase Auth UI
-- Ga naar: Dashboard > Authentication > Users > Add user
-- Email: admin@kappernodig.nl
-- Password: admin123

-- Stap 2: Voer deze SQL uit (vervang EMAIL met je email)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@kappernodig.nl';

-- Stap 3: Controleer of het gelukt is
SELECT id, naam, email, role FROM public.profiles WHERE email = 'admin@kappernodig.nl';

-- Als je een andere email wilt gebruiken, vervang dan 'admin@kappernodig.nl' met jouw email
