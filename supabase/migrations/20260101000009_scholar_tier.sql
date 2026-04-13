-- =============================================
-- VarsityOS — Scholar Tier Migration
-- Run this in your Supabase SQL editor
-- Date: 2026-03-28
-- =============================================
-- Adds subscription_tier, referral_credits, and ai_language to profiles.
-- Updates subscriptions to support 'scholar' plan.
-- Backfills subscription_tier from existing is_premium flag.
-- =============================================

-- ─────────────────────────────────────────────
-- 1. profiles — add missing columns
-- ─────────────────────────────────────────────

-- subscription_tier: the canonical tier column (free | scholar | premium)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT
    CHECK (subscription_tier IN ('free', 'scholar', 'premium'))
    DEFAULT 'free';

-- referral_credits: bonus Nova messages earned from referrals
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_credits INTEGER NOT NULL DEFAULT 0;

-- ai_language: user's preferred response language for Nova
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_language TEXT;

-- ─────────────────────────────────────────────
-- 2. Backfill subscription_tier from is_premium
-- ─────────────────────────────────────────────
-- Users who are already premium get 'premium', everyone else gets 'free'.
-- Scholar tier will be set by the PayFast webhook going forward.
UPDATE public.profiles
  SET subscription_tier = CASE
    WHEN is_premium = TRUE THEN 'premium'
    ELSE 'free'
  END
WHERE subscription_tier IS NULL OR subscription_tier = 'free';

-- ─────────────────────────────────────────────
-- 3. Backfill subscriptions.plan to match tier
-- ─────────────────────────────────────────────
UPDATE public.subscriptions s
  SET plan = p.subscription_tier
  FROM public.profiles p
  WHERE s.user_id = p.id
    AND s.plan = 'free'
    AND p.subscription_tier IN ('scholar', 'premium');

-- ─────────────────────────────────────────────
-- 4. Index for tier lookups
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier
  ON public.profiles(subscription_tier);

-- ─────────────────────────────────────────────
-- 5. Verify
-- ─────────────────────────────────────────────
-- Run this to confirm the columns exist and backfill worked:
SELECT
  subscription_tier,
  COUNT(*) as user_count
FROM public.profiles
GROUP BY subscription_tier
ORDER BY subscription_tier;
