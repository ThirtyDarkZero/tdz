-- ============================================
-- TDZ Distribution Security Hardening Migration
-- ============================================

-- 1. CREATE ROLE-BASED ACCESS CONTROL SYSTEM
-- ============================================

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'verified_artist', 'artist', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  granted_at timestamptz DEFAULT now(),
  granted_by uuid,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- User_roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 2. RESTRICT PROVIDER_HEALTH TABLE ACCESS
-- ============================================

-- Drop the public policy
DROP POLICY IF EXISTS "Anyone can view provider health" ON public.provider_health;

-- Only admins can view provider health (internal system data)
CREATE POLICY "Admins can view provider health"
ON public.provider_health FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 3. ADD EXPLICIT DENY POLICIES FOR RENDER_CREDITS
-- ============================================

-- Prevent direct credit creation (only via backend functions)
CREATE POLICY "Only backend can create credits"
ON public.render_credits FOR INSERT
WITH CHECK (false);

-- Prevent direct updates (only via deduct_render_credits function)
CREATE POLICY "Only backend can update credits"
ON public.render_credits FOR UPDATE
USING (false);

-- Prevent deletion of credit records (maintain audit trail)
CREATE POLICY "No deletion of credits"
ON public.render_credits FOR DELETE
USING (false);

-- 4. MINIMIZE PUBLISHED TRACK DATA EXPOSURE
-- ============================================

-- Create a safe public view that exposes only necessary track fields
CREATE OR REPLACE VIEW public.public_tracks AS
SELECT 
  id,
  title,
  artist_name,
  duration,
  genre,
  play_count,
  like_count,
  created_at,
  album_id
FROM tracks
WHERE is_published = true;

-- Grant access to the view
GRANT SELECT ON public.public_tracks TO anon, authenticated;

-- 5. IMPROVE CREDIT DEDUCTION FUNCTION (PREVENT RACE CONDITIONS)
-- ============================================

CREATE OR REPLACE FUNCTION public.deduct_render_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Use advisory lock for user-level serialization (prevents race conditions)
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));
  
  -- Ensure credits record exists with atomic initialization
  INSERT INTO public.render_credits (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Lock the row and get current balance
  SELECT balance INTO STRICT v_current_balance
  FROM public.render_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check sufficient credits
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits: have %, need %', v_current_balance, p_amount
      USING ERRCODE = 'check_violation';
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;
  
  -- Update balance
  UPDATE public.render_credits
  SET balance = v_new_balance,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Insert transaction record
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description
  ) VALUES (
    p_user_id,
    -p_amount,
    'deduction',
    p_description
  );
  
  RETURN v_new_balance;
END;
$$;

-- 6. ADD ADMIN-ONLY POLICIES FOR SENSITIVE OPERATIONS
-- ============================================

-- Only admins can delete tracks (content moderation)
CREATE POLICY "Admins can delete any track"
ON public.tracks FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can view all user library entries (audit purposes)
CREATE POLICY "Admins can view all library entries"
ON public.user_library FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- 7. ADD ARTIST VERIFICATION POLICIES
-- ============================================

-- Only verified artists and admins can publish tracks
DROP POLICY IF EXISTS "Users can update own tracks" ON public.tracks;
CREATE POLICY "Users can update own tracks"
ON public.tracks FOR UPDATE
USING (
  auth.uid() = user_id AND (
    public.has_role(auth.uid(), 'verified_artist') OR 
    public.has_role(auth.uid(), 'artist') OR
    public.has_role(auth.uid(), 'admin')
  )
);

-- Create trigger to auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Initialize render credits
  INSERT INTO public.render_credits (user_id, balance)
  VALUES (NEW.id, 100);
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();