-- Create subscription plan enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'starter', 'pro', 'enterprise', 'fan');

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'trial')),
  ai_videos_used INTEGER NOT NULL DEFAULT 0,
  ai_videos_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own subscription (on signup)
CREATE POLICY "Users can create their own subscription"
ON public.user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only backend can update subscriptions
CREATE POLICY "Only backend can update subscriptions"
ON public.user_subscriptions
FOR UPDATE
USING (false);

-- Create index for fast lookups
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- Create function to check if user has plan access
CREATE OR REPLACE FUNCTION public.has_plan_access(_user_id UUID, _required_plan subscription_plan)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = _user_id
      AND status IN ('active', 'trial')
      AND (expires_at IS NULL OR expires_at > now())
      AND (
        CASE _required_plan
          WHEN 'free' THEN true
          WHEN 'starter' THEN plan IN ('starter', 'pro', 'enterprise')
          WHEN 'pro' THEN plan IN ('pro', 'enterprise')
          WHEN 'enterprise' THEN plan = 'enterprise'
          WHEN 'fan' THEN plan = 'fan'
          ELSE false
        END
      )
  )
$$;

-- Create function to get user's current plan
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id UUID)
RETURNS subscription_plan
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT plan FROM public.user_subscriptions
     WHERE user_id = _user_id
       AND status IN ('active', 'trial')
       AND (expires_at IS NULL OR expires_at > now())
     LIMIT 1),
    'free'::subscription_plan
  )
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();