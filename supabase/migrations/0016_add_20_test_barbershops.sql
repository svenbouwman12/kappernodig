-- Add 20 test barbershops for testing purposes
-- This migration adds diverse barbershops across different locations in the Netherlands

-- First, get a barber account to assign as owner
DO $$
DECLARE
    barber_owner_id UUID;
    salon_id_var UUID;
BEGIN
    -- Get the first barber account as owner
    SELECT id INTO barber_owner_id FROM auth.users WHERE id IN (
        SELECT user_id FROM public.kapper_accounts
    ) LIMIT 1;
    
    -- If no barber account exists, use any user
    IF barber_owner_id IS NULL THEN
        SELECT id INTO barber_owner_id FROM auth.users LIMIT 1;
    END IF;

    -- Insert 20 test barbershops
    INSERT INTO public.barbers (owner_id, name, description, location, price_range, image_url, rating, address, phone, website, latitude, longitude, gender_served, services_offered) VALUES
    -- Amsterdam area
    (barber_owner_id, 'Barbershop Amsterdam Centrum', 'Moderne kapsalon in het hart van Amsterdam met ervaren kappers en de nieuwste trends.', 'Amsterdam', '€€€', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop', 4.8, 'Damrak 1, 1012 LG Amsterdam', '+31 20 123 4567', 'https://barbershop-amsterdam.nl', 52.3676, 4.9041, 'man', ARRAY['Knippen', 'Baard', 'Styling', 'Highlights']),
    
    (barber_owner_id, 'Gentleman''s Cut', 'Exclusieve barbershop voor de moderne gentleman. Premium service en persoonlijke aandacht.', 'Amsterdam', '€€€€', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop', 4.9, 'Leidseplein 12, 1017 PT Amsterdam', '+31 20 234 5678', 'https://gentlemanscut.nl', 52.3641, 4.8828, 'man', ARRAY['Knippen', 'Baard', 'Styling', 'Facial']),
    
    (barber_owner_id, 'De Oude Kapper', 'Traditionele kapsalon met 40 jaar ervaring. Klassieke snitten en moderne trends.', 'Amsterdam', '€€', 'https://images.unsplash.com/photo-1594736797933-d0c29c6b3241?q=80&w=1200&auto=format&fit=crop', 4.6, 'Nieuwmarkt 8, 1012 CR Amsterdam', '+31 20 345 6789', 'https://deoudekapper.nl', 52.3720, 4.9003, 'man', ARRAY['Knippen', 'Baard', 'Wassen']),
    
    -- Rotterdam area
    (barber_owner_id, 'Rotterdam Barbershop', 'Hip barbershop in het centrum van Rotterdam. Jonge, creatieve kappers met oog voor detail.', 'Rotterdam', '€€', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop', 4.7, 'Lijnbaan 45, 3012 EN Rotterdam', '+31 10 123 4567', 'https://rotterdam-barbershop.nl', 51.9225, 4.4792, 'man', ARRAY['Knippen', 'Baard', 'Styling', 'Highlights']),
    
    (barber_owner_id, 'The Cut Studio', 'Moderne studio met focus op creatieve kapsels en baardverzorging. Gespecialiseerd in trendy looks.', 'Rotterdam', '€€€', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop', 4.8, 'Coolsingel 123, 3012 AG Rotterdam', '+31 10 234 5678', 'https://thecutstudio.nl', 51.9225, 4.4792, 'man', ARRAY['Knippen', 'Baard', 'Styling', 'Facial', 'Highlights']),
    
    -- Utrecht area
    (barber_owner_id, 'Utrecht Kappers', 'Gezellige kapsalon in het centrum van Utrecht. Familiebedrijf met persoonlijke service.', 'Utrecht', '€€', 'https://images.unsplash.com/photo-1594736797933-d0c29c6b3241?q=80&w=1200&auto=format&fit=crop', 4.5, 'Oudegracht 67, 3511 AD Utrecht', '+31 30 123 4567', 'https://utrecht-kappers.nl', 52.0907, 5.1214, 'man', ARRAY['Knippen', 'Baard', 'Wassen']),
    
    (barber_owner_id, 'Style & Cut', 'Moderne kapsalon met focus op persoonlijke styling. Gespecialiseerd in zakelijke looks.', 'Utrecht', '€€€', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop', 4.7, 'Vredenburg 15, 3511 BA Utrecht', '+31 30 234 5678', 'https://styleandcut.nl', 52.0907, 5.1214, 'man', ARRAY['Knippen', 'Baard', 'Styling', 'Highlights']),
    
    -- Den Haag area
    (barber_owner_id, 'Den Haag Barbershop', 'Elegante barbershop in het centrum van Den Haag. Premium service voor de moderne man.', 'Den Haag', '€€€', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop', 4.8, 'Lange Voorhout 12, 2514 EA Den Haag', '+31 70 123 4567', 'https://denhaag-barbershop.nl', 52.0705, 4.3007, 'man', ARRAY['Knippen', 'Baard', 'Styling', 'Facial']),
    
    (barber_owner_id, 'The Hague Cut', 'Hip barbershop met internationale flair. Gespecialiseerd in moderne kapsels en baardverzorging.', 'Den Haag', '€€', 'https://images.unsplash.com/photo-1594736797933-d0c29c6b3241?q=80&w=1200&auto=format&fit=crop', 4.6, 'Grote Markt 8, 2511 BJ Den Haag', '+31 70 234 5678', 'https://thehaguecut.nl', 52.0705, 4.3007, 'man', ARRAY['Knippen', 'Baard', 'Styling']),
    
    -- Eindhoven area
    (barber_owner_id, 'Eindhoven Kappers', 'Moderne kapsalon in het centrum van Eindhoven. Jonge, creatieve kappers met passie voor hun vak.', 'Eindhoven', '€€', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop', 4.7, 'Stratumseind 25, 5611 EP Eindhoven', '+31 40 123 4567', 'https://eindhoven-kappers.nl', 51.4416, 5.4697, 'man', ARRAY['Knippen', 'Baard', 'Styling', 'Highlights']),
    
    (barber_owner_id, 'Tech City Barbers', 'Hip barbershop in de tech hub van Eindhoven. Gespecialiseerd in moderne, zakelijke looks.', 'Eindhoven', '€€€', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop', 4.8, 'Kleine Berg 3, 5611 JN Eindhoven', '+31 40 234 5678', 'https://techcitybarbers.nl', 51.4416, 5.4697, 'man', ARRAY['Knippen', 'Baard', 'Styling', 'Facial']),
    
    -- Tilburg area
    (barber_owner_id, 'Tilburg Barbershop', 'Gezellige kapsalon in het centrum van Tilburg. Familiebedrijf met 30 jaar ervaring.', 'Tilburg', '€€', 'https://images.unsplash.com/photo-1594736797933-d0c29c6b3241?q=80&w=1200&auto=format&fit=crop', 4.5, 'Heuvel 15, 5038 CP Tilburg', '+31 13 123 4567', 'https://tilburg-barbershop.nl', 51.5555, 5.0913, 'man', ARRAY['Knippen', 'Baard', 'Wassen']),
    
    (barber_owner_id, 'The Modern Cut', 'Moderne kapsalon met focus op trendy kapsels. Gespecialiseerd in creatieve styling.', 'Tilburg', '€€€', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop', 4.6, 'Spoorlaan 45, 5038 CB Tilburg', '+31 13 234 5678', 'https://themoderncut.nl', 51.5555, 5.0913, 'man', ARRAY['Knippen', 'Baard', 'Styling', 'Highlights']),
    
    -- Groningen area
    (barber_owner_id, 'Groningen Kappers', 'Traditionele kapsalon in het centrum van Groningen. Persoonlijke service en aandacht voor detail.', 'Groningen', '€€', 'https://images.unsplash.com/photo-1594736797933-d0c29c6b3241?q=80&w=1200&auto=format&fit=crop', 4.6, 'Grote Markt 8, 9712 HS Groningen', '+31 50 123 4567', 'https://groningen-kappers.nl', 53.2194, 6.5665, 'man', ARRAY['Knippen', 'Baard', 'Wassen']),
    
    (barber_owner_id, 'Northern Style', 'Hip barbershop in het noorden van Nederland. Gespecialiseerd in moderne kapsels en baardverzorging.', 'Groningen', '€€€', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop', 4.7, 'Herestraat 25, 9711 ER Groningen', '+31 50 234 5678', 'https://northernstyle.nl', 53.2194, 6.5665, 'man', ARRAY['Knippen', 'Baard', 'Styling', 'Facial']),
    
    -- Nijmegen area
    (barber_owner_id, 'Nijmegen Barbershop', 'Moderne kapsalon in het centrum van Nijmegen. Jonge, creatieve kappers met oog voor detail.', 'Nijmegen', '€€', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop', 4.7, 'Grote Markt 12, 6511 KB Nijmegen', '+31 24 123 4567', 'https://nijmegen-barbershop.nl', 51.8426, 5.8589, 'man', ARRAY['Knippen', 'Baard', 'Styling', 'Highlights']),
    
    (barber_owner_id, 'The Roman Cut', 'Elegante barbershop met historische flair. Gespecialiseerd in klassieke en moderne kapsels.', 'Nijmegen', '€€€', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop', 4.8, 'Burchtstraat 8, 6511 RC Nijmegen', '+31 24 234 5678', 'https://theromancut.nl', 51.8426, 5.8589, 'man', ARRAY['Knippen', 'Baard', 'Styling', 'Facial']),
    
    -- Arnhem area
    (barber_owner_id, 'Arnhem Kappers', 'Gezellige kapsalon in het centrum van Arnhem. Familiebedrijf met persoonlijke service.', 'Arnhem', '€€', 'https://images.unsplash.com/photo-1594736797933-d0c29c6b3241?q=80&w=1200&auto=format&fit=crop', 4.5, 'Korenmarkt 15, 6811 GW Arnhem', '+31 26 123 4567', 'https://arnhem-kappers.nl', 51.9851, 5.8987, 'man', ARRAY['Knippen', 'Baard', 'Wassen']),
    
    (barber_owner_id, 'The Green Cut', 'Eco-vriendelijke barbershop met natuurlijke producten. Gespecialiseerd in duurzame styling.', 'Arnhem', '€€€', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop', 4.6, 'Rijnstraat 25, 6811 HD Arnhem', '+31 26 234 5678', 'https://thegreencut.nl', 51.9851, 5.8987, 'man', ARRAY['Knippen', 'Baard', 'Styling', 'Facial']),
    
    -- Enschede area
    (barber_owner_id, 'Enschede Barbershop', 'Moderne kapsalon in het centrum van Enschede. Jonge, creatieve kappers met passie voor hun vak.', 'Enschede', '€€', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop', 4.6, 'Oude Markt 8, 7511 GA Enschede', '+31 53 123 4567', 'https://enschede-barbershop.nl', 52.2215, 6.8937, 'man', ARRAY['Knippen', 'Baard', 'Styling', 'Highlights']),
    
    (barber_owner_id, 'The Twente Cut', 'Hip barbershop in de Twente regio. Gespecialiseerd in moderne kapsels en baardverzorging.', 'Enschede', '€€€', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop', 4.7, 'Van Heekstraat 12, 7511 EA Enschede', '+31 53 234 5678', 'https://thetwentecut.nl', 52.2215, 6.8937, 'man', ARRAY['Knippen', 'Baard', 'Styling', 'Facial']);

    -- Get the salon IDs for adding services
    SELECT id INTO salon_id_var FROM public.barbers WHERE name = 'Barbershop Amsterdam Centrum' LIMIT 1;
    
    -- Add services for the first barbershop as example
    IF salon_id_var IS NOT NULL THEN
        INSERT INTO public.services (barber_id, name, price) VALUES
        (salon_id_var, 'Knippen', 25.00),
        (salon_id_var, 'Baard trimmen', 15.00),
        (salon_id_var, 'Knippen + Baard', 35.00),
        (salon_id_var, 'Styling', 20.00),
        (salon_id_var, 'Highlights', 45.00);
    END IF;

    RAISE NOTICE 'Successfully added 20 test barbershops';
END $$;
