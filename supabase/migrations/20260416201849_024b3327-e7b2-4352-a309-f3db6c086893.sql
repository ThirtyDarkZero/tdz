-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. merch_purchases
CREATE TABLE IF NOT EXISTS public.merch_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  artist_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  item_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  amount NUMERIC(10,2) NOT NULL,
  artist_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  shipping_address JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.merch_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their merch purchases" ON public.merch_purchases
  FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Artists can view sales of their merch" ON public.merch_purchases
  FOR SELECT USING (auth.uid() = artist_id);
CREATE POLICY "CEOs can view all merch purchases" ON public.merch_purchases
  FOR SELECT USING (public.has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "Service role manages merch purchases" ON public.merch_purchases
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_merch_purchases_buyer ON public.merch_purchases(buyer_id);
CREATE INDEX idx_merch_purchases_artist ON public.merch_purchases(artist_id);
CREATE INDEX idx_merch_purchases_session ON public.merch_purchases(stripe_session_id);

-- 2. unmatched_transactions
CREATE TABLE IF NOT EXISTS public.unmatched_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_object_id TEXT NOT NULL UNIQUE,
  stripe_object_type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  customer_email TEXT,
  metadata JSONB,
  suggested_match_table TEXT,
  suggested_match_id UUID,
  match_confidence NUMERIC(3,2),
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.unmatched_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEOs view unmatched transactions" ON public.unmatched_transactions
  FOR SELECT USING (public.has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEOs update unmatched transactions" ON public.unmatched_transactions
  FOR UPDATE USING (public.has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "Service role manages unmatched transactions" ON public.unmatched_transactions
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_unmatched_status ON public.unmatched_transactions(status);

-- 3. stream_revenue_audit
CREATE TABLE IF NOT EXISTS public.stream_revenue_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL,
  stream_id UUID,
  user_id UUID,
  validated BOOLEAN NOT NULL DEFAULT false,
  amount NUMERIC(10,4) NOT NULL DEFAULT 0,
  recorded_to_earnings BOOLEAN NOT NULL DEFAULT false,
  earnings_id UUID,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stream_revenue_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists view own stream audits" ON public.stream_revenue_audit
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.tracks t WHERE t.id = stream_revenue_audit.track_id AND t.user_id = auth.uid()));
CREATE POLICY "CEOs view all stream audits" ON public.stream_revenue_audit
  FOR SELECT USING (public.has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "Service role manages stream audits" ON public.stream_revenue_audit
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_stream_audit_track ON public.stream_revenue_audit(track_id);
CREATE INDEX idx_stream_audit_recorded ON public.stream_revenue_audit(recorded_to_earnings);

-- 4. system_health_log
CREATE TABLE IF NOT EXISTS public.system_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.system_health_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEOs view system health" ON public.system_health_log
  FOR SELECT USING (public.has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "Service role manages system health" ON public.system_health_log
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_health_log_created ON public.system_health_log(created_at DESC);
CREATE INDEX idx_health_log_status ON public.system_health_log(status);

-- triggers for updated_at
CREATE TRIGGER trg_merch_purchases_updated_at
  BEFORE UPDATE ON public.merch_purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();