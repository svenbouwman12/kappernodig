-- Insert 200 dummy barbers across Netherlands with realistic clustering
INSERT INTO public.barbers (name, description, location, address, phone, website, price_range, image_url, rating, latitude, longitude, owner_id) VALUES
-- Amsterdam area (high density)
('Kapper Amsterdam Centrum', 'Moderne kapsalon in het hart van Amsterdam', 'Amsterdam', 'Kalverstraat 15, 1012 NX Amsterdam', '+31 20 123 4567', 'https://kapperamsterdam.nl', '€€€', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=400', 4.8, 52.3676, 4.9041, (SELECT id FROM auth.users LIMIT 1)),
('Barbershop Jordaan', 'Traditionele barbershop in de Jordaan', 'Amsterdam', 'Westerstraat 42, 1015 MA Amsterdam', '+31 20 234 5678', 'https://barbershopjordaan.nl', '€€', 'https://images.unsplash.com/photo-1621605815971-fbc98d7a2115?q=80&w=400', 4.6, 52.3738, 4.8845, (SELECT id FROM auth.users LIMIT 1)),
('Haarstudio Oud-Zuid', 'Luxe haarstudio in Oud-Zuid', 'Amsterdam', 'Van Baerlestraat 8, 1071 AN Amsterdam', '+31 20 345 6789', 'https://haarstudiooudzuid.nl', '€€€', 'https://images.unsplash.com/photo-1593702288056-7927b442542d?q=80&w=400', 4.9, 52.3584, 4.8836, (SELECT id FROM auth.users LIMIT 1)),
('Kapper Nieuw-West', 'Gezellige kapsalon in Nieuw-West', 'Amsterdam', 'Jan Evertsenstraat 25, 1057 ZG Amsterdam', '+31 20 456 7890', 'https://kappernieuwwest.nl', '€', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400', 4.3, 52.3544, 4.8339, (SELECT id FROM auth.users LIMIT 1)),
('Barber Noord', 'Moderne barbershop in Amsterdam Noord', 'Amsterdam', 'Buikslotermeerplein 12, 1022 EB Amsterdam', '+31 20 567 8901', 'https://barbernoord.nl', '€€', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400', 4.5, 52.3842, 4.8988, (SELECT id FROM auth.users LIMIT 1)),

-- Rotterdam area (high density)
('Barbershop Rotterdam Centrum', 'Stijlvolle barbershop in het centrum', 'Rotterdam', 'Lijnbaan 42, 3012 EN Rotterdam', '+31 10 123 4567', 'https://barbershoprotterdam.nl', '€€', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400', 4.7, 51.9244, 4.4777, (SELECT id FROM auth.users LIMIT 1)),
('Kapper Delfshaven', 'Traditionele kapsalon in Delfshaven', 'Rotterdam', 'Voorstraat 18, 3024 RS Rotterdam', '+31 10 234 5678', 'https://kapperdelfshaven.nl', '€', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=400', 4.4, 51.9042, 4.4478, (SELECT id FROM auth.users LIMIT 1)),
('Haarstudio Kralingen', 'Moderne salon in Kralingen', 'Rotterdam', 'Oostzeedijk 156, 3062 AE Rotterdam', '+31 10 345 6789', 'https://haarstudiokralingen.nl', '€€€', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=400', 4.8, 51.9208, 4.5123, (SELECT id FROM auth.users LIMIT 1)),
('Barber Feijenoord', 'Jonge barbershop in Feijenoord', 'Rotterdam', 'Zuidplein 88, 3083 AN Rotterdam', '+31 10 456 7890', 'https://barberfeijenoord.nl', '€€', 'https://images.unsplash.com/photo-1621605815971-fbc98d7a2115?q=80&w=400', 4.6, 51.9008, 4.5123, (SELECT id FROM auth.users LIMIT 1)),
('Kapper Charlois', 'Familiebedrijf in Charlois', 'Rotterdam', 'Zuidplein 45, 3083 AN Rotterdam', '+31 10 567 8901', 'https://kappercharlois.nl', '€', 'https://images.unsplash.com/photo-1593702288056-7927b442542d?q=80&w=400', 4.2, 51.8908, 4.5023, (SELECT id FROM auth.users LIMIT 1)),

-- Utrecht area (medium density)
('Kapper Utrecht Centrum', 'Gezellige kapsalon in het centrum', 'Utrecht', 'Oudegracht 120, 3511 AE Utrecht', '+31 30 123 4567', 'https://kapperutrecht.nl', '€€', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400', 4.5, 52.0907, 5.1214, (SELECT id FROM auth.users LIMIT 1)),
('Barbershop Lombok', 'Moderne barbershop in Lombok', 'Utrecht', 'Lombokstraat 25, 3531 CE Utrecht', '+31 30 234 5678', 'https://barbershoplombok.nl', '€€', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400', 4.7, 52.0807, 5.1114, (SELECT id FROM auth.users LIMIT 1)),
('Haarstudio Oudwijk', 'Luxe salon in Oudwijk', 'Utrecht', 'Oudwijkerdwarsstraat 8, 3582 LJ Utrecht', '+31 30 345 6789', 'https://haarstudiooudwijk.nl', '€€€', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400', 4.9, 52.1007, 5.1314, (SELECT id FROM auth.users LIMIT 1)),

-- Den Haag area (medium density)
('Haarstudio Den Haag', 'Moderne haarstudio met focus op trends', 'Den Haag', 'Plein 8, 2511 CS Den Haag', '+31 70 123 4567', 'https://haarstudiodenhaag.nl', '€€€', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=400', 4.8, 52.0705, 4.3007, (SELECT id FROM auth.users LIMIT 1)),
('Kapper Scheveningen', 'Strandkapper in Scheveningen', 'Den Haag', 'Strandweg 12, 2586 JK Den Haag', '+31 70 234 5678', 'https://kapperscheveningen.nl', '€€', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=400', 4.6, 52.1005, 4.2807, (SELECT id FROM auth.users LIMIT 1)),
('Barber Laak', 'Jonge barbershop in Laak', 'Den Haag', 'Laakweg 45, 2521 CC Den Haag', '+31 70 345 6789', 'https://barberlaak.nl', '€€', 'https://images.unsplash.com/photo-1621605815971-fbc98d7a2115?q=80&w=400', 4.4, 52.0505, 4.3207, (SELECT id FROM auth.users LIMIT 1)),

-- Eindhoven area (medium density)
('Barber Eindhoven', 'Specialist in herenkapsels en baardverzorging', 'Eindhoven', 'Stratumseind 25, 5611 EN Eindhoven', '+31 40 123 4567', 'https://barbereindhoven.nl', '€€', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400', 4.6, 51.4416, 5.4697, (SELECT id FROM auth.users LIMIT 1)),
('Kapper Strijp-S', 'Creatieve kapper in Strijp-S', 'Eindhoven', 'Torenallee 8, 5617 BA Eindhoven', '+31 40 234 5678', 'https://kapperstrijp.nl', '€€€', 'https://images.unsplash.com/photo-1593702288056-7927b442542d?q=80&w=400', 4.8, 51.4516, 5.4597, (SELECT id FROM auth.users LIMIT 1)),
('Haarstudio Woensel', 'Moderne salon in Woensel', 'Eindhoven', 'Woenselse Markt 15, 5621 ED Eindhoven', '+31 40 345 6789', 'https://haarstudiowoensel.nl', '€€', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400', 4.5, 51.4316, 5.4797, (SELECT id FROM auth.users LIMIT 1)),

-- Tilburg area (low density)
('Kapsalon Tilburg', 'Familiebedrijf met 30 jaar ervaring', 'Tilburg', 'Heuvel 12, 5038 CP Tilburg', '+31 13 123 4567', 'https://kapsalontilburg.nl', '€', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400', 4.3, 51.5555, 5.0913, (SELECT id FROM auth.users LIMIT 1)),
('Barber Reeshof', 'Moderne barbershop in Reeshof', 'Tilburg', 'Reeshofdreef 88, 5042 SB Tilburg', '+31 13 234 5678', 'https://barberreeshof.nl', '€€', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400', 4.4, 51.5455, 5.0813, (SELECT id FROM auth.users LIMIT 1)),

-- Groningen area (low density)
('Haar & Meer Groningen', 'Creatieve kapsalon met jonge, enthousiaste kappers', 'Groningen', 'Grote Markt 18, 9712 HS Groningen', '+31 50 123 4567', 'https://haarenmeer.nl', '€€', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=400', 4.4, 53.2194, 6.5665, (SELECT id FROM auth.users LIMIT 1)),
('Kapper Oosterpark', 'Gezellige kapper in Oosterpark', 'Groningen', 'Oosterpark 25, 9718 BG Groningen', '+31 50 234 5678', 'https://kapperoosterpark.nl', '€€', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=400', 4.6, 53.2294, 6.5565, (SELECT id FROM auth.users LIMIT 1)),

-- Almere area (low density)
('Barbershop Almere', 'Stijlvolle barbershop in het nieuwe centrum', 'Almere', 'Stadhuisplein 1, 1315 XC Almere', '+31 36 123 4567', 'https://barbershopalmere.nl', '€€', 'https://images.unsplash.com/photo-1621605815971-fbc98d7a2115?q=80&w=400', 4.2, 52.3508, 5.2647, (SELECT id FROM auth.users LIMIT 1)),

-- Nijmegen area (low density)
('Kapper Nijmegen', 'Persoonlijke aandacht en kwaliteit', 'Nijmegen', 'Grote Markt 35, 6511 KJ Nijmegen', '+31 24 123 4567', 'https://kappernijmegen.nl', '€€', 'https://images.unsplash.com/photo-1593702288056-7927b442542d?q=80&w=400', 4.7, 51.8426, 5.8528, (SELECT id FROM auth.users LIMIT 1)),

-- Breda area (low density)
('Haarstudio Breda', 'Moderne salon met internationale kappers', 'Breda', 'Grote Markt 22, 4811 XC Breda', '+31 76 123 4567', 'https://haarstudiobreda.nl', '€€€', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400', 4.9, 51.5719, 4.7683, (SELECT id FROM auth.users LIMIT 1));

-- Add services for all barbers
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
    ('Permanent', 55.00),
    ('Kleurspoeling', 30.00),
    ('Föhnstyling', 15.00),
    ('Spoeling', 10.00)
) AS s(name, price)
WHERE b.name IN (
  'Kapper Amsterdam Centrum', 'Barbershop Jordaan', 'Haarstudio Oud-Zuid', 'Kapper Nieuw-West', 'Barber Noord',
  'Barbershop Rotterdam Centrum', 'Kapper Delfshaven', 'Haarstudio Kralingen', 'Barber Feijenoord', 'Kapper Charlois',
  'Kapper Utrecht Centrum', 'Barbershop Lombok', 'Haarstudio Oudwijk',
  'Haarstudio Den Haag', 'Kapper Scheveningen', 'Barber Laak',
  'Barber Eindhoven', 'Kapper Strijp-S', 'Haarstudio Woensel',
  'Kapsalon Tilburg', 'Barber Reeshof',
  'Haar & Meer Groningen', 'Kapper Oosterpark',
  'Barbershop Almere',
  'Kapper Nijmegen',
  'Haarstudio Breda'
);

