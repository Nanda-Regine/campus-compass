-- =============================================
-- VarsityOS — Nova Unlimited Tier Migration
-- Run this in your Supabase SQL editor
-- Date: 2026-04-10
-- =============================================
-- Extends subscription_tier CHECK constraint to include 'nova_unlimited'.
-- Updates PayFast webhook tier references.
-- =============================================

-- ─────────────────────────────────────────────
-- 1. Drop old CHECK constraint, add updated one
-- ─────────────────────────────────────────────
-- PostgreSQL requires dropping then recreating CHECK constraints
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_tier_check
    CHECK (subscription_tier IN ('free', 'scholar', 'premium', 'nova_unlimited'));

-- ─────────────────────────────────────────────
-- 2. profiles.plan — extend to include nova_unlimited
-- ─────────────────────────────────────────────
-- If plan is an enum type, run this instead:
-- ALTER TYPE plan_enum ADD VALUE IF NOT EXISTS 'nova_unlimited';
-- If it's a TEXT CHECK constraint:
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
    CHECK (plan IN ('free', 'scholar', 'premium', 'nova_unlimited'));

-- ─────────────────────────────────────────────
-- 3. subscriptions.plan — same extension
-- ─────────────────────────────────────────────
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check
    CHECK (plan IN ('free', 'scholar', 'premium', 'nova_unlimited'));

-- ─────────────────────────────────────────────
-- 4. Add name, emoji columns if missing (used in components)
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '🎓';

-- Backfill name from full_name
UPDATE public.profiles
  SET name = full_name
  WHERE name IS NULL AND full_name IS NOT NULL;

-- ─────────────────────────────────────────────
-- 5. Add is_premium computed-style column (boolean shorthand)
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill is_premium based on current tier
UPDATE public.profiles
  SET is_premium = (subscription_tier IN ('premium', 'nova_unlimited'));

-- ─────────────────────────────────────────────
-- 6. Add done_at column to tasks (used in TasksTab)
-- ─────────────────────────────────────────────
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS done_at TIMESTAMPTZ;

-- Backfill done_at for tasks that have a completed status
UPDATE public.tasks
  SET done_at = completed_at
  WHERE done_at IS NULL AND completed_at IS NOT NULL;

-- ─────────────────────────────────────────────
-- 7. Verify
-- ─────────────────────────────────────────────
SELECT
  subscription_tier,
  COUNT(*) AS user_count
FROM public.profiles
GROUP BY subscription_tier
ORDER BY subscription_tier;
