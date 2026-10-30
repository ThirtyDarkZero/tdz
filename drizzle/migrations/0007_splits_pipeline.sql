-- Publishing and master splits, end to end.
--
-- Before: splits were typed in per track, only capped at 100% (never required
-- to reach it), nobody on a split was ever asked to confirm, and writer
-- credits entered at upload never became splits.
--
-- Now:
--   * each split row has a status: draft -> sent -> confirmed / disputed
--   * changing a confirmed share sends it back to draft (it must be re-confirmed)
--   * writers from upload become draft publishing splits automatically
--   * collaborators confirm or dispute from an emailed link (/split/<token>)
--   * one call returns every track's split health for the Rights screen

ALTER TABLE public.track_rights_splits
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_note text,
  ADD COLUMN IF NOT EXISTS holder_user_id uuid;
ALTER TABLE public.track_rights_splits DROP CONSTRAINT IF EXISTS track_rights_splits_status_check;
ALTER TABLE public.track_rights_splits ADD CONSTRAINT track_rights_splits_status_check
  CHECK (status IN ('draft', 'sent', 'confirmed', 'disputed'));
CREATE UNIQUE INDEX IF NOT EXISTS uq_track_rights_splits_token ON public.track_rights_splits (token);
CREATE INDEX IF NOT EXISTS idx_track_rights_splits_track ON public.track_rights_splits (track_id, rights_type);
UPDATE public.track_rights_splits SET status = 'confirmed' WHERE is_verified AND status = 'draft';

-- A confirmed share that changes must be confirmed again.
CREATE OR REPLACE FUNCTION public.reset_split_on_change() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND (
       NEW.split_percentage IS DISTINCT FROM OLD.split_percentage
    OR NEW.holder_name IS DISTINCT FROM OLD.holder_name
    OR NEW.holder_email IS DISTINCT FROM OLD.holder_email
    OR NEW.rights_type IS DISTINCT FROM OLD.rights_type) THEN
    NEW.status := 'draft';
    NEW.is_verified := false;
    NEW.responded_at := NULL;
    NEW.token := gen_random_uuid();   -- old confirmation links stop working
  END IF;
  -- Owners can't mark their own collaborators as confirmed.
  IF auth.uid() IS NOT NULL AND NEW.status IN ('confirmed', 'disputed') AND OLD.status IS DISTINCT FROM NEW.status
     AND COALESCE(current_setting('tdz.split_response', true), '') <> 'on' THEN
    RAISE EXCEPTION 'Only the collaborator can confirm or dispute their split' USING ERRCODE = '42501';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_reset_split_on_change ON public.track_rights_splits;
CREATE TRIGGER trg_reset_split_on_change BEFORE UPDATE ON public.track_rights_splits
  FOR EACH ROW EXECUTE FUNCTION public.reset_split_on_change();

CREATE OR REPLACE FUNCTION public.guard_split_insert() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.status := 'draft';
    NEW.is_verified := false;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_guard_split_insert ON public.track_rights_splits;
CREATE TRIGGER trg_guard_split_insert BEFORE INSERT ON public.track_rights_splits
  FOR EACH ROW EXECUTE FUNCTION public.guard_split_insert();

-- Writers credited at upload become draft publishing splits.
-- Uses their split % when those add to 100, otherwise shares equally.
CREATE OR REPLACE FUNCTION public.splits_from_credits() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_writers jsonb := COALESCE(NEW.credits -> 'writers', '[]'::jsonb);
  v_n int := jsonb_array_length(COALESCE(NEW.credits -> 'writers', '[]'::jsonb));
  v_sum numeric;
  w jsonb;
  i int := 0;
  v_share numeric;
  v_given numeric := 0;
BEGIN
  IF jsonb_typeof(v_writers) <> 'array' OR v_n = 0 THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.track_rights_splits WHERE track_id = NEW.id AND rights_type = 'publishing') THEN
    RETURN NEW;
  END IF;
  SELECT sum(COALESCE(NULLIF(x ->> 'split', '')::numeric, 0)) INTO v_sum FROM jsonb_array_elements(v_writers) x;
  FOR w IN SELECT * FROM jsonb_array_elements(v_writers) LOOP
    i := i + 1;
    IF COALESCE(trim(w ->> 'name'), '') = '' THEN CONTINUE; END IF;
    v_share := CASE WHEN v_sum = 100 THEN (w ->> 'split')::numeric
                    WHEN i = v_n THEN 100 - v_given
                    ELSE round(100.0 / v_n, 2) END;
    v_given := v_given + v_share;
    INSERT INTO public.track_rights_splits (track_id, rights_type, holder_name, holder_email, split_percentage, role, status)
    VALUES (NEW.id, 'publishing', left(trim(w ->> 'name'), 200), NULLIF(lower(trim(w ->> 'email')), ''),
            v_share, COALESCE(w ->> 'role', 'writer'), 'draft');
  END LOOP;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_splits_from_credits ON public.tracks;
CREATE TRIGGER trg_splits_from_credits AFTER INSERT ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION public.splits_from_credits();

-- Split health for every track the caller owns (one round trip).
CREATE OR REPLACE FUNCTION public.split_overview()
RETURNS TABLE (track_id uuid, rights_type text, total numeric, holders int, confirmed int, disputed int)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT s.track_id, s.rights_type, sum(s.split_percentage), count(*)::int,
         count(*) FILTER (WHERE s.status = 'confirmed')::int,
         count(*) FILTER (WHERE s.status = 'disputed')::int
  FROM public.track_rights_splits s
  JOIN public.tracks t ON t.id = s.track_id
  WHERE t.user_id = auth.uid()
  GROUP BY s.track_id, s.rights_type;
$$;
GRANT EXECUTE ON FUNCTION public.split_overview() TO authenticated;

-- Copy one track's splits to other tracks the caller owns (e.g. a whole album).
CREATE OR REPLACE FUNCTION public.copy_splits(p_from uuid, p_to uuid[])
RETURNS int
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE n int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tracks WHERE id = p_from AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not your track' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.track_rights_splits s
  USING public.tracks t
  WHERE s.track_id = t.id AND t.id = ANY (p_to) AND t.id <> p_from AND t.user_id = auth.uid();
  INSERT INTO public.track_rights_splits (track_id, rights_type, holder_name, holder_email, split_percentage,
                                          pro_affiliation, ipi_number, role)
  SELECT t.id, s.rights_type, s.holder_name, s.holder_email, s.split_percentage, s.pro_affiliation, s.ipi_number, s.role
  FROM public.track_rights_splits s
  CROSS JOIN public.tracks t
  WHERE s.track_id = p_from AND t.id = ANY (p_to) AND t.id <> p_from AND t.user_id = auth.uid();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
GRANT EXECUTE ON FUNCTION public.copy_splits(uuid, uuid[]) TO authenticated;

-- What a collaborator sees from their emailed link.
CREATE OR REPLACE FUNCTION public.get_split_by_token(p_token uuid)
RETURNS TABLE (holder_name text, rights_type text, split_percentage numeric, role text, status text,
               track_title text, artist_name text, others jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.holder_name, s.rights_type, s.split_percentage, s.role, s.status, t.title, t.artist_name,
         (SELECT jsonb_agg(jsonb_build_object('name', o.holder_name, 'share', o.split_percentage, 'role', o.role)
                           ORDER BY o.split_percentage DESC)
          FROM public.track_rights_splits o
          WHERE o.track_id = s.track_id AND o.rights_type = s.rights_type)
  FROM public.track_rights_splits s
  JOIN public.tracks t ON t.id = s.track_id
  WHERE s.token = p_token;
$$;
GRANT EXECUTE ON FUNCTION public.get_split_by_token(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.respond_to_split(p_token uuid, p_confirm boolean, p_note text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_status text; v_uid uuid := auth.uid();
BEGIN
  SELECT id, status INTO v_id, v_status FROM public.track_rights_splits WHERE token = p_token FOR UPDATE;
  IF v_id IS NULL THEN RAISE EXCEPTION 'This link is no longer valid. Ask for a new one.' USING ERRCODE = 'P0002'; END IF;
  IF v_status NOT IN ('sent', 'draft') THEN RETURN v_status; END IF;
  -- Tell the guard trigger this change comes from the collaborator's link.
  PERFORM set_config('tdz.split_response', 'on', true);
  UPDATE public.track_rights_splits
  SET status = CASE WHEN p_confirm THEN 'confirmed' ELSE 'disputed' END,
      is_verified = p_confirm,
      dispute_note = CASE WHEN p_confirm THEN NULL ELSE left(p_note, 1000) END,
      responded_at = now(),
      holder_user_id = COALESCE(holder_user_id, v_uid)
  WHERE id = v_id;
  PERFORM set_config('tdz.split_response', '', true);
  RETURN CASE WHEN p_confirm THEN 'confirmed' ELSE 'disputed' END;
END $$;
GRANT EXECUTE ON FUNCTION public.respond_to_split(uuid, boolean, text) TO anon, authenticated;