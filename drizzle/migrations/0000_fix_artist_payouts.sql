ALTER TABLE public.artist_payouts
  ADD CONSTRAINT artist_payouts_amount_positive CHECK (amount > 0);

CREATE INDEX IF NOT EXISTS idx_artist_payouts_artist_status ON public.artist_payouts (artist_id, status);
CREATE INDEX IF NOT EXISTS idx_artist_earnings_artist_status ON public.artist_earnings (artist_id, payout_status);

-- Prevent the same earnings row from sitting in two active payouts
CREATE OR REPLACE FUNCTION public.prevent_double_payout_earnings()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.earnings_ids IS NOT NULL AND NEW.status IN ('pending','processing','completed') THEN
    IF EXISTS (
      SELECT 1 FROM public.artist_payouts p
      WHERE p.id <> NEW.id
        AND p.status IN ('pending','processing','completed')
        AND p.earnings_ids && NEW.earnings_ids
    ) THEN
      RAISE EXCEPTION 'One or more earnings rows are already in another active payout'
        USING ERRCODE = 'unique_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_double_payout_earnings
BEFORE INSERT OR UPDATE OF earnings_ids, status ON public.artist_payouts
FOR EACH ROW EXECUTE FUNCTION public.prevent_double_payout_earnings();

-- Keep earnings payout_status in sync with the payout lifecycle
CREATE OR REPLACE FUNCTION public.sync_earnings_on_payout_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.earnings_ids IS NULL OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status = 'completed' THEN
    UPDATE public.artist_earnings SET payout_status = 'paid', payout_date = COALESCE(NEW.completed_at, now())
    WHERE id = ANY(NEW.earnings_ids);
  ELSIF NEW.status IN ('failed','reversed') THEN
    UPDATE public.artist_earnings SET payout_status = 'pending', payout_date = NULL
    WHERE id = ANY(NEW.earnings_ids);
  ELSIF NEW.status = 'processing' THEN
    UPDATE public.artist_earnings SET payout_status = 'processing'
    WHERE id = ANY(NEW.earnings_ids) AND payout_status <> 'paid';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_earnings_on_payout_status
AFTER UPDATE OF status ON public.artist_payouts
FOR EACH ROW EXECUTE FUNCTION public.sync_earnings_on_payout_status();