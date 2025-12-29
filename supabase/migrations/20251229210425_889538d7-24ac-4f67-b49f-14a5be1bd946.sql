-- Create smart_links table for tracking shareable links
CREATE TABLE IF NOT EXISTS public.smart_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('track', 'album', 'playlist', 'artist')),
  target_id UUID NOT NULL,
  short_code TEXT UNIQUE NOT NULL,
  title TEXT,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.smart_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own smart links
CREATE POLICY "Users can view own smart links" 
ON public.smart_links 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create smart links
CREATE POLICY "Users can create smart links" 
ON public.smart_links 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own smart links
CREATE POLICY "Users can update own smart links" 
ON public.smart_links 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Anyone can view smart links for click tracking
CREATE POLICY "Anyone can view smart links by short_code" 
ON public.smart_links 
FOR SELECT 
USING (true);

-- Policy: Anyone can update click count (for analytics)
CREATE POLICY "Anyone can update click count" 
ON public.smart_links 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Create index for fast short_code lookups
CREATE INDEX idx_smart_links_short_code ON public.smart_links(short_code);
CREATE INDEX idx_smart_links_user_id ON public.smart_links(user_id);
CREATE INDEX idx_smart_links_target ON public.smart_links(target_type, target_id);

-- Trigger for updated_at
CREATE TRIGGER update_smart_links_updated_at
BEFORE UPDATE ON public.smart_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();