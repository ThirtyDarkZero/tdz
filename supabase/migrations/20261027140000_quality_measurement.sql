-- Six Sigma step 1: measure real outcomes.
-- Every critical-to-quality (CTQ) operation records one pass/fail row, so the
-- platform's defect rate per million operations can be computed from real use.

CREATE TABLE IF NOT EXISTS public.outcome_events (
  id          bigserial PRIMARY KEY,
  ctq         text        NOT NULL,          -- stream_credit, payout, checkout, upload, ...
  ok          boolean     NOT NULL,
  reason      text,                          -- short machine-readable cause on failure
  subject_id  text,                          -- track / payout / session id
  artist_id   uuid,
  detail      jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outcome_events_ctq_time ON public.outcome_events (ctq, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_outcome_events_fail ON public.outcome_events (occurred_at DESC) WHERE NOT ok;

ALTER TABLE public.outcome_events ENABLE ROW LEVEL SECURITY;
-- Writes come only from edge functions (service role). CEO/admin can read.
DROP POLICY IF EXISTS "CEO and admin read outcomes" ON public.outcome_events;
CREATE POLICY "CEO and admin read outcomes" ON public.outcome_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ceo'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Sigma level for a defect rate (short-term sigma, with the standard 1.5 shift).
-- Inverse normal via Acklam's rational approximation (error < 1.2e-9).
CREATE OR REPLACE FUNCTION public.sigma_level(p_dpmo numeric)
RETURNS numeric LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  p  double precision;
  q  double precision;
  r  double precision;
  z  double precision;
  a1 double precision := -3.969683028665376e+01; a2 double precision := 2.209460984245205e+02;
  a3 double precision := -2.759285104469687e+02; a4 double precision := 1.383577518672690e+02;
  a5 double precision := -3.066479806614716e+01; a6 double precision := 2.506628277459239e+00;
  b1 double precision := -5.447609879822406e+01; b2 double precision := 1.615858368580409e+02;
  b3 double precision := -1.556989798598866e+02; b4 double precision := 6.680131188771972e+01;
  b5 double precision := -1.328068155288572e+01;
  c1 double precision := -7.784894002430293e-03; c2 double precision := -3.223964580411365e-01;
  c3 double precision := -2.400758277161838e+00; c4 double precision := -2.549732539343734e+00;
  c5 double precision := 4.374664141464968e+00;  c6 double precision := 2.938163982698783e+00;
  d1 double precision := 7.784695709041462e-03;  d2 double precision := 3.224671290700398e-01;
  d3 double precision := 2.445134137142996e+00;  d4 double precision := 3.754408661907416e+00;
BEGIN
  IF p_dpmo IS NULL THEN RETURN NULL; END IF;
  IF p_dpmo <= 0 THEN RETURN 6.0; END IF;          -- no defects observed: report the target ceiling
  IF p_dpmo >= 1000000 THEN RETURN 0; END IF;
  p := 1 - (p_dpmo::double precision / 1000000);    -- yield
  IF p < 0.02425 THEN
    q := sqrt(-2 * ln(p));
    z := (((((c1*q+c2)*q+c3)*q+c4)*q+c5)*q+c6) / ((((d1*q+d2)*q+d3)*q+d4)*q+1);
  ELSIF p <= 1 - 0.02425 THEN
    q := p - 0.5; r := q*q;
    z := (((((a1*r+a2)*r+a3)*r+a4)*r+a5)*r+a6)*q / (((((b1*r+b2)*r+b3)*r+b4)*r+b5)*r+1);
  ELSE
    q := sqrt(-2 * ln(1 - p));
    z := -(((((c1*q+c2)*q+c3)*q+c4)*q+c5)*q+c6) / ((((d1*q+d2)*q+d3)*q+d4)*q+1);
  END IF;
  RETURN round(LEAST(GREATEST(z + 1.5, 0), 6.0)::numeric, 2);
END;
$$;

-- Quality scorecard: one row per CTQ over the last p_days days.
-- Stripe webhook processing is read from the existing stripe_webhook_events log.
CREATE OR REPLACE FUNCTION public.get_quality_scorecard(p_days integer DEFAULT 30)
RETURNS TABLE (ctq text, opportunities bigint, defects bigint, dpmo numeric, sigma numeric, top_failure text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'ceo'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)
          OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH ev AS (
    SELECT o.ctq, o.ok, o.reason
    FROM public.outcome_events o
    WHERE o.occurred_at > now() - make_interval(days => p_days)
    UNION ALL
    SELECT 'stripe_webhook', w.status IN ('processed', 'ignored'), left(w.error_message, 80)
    FROM public.stripe_webhook_events w
    WHERE w.received_at > now() - make_interval(days => p_days)
      AND w.signature_valid AND w.status <> 'received'
  ),
  agg AS (
    SELECT e.ctq, count(*) AS n, count(*) FILTER (WHERE NOT e.ok) AS d
    FROM ev e GROUP BY e.ctq
  ),
  top AS (
    SELECT DISTINCT ON (e.ctq) e.ctq, e.reason
    FROM ev e WHERE NOT e.ok AND e.reason IS NOT NULL
    GROUP BY e.ctq, e.reason
    ORDER BY e.ctq, count(*) DESC
  )
  SELECT a.ctq, a.n, a.d,
         round(a.d::numeric / a.n * 1000000, 0),
         public.sigma_level(a.d::numeric / a.n * 1000000),
         t.reason
  FROM agg a LEFT JOIN top t ON t.ctq = a.ctq
  ORDER BY public.sigma_level(a.d::numeric / a.n * 1000000) ASC, a.ctq;
END;
$$;

REVOKE ALL ON FUNCTION public.get_quality_scorecard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_quality_scorecard(integer) TO authenticated, service_role;
