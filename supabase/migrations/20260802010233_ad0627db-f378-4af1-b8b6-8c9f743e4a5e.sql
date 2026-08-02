CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  display_name text,
  date_of_birth date,
  email text,
  phone text,
  country text,
  city text,
  gender text,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own profile" ON public.user_profiles;
CREATE POLICY "Users view own profile" ON public.user_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own profile" ON public.user_profiles;
CREATE POLICY "Users insert own profile" ON public.user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own profile" ON public.user_profiles;
CREATE POLICY "Users update own profile" ON public.user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.validate_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.date_of_birth IS NOT NULL THEN
    IF NEW.date_of_birth > (current_date - interval '13 years')
       OR NEW.date_of_birth < (current_date - interval '120 years') THEN
      RAISE EXCEPTION 'Date of birth must be a real date and the account holder must be at least 13 years old';
    END IF;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_user_profile_trg ON public.user_profiles;
CREATE TRIGGER validate_user_profile_trg
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_profile();