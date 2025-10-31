-- Add artist and listener roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'artist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'listener';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'verified_artist';

-- Create listener profiles table for fan interactions
CREATE TABLE IF NOT EXISTS public.listener_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  profile_image_path TEXT,
  favorite_genres JSONB DEFAULT '[]'::jsonb,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on listener_profiles
ALTER TABLE public.listener_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for listener_profiles
CREATE POLICY "Anyone can view listener profiles"
  ON public.listener_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can create their listener profile"
  ON public.listener_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their listener profile"
  ON public.listener_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create track likes table for fan engagement
CREATE TABLE IF NOT EXISTS public.track_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id)
);

-- Enable RLS on track_likes
ALTER TABLE public.track_likes ENABLE ROW LEVEL SECURITY;

-- Policies for track_likes
CREATE POLICY "Users can view their own likes"
  ON public.track_likes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can like tracks"
  ON public.track_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike tracks"
  ON public.track_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create artist follows table for fan-artist connections
CREATE TABLE IF NOT EXISTS public.artist_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, artist_id)
);

-- Enable RLS on artist_follows
ALTER TABLE public.artist_follows ENABLE ROW LEVEL SECURITY;

-- Policies for artist_follows
CREATE POLICY "Anyone can view follows"
  ON public.artist_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow artists"
  ON public.artist_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow artists"
  ON public.artist_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Update handle_new_user function to not auto-assign role
-- Users will choose their role during onboarding
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Initialize render credits (for artists)
  INSERT INTO public.render_credits (user_id, balance)
  VALUES (NEW.id, 100)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;