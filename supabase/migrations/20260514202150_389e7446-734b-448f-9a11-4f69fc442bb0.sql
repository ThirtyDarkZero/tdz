
-- Fix Security Definer View: enforce security_invoker on payout safe view
DROP VIEW IF EXISTS public.artist_payout_details_safe;
CREATE VIEW public.artist_payout_details_safe
WITH (security_invoker = true) AS
SELECT id, artist_id, payout_enabled, account_holder_name, stripe_connect_id,
       last_payout_date, created_at, updated_at
FROM public.artist_payout_details;

-- Fix Function Search Path Mutable on email queue helpers (pgmq + public)
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = pgmq, public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = pgmq, public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = pgmq, public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = pgmq, public;
