
-- Artist autopilot configuration table
CREATE TABLE public.artist_autopilot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_publish_releases BOOLEAN NOT NULL DEFAULT true,
  auto_analytics_reports BOOLEAN NOT NULL DEFAULT true,
  auto_fan_engagement BOOLEAN NOT NULL DEFAULT true,
  auto_revenue_optimization BOOLEAN NOT NULL DEFAULT true,
  auto_social_posting BOOLEAN NOT NULL DEFAULT false,
  auto_playlist_pitching BOOLEAN NOT NULL DEFAULT true,
  auto_momentum_tracking BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  run_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Autopilot activity log
CREATE TABLE public.autopilot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  summary TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artist_autopilot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopilot_logs ENABLE ROW LEVEL SECURITY;

-- Artists can manage their own autopilot settings
CREATE POLICY "Users manage own autopilot" ON public.artist_autopilot
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Service role can read all for scheduled processing
CREATE POLICY "Service role full access autopilot" ON public.artist_autopilot
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Users can view their own logs
CREATE POLICY "Users view own autopilot logs" ON public.autopilot_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Service role can insert logs
CREATE POLICY "Service role manage autopilot logs" ON public.autopilot_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Enable realtime for logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.autopilot_logs;
