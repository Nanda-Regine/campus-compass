-- ============================================================
-- Fix: add nova_unlimited to subscription_tier CHECK constraint
-- Also adds subscription_tier column to profiles if missing
-- Safe to re-run
-- ============================================================

-- 1. Add subscription_tier column if it doesn't exist yet
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- 2. Drop old constraint (may have been created with fewer values)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

-- 3. Re-add constraint with all valid tiers
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_tier_check
    CHECK (subscription_tier IN ('free', 'scholar', 'premium', 'nova_unlimited'));

-- 4. Add other missing profile columns (safe, idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_credits INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_language TEXT,
  ADD COLUMN IF NOT EXISTS nova_messages_limit INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

-- 5. Backfill subscription_tier from is_premium where not set
UPDATE public.profiles
  SET subscription_tier = CASE
    WHEN is_premium = TRUE THEN 'premium'
    ELSE 'free'
  END
WHERE subscription_tier IS NULL OR subscription_tier = '';

-- 6. Create payment_logs table if missing (needed by PayFast notify route)
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payfast_payment_id TEXT,
  amount            NUMERIC(10,2),
  status            TEXT,
  item_name         TEXT,
  raw_data          JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_only" ON public.payment_logs;
CREATE POLICY "service_only" ON public.payment_logs
  FOR ALL USING (false); -- only accessible via service role

CREATE INDEX IF NOT EXISTS idx_payment_logs_user ON public.payment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);

SELECT 'subscription_tier fix complete ✓' AS result;
