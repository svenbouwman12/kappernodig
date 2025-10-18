-- Fix profiles table and ensure it exists with proper structure
-- This migration ensures the profiles table is created correctly

-- Drop and recreate profiles table to ensure clean state
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table for user roles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('kapper', 'client', 'admin')),
  naam TEXT NOT NULL,
  profielfoto TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create bookmarks table for client favorites (if not exists)
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  klant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(klant_id, salon_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for bookmarks
CREATE POLICY "Clients can view own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = klant_id);

CREATE POLICY "Clients can insert own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = klant_id);

CREATE POLICY "Clients can delete own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = klant_id);

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

-- Create profiles for existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Get all existing users and create profiles for them
    FOR user_record IN 
        SELECT id, email, raw_user_meta_data
        FROM auth.users
        WHERE id NOT IN (SELECT id FROM public.profiles)
    LOOP
        -- Determine role based on existing data or default to client
        DECLARE
            user_role TEXT := 'client';
        BEGIN
            -- Check if user has kapper_accounts entry
            IF EXISTS (SELECT 1 FROM public.kapper_accounts WHERE user_id = user_record.id) THEN
                user_role := 'kapper';
            END IF;
            
            -- Insert profile
            INSERT INTO public.profiles (id, email, role, naam)
            VALUES (
                user_record.id, 
                user_record.email, 
                user_role,
                COALESCE(user_record.raw_user_meta_data->>'naam', 'Bestaande gebruiker')
            );
        END;
    END LOOP;
    
    RAISE NOTICE 'Created profiles for existing users';
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_bookmarks_klant_id ON public.bookmarks(klant_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_salon_id ON public.bookmarks(salon_id);
