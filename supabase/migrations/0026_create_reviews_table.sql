-- Create reviews table for salon reviews
-- This migration creates a reviews system for barbers/salons

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous reviews
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT, -- Optional for anonymous reviews
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false, -- For future verification system
  is_published BOOLEAN DEFAULT false, -- Changed to false for moderation
  is_approved BOOLEAN DEFAULT false, -- Admin approval system
  ip_address INET, -- Track IP for rate limiting
  user_agent TEXT, -- Track browser for spam detection
  spam_score DECIMAL(3,2) DEFAULT 0, -- Spam detection score (0-1)
  flags JSONB DEFAULT '[]'::jsonb, -- Array of flags for moderation
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_salon_id ON public.reviews(salon_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_published ON public.reviews(is_published);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_ip_address ON public.reviews(ip_address);
CREATE INDEX IF NOT EXISTS idx_reviews_spam_score ON public.reviews(spam_score);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_email ON public.reviews(reviewer_email);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow everyone to read published and approved reviews
CREATE POLICY "Reviews select for all" ON public.reviews
  FOR SELECT TO anon, authenticated 
  USING (is_published = true AND is_approved = true);

-- Allow authenticated users to insert reviews
CREATE POLICY "Reviews insert for authenticated" ON public.reviews
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- Allow anonymous users to insert reviews (for non-logged in users)
CREATE POLICY "Reviews insert for anonymous" ON public.reviews
  FOR INSERT TO anon 
  WITH CHECK (true);

-- Allow users to update their own reviews
CREATE POLICY "Reviews update by owner" ON public.reviews
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own reviews
CREATE POLICY "Reviews delete by owner" ON public.reviews
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_reviews_updated_at_trigger
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- Function to check rate limiting (max 3 reviews per IP per day)
CREATE OR REPLACE FUNCTION check_review_rate_limit(ip_addr INET)
RETURNS BOOLEAN AS $$
DECLARE
  review_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO review_count
  FROM public.reviews
  WHERE ip_address = ip_addr
    AND created_at >= NOW() - INTERVAL '24 hours';
  
  RETURN review_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate spam score
CREATE OR REPLACE FUNCTION calculate_spam_score(
  review_title TEXT,
  review_content TEXT,
  reviewer_name TEXT,
  user_agent TEXT
)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  score DECIMAL(3,2) := 0;
  title_lower TEXT;
  content_lower TEXT;
  name_lower TEXT;
BEGIN
  title_lower := LOWER(review_title);
  content_lower := LOWER(review_content);
  name_lower := LOWER(reviewer_name);
  
  -- Check for common spam keywords
  IF title_lower ~ '.*(free|cheap|best|amazing|incredible|wow|click here|buy now|discount|offer).*' THEN
    score := score + 0.2;
  END IF;
  
  -- Check for excessive capitalization
  IF review_title ~ '[A-Z]{5,}' OR review_content ~ '[A-Z]{5,}' THEN
    score := score + 0.15;
  END IF;
  
  -- Check for excessive exclamation marks
  IF (LENGTH(review_title) - LENGTH(REPLACE(review_title, '!', ''))) > 2 OR
     (LENGTH(review_content) - LENGTH(REPLACE(review_content, '!', ''))) > 3 THEN
    score := score + 0.1;
  END IF;
  
  -- Check for very short content
  IF LENGTH(review_content) < 20 THEN
    score := score + 0.2;
  END IF;
  
  -- Check for suspicious user agents
  IF user_agent IS NULL OR user_agent = '' OR user_agent ~ '.*(bot|crawler|spider).*' THEN
    score := score + 0.3;
  END IF;
  
  -- Check for repeated characters
  IF review_title ~ '(.)\1{3,}' OR review_content ~ '(.)\1{3,}' THEN
    score := score + 0.25;
  END IF;
  
  -- Cap the score at 1.0
  RETURN LEAST(score, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for duplicate reviews
CREATE OR REPLACE FUNCTION check_duplicate_review(
  salon_uuid UUID,
  review_title TEXT,
  review_content TEXT,
  ip_addr INET
)
RETURNS BOOLEAN AS $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM public.reviews
  WHERE salon_id = salon_uuid
    AND ip_address = ip_addr
    AND (
      title ILIKE '%' || review_title || '%'
      OR content ILIKE '%' || review_content || '%'
    )
    AND created_at >= NOW() - INTERVAL '30 days';
  
  RETURN duplicate_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.reviews IS 'Reviews for barbers/salons with anti-spam measures';
COMMENT ON COLUMN public.reviews.salon_id IS 'ID of the salon being reviewed';
COMMENT ON COLUMN public.reviews.user_id IS 'ID of the user who wrote the review (NULL for anonymous)';
COMMENT ON COLUMN public.reviews.reviewer_name IS 'Name of the reviewer';
COMMENT ON COLUMN public.reviews.reviewer_email IS 'Email of the reviewer (optional)';
COMMENT ON COLUMN public.reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN public.reviews.title IS 'Title of the review';
COMMENT ON COLUMN public.reviews.content IS 'Content/body of the review';
COMMENT ON COLUMN public.reviews.is_verified IS 'Whether the review is verified (future feature)';
COMMENT ON COLUMN public.reviews.is_published IS 'Whether the review is published and visible';
COMMENT ON COLUMN public.reviews.is_approved IS 'Whether the review is approved by admin';
COMMENT ON COLUMN public.reviews.ip_address IS 'IP address for rate limiting and spam detection';
COMMENT ON COLUMN public.reviews.user_agent IS 'Browser user agent for spam detection';
COMMENT ON COLUMN public.reviews.spam_score IS 'Calculated spam score (0-1, higher = more likely spam)';
COMMENT ON COLUMN public.reviews.flags IS 'JSON array of moderation flags';