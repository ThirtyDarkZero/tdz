CREATE TABLE public.marketing_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  draft_date DATE NOT NULL DEFAULT CURRENT_DATE,
  funnel_stage TEXT NOT NULL,
  audience TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  preview_text TEXT,
  body_markdown TEXT NOT NULL,
  cta_label TEXT,
  cta_url TEXT,
  feature_focus TEXT,
  screenshot_hint TEXT,
  channel TEXT NOT NULL DEFAULT 'email',
  status TEXT NOT NULL DEFAULT 'draft',
  generated_by TEXT NOT NULL DEFAULT 'marketing-brain',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX marketing_drafts_date_idx ON public.marketing_drafts (draft_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_drafts TO authenticated;
GRANT ALL ON public.marketing_drafts TO service_role;

ALTER TABLE public.marketing_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and CEO can read marketing drafts"
ON public.marketing_drafts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Admins and CEO can insert marketing drafts"
ON public.marketing_drafts FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Admins and CEO can update marketing drafts"
ON public.marketing_drafts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Admins and CEO can delete marketing drafts"
ON public.marketing_drafts FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ceo'));

CREATE TRIGGER update_marketing_drafts_updated_at
BEFORE UPDATE ON public.marketing_drafts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();