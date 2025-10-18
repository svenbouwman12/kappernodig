-- Fix profiles table RLS and ensure proper setup
-- First, drop and recreate the profiles table to ensure clean state
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Recreate profiles table with all necessary fields
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('kapper', 'client')),
  naam TEXT NOT NULL,
  profielfoto TEXT,
  telefoon TEXT,
  adres TEXT,
  stad TEXT,
  postcode TEXT,
  geboortedatum DATE,
  geslacht TEXT CHECK (geslacht IN ('man', 'vrouw', 'anders')),
  notities TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create new RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_stad ON public.profiles(stad);
CREATE INDEX IF NOT EXISTS idx_profiles_geslacht ON public.profiles(geslacht);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, naam)
  VALUES (NEW.id, NEW.email, 'client', COALESCE(NEW.raw_user_meta_data->>'naam', 'Nieuwe klant'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for existing users if they don't exist
INSERT INTO public.profiles (id, email, role, naam)
SELECT 
  id, 
  email, 
  'client' as role,
  COALESCE(raw_user_meta_data->>'naam', split_part(email, '@', 1)) as naam
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Fix bookmarks table RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing bookmark policies if they exist
DROP POLICY IF EXISTS "Clients can view own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Clients can insert own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Clients can delete own bookmarks" ON public.bookmarks;

-- Create new bookmark policies
CREATE POLICY "Clients can view own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = klant_id);

CREATE POLICY "Clients can insert own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = klant_id);

CREATE POLICY "Clients can delete own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = klant_id);
