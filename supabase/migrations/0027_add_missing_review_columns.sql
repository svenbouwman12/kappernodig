-- Add missing columns to existing reviews table
-- This migration adds the anti-spam columns that might be missing

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add is_approved column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'is_approved') THEN
        ALTER TABLE public.reviews ADD COLUMN is_approved BOOLEAN DEFAULT false;
    END IF;
    
    -- Add ip_address column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'ip_address') THEN
        ALTER TABLE public.reviews ADD COLUMN ip_address INET;
    END IF;
    
    -- Add user_agent column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'user_agent') THEN
        ALTER TABLE public.reviews ADD COLUMN user_agent TEXT;
    END IF;
    
    -- Add spam_score column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'spam_score') THEN
        ALTER TABLE public.reviews ADD COLUMN spam_score DECIMAL(3,2) DEFAULT 0;
    END IF;
    
    -- Add flags column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'flags') THEN
        ALTER TABLE public.reviews ADD COLUMN flags JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Update is_published default to false for new reviews
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'reviews' AND column_name = 'is_published') THEN
        ALTER TABLE public.reviews ALTER COLUMN is_published SET DEFAULT false;
    END IF;
END $$;

-- Create indexes for the new columns if they don't exist
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_ip_address ON public.reviews(ip_address);
CREATE INDEX IF NOT EXISTS idx_reviews_spam_score ON public.reviews(spam_score);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_email ON public.reviews(reviewer_email);

-- Update existing RLS policies if they exist
DROP POLICY IF EXISTS "Reviews select for all" ON public.reviews;
CREATE POLICY "Reviews select for all" ON public.reviews
  FOR SELECT TO anon, authenticated 
  USING (is_published = true AND is_approved = true);

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
