-- Create enum for collaboration permissions
CREATE TYPE public.collaboration_permission AS ENUM (
  'view_tracks',
  'edit_tracks',
  'upload_tracks',
  'delete_tracks',
  'view_analytics',
  'manage_albums'
);

-- Create collaborator invites table
CREATE TABLE public.collaborator_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL,
  invited_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  permissions JSONB NOT NULL DEFAULT '["view_tracks"]'::jsonb,
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create artist collaborators table
CREATE TABLE public.artist_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL,
  collaborator_id UUID NOT NULL,
  permissions JSONB NOT NULL DEFAULT '["view_tracks"]'::jsonb,
  invite_id UUID REFERENCES public.collaborator_invites(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(artist_id, collaborator_id)
);

-- Enable RLS
ALTER TABLE public.collaborator_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collaborator_invites
CREATE POLICY "Artists can create invites"
  ON public.collaborator_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can view their invites"
  ON public.collaborator_invites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = artist_id);

CREATE POLICY "Invited users can view their invites"
  ON public.collaborator_invites
  FOR SELECT
  TO authenticated
  USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
    AND expires_at > now()
  );

CREATE POLICY "Invited users can update invite status"
  ON public.collaborator_invites
  FOR UPDATE
  TO authenticated
  USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
  )
  WITH CHECK (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Artists can update their invites"
  ON public.collaborator_invites
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = artist_id)
  WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can delete their invites"
  ON public.collaborator_invites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = artist_id);

-- RLS Policies for artist_collaborators
CREATE POLICY "Artists can view their collaborators"
  ON public.artist_collaborators
  FOR SELECT
  TO authenticated
  USING (auth.uid() = artist_id);

CREATE POLICY "Collaborators can view their relationships"
  ON public.artist_collaborators
  FOR SELECT
  TO authenticated
  USING (auth.uid() = collaborator_id);

CREATE POLICY "Artists can manage collaborators"
  ON public.artist_collaborators
  FOR ALL
  TO authenticated
  USING (auth.uid() = artist_id)
  WITH CHECK (auth.uid() = artist_id);

-- Update tracks RLS to allow collaborators
CREATE POLICY "Collaborators can view artist tracks"
  ON public.tracks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.artist_collaborators
      WHERE collaborator_id = auth.uid()
      AND artist_id = tracks.user_id
      AND permissions @> '["view_tracks"]'::jsonb
    )
  );

CREATE POLICY "Collaborators can edit allowed tracks"
  ON public.tracks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.artist_collaborators
      WHERE collaborator_id = auth.uid()
      AND artist_id = tracks.user_id
      AND permissions @> '["edit_tracks"]'::jsonb
    )
  );

CREATE POLICY "Collaborators can upload tracks"
  ON public.tracks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artist_collaborators
      WHERE collaborator_id = auth.uid()
      AND artist_id = tracks.user_id
      AND permissions @> '["upload_tracks"]'::jsonb
    )
  );

-- Create indexes
CREATE INDEX idx_collaborator_invites_artist ON public.collaborator_invites(artist_id);
CREATE INDEX idx_collaborator_invites_email ON public.collaborator_invites(invited_email);
CREATE INDEX idx_collaborator_invites_status ON public.collaborator_invites(status);
CREATE INDEX idx_artist_collaborators_artist ON public.artist_collaborators(artist_id);
CREATE INDEX idx_artist_collaborators_collaborator ON public.artist_collaborators(collaborator_id);

-- Trigger for updated_at
CREATE TRIGGER update_collaborator_invites_updated_at
  BEFORE UPDATE ON public.collaborator_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artist_collaborators_updated_at
  BEFORE UPDATE ON public.artist_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();