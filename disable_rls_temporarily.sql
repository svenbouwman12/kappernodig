-- Temporary fix: Disable RLS completely for development
-- This will allow admin panel to work without policy issues

-- Disable RLS on all tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

-- Test that everything works
SELECT 'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'barbers' as table_name, COUNT(*) as count FROM public.barbers
UNION ALL
SELECT 'appointments' as table_name, COUNT(*) as count FROM public.appointments
UNION ALL
SELECT 'services' as table_name, COUNT(*) as count FROM public.services
UNION ALL
SELECT 'reviews' as table_name, COUNT(*) as count FROM public.reviews;

-- To re-enable RLS later, run:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
