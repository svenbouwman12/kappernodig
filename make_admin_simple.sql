-- SIMPELSTE MANIER OM ADMIN TE MAKEN
-- Voer deze SQL uit in je Supabase SQL Editor

-- Stap 1: Maak user aan in Supabase Auth UI
-- Ga naar: Dashboard > Authentication > Users > Add user
-- Email: admin@kappernodig.nl
-- Password: admin123

-- Stap 2: Zoek de User ID
-- Ga naar: Dashboard > Authentication > Users
-- Klik op de user die je net hebt gemaakt
-- Kopieer de User ID (lijkt op: 12345678-1234-1234-1234-123456789abc)

-- Stap 3: Voer deze SQL uit (vervang USER_ID met de echte ID)
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'USER_ID_HIER';

-- Stap 4: Controleer of het gelukt is
SELECT id, naam, email, role FROM public.profiles WHERE id = 'USER_ID_HIER';
