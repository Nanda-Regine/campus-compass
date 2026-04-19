-- =============================================
-- VarsityOS — Add subscription_tier to profiles
-- Run in Supabase SQL editor
-- Date: 2026-04-19
-- =============================================
-- The PayFast ITN webhook writes to subscription_tier on every payment.
-- Without this column the upgrade silently fails (Supabase returns an error
-- that is logged but the user stays on free tier forever).
-- =============================================

-- 1. Add column (idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free';

-- 2. Check constraint — only valid tier values accepted
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_tier_check
    CHECK (subscription_tier IN ('free', 'scholar', 'premium', 'nova_unlimited'));

-- 3. Backfill existing rows that are on a paid plan (plan column already exists)
UPDATE public.profiles
SET subscription_tier = plan
WHERE plan IN ('scholar', 'premium', 'nova_unlimited')
  AND subscription_tier = 'free';

-- 4. Verify
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'profiles'
  AND column_name  IN ('plan', 'subscription_tier', 'is_premium', 'nova_messages_limit')
ORDER BY column_name;
