-- Insert 10 dummy barbers across Netherlands
INSERT INTO public.barbers (name, description, location, address, phone, website, price_range, image_url, rating, latitude, longitude, owner_id) VALUES
('De Gouden Schaar', 'Traditionele kapsalon in het hart van Amsterdam', 'Amsterdam', 'Kalverstraat 15, 1012 NX Amsterdam', '+31 20 123 4567', 'https://degoudenschaar.nl', '€€', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=400', 4.7, 52.3676, 4.9041, (SELECT id FROM auth.users LIMIT 1)),
('Barbershop Noord', 'Moderne barbershop met specialiteit in fades', 'Rotterdam', 'Lijnbaan 42, 3012 EN Rotterdam', '+31 10 234 5678', 'https://barbershopnoord.nl', '€€€', 'https://images.unsplash.com/photo-1621605815971-fbc98d7a2115?q=80&w=400', 4.9, 51.9244, 4.4777, (SELECT id FROM auth.users LIMIT 1)),
('Kapper Utrecht Centrum', 'Gezellige kapsalon met ervaren kappers', 'Utrecht', 'Oudegracht 120, 3511 AE Utrecht', '+31 30 345 6789', 'https://kapperutrecht.nl', '€€', 'https://images.unsplash.com/photo-1593702288056-7927b442542d?q=80&w=400', 4.5, 52.0907, 5.1214, (SELECT id FROM auth.users LIMIT 1)),
('Haarstudio Den Haag', 'Moderne haarstudio met focus op trends', 'Den Haag', 'Plein 8, 2511 CS Den Haag', '+31 70 456 7890', 'https://haarstudiodenhaag.nl', '€€€', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400', 4.8, 52.0705, 4.3007, (SELECT id FROM auth.users LIMIT 1)),
('Barber Eindhoven', 'Specialist in herenkapsels en baardverzorging', 'Eindhoven', 'Stratumseind 25, 5611 EN Eindhoven', '+31 40 567 8901', 'https://barbereindhoven.nl', '€€', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400', 4.6, 51.4416, 5.4697, (SELECT id FROM auth.users LIMIT 1)),
('Kapsalon Tilburg', 'Familiebedrijf met 30 jaar ervaring', 'Tilburg', 'Heuvel 12, 5038 CP Tilburg', '+31 13 678 9012', 'https://kapsalontilburg.nl', '€', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400', 4.3, 51.5555, 5.0913, (SELECT id FROM auth.users LIMIT 1)),
('Haar & Meer Groningen', 'Creatieve kapsalon met jonge, enthousiaste kappers', 'Groningen', 'Grote Markt 18, 9712 HS Groningen', '+31 50 789 0123', 'https://haarenmeer.nl', '€€', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=400', 4.4, 53.2194, 6.5665, (SELECT id FROM auth.users LIMIT 1)),
('Barbershop Almere', 'Stijlvolle barbershop in het nieuwe centrum', 'Almere', 'Stadhuisplein 1, 1315 XC Almere', '+31 36 890 1234', 'https://barbershopalmere.nl', '€€', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=400', 4.2, 52.3508, 5.2647, (SELECT id FROM auth.users LIMIT 1)),
('Kapper Nijmegen', 'Persoonlijke aandacht en kwaliteit', 'Nijmegen', 'Grote Markt 35, 6511 KJ Nijmegen', '+31 24 901 2345', 'https://kappernijmegen.nl', '€€', 'https://images.unsplash.com/photo-1593702288056-7927b442542d?q=80&w=400', 4.7, 51.8426, 5.8528, (SELECT id FROM auth.users LIMIT 1)),
('Haarstudio Breda', 'Moderne salon met internationale kappers', 'Breda', 'Grote Markt 22, 4811 XC Breda', '+31 76 012 3456', 'https://haarstudiobreda.nl', '€€€', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400', 4.9, 51.5719, 4.7683, (SELECT id FROM auth.users LIMIT 1));

-- Add services for each barber
INSERT INTO public.services (barber_id, name, price)
SELECT b.id, s.name, s.price
FROM public.barbers b
CROSS JOIN (
  VALUES 
    ('Knippen', 25.00),
    ('Wassen & knippen', 35.00),
    ('Baard trimmen', 15.00),
    ('Baard styling', 20.00),
    ('Knippen + baard', 35.00),
    ('Highlights', 45.00),
    ('Permanent', 55.00)
) AS s(name, price)
WHERE b.name IN ('De Gouden Schaar', 'Barbershop Noord', 'Kapper Utrecht Centrum', 'Haarstudio Den Haag', 'Barber Eindhoven', 'Kapsalon Tilburg', 'Haar & Meer Groningen', 'Barbershop Almere', 'Kapper Nijmegen', 'Haarstudio Breda');

