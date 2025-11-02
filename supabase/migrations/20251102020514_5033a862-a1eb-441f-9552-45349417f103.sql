-- Create tables for production-ready features

-- Master Classes
CREATE TABLE public.master_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  instructor TEXT NOT NULL,
  duration TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'All Levels')),
  enrolled INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  price TEXT NOT NULL,
  thumbnail TEXT,
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.master_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available master classes"
ON public.master_classes
FOR SELECT
USING (available = true);

-- Opportunities Marketplace
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Sync Licensing', 'Brand Partnership', 'Performance', 'Collaboration')),
  budget TEXT NOT NULL,
  deadline DATE NOT NULL,
  genre JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Hot', 'Exclusive', 'Featured', 'New', 'Active', 'Closed')),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view opportunities"
ON public.opportunities
FOR SELECT
USING (true);

-- Tour Recommendations (AI-generated based on listener data)
CREATE TABLE public.tour_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  reason TEXT NOT NULL,
  venues JSONB NOT NULL DEFAULT '[]'::jsonb,
  best_month TEXT NOT NULL,
  audience_size TEXT NOT NULL,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tour_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tour recommendations"
ON public.tour_recommendations
FOR SELECT
USING (auth.uid() = user_id);

-- Fan Engagement Metrics (real-time tracking)
CREATE TABLE public.fan_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_list_size INTEGER NOT NULL DEFAULT 0,
  open_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  super_fans_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fan_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fan metrics"
ON public.fan_metrics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own fan metrics"
ON public.fan_metrics
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fan metrics"
ON public.fan_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Momentum Tracker (career momentum scoring)
CREATE TABLE public.momentum_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  streak_days INTEGER NOT NULL DEFAULT 0,
  release_velocity NUMERIC(5,2) NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  content_consistency NUMERIC(5,2) NOT NULL DEFAULT 0,
  fan_growth INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.momentum_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own momentum scores"
ON public.momentum_scores
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own momentum scores"
ON public.momentum_scores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Milestones
CREATE TABLE public.milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  achieved BOOLEAN NOT NULL DEFAULT false,
  date_achieved DATE,
  current_value INTEGER,
  target_value INTEGER,
  momentum_impact INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own milestones"
ON public.milestones
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones"
ON public.milestones
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones"
ON public.milestones
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Social Media Connections
CREATE TABLE public.social_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('spotify', 'apple', 'youtube', 'instagram', 'twitter')),
  platform_name TEXT NOT NULL,
  connected BOOLEAN NOT NULL DEFAULT false,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own social connections"
ON public.social_connections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own social connections"
ON public.social_connections
FOR ALL
USING (auth.uid() = user_id);

-- Function to initialize fan metrics for new users
CREATE OR REPLACE FUNCTION public.initialize_fan_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.fan_metrics (user_id, email_list_size, open_rate, conversion_rate, super_fans_count)
  VALUES (NEW.id, 0, 0, 0, 0)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public.momentum_scores (user_id, score, streak_days)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to initialize metrics on user creation
CREATE TRIGGER on_user_created_init_metrics
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_fan_metrics();