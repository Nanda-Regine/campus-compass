-- Add PayFast subscription management columns to subscriptions table
-- Required for: notify/route.ts token storage, subscription status lifecycle

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS status           TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS payfast_subscription_token TEXT,
  ADD COLUMN IF NOT EXISTS payfast_payment_id          TEXT,
  ADD COLUMN IF NOT EXISTS amount           NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS billing_date     DATE,
  ADD COLUMN IF NOT EXISTS next_billing_date DATE,
  ADD COLUMN IF NOT EXISTS cancelled_at     TIMESTAMPTZ;

-- Index for token lookups (cancellation management)
CREATE INDEX IF NOT EXISTS idx_subscriptions_payfast_token
  ON subscriptions (payfast_subscription_token)
  WHERE payfast_subscription_token IS NOT NULL;
