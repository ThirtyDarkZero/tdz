
-- Fix notifications insert spoofing: only allow self-notifications via RLS.
-- Cross-user notifications must go through service_role (edge functions).
DROP POLICY IF EXISTS "Users can create notifications they authored" ON public.notifications;
CREATE POLICY "Users can create self notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = actor_id AND auth.uid() = user_id);

-- Fix collaborator_invites: prevent invited users from tampering with permissions/artist_id/etc.
-- Keep policy but add a trigger that restricts invited-user updates to status/updated_at only.
CREATE OR REPLACE FUNCTION public.enforce_collaborator_invite_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_email text;
BEGIN
  -- Artist owner can change anything
  IF auth.uid() = OLD.artist_id THEN
    RETURN NEW;
  END IF;

  SELECT email::text INTO caller_email FROM auth.users WHERE id = auth.uid();

  IF caller_email IS NOT NULL AND caller_email = OLD.invited_email THEN
    -- Invited user: only allow status transition from pending -> accepted/declined
    IF OLD.status <> 'pending' THEN
      RAISE EXCEPTION 'Invite is no longer pending';
    END IF;
    IF NEW.status NOT IN ('accepted','declined') THEN
      RAISE EXCEPTION 'Invited user may only accept or decline';
    END IF;
    -- Block changes to sensitive fields
    IF NEW.artist_id IS DISTINCT FROM OLD.artist_id
       OR NEW.invited_email IS DISTINCT FROM OLD.invited_email
       OR NEW.permissions IS DISTINCT FROM OLD.permissions
       OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
       OR (to_jsonb(NEW) ? 'role' AND NEW.role IS DISTINCT FROM OLD.role)
    THEN
      RAISE EXCEPTION 'Invited users cannot modify invite permissions or metadata';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Not permitted to update this invite';
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_collaborator_invite_update ON public.collaborator_invites;
CREATE TRIGGER trg_enforce_collaborator_invite_update
BEFORE UPDATE ON public.collaborator_invites
FOR EACH ROW
EXECUTE FUNCTION public.enforce_collaborator_invite_update();
