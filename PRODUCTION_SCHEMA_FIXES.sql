-- =============================================
-- VarsityOS — Production Schema Fixes
-- Run ONCE in Supabase SQL editor (idempotent)
-- =============================================

-- ─────────────────────────────────────────────
-- 3a. Atomic Nova usage — replaces race-prone increment function
-- ─────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.increment_nova_usage(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.check_and_increment_nova_usage(
  p_user_id     UUID,
  p_month_year  TEXT,
  p_max_messages INT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INT;
BEGIN
  SELECT message_count INTO current_count
  FROM public.nova_usage
  WHERE user_id = p_user_id AND month_year = p_month_year
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.nova_usage (user_id, month_year, message_count)
    VALUES (p_user_id, p_month_year, 1);
    RETURN TRUE;
  END IF;

  IF current_count >= p_max_messages THEN
    RETURN FALSE;
  END IF;

  UPDATE public.nova_usage
  SET message_count = message_count + 1, updated_at = NOW()
  WHERE user_id = p_user_id AND month_year = p_month_year;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_and_increment_nova_usage TO authenticated;

-- ─────────────────────────────────────────────
-- 3c. Composite index for nova_messages query performance
-- ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_nova_messages_user_created
  ON public.nova_messages(user_id, created_at DESC);

-- ─────────────────────────────────────────────
-- 3d. Constraint on nova_insights.insight_type
-- ─────────────────────────────────────────────

ALTER TABLE public.nova_insights
  DROP CONSTRAINT IF EXISTS nova_insights_type_check;

ALTER TABLE public.nova_insights
  ADD CONSTRAINT nova_insights_type_check
  CHECK (insight_type IN (
    'stress_alert',
    'budget_warning',
    'study_nudge',
    'exam_reminder',
    'budget_80_warning'
  ));

-- ─────────────────────────────────────────────
-- 3e. dashboard_summary view with subscription_tier
-- ─────────────────────────────────────────────

CREATE OR REPLACE VIEW public.dashboard_summary AS
SELECT
  p.id AS user_id,
  p.name,
  p.emoji,
  p.university,
  p.year_of_study,
  p.setup_complete,
  p.is_premium,
  p.subscription_tier,
  b.monthly_budget,
  b.nsfas_enabled,
  b.nsfas_living,
  b.nsfas_accom,
  b.nsfas_books,
  COALESCE((
    SELECT SUM(e.amount)
    FROM public.expenses e
    WHERE e.user_id = p.id
    AND date_trunc('month', e.date::TIMESTAMPTZ) = date_trunc('month', NOW())
  ), 0) AS spent_this_month,
  (SELECT COUNT(*) FROM public.tasks t
   WHERE t.user_id = p.id AND t.done = FALSE
   AND t.due_date IS NOT NULL AND t.due_date >= CURRENT_DATE) AS pending_tasks,
  (SELECT COUNT(*) FROM public.tasks t
   WHERE t.user_id = p.id AND t.done = FALSE
   AND t.due_date IS NOT NULL AND t.due_date < CURRENT_DATE) AS overdue_tasks,
  (SELECT COUNT(*) FROM public.modules m WHERE m.user_id = p.id) AS module_count,
  (SELECT COUNT(*) FROM public.exams ex
   WHERE ex.user_id = p.id AND ex.exam_date >= CURRENT_DATE) AS upcoming_exams,
  (SELECT COUNT(*) FROM public.nova_insights ni
   WHERE ni.user_id = p.id AND ni.dismissed = FALSE) AS active_insights
FROM public.profiles p
LEFT JOIN public.budgets b ON b.user_id = p.id;

GRANT SELECT ON public.dashboard_summary TO authenticated;

-- ─────────────────────────────────────────────
-- 3f. Missing tables
-- ─────────────────────────────────────────────

-- Nova abuse flags (rate-abuse detection)
CREATE TABLE IF NOT EXISTS public.nova_abuse_flags (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  flagged_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_count  INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL DEFAULT 60,
  resolved       BOOLEAN NOT NULL DEFAULT FALSE
);
ALTER TABLE public.nova_abuse_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role abuse flags" ON public.nova_abuse_flags;
CREATE POLICY "Service role abuse flags" ON public.nova_abuse_flags
  FOR ALL USING (auth.role() = 'service_role');
CREATE INDEX IF NOT EXISTS idx_abuse_flags_user
  ON public.nova_abuse_flags(user_id, flagged_at);

-- Push subscriptions (Web Push / VAPID)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Own push subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- POPIA soft-delete column on nova_messages
ALTER TABLE public.nova_messages
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────
-- 3g. Sync subscriptions.plan → profiles.subscription_tier
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET subscription_tier = NEW.plan,
      is_premium        = (NEW.plan IN ('scholar', 'premium')),
      updated_at        = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_tier_on_subscription_update ON public.subscriptions;
CREATE TRIGGER sync_tier_on_subscription_update
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_subscription_tier();

-- ─────────────────────────────────────────────
-- 3h. Merge group + referral tables (IF NOT EXISTS guards)
-- ─────────────────────────────────────────────

-- GROUP ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.group_assignments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  subject      TEXT,
  description  TEXT,
  due_date     DATE,
  status       TEXT NOT NULL DEFAULT 'active',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.group_assignments(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email         TEXT NOT NULL,
  display_name  TEXT,
  role          TEXT NOT NULL DEFAULT 'member',
  status        TEXT NOT NULL DEFAULT 'invited',
  invited_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at     TIMESTAMPTZ,
  UNIQUE(assignment_id, email)
);

CREATE TABLE IF NOT EXISTS public.group_tasks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id     UUID NOT NULL REFERENCES public.group_assignments(id) ON DELETE CASCADE,
  created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to_email TEXT,
  title             TEXT NOT NULL,
  notes             TEXT,
  done              BOOLEAN NOT NULL DEFAULT FALSE,
  done_at           TIMESTAMPTZ,
  due_date          DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_invites (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.group_assignments(id) ON DELETE CASCADE,
  email         TEXT,
  token         TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  accepted_at   TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_assignments_created_by ON public.group_assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_group_members_assignment_id  ON public.group_members(assignment_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id        ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_email          ON public.group_members(email);
CREATE INDEX IF NOT EXISTS idx_group_tasks_assignment_id    ON public.group_tasks(assignment_id);
CREATE INDEX IF NOT EXISTS idx_group_tasks_assigned_to      ON public.group_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_group_invites_token          ON public.group_invites(token);
CREATE INDEX IF NOT EXISTS idx_group_invites_assignment_id  ON public.group_invites(assignment_id);

ALTER TABLE public.group_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites     ENABLE ROW LEVEL SECURITY;

-- REFERRALS
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code    TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 6),
  ADD COLUMN IF NOT EXISTS referral_credits INTEGER NOT NULL DEFAULT 0;

UPDATE public.profiles
  SET referral_code = substr(md5(id::text), 1, 6)
  WHERE referral_code IS NULL;

CREATE TABLE IF NOT EXISTS public.referrals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'credited',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- 8. Cron: Daily exam reminders (07:00 SAST = 05:00 UTC)
-- ─────────────────────────────────────────────

-- Enable pg_cron extension (run as superuser if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Daily exam reminder — creates nova_insights for exams in next 3 days
-- SELECT cron.schedule(
--   'exam-reminders-daily',
--   '0 5 * * *',
--   $$
--     INSERT INTO public.nova_insights (user_id, insight_type, content)
--     SELECT DISTINCT ON (e.user_id)
--       e.user_id,
--       'exam_reminder',
--       format(
--         '%s exam in %s day%s — %s at %s',
--         m.name,
--         (e.exam_date - CURRENT_DATE),
--         CASE WHEN (e.exam_date - CURRENT_DATE) = 1 THEN '' ELSE 's' END,
--         to_char(e.exam_date, 'Day DD Mon'),
--         COALESCE(e.venue, 'venue TBC')
--       )
--     FROM public.exams e
--     LEFT JOIN public.modules m ON m.id = e.module_id
--     WHERE e.exam_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
--       AND NOT EXISTS (
--         SELECT 1 FROM public.nova_insights ni
--         WHERE ni.user_id = e.user_id
--           AND ni.insight_type = 'exam_reminder'
--           AND ni.created_at >= CURRENT_DATE
--       )
--     ORDER BY e.user_id, e.exam_date ASC;
--   $$
-- );

-- Premium expiry check — daily at midnight UTC
-- SELECT cron.schedule(
--   'premium-expiry-check',
--   '0 0 * * *',
--   $$
--     UPDATE public.profiles p
--     SET subscription_tier = 'free',
--         is_premium = false,
--         updated_at = NOW()
--     FROM public.subscriptions s
--     WHERE s.user_id = p.id
--       AND s.status = 'active'
--       AND s.next_billing_date < NOW() - INTERVAL '3 days';

--     UPDATE public.subscriptions
--     SET status = 'expired', updated_at = NOW()
--     WHERE status = 'active'
--       AND next_billing_date < NOW() - INTERVAL '3 days';
--   $$
-- );
