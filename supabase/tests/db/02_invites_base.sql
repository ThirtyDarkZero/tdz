-- Invite tables, policies and triggers as they stood before 20261030120000_team_invites.
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email text;
CREATE TABLE public.artist_profiles (user_id uuid PRIMARY KEY, artist_name text);
CREATE TABLE public.manager_artists (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), manager_id uuid NOT NULL,
  artist_id uuid NOT NULL, commission_rate numeric, UNIQUE (manager_id, artist_id));
CREATE TABLE public.collaborator_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artist_id uuid NOT NULL, invited_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  permissions jsonb NOT NULL DEFAULT '["view_tracks"]'::jsonb, message text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.artist_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artist_id uuid NOT NULL, collaborator_id uuid NOT NULL,
  permissions jsonb NOT NULL DEFAULT '["view_tracks"]'::jsonb,
  invite_id uuid REFERENCES public.collaborator_invites(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artist_id, collaborator_id));
ALTER TABLE public.collaborator_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_collaborators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artists can create invites" ON public.collaborator_invites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = artist_id);
CREATE POLICY "Artists can view their invites" ON public.collaborator_invites FOR SELECT TO authenticated
  USING (auth.uid() = artist_id);
CREATE POLICY "Invited users can view their invites" ON public.collaborator_invites FOR SELECT TO authenticated
  USING (invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND status = 'pending' AND expires_at > now());
CREATE POLICY "Artists can manage collaborators" ON public.artist_collaborators FOR ALL TO authenticated
  USING (auth.uid() = artist_id) WITH CHECK (auth.uid() = artist_id);
CREATE POLICY "Collaborators can view their relationships" ON public.artist_collaborators FOR SELECT TO authenticated
  USING (auth.uid() = collaborator_id);
GRANT SELECT, INSERT, UPDATE ON public.collaborator_invites, public.artist_collaborators TO authenticated;

-- Manager link on accept (20260722234402).
CREATE FUNCTION public.on_collaborator_invite_accepted() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE v_accepter uuid;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted')
     AND jsonb_typeof(NEW.permissions) = 'object' AND (NEW.permissions ->> 'manager')::boolean IS TRUE THEN
    SELECT id INTO v_accepter FROM auth.users WHERE lower(email) = lower(NEW.invited_email) LIMIT 1;
    IF v_accepter IS NOT NULL AND v_accepter <> NEW.artist_id THEN
      INSERT INTO public.manager_artists (manager_id, artist_id, commission_rate) VALUES (NEW.artist_id, v_accepter, 15.00)
      ON CONFLICT (manager_id, artist_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_collab_invite_accepted AFTER UPDATE ON public.collaborator_invites
  FOR EACH ROW EXECUTE FUNCTION public.on_collaborator_invite_accepted();
CREATE FUNCTION public.enforce_collaborator_invite_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
CREATE TRIGGER trg_enforce_collaborator_invite_update BEFORE UPDATE ON public.collaborator_invites
  FOR EACH ROW EXECUTE FUNCTION public.enforce_collaborator_invite_update();

-- Smart links as they stood before 20261030130000_smart_links.
CREATE TABLE public.smart_links (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('track', 'album', 'playlist', 'artist')), target_id uuid NOT NULL,
  short_code text UNIQUE NOT NULL, title text, clicks integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.smart_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create smart links" ON public.smart_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view smart links by short_code" ON public.smart_links FOR SELECT USING (true);
CREATE TABLE public.smart_link_clicks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smart_link_id uuid REFERENCES public.smart_links(id) ON DELETE CASCADE NOT NULL, platform text, user_agent text,
  country text, clicked_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.smart_link_clicks ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.smart_links TO authenticated;
GRANT SELECT ON public.smart_links TO anon;
CREATE FUNCTION public.increment_smart_link_clicks(p_short_code text) RETURNS void LANGUAGE sql AS $$ SELECT $$;
