-- ─── Pricing v2: Remove 'premium' tier, update message limits ────────────────
--
-- New model:
--   Free          — R0,   20 Nova msgs/month
--   Nova Scholar  — R29,  150 Nova msgs/month
--   Nova Unlimited — R89, unlimited (internal cap 1000)
--
-- Run this in the Supabase SQL editor (NOT via MCP — this project uses a
-- different Supabase account from the MCP-connected one).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Migrate existing 'premium' subscribers to 'nova_unlimited'
--    (they're getting a better product for cheaper — a good-will upgrade)
UPDATE profiles
SET
  subscription_tier     = 'nova_unlimited',
  plan                  = 'nova_unlimited',
  nova_messages_limit   = 9999
WHERE subscription_tier = 'premium';

UPDATE subscriptions
SET plan = 'nova_unlimited'
WHERE plan = 'premium';

-- 2. Bump existing Scholar subscribers from 100 → 150 messages
UPDATE profiles
SET nova_messages_limit = 150
WHERE subscription_tier = 'scholar'
  AND nova_messages_limit = 100;

-- 3. Bump free-tier users from 15 → 20 messages
UPDATE profiles
SET nova_messages_limit = 20
WHERE (subscription_tier IS NULL OR subscription_tier = 'free')
  AND nova_messages_limit = 15;

-- 4. Update the subscription_tier CHECK constraint to remove 'premium'
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'scholar', 'nova_unlimited'));

-- 5. Confirm counts (informational — remove before running if preferred)
-- SELECT subscription_tier, COUNT(*) FROM profiles GROUP BY subscription_tier;
