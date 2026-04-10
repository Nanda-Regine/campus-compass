-- =============================================
-- VarsityOS — Profiles Extension Migration
-- Run this in your Supabase SQL editor
-- Date: 2026-04-10
-- =============================================
-- The full-new-schema.sql already includes:
--   plan CHECK ('free','scholar','premium','nova_unlimited')
--   recurrence_rule on tasks
-- This migration adds the columns missing from the clean schema
-- that the app code expects.
-- =============================================

-- ─────────────────────────────────────────────
-- 1. Add subscription_tier column to profiles
--    (PayFast webhook writes this on COMPLETE/CANCELLED)
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'scholar', 'premium', 'nova_unlimited'));

-- Backfill from plan
UPDATE public.profiles
  SET subscription_tier = plan
  WHERE subscription_tier = 'free' AND plan != 'free';

-- ─────────────────────────────────────────────
-- 2. Add is_premium boolean shorthand
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;

-- Backfill
UPDATE public.profiles
  SET is_premium = (plan IN ('scholar', 'premium', 'nova_unlimited'));

-- ─────────────────────────────────────────────
-- 3. Add name (display name, mirrors full_name by default)
--    Used in onboarding flow and Nova greeting
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name TEXT;

UPDATE public.profiles
  SET name = full_name
  WHERE name IS NULL AND full_name IS NOT NULL;

-- ─────────────────────────────────────────────
-- 4. Add emoji (avatar emoji chosen at onboarding)
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '🎓';

-- ─────────────────────────────────────────────
-- 5. Create budgets table (used by BudgetClient and 8 API routes)
--    This is separate from wallet_config which tracks income sources.
--    budgets stores monthly budget targets and NSFAS allocations.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.budgets (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  monthly_budget NUMERIC(10,2) NOT NULL DEFAULT 0,
  food_budget    NUMERIC(10,2) NOT NULL DEFAULT 0,
  nsfas_enabled  BOOLEAN NOT NULL DEFAULT false,
  nsfas_living   NUMERIC(10,2) NOT NULL DEFAULT 0,
  nsfas_accom    NUMERIC(10,2) NOT NULL DEFAULT 0,
  nsfas_books    NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_rows" ON public.budgets FOR ALL USING (auth.uid() = user_id);

-- Backfill: create a budget row for every existing profile
INSERT INTO public.budgets (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 6. Verify results
-- ─────────────────────────────────────────────
SELECT
  plan,
  subscription_tier,
  COUNT(*) AS user_count
FROM public.profiles
GROUP BY plan, subscription_tier
ORDER BY plan;
