
-- Manager integrations for enterprise white-label integrations
CREATE TABLE IF NOT EXISTS public.manager_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  display_name TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(manager_id, provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_integrations TO authenticated;
GRANT ALL ON public.manager_integrations TO service_role;

ALTER TABLE public.manager_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers view their own integrations"
  ON public.manager_integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = manager_id);

CREATE POLICY "Managers insert their own integrations"
  ON public.manager_integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers update their own integrations"
  ON public.manager_integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = manager_id)
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers delete their own integrations"
  ON public.manager_integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = manager_id);

CREATE TRIGGER trg_manager_integrations_updated_at
  BEFORE UPDATE ON public.manager_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Onboarding completion flag on profiles-adjacent table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='listener_profiles' AND column_name='onboarding_completed'
  ) THEN
    ALTER TABLE public.listener_profiles ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;
