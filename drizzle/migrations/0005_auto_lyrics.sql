-- Automatic lyrics on upload.
-- Every new track gets a lyrics job. The uploader starts it right away (with a
-- small 16 kHz copy of the audio made in the browser); a cron sweep retries
-- anything that didn't finish. Results land in track_lyrics_sync as version 1
-- with source "auto", which the artist can then correct.

CREATE TABLE IF NOT EXISTS public.lyrics_jobs (
  track_id   uuid PRIMARY KEY REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL,
  status     text NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'processing', 'done', 'instrumental', 'skipped', 'failed', 'gave_up')),
  attempts   integer NOT NULL DEFAULT 0,
  proxy_path text,
  error      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lyrics_jobs_open ON public.lyrics_jobs (status, updated_at) WHERE status IN ('pending', 'failed');
ALTER TABLE public.lyrics_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners see their lyrics jobs" ON public.lyrics_jobs;
CREATE POLICY "Owners see their lyrics jobs" ON public.lyrics_jobs FOR SELECT TO authenticated USING (user_id = auth.uid());
-- The uploader records where it put the small audio copy.
DROP POLICY IF EXISTS "Owners set the lyrics audio copy" ON public.lyrics_jobs;
CREATE POLICY "Owners set the lyrics audio copy" ON public.lyrics_jobs FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, UPDATE (proxy_path) ON public.lyrics_jobs TO authenticated;
-- Supabase grants table-wide rights by default, so enforce "proxy_path only" here too.
CREATE OR REPLACE FUNCTION public.guard_lyrics_job_update() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_proxy text := NEW.proxy_path;
BEGIN
  IF auth.uid() IS NOT NULL THEN   -- an end user, not the server
    NEW := OLD;
    NEW.proxy_path := v_proxy;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_guard_lyrics_job_update ON public.lyrics_jobs;
CREATE TRIGGER trg_guard_lyrics_job_update BEFORE UPDATE ON public.lyrics_jobs
  FOR EACH ROW EXECUTE FUNCTION public.guard_lyrics_job_update();

CREATE OR REPLACE FUNCTION public.queue_lyrics_job() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.lyrics_jobs (track_id, user_id) VALUES (NEW.id, NEW.user_id)
  ON CONFLICT (track_id) DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_queue_lyrics_job ON public.tracks;
CREATE TRIGGER trg_queue_lyrics_job AFTER INSERT ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION public.queue_lyrics_job();

-- Retry sweep (cron.schedule reading vault secrets) omitted here: agent tooling
-- may not reference vault. Schedule separately.