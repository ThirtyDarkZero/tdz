-- Tables the tested migrations build on, as defined by earlier migrations.
CREATE TABLE public.artist_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artist_id uuid NOT NULL,
  period_start date NOT NULL DEFAULT current_date, period_end date NOT NULL DEFAULT current_date,
  total_streams bigint NOT NULL DEFAULT 0, streaming_revenue numeric(12,2) NOT NULL DEFAULT 0,
  total_downloads integer NOT NULL DEFAULT 0, download_revenue numeric(12,2) NOT NULL DEFAULT 0,
  total_earnings numeric(12,2) GENERATED ALWAYS AS (streaming_revenue + download_revenue) STORED,
  payout_status text NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending','processing','paid','failed')),
  payout_date timestamptz, idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX uq_artist_earnings_idem ON public.artist_earnings (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE TABLE public.artist_payouts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artist_id uuid NOT NULL,
  amount numeric NOT NULL, status text NOT NULL DEFAULT 'pending', square_payout_id text,
  earnings_ids uuid[] DEFAULT '{}', processed_by uuid, created_at timestamptz DEFAULT now(), completed_at timestamptz);
CREATE TABLE public.user_stream_limits (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE,
  streams_today int DEFAULT 0, streams_this_hour int DEFAULT 0, unique_tracks_today int DEFAULT 0,
  last_stream_at timestamptz, hour_window_start timestamptz DEFAULT now(), day_window_start timestamptz DEFAULT now(),
  is_flagged boolean DEFAULT false, flag_reason text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE public.blocked_entities (entity_type text, entity_value text, expires_at timestamptz);
CREATE TABLE public.stream_fraud_detection (user_id uuid, ip_address inet, device_fingerprint text,
  detection_type text, severity text, details jsonb, created_at timestamptz DEFAULT now());
CREATE TABLE public.stripe_webhook_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), stripe_event_id text UNIQUE,
  event_type text DEFAULT 'test', status text NOT NULL DEFAULT 'received', signature_valid boolean NOT NULL DEFAULT true,
  error_message text, received_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.render_credits (user_id uuid PRIMARY KEY, balance integer NOT NULL DEFAULT 0);
CREATE FUNCTION public.deduct_render_credits(p_user_id uuid, p_amount integer, p_description text DEFAULT NULL)
  RETURNS integer LANGUAGE sql SECURITY DEFINER AS $$ SELECT 0 $$;

-- Tables and policies as they stood before the step-5 security migration.
CREATE TYPE public.subscription_plan AS ENUM ('free', 'starter', 'pro', 'enterprise', 'fan');
CREATE TABLE public.user_subscriptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE,
  plan public.subscription_plan NOT NULL DEFAULT 'free', status text NOT NULL DEFAULT 'active', expires_at timestamptz);
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create their own subscription" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TABLE public.artist_tips (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artist_id uuid NOT NULL, tipper_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL, square_payment_id text, status text NOT NULL DEFAULT 'pending', created_at timestamptz DEFAULT now());
ALTER TABLE public.artist_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can insert tips" ON public.artist_tips FOR INSERT WITH CHECK (auth.uid() = tipper_id);
GRANT USAGE ON SCHEMA auth TO authenticated, anon;
GRANT SELECT ON auth._session TO authenticated, anon;
GRANT INSERT, SELECT ON public.user_subscriptions, public.artist_tips TO authenticated;
CREATE FUNCTION public.create_system_notification(p_user_id uuid, p_title text, p_message text)
  RETURNS void LANGUAGE sql SECURITY DEFINER AS $$ SELECT $$;
