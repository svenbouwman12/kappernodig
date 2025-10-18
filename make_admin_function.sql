-- ALLEREENVOUDIGSTE MANIER: Functie die alles automatisch doet
-- Voer deze SQL uit in je Supabase SQL Editor

-- Stap 1: Maak de functie aan
CREATE OR REPLACE FUNCTION make_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
    result_message TEXT;
BEGIN
    -- Zoek de user ID op basis van email
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    -- Check of user bestaat
    IF user_id IS NULL THEN
        RETURN 'FOUT: User met email ' || user_email || ' bestaat niet. Maak eerst een user aan in Supabase Auth UI.';
    END IF;
    
    -- Update de role naar admin
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE id = user_id;
    
    -- Check of het gelukt is
    IF FOUND THEN
        result_message := 'SUCCESS: ' || user_email || ' is nu admin!';
    ELSE
        -- Als er geen profile bestaat, maak er een aan
        INSERT INTO public.profiles (id, naam, email, role, created_at)
        VALUES (user_id, 'Admin', user_email, 'admin', NOW());
        result_message := 'SUCCESS: Profile aangemaakt en ' || user_email || ' is nu admin!';
    END IF;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stap 2: Gebruik de functie
-- Maak eerst een user aan in Supabase Auth UI, dan voer uit:
SELECT make_admin('admin@kappernodig.nl');

-- Stap 3: Controleer
SELECT id, naam, email, role FROM public.profiles WHERE email = 'admin@kappernodig.nl';
