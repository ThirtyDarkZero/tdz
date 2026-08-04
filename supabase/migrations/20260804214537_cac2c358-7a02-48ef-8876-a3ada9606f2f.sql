-- Restrict collaborator invite acceptance/decline updates to status only.
CREATE OR REPLACE FUNCTION public.enforce_collaborator_invite_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_email text;
BEGIN
  -- The invite owner may continue to administer their own invite.
  IF auth.uid() = OLD.artist_id THEN
    RETURN NEW;
  END IF;

  SELECT u.email::text
  INTO caller_email
  FROM auth.users AS u
  WHERE u.id = auth.uid();

  IF caller_email IS NULL OR lower(caller_email) <> lower(OLD.invited_email) THEN
    RAISE EXCEPTION 'Not permitted to update this invite'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF OLD.status <> 'pending' OR NEW.status NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Invited users may only accept or decline a pending invite'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.artist_id IS DISTINCT FROM OLD.artist_id
     OR NEW.invited_email IS DISTINCT FROM OLD.invited_email
     OR NEW.permissions IS DISTINCT FROM OLD.permissions
     OR NEW.message IS DISTINCT FROM OLD.message
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Invited users may only change invite status'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_collaborator_invite_update ON public.collaborator_invites;
CREATE TRIGGER trg_enforce_collaborator_invite_update
BEFORE UPDATE ON public.collaborator_invites
FOR EACH ROW
EXECUTE FUNCTION public.enforce_collaborator_invite_update();

DROP POLICY IF EXISTS "Invited users can update invite status" ON public.collaborator_invites;
CREATE POLICY "Invited users can update invite status"
ON public.collaborator_invites
FOR UPDATE
TO authenticated
USING (
  lower(invited_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  AND status = 'pending'
  AND expires_at > now()
)
WITH CHECK (
  lower(invited_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  AND status IN ('accepted', 'declined')
);

-- Preserve the identity of an established manager/artist relationship.
CREATE OR REPLACE FUNCTION public.enforce_manager_artist_identity_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.manager_id IS DISTINCT FROM OLD.manager_id
     OR NEW.artist_id IS DISTINCT FROM OLD.artist_id
  THEN
    RAISE EXCEPTION 'Manager and artist identities cannot be changed on an existing relationship'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_manager_artist_identity_update ON public.manager_artists;
CREATE TRIGGER trg_enforce_manager_artist_identity_update
BEFORE UPDATE ON public.manager_artists
FOR EACH ROW
EXECUTE FUNCTION public.enforce_manager_artist_identity_update();

DROP POLICY IF EXISTS "Roster rows updatable by both parties" ON public.manager_artists;
CREATE POLICY "Roster rows updatable by both parties"
ON public.manager_artists
FOR UPDATE
TO authenticated
USING (manager_id = auth.uid() OR artist_id = auth.uid())
WITH CHECK (manager_id = auth.uid() OR artist_id = auth.uid());