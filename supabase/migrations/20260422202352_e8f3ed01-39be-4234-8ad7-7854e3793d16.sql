
-- Persistent log of every Stripe webhook event for CEO debugging
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received', -- received | processed | failed | ignored
  livemode BOOLEAN NOT NULL DEFAULT false,
  signature_valid BOOLEAN NOT NULL DEFAULT true,
  processing_ms INTEGER,
  error_message TEXT,
  payload JSONB NOT NULL,
  related_user_id UUID,
  related_resource_type TEXT,
  related_resource_id TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS stripe_webhook_events_received_at_idx
  ON public.stripe_webhook_events (received_at DESC);
CREATE INDEX IF NOT EXISTS stripe_webhook_events_event_type_idx
  ON public.stripe_webhook_events (event_type);
CREATE INDEX IF NOT EXISTS stripe_webhook_events_status_idx
  ON public.stripe_webhook_events (status);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only CEOs can read webhook events (raw payloads contain sensitive data)
CREATE POLICY "CEO can read stripe webhook events"
ON public.stripe_webhook_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'ceo'::app_role));

-- No client inserts/updates/deletes — only the service role (edge function) writes.
