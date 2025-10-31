-- Atomic credit deduction function
CREATE OR REPLACE FUNCTION public.deduct_render_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reference_id UUID,
  p_reference_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get or create user credits record
  INSERT INTO public.render_credits (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock the row and get current balance
  SELECT balance INTO v_current_balance
  FROM public.render_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient credits: have %, need %', v_current_balance, p_amount;
  END IF;

  -- Deduct credits
  v_new_balance := v_current_balance - p_amount;

  UPDATE public.render_credits
  SET 
    balance = v_new_balance,
    total_spent = total_spent + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    reference_id,
    reference_type,
    status
  ) VALUES (
    p_user_id,
    -p_amount,
    'render',
    p_reference_id,
    p_reference_type,
    'completed'
  );

  RETURN v_new_balance;
END;
$$;