
CREATE TABLE public.enterprise_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  logo_path TEXT,
  accent_color TEXT DEFAULT '#00CFFF',
  background_color TEXT DEFAULT '#141414',
  sidebar_color TEXT DEFAULT '#0A0A1A',
  hide_tdz_branding BOOLEAN DEFAULT false,
  custom_font TEXT,
  label_name TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.enterprise_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own branding"
ON public.enterprise_branding FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own branding"
ON public.enterprise_branding FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own branding"
ON public.enterprise_branding FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_enterprise_branding_updated_at
BEFORE UPDATE ON public.enterprise_branding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
