-- Team and roster invites, end to end.
--
-- What was broken:
--   1. No email was ever sent: the app only inserted a row.
--   2. Invitees couldn't see their invites: the policy read auth.users, which
--      signed-in users have no access to ("permission denied for table users").
--   3. Accepting failed: the invitee inserted into artist_collaborators, whose
--      policy only lets the *artist* insert.
--   4. Declining failed: the app set 'rejected'; the update policy only allows
--      'accepted' or 'declined', and the CHECK constraint didn't allow 'declined'.
--
-- Now: the send-team-invite function creates the invite and queues the email;
-- the invitee opens /invite/<token> and accepts or declines through the
-- functions below, which do the privileged parts safely.

ALTER TABLE public.collaborator_invites
  ADD COLUMN IF NOT EXISTS token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'collaborator',
  ADD COLUMN IF NOT EXISTS inviter_name text,
  ADD COLUMN IF NOT EXISTS email_status text,
  ADD COLUMN IF NOT EXISTS email_error text,
  ADD COLUMN IF NOT EXISTS last_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS uq_collaborator_invites_token ON public.collaborator_invites (token);

-- Manager-flagged invites are roster invites.
UPDATE public.collaborator_invites
SET kind = 'roster'
WHERE jsonb_typeof(permissions) = 'object' AND (permissions ->> 'manager')::boolean IS TRUE;

ALTER TABLE public.collaborator_invites DROP CONSTRAINT IF EXISTS collaborator_invites_status_check;
ALTER TABLE public.collaborator_invites
  ADD CONSTRAINT collaborator_invites_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'rejected', 'expired', 'revoked'));
ALTER TABLE public.collaborator_invites DROP CONSTRAINT IF EXISTS collaborator_invites_kind_check;
ALTER TABLE public.collaborator_invites
  ADD CONSTRAINT collaborator_invites_kind_check CHECK (kind IN ('collaborator', 'roster'));

-- One open invite per artist + email + kind; re-sending refreshes it.
WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY artist_id, lower(invited_email), kind ORDER BY created_at DESC) AS rn
  FROM public.collaborator_invites WHERE status = 'pending'
)
UPDATE public.collaborator_invites c SET status = 'expired'
FROM ranked r WHERE r.id = c.id AND r.rn > 1;
CREATE UNIQUE INDEX IF NOT EXISTS uq_collaborator_invites_open
  ON public.collaborator_invites (artist_id, lower(invited_email), kind) WHERE status = 'pending';

-- Invitees see their own invites (by the email on their sign-in token).
DROP POLICY IF EXISTS "Invited users can view their invites" ON public.collaborator_invites;
CREATE POLICY "Invited users can view their invites"
ON public.collaborator_invites FOR SELECT TO authenticated
USING (lower(invited_email) = lower(COALESCE(auth.jwt() ->> 'email', '')));

-- Public preview of an invite by its secret token (who invited you, for what).
CREATE OR REPLACE FUNCTION public.get_invite_by_token(p_token uuid)
RETURNS TABLE (id uuid, kind text, inviter_name text, invited_email text, permissions jsonb,
               message text, status text, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.id, i.kind,
         COALESCE(i.inviter_name, ap.artist_name, 'A TDZ artist'),
         i.invited_email, i.permissions, i.message,
         CASE WHEN i.status = 'pending' AND i.expires_at <= now() THEN 'expired' ELSE i.status END,
         i.expires_at
  FROM public.collaborator_invites i
  LEFT JOIN public.artist_profiles ap ON ap.user_id = i.artist_id
  WHERE i.token = p_token;
$$;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(uuid) TO anon, authenticated;

-- Accept or decline. The signed-in user's email must match the invite.
CREATE OR REPLACE FUNCTION public.respond_to_invite(p_token uuid, p_accept boolean)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inv public.collaborator_invites;
  v_uid uuid := auth.uid();
  v_email text := lower(COALESCE(auth.jwt() ->> 'email', ''));
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in to respond to this invite' USING ERRCODE = '28000'; END IF;

  SELECT * INTO v_inv FROM public.collaborator_invites WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invite not found' USING ERRCODE = 'P0002'; END IF;
  IF lower(v_inv.invited_email) <> v_email THEN
    RAISE EXCEPTION 'This invite was sent to %. Sign in with that email to accept it.', v_inv.invited_email
      USING ERRCODE = '42501';
  END IF;
  IF v_inv.artist_id = v_uid THEN RAISE EXCEPTION 'You cannot accept your own invite' USING ERRCODE = '42501'; END IF;
  IF v_inv.status <> 'pending' THEN RETURN v_inv.status; END IF;
  IF v_inv.expires_at <= now() THEN
    UPDATE public.collaborator_invites SET status = 'expired' WHERE id = v_inv.id;
    RETURN 'expired';
  END IF;

  IF p_accept THEN
    IF v_inv.kind = 'collaborator' THEN
      INSERT INTO public.artist_collaborators (artist_id, collaborator_id, permissions, invite_id)
      VALUES (v_inv.artist_id, v_uid,
              CASE WHEN jsonb_typeof(v_inv.permissions) = 'array' THEN v_inv.permissions ELSE '["view_tracks"]'::jsonb END,
              v_inv.id)
      ON CONFLICT (artist_id, collaborator_id)
      DO UPDATE SET permissions = EXCLUDED.permissions, invite_id = EXCLUDED.invite_id, updated_at = now();
    END IF;
    -- Roster invites: the existing trigger links manager and artist on 'accepted'.
    UPDATE public.collaborator_invites SET status = 'accepted', responded_at = now(), updated_at = now()
    WHERE id = v_inv.id;
    RETURN 'accepted';
  END IF;

  UPDATE public.collaborator_invites SET status = 'declined', responded_at = now(), updated_at = now()
  WHERE id = v_inv.id;
  RETURN 'declined';
END;
$$;
REVOKE ALL ON FUNCTION public.respond_to_invite(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_to_invite(uuid, boolean) TO authenticated;

-- Guard: invitees may only move a pending invite to accepted/declined/expired.
-- Server jobs (no end-user caller) may manage invites, e.g. re-sending.
CREATE OR REPLACE FUNCTION public.enforce_collaborator_invite_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() = OLD.artist_id THEN
    RETURN NEW;
  END IF;
  IF lower(OLD.invited_email) <> lower(COALESCE(auth.jwt() ->> 'email', '')) THEN
    RAISE EXCEPTION 'Not permitted to update this invite' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF OLD.status <> 'pending' OR NEW.status NOT IN ('accepted', 'declined', 'expired') THEN
    RAISE EXCEPTION 'Invited users may only accept or decline a pending invite' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.artist_id IS DISTINCT FROM OLD.artist_id
     OR NEW.invited_email IS DISTINCT FROM OLD.invited_email
     OR NEW.permissions IS DISTINCT FROM OLD.permissions
     OR NEW.message IS DISTINCT FROM OLD.message
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.token IS DISTINCT FROM OLD.token
     OR NEW.kind IS DISTINCT FROM OLD.kind
  THEN
    RAISE EXCEPTION 'Invited users may only change invite status' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;
