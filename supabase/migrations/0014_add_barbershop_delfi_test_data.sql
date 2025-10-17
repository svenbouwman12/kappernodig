-- Add Barbershop Delfi in Appingedam with test data
-- First, let's add the barbershop to the first kapper account we find

-- Insert Barbershop Delfi (link to first available kapper account)
INSERT INTO public.barbers (
  name, 
  description, 
  location, 
  address, 
  phone, 
  website, 
  price_range, 
  image_url, 
  rating, 
  latitude, 
  longitude, 
  owner_id
) VALUES (
  'Barbershop Delfi',
  'Moderne barbershop in het centrum van Appingedam',
  'Appingedam',
  'Hoofdstraat 15, 9901 AB Appingedam',
  '+31 596 123 456',
  'https://barbershopdelfi.nl',
  '€€',
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=400',
  4.7,
  53.3200,
  6.8600,
  COALESCE(
    (SELECT id FROM auth.users WHERE id IN (SELECT user_id FROM public.kapper_accounts) LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1)
  )
);

-- Get the salon ID for Barbershop Delfi
DO $$
DECLARE
    salon_id_var uuid;
BEGIN
    SELECT id INTO salon_id_var FROM public.barbers WHERE name = 'Barbershop Delfi';
    
    -- Add services for Barbershop Delfi
    INSERT INTO public.services (barber_id, name, price, duration_minutes) VALUES
    (salon_id_var, 'Knippen', 25.00, 30),
    (salon_id_var, 'Baard trimmen', 15.00, 20),
    (salon_id_var, 'Knippen + Baard', 35.00, 45),
    (salon_id_var, 'Wassen & Knippen', 30.00, 40),
    (salon_id_var, 'Highlights', 45.00, 60);
    
    -- Add test clients for this week
    INSERT INTO public.clients (salon_id, naam, telefoon, email, laatste_afspraak) VALUES
    (salon_id_var, 'Jan de Vries', '06-12345678', 'jan.devries@email.com', null),
    (salon_id_var, 'Piet Bakker', '06-23456789', 'piet.bakker@email.com', null),
    (salon_id_var, 'Klaas van der Berg', '06-34567890', 'klaas.vandenberg@email.com', null),
    (salon_id_var, 'Henk Jansen', '06-45678901', 'henk.jansen@email.com', null),
    (salon_id_var, 'Sander Mulder', '06-56789012', 'sander.mulder@email.com', null),
    (salon_id_var, 'Rob de Jong', '06-67890123', 'rob.dejong@email.com', null),
    (salon_id_var, 'Tom van Dijk', '06-78901234', 'tom.vandijk@email.com', null),
    (salon_id_var, 'Mark Smit', '06-89012345', 'mark.smit@email.com', null);
    
    -- Get client IDs for appointments
    DECLARE
        client1_id uuid;
        client2_id uuid;
        client3_id uuid;
        client4_id uuid;
        client5_id uuid;
        client6_id uuid;
        client7_id uuid;
        client8_id uuid;
    BEGIN
        SELECT id INTO client1_id FROM public.clients WHERE salon_id = salon_id_var AND naam = 'Jan de Vries';
        SELECT id INTO client2_id FROM public.clients WHERE salon_id = salon_id_var AND naam = 'Piet Bakker';
        SELECT id INTO client3_id FROM public.clients WHERE salon_id = salon_id_var AND naam = 'Klaas van der Berg';
        SELECT id INTO client4_id FROM public.clients WHERE salon_id = salon_id_var AND naam = 'Henk Jansen';
        SELECT id INTO client5_id FROM public.clients WHERE salon_id = salon_id_var AND naam = 'Sander Mulder';
        SELECT id INTO client6_id FROM public.clients WHERE salon_id = salon_id_var AND naam = 'Rob de Jong';
        SELECT id INTO client7_id FROM public.clients WHERE salon_id = salon_id_var AND naam = 'Tom van Dijk';
        SELECT id INTO client8_id FROM public.clients WHERE salon_id = salon_id_var AND naam = 'Mark Smit';
        
        -- Add test appointments for this week (Monday to Friday)
        -- Monday appointments (using current week dates)
        INSERT INTO public.appointments (salon_id, klant_id, dienst, start_tijd, eind_tijd, notities) VALUES
        (salon_id_var, client1_id, 'Knippen', (CURRENT_DATE + INTERVAL '1 day')::timestamp + INTERVAL '9 hours', (CURRENT_DATE + INTERVAL '1 day')::timestamp + INTERVAL '9 hours 30 minutes', 'Reguliere knipbeurt'),
        (salon_id_var, client2_id, 'Baard trimmen', (CURRENT_DATE + INTERVAL '1 day')::timestamp + INTERVAL '10 hours', (CURRENT_DATE + INTERVAL '1 day')::timestamp + INTERVAL '10 hours 20 minutes', 'Baard bijwerken'),
        (salon_id_var, client3_id, 'Knippen + Baard', (CURRENT_DATE + INTERVAL '1 day')::timestamp + INTERVAL '11 hours', (CURRENT_DATE + INTERVAL '1 day')::timestamp + INTERVAL '11 hours 45 minutes', 'Complete behandeling'),
        (salon_id_var, client4_id, 'Wassen & Knippen', (CURRENT_DATE + INTERVAL '1 day')::timestamp + INTERVAL '14 hours', (CURRENT_DATE + INTERVAL '1 day')::timestamp + INTERVAL '14 hours 40 minutes', 'Met wassen en styling'),
        (salon_id_var, client5_id, 'Knippen', (CURRENT_DATE + INTERVAL '1 day')::timestamp + INTERVAL '15 hours 30 minutes', (CURRENT_DATE + INTERVAL '1 day')::timestamp + INTERVAL '16 hours', 'Korte knipbeurt');
        
        -- Tuesday appointments
        INSERT INTO public.appointments (salon_id, klant_id, dienst, start_tijd, eind_tijd, notities) VALUES
        (salon_id_var, client6_id, 'Knippen', (CURRENT_DATE + INTERVAL '2 days')::timestamp + INTERVAL '9 hours 30 minutes', (CURRENT_DATE + INTERVAL '2 days')::timestamp + INTERVAL '10 hours', 'Reguliere knipbeurt'),
        (salon_id_var, client7_id, 'Baard trimmen', (CURRENT_DATE + INTERVAL '2 days')::timestamp + INTERVAL '10 hours 30 minutes', (CURRENT_DATE + INTERVAL '2 days')::timestamp + INTERVAL '10 hours 50 minutes', 'Baard bijwerken'),
        (salon_id_var, client8_id, 'Knippen + Baard', (CURRENT_DATE + INTERVAL '2 days')::timestamp + INTERVAL '11 hours 30 minutes', (CURRENT_DATE + INTERVAL '2 days')::timestamp + INTERVAL '12 hours 15 minutes', 'Complete behandeling'),
        (salon_id_var, client1_id, 'Highlights', (CURRENT_DATE + INTERVAL '2 days')::timestamp + INTERVAL '14 hours', (CURRENT_DATE + INTERVAL '2 days')::timestamp + INTERVAL '15 hours', 'Highlights aanbrengen'),
        (salon_id_var, client2_id, 'Wassen & Knippen', (CURRENT_DATE + INTERVAL '2 days')::timestamp + INTERVAL '15 hours 30 minutes', (CURRENT_DATE + INTERVAL '2 days')::timestamp + INTERVAL '16 hours 10 minutes', 'Met wassen en styling');
        
        -- Wednesday appointments
        INSERT INTO public.appointments (salon_id, klant_id, dienst, start_tijd, eind_tijd, notities) VALUES
        (salon_id_var, client3_id, 'Knippen', (CURRENT_DATE + INTERVAL '3 days')::timestamp + INTERVAL '9 hours', (CURRENT_DATE + INTERVAL '3 days')::timestamp + INTERVAL '9 hours 30 minutes', 'Reguliere knipbeurt'),
        (salon_id_var, client4_id, 'Baard trimmen', (CURRENT_DATE + INTERVAL '3 days')::timestamp + INTERVAL '10 hours', (CURRENT_DATE + INTERVAL '3 days')::timestamp + INTERVAL '10 hours 20 minutes', 'Baard bijwerken'),
        (salon_id_var, client5_id, 'Knippen + Baard', (CURRENT_DATE + INTERVAL '3 days')::timestamp + INTERVAL '11 hours', (CURRENT_DATE + INTERVAL '3 days')::timestamp + INTERVAL '11 hours 45 minutes', 'Complete behandeling'),
        (salon_id_var, client6_id, 'Wassen & Knippen', (CURRENT_DATE + INTERVAL '3 days')::timestamp + INTERVAL '14 hours', (CURRENT_DATE + INTERVAL '3 days')::timestamp + INTERVAL '14 hours 40 minutes', 'Met wassen en styling'),
        (salon_id_var, client7_id, 'Knippen', (CURRENT_DATE + INTERVAL '3 days')::timestamp + INTERVAL '15 hours 30 minutes', (CURRENT_DATE + INTERVAL '3 days')::timestamp + INTERVAL '16 hours', 'Korte knipbeurt');
        
        -- Thursday appointments
        INSERT INTO public.appointments (salon_id, klant_id, dienst, start_tijd, eind_tijd, notities) VALUES
        (salon_id_var, client8_id, 'Knippen', (CURRENT_DATE + INTERVAL '4 days')::timestamp + INTERVAL '9 hours 30 minutes', (CURRENT_DATE + INTERVAL '4 days')::timestamp + INTERVAL '10 hours', 'Reguliere knipbeurt'),
        (salon_id_var, client1_id, 'Baard trimmen', (CURRENT_DATE + INTERVAL '4 days')::timestamp + INTERVAL '10 hours 30 minutes', (CURRENT_DATE + INTERVAL '4 days')::timestamp + INTERVAL '10 hours 50 minutes', 'Baard bijwerken'),
        (salon_id_var, client2_id, 'Knippen + Baard', (CURRENT_DATE + INTERVAL '4 days')::timestamp + INTERVAL '11 hours 30 minutes', (CURRENT_DATE + INTERVAL '4 days')::timestamp + INTERVAL '12 hours 15 minutes', 'Complete behandeling'),
        (salon_id_var, client3_id, 'Highlights', (CURRENT_DATE + INTERVAL '4 days')::timestamp + INTERVAL '14 hours', (CURRENT_DATE + INTERVAL '4 days')::timestamp + INTERVAL '15 hours', 'Highlights aanbrengen'),
        (salon_id_var, client4_id, 'Wassen & Knippen', (CURRENT_DATE + INTERVAL '4 days')::timestamp + INTERVAL '15 hours 30 minutes', (CURRENT_DATE + INTERVAL '4 days')::timestamp + INTERVAL '16 hours 10 minutes', 'Met wassen en styling');
        
        -- Friday appointments
        INSERT INTO public.appointments (salon_id, klant_id, dienst, start_tijd, eind_tijd, notities) VALUES
        (salon_id_var, client5_id, 'Knippen', (CURRENT_DATE + INTERVAL '5 days')::timestamp + INTERVAL '9 hours', (CURRENT_DATE + INTERVAL '5 days')::timestamp + INTERVAL '9 hours 30 minutes', 'Reguliere knipbeurt'),
        (salon_id_var, client6_id, 'Baard trimmen', (CURRENT_DATE + INTERVAL '5 days')::timestamp + INTERVAL '10 hours', (CURRENT_DATE + INTERVAL '5 days')::timestamp + INTERVAL '10 hours 20 minutes', 'Baard bijwerken'),
        (salon_id_var, client7_id, 'Knippen + Baard', (CURRENT_DATE + INTERVAL '5 days')::timestamp + INTERVAL '11 hours', (CURRENT_DATE + INTERVAL '5 days')::timestamp + INTERVAL '11 hours 45 minutes', 'Complete behandeling'),
        (salon_id_var, client8_id, 'Wassen & Knippen', (CURRENT_DATE + INTERVAL '5 days')::timestamp + INTERVAL '14 hours', (CURRENT_DATE + INTERVAL '5 days')::timestamp + INTERVAL '14 hours 40 minutes', 'Met wassen en styling'),
        (salon_id_var, client1_id, 'Knippen', (CURRENT_DATE + INTERVAL '5 days')::timestamp + INTERVAL '15 hours 30 minutes', (CURRENT_DATE + INTERVAL '5 days')::timestamp + INTERVAL '16 hours', 'Korte knipbeurt');
    END;
END $$;
