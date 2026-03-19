-- =============================================
-- Campus Compass — Referral Credit System
-- Run this in your Supabase SQL editor
-- =============================================

-- Add referral_code and referral_credits to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 6),
  ADD COLUMN IF NOT EXISTS referral_credits INTEGER NOT NULL DEFAULT 0;

-- Ensure every existing profile has a unique referral code
UPDATE public.profiles SET referral_code = substr(md5(id::text), 1, 6) WHERE referral_code IS NULL;

-- ─────────────────────────────────────────────
-- REFERRALS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE public.referrals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'credited', -- credited | reversed
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referred_id) -- each person can only be referred once
);

CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON public.referrals(referred_id);

-- RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own referrals (as referrer)" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Service role referrals" ON public.referrals
  FOR ALL USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────
-- APPLY REFERRAL FUNCTION
-- Called when a new user applies a referral code
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.apply_referral(
  p_referred_id  UUID,
  p_referral_code TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_referrer_id UUID;
  v_already_used BOOLEAN;
BEGIN
  -- Cannot refer yourself
  SELECT id INTO v_referrer_id FROM public.profiles
  WHERE referral_code = p_referral_code AND id != p_referred_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invalid referral code');
  END IF;

  -- Check if this user was already referred
  SELECT EXISTS(
    SELECT 1 FROM public.referrals WHERE referred_id = p_referred_id
  ) INTO v_already_used;

  IF v_already_used THEN
    RETURN jsonb_build_object('error', 'You have already used a referral code');
  END IF;

  -- Record referral
  INSERT INTO public.referrals (referrer_id, referred_id)
  VALUES (v_referrer_id, p_referred_id);

  -- Give referrer 50 bonus Nova messages
  UPDATE public.profiles
  SET referral_credits = referral_credits + 50
  WHERE id = v_referrer_id;

  -- Give new user 10 bonus Nova messages (on top of their free 10 = 20 total this month)
  UPDATE public.profiles
  SET referral_credits = referral_credits + 10
  WHERE id = p_referred_id;

  RETURN jsonb_build_object(
    'success', true,
    'referrer_bonus', 50,
    'referred_bonus', 10
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.apply_referral TO authenticated;
