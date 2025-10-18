-- DEFINITIEVE OPLOSSING voor Admin RLS problemen
-- Dit script zorgt ervoor dat admin users volledige toegang hebben

-- 1. Eerst alle bestaande policies verwijderen
DROP POLICY IF EXISTS "Admin can do everything on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin can do everything on barbers" ON public.barbers;
DROP POLICY IF EXISTS "Admin can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can do everything on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin can do everything on services" ON public.services;

-- 2. Nieuwe admin policies maken die ALTIJD toegang geven voor admin role
CREATE POLICY "admin_full_access_appointments" ON public.appointments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "admin_full_access_barbers" ON public.barbers
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "admin_full_access_profiles" ON public.profiles
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "admin_full_access_reviews" ON public.reviews
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "admin_full_access_services" ON public.services
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "admin_full_access_clients" ON public.clients
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "admin_full_access_kapper_accounts" ON public.kapper_accounts
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 3. Ook policies voor andere tabellen
CREATE POLICY "admin_full_access_bookmarks" ON public.bookmarks
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "admin_full_access_salon_hours" ON public.salon_hours
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "admin_full_access_users" ON public.users
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 4. Verificatie query - toon alle admin policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND policyname LIKE 'admin_full_access%'
ORDER BY tablename, policyname;
