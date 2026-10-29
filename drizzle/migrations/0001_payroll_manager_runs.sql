CREATE TABLE public.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'healthy',
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  auto_fixes jsonb NOT NULL DEFAULT '[]'::jsonb,
  totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary text
);
GRANT SELECT ON public.payroll_runs TO authenticated;
GRANT ALL ON public.payroll_runs TO service_role;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CEO and admin read payroll runs" ON public.payroll_runs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'ceo') OR public.has_role(auth.uid(),'admin'));
CREATE INDEX payroll_runs_created_idx ON public.payroll_runs(created_at DESC);