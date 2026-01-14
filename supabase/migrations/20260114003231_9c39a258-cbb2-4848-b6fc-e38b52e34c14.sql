-- Support Tickets table for artist technical issues and QA concerns
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticket_number TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]',
  assigned_to UUID,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ticket responses/comments
CREATE TABLE public.ticket_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_staff BOOLEAN NOT NULL DEFAULT false,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Track territories and rights management
CREATE TABLE public.track_territories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  territory_code TEXT NOT NULL,
  territory_name TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  restriction_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(track_id, territory_code)
);

-- Rights splits for tracks
CREATE TABLE public.track_rights_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  rights_type TEXT NOT NULL CHECK (rights_type IN ('master', 'publishing', 'performance')),
  holder_name TEXT NOT NULL,
  holder_email TEXT,
  split_percentage DECIMAL(5,2) NOT NULL CHECK (split_percentage >= 0 AND split_percentage <= 100),
  pro_affiliation TEXT,
  ipi_number TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pre-save campaigns
CREATE TABLE public.presave_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  release_date DATE NOT NULL,
  description TEXT,
  cover_image_path TEXT,
  landing_page_settings JSONB DEFAULT '{}',
  total_presaves INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pre-save signups
CREATE TABLE public.presave_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.presave_campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id UUID,
  platform_preferences JSONB DEFAULT '[]',
  notified_on_release BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_rights_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presave_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presave_signups ENABLE ROW LEVEL SECURITY;

-- Support tickets policies
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
  ON public.support_tickets FOR UPDATE
  USING (auth.uid() = user_id);

-- Ticket responses policies
CREATE POLICY "Users can view responses for their tickets"
  ON public.ticket_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE support_tickets.id = ticket_responses.ticket_id 
    AND support_tickets.user_id = auth.uid()
  ));

CREATE POLICY "Users can add responses to their tickets"
  ON public.ticket_responses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE support_tickets.id = ticket_responses.ticket_id 
    AND support_tickets.user_id = auth.uid()
  ));

-- Track territories policies
CREATE POLICY "Users can view their track territories"
  ON public.track_territories FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tracks 
    WHERE tracks.id = track_territories.track_id 
    AND tracks.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their track territories"
  ON public.track_territories FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tracks 
    WHERE tracks.id = track_territories.track_id 
    AND tracks.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their track territories"
  ON public.track_territories FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.tracks 
    WHERE tracks.id = track_territories.track_id 
    AND tracks.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their track territories"
  ON public.track_territories FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.tracks 
    WHERE tracks.id = track_territories.track_id 
    AND tracks.user_id = auth.uid()
  ));

-- Track rights splits policies
CREATE POLICY "Users can view their track rights splits"
  ON public.track_rights_splits FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tracks 
    WHERE tracks.id = track_rights_splits.track_id 
    AND tracks.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their track rights splits"
  ON public.track_rights_splits FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tracks 
    WHERE tracks.id = track_rights_splits.track_id 
    AND tracks.user_id = auth.uid()
  ));

-- Presave campaigns policies
CREATE POLICY "Users can view their own campaigns"
  ON public.presave_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active campaigns by slug"
  ON public.presave_campaigns FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can manage their campaigns"
  ON public.presave_campaigns FOR ALL
  USING (auth.uid() = user_id);

-- Presave signups policies
CREATE POLICY "Campaign owners can view signups"
  ON public.presave_signups FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.presave_campaigns 
    WHERE presave_campaigns.id = presave_signups.campaign_id 
    AND presave_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can create signups"
  ON public.presave_signups FOR INSERT
  WITH CHECK (true);

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  ticket_num TEXT;
BEGIN
  year_part := to_char(NOW(), 'YYMM');
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 6) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.support_tickets
  WHERE ticket_number LIKE 'TDZ-' || year_part || '%';
  ticket_num := 'TDZ-' || year_part || LPAD(sequence_num::TEXT, 5, '0');
  RETURN ticket_num;
END;
$$;

-- Trigger for auto-generating ticket numbers
CREATE OR REPLACE FUNCTION public.auto_generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := public.generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_ticket_number();

-- Trigger for updated_at columns
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_track_territories_updated_at
  BEFORE UPDATE ON public.track_territories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_track_rights_splits_updated_at
  BEFORE UPDATE ON public.track_rights_splits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_presave_campaigns_updated_at
  BEFORE UPDATE ON public.presave_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_ticket_responses_ticket_id ON public.ticket_responses(ticket_id);
CREATE INDEX idx_track_territories_track_id ON public.track_territories(track_id);
CREATE INDEX idx_track_rights_splits_track_id ON public.track_rights_splits(track_id);
CREATE INDEX idx_presave_campaigns_user_id ON public.presave_campaigns(user_id);
CREATE INDEX idx_presave_campaigns_slug ON public.presave_campaigns(slug);
CREATE INDEX idx_presave_signups_campaign_id ON public.presave_signups(campaign_id);