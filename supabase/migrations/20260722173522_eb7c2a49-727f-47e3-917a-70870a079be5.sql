
-- Payout status state machine: prevent webhook retries from regressing state.
-- Allowed transitions:
--   pending    -> processing, completed, failed
--   processing -> completed, failed
--   completed  -> reversed          (chargeback / manual reverse only)
--   failed     -> pending, processing  (retry path)
--   reversed   -> (terminal)
-- Any other transition is blocked. Same-state updates are always allowed.

CREATE OR REPLACE FUNCTION public.enforce_payout_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  allowed boolean := false;
BEGIN
  IF NEW.status IS NULL THEN
    RAISE EXCEPTION 'artist_payouts.status cannot be null';
  END IF;

  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  allowed := CASE OLD.status
    WHEN 'pending'    THEN NEW.status IN ('processing', 'completed', 'failed')
    WHEN 'processing' THEN NEW.status IN ('completed', 'failed')
    WHEN 'completed'  THEN NEW.status IN ('reversed')
    WHEN 'failed'     THEN NEW.status IN ('pending', 'processing')
    WHEN 'reversed'   THEN false
    ELSE false
  END;

  IF NOT allowed THEN
    RAISE EXCEPTION 'Illegal payout status transition: % -> % (payout %)',
      OLD.status, NEW.status, OLD.id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_payout_status_transition ON public.artist_payouts;
CREATE TRIGGER trg_enforce_payout_status_transition
BEFORE UPDATE OF status ON public.artist_payouts
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.enforce_payout_status_transition();

-- Constrain the allowed values so unknown states can never enter the table.
ALTER TABLE public.artist_payouts
  DROP CONSTRAINT IF EXISTS artist_payouts_status_check;
ALTER TABLE public.artist_payouts
  ADD CONSTRAINT artist_payouts_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'reversed'));
