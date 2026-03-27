
CREATE TABLE public.saved_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  strategy_type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.saved_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own strategies"
  ON public.saved_strategies FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own strategies"
  ON public.saved_strategies FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own strategies"
  ON public.saved_strategies FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
