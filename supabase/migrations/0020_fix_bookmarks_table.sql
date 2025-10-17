-- Fix bookmarks table specifically
-- Drop and recreate bookmarks table with proper structure
DROP TABLE IF EXISTS public.bookmarks CASCADE;

-- Recreate bookmarks table
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  klant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(klant_id, salon_id)
);

-- Enable RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bookmarks
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = klant_id);

CREATE POLICY "Users can insert own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = klant_id);

CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = klant_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_klant_id ON public.bookmarks(klant_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_salon_id ON public.bookmarks(salon_id);
