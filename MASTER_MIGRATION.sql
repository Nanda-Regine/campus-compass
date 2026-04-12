-- ============================================================
-- VarsityOS — MASTER MIGRATION (Run this in Supabase SQL Editor)
-- Safe to re-run: all statements are idempotent.
-- Fixes: PayFast 500, missing tables for Work/Groups/Insights,
--        savings goals, streaks, mood checkins, referrals, push subs
-- Date: 2026-04-12
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES — fix subscription_tier constraint + missing columns
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS referral_credits INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE DEFAULT LOWER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
  ADD COLUMN IF NOT EXISTS ai_language TEXT,
  ADD COLUMN IF NOT EXISTS nova_messages_limit INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS nova_messages_reset_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

-- Drop old constraint (had fewer valid values)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

-- Re-add with all valid tiers
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_tier_check
    CHECK (subscription_tier IN ('free', 'scholar', 'premium', 'nova_unlimited'));

-- Backfill subscription_tier
UPDATE public.profiles
  SET subscription_tier = CASE
    WHEN is_premium = TRUE THEN 'premium'
    ELSE 'free'
  END
WHERE subscription_tier IS NULL OR subscription_tier = '';

-- Backfill referral codes
UPDATE public.profiles
  SET referral_code = LOWER(SUBSTRING(MD5(id::TEXT) FROM 1 FOR 8))
  WHERE referral_code IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);

-- ─────────────────────────────────────────────────────────────
-- 2. EXAMS — add start_time column
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS start_time TEXT;

-- ─────────────────────────────────────────────────────────────
-- 3. PAYMENT LOGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payfast_payment_id  TEXT,
  amount              NUMERIC(10,2),
  status              TEXT,
  item_name           TEXT,
  raw_data            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_only" ON public.payment_logs;
CREATE POLICY "service_only" ON public.payment_logs FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_payment_logs_user ON public.payment_logs(user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 4. NOVA INSIGHTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nova_insights (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  content      TEXT NOT NULL,
  dismissed    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.nova_insights ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_rows" ON public.nova_insights FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_nova_insights_user ON public.nova_insights(user_id, dismissed, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 5. PUSH SUBSCRIPTIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_rows" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id);

-- ─────────────────────────────────────────────────────────────
-- 6. PART TIME JOBS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.part_time_jobs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employer_name  TEXT NOT NULL,
  job_title      TEXT,
  job_type       TEXT NOT NULL DEFAULT 'part_time'
                   CHECK (job_type IN ('part_time','casual','freelance','internship','contract')),
  pay_rate       NUMERIC(8,2),
  pay_type       TEXT NOT NULL DEFAULT 'hourly'
                   CHECK (pay_type IN ('hourly','shift','monthly')),
  hours_per_week NUMERIC(4,1),
  start_date     DATE,
  end_date       DATE,
  notes          TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  contact_name   TEXT,
  contact_email  TEXT,
  contact_phone  TEXT,
  location       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.part_time_jobs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_rows" ON public.part_time_jobs FOR ALL USING (auth.uid() = student_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_jobs_student ON public.part_time_jobs(student_id, is_active);

-- ─────────────────────────────────────────────────────────────
-- 7. WORK SHIFTS — add missing columns
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.work_shifts
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.part_time_jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  ADD COLUMN IF NOT EXISTS earnings NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS duration_hours NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS has_study_conflict BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS conflict_type TEXT,
  ADD COLUMN IF NOT EXISTS conflict_detail TEXT;

-- Make employer_name nullable
ALTER TABLE public.work_shifts ALTER COLUMN employer_name DROP NOT NULL;

-- Backfill student_id
UPDATE public.work_shifts SET student_id = user_id WHERE student_id IS NULL AND user_id IS NOT NULL;

-- Update RLS
DROP POLICY IF EXISTS "own_rows" ON public.work_shifts;
DO $$ BEGIN
  CREATE POLICY "own_rows" ON public.work_shifts
    FOR ALL USING (auth.uid() = user_id OR auth.uid() = student_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_shifts_student ON public.work_shifts(student_id, shift_date);

-- ─────────────────────────────────────────────────────────────
-- 8. GROUP ASSIGNMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.group_assignments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  subject     TEXT,
  description TEXT,
  due_date    DATE,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.group_assignments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "creator_all" ON public.group_assignments
    FOR ALL USING (auth.uid() = created_by);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_assignments_creator ON public.group_assignments(created_by, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 9. GROUP MEMBERS — add assignment-based columns
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.group_assignments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'joined'
    CHECK (status IN ('pending','joined','declined'));

-- Make group_id nullable if it exists and is NOT NULL
DO $$
BEGIN
  ALTER TABLE public.group_members ALTER COLUMN group_id DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_gm_assignment ON public.group_members(assignment_id, user_id);

-- member_select on group_assignments (added after assignment_id column exists)
DO $$ BEGIN
  CREATE POLICY "member_select" ON public.group_assignments
    FOR SELECT USING (
      id IN (
        SELECT assignment_id FROM public.group_members
        WHERE user_id = auth.uid() AND assignment_id IS NOT NULL
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 10. GROUP TASKS — add assignment-based columns
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.group_tasks
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.group_assignments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS done BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS assigned_to_email TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

DO $$
BEGIN
  ALTER TABLE public.group_tasks ALTER COLUMN group_id DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DROP POLICY IF EXISTS "member_all" ON public.group_tasks;
DO $$ BEGIN
  CREATE POLICY "member_all" ON public.group_tasks FOR ALL USING (
    (group_id IS NOT NULL AND group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    ))
    OR
    (assignment_id IS NOT NULL AND assignment_id IN (
      SELECT assignment_id FROM public.group_members
      WHERE user_id = auth.uid() AND assignment_id IS NOT NULL
    ))
    OR created_by = auth.uid()
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_gt_assignment ON public.group_tasks(assignment_id);

-- ─────────────────────────────────────────────────────────────
-- 11. GROUP INVITES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.group_invites (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.group_assignments(id) ON DELETE CASCADE,
  token         TEXT NOT NULL UNIQUE DEFAULT LOWER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12)),
  email         TEXT,
  created_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "creator_all" ON public.group_invites
    FOR ALL USING (auth.uid() = created_by);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "token_lookup" ON public.group_invites FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- accept_group_invite RPC
CREATE OR REPLACE FUNCTION public.accept_group_invite(
  p_token   TEXT,
  p_user_id UUID,
  p_email   TEXT,
  p_name    TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_invite     RECORD;
  v_assignment RECORD;
BEGIN
  SELECT * INTO v_invite FROM public.group_invites WHERE token = p_token LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invite not found');
  END IF;
  IF v_invite.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Invite already used');
  END IF;
  IF v_invite.expires_at < NOW() THEN
    RETURN jsonb_build_object('error', 'Invite has expired');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE assignment_id = v_invite.assignment_id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('error', 'You are already a member of this group');
  END IF;

  SELECT * INTO v_assignment FROM public.group_assignments WHERE id = v_invite.assignment_id;

  INSERT INTO public.group_members (assignment_id, user_id, email, display_name, role, status)
  VALUES (v_invite.assignment_id, p_user_id, p_email, p_name, 'member', 'joined');

  UPDATE public.group_invites SET accepted_at = NOW() WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', v_invite.assignment_id,
    'assignment_title', v_assignment.title
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 12. STREAKS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.streaks (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity  DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_rows" ON public.streaks FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 13. SAVINGS GOALS + CONTRIBUTIONS (used by /streak + /budget)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  target_amount  NUMERIC(10,2) NOT NULL,
  current_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  emoji          TEXT DEFAULT '🎯',
  colour         TEXT DEFAULT '#0d9488',
  deadline       DATE,
  completed      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_rows" ON public.savings_goals FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON public.savings_goals(user_id);

CREATE TABLE IF NOT EXISTS public.savings_contributions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id    UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount     NUMERIC(10,2) NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_rows" ON public.savings_contributions FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_savings_contrib_goal ON public.savings_contributions(goal_id);

-- ─────────────────────────────────────────────────────────────
-- 14. MOOD CHECKINS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mood_checkins (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood_score INTEGER NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.mood_checkins ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_rows" ON public.mood_checkins FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_mood_checkins_user ON public.mood_checkins(user_id, date DESC);

-- ─────────────────────────────────────────────────────────────
-- 15. REFERRALS + RPC
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_rows" ON public.referrals FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);

CREATE OR REPLACE FUNCTION public.apply_referral(
  p_referred_id   UUID,
  p_referral_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  SELECT id INTO v_referrer_id FROM public.profiles
  WHERE referral_code = p_referral_code LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid referral code');
  END IF;

  IF v_referrer_id = p_referred_id THEN
    RETURN jsonb_build_object('error', 'Cannot use your own referral code');
  END IF;

  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = p_referred_id) THEN
    RETURN jsonb_build_object('error', 'You have already used a referral code');
  END IF;

  INSERT INTO public.referrals (referrer_id, referred_id)
  VALUES (v_referrer_id, p_referred_id)
  ON CONFLICT (referred_id) DO NOTHING;

  UPDATE public.profiles
    SET nova_messages_used = GREATEST(0, COALESCE(nova_messages_used, 0) - 10)
    WHERE id = p_referred_id;

  UPDATE public.profiles
    SET referral_credits = COALESCE(referral_credits, 0) + 5
    WHERE id = v_referrer_id;

  RETURN jsonb_build_object('success', true, 'referrer_bonus', 5, 'referred_bonus', 10);
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 16. TIMETABLE SLOTS — text alias for day_of_week
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.timetable_slots
  ADD COLUMN IF NOT EXISTS day_of_week_text TEXT;

UPDATE public.timetable_slots
  SET day_of_week_text = (ARRAY['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'])[day_of_week + 1]
  WHERE day_of_week_text IS NULL AND day_of_week IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 17. GROCERIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grocery_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  quantity       INTEGER NOT NULL DEFAULT 1,
  unit           TEXT,
  category       TEXT,
  estimated_cost NUMERIC(6,2),
  is_purchased   BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_rows" ON public.grocery_items FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 18. NOVA AUX TABLES (nova_messages, nova_usage, nova_abuse_flags)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nova_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','assistant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.nova_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_rows" ON public.nova_messages FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.nova_usage (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  count      INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, month_year)
);
ALTER TABLE public.nova_usage ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_rows" ON public.nova_usage FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.nova_abuse_flags (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason     TEXT NOT NULL,
  flagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.nova_abuse_flags ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_rows" ON public.nova_abuse_flags FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 19. APP FEEDBACK
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_feedback (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  category   TEXT,
  message    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;
-- Users can insert their own feedback; admins read via service role
DO $$ BEGIN
  CREATE POLICY "insert_own" ON public.app_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "select_own" ON public.app_feedback FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.app_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON public.app_feedback(rating, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 20. POPIA CONSENT — add to profiles + index
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS popia_consent    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS popia_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';  -- safe if already added

-- Re-apply constraint idempotently
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_tier_check
    CHECK (subscription_tier IN ('free','scholar','premium','nova_unlimited'));

CREATE INDEX IF NOT EXISTS idx_profiles_popia ON public.profiles(popia_consent) WHERE popia_consent = false;

-- ─────────────────────────────────────────────────────────────
-- 21. DASHBOARD SUMMARY VIEW
-- Aggregates per-user KPIs for the dashboard server component.
-- Uses SECURITY INVOKER so RLS on base tables is honoured.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.dashboard_summary
WITH (security_invoker = true)
AS
SELECT
  p.id                                                      AS user_id,
  p.full_name,
  p.university,
  p.year_of_study,
  p.plan,
  COALESCE(p.subscription_tier, p.plan, 'free')             AS tier,
  p.nova_messages_used,
  p.nova_messages_limit,
  p.streak_count,
  p.last_activity_date,

  -- Budget: current-month net
  COALESCE((
    SELECT SUM(amount) FROM public.income_entries ie
    WHERE ie.user_id = p.id
      AND ie.month_year = TO_CHAR(NOW(), 'YYYY-MM')
  ), 0)                                                      AS income_this_month,
  COALESCE((
    SELECT SUM(amount) FROM public.expenses ex
    WHERE ex.user_id = p.id
      AND ex.month_year = TO_CHAR(NOW(), 'YYYY-MM')
  ), 0)                                                      AS expenses_this_month,

  -- Tasks
  (SELECT COUNT(*) FROM public.tasks t
   WHERE t.user_id = p.id AND t.status != 'done')           AS open_tasks,
  (SELECT COUNT(*) FROM public.tasks t
   WHERE t.user_id = p.id AND t.status = 'done')            AS done_tasks,
  (SELECT COUNT(*) FROM public.tasks t
   WHERE t.user_id = p.id AND t.status = 'overdue')         AS overdue_tasks,

  -- Upcoming exams (next 30 days)
  (SELECT COUNT(*) FROM public.exams e
   WHERE e.user_id = p.id
     AND e.exam_date BETWEEN NOW() AND NOW() + INTERVAL '30 days') AS upcoming_exams,

  -- Study hours this week
  COALESCE((
    SELECT SUM(duration_minutes) / 60.0
    FROM public.study_sessions ss
    WHERE ss.user_id = p.id
      AND ss.started_at >= date_trunc('week', NOW())
  ), 0)                                                      AS study_hours_this_week,

  -- Savings
  COALESCE((
    SELECT SUM(current_amount) FROM public.savings_goals sg
    WHERE sg.user_id = p.id AND sg.is_completed = false
  ), 0)                                                      AS total_savings,

  -- Notifications unread
  (SELECT COUNT(*) FROM public.notifications n
   WHERE n.user_id = p.id AND n.is_read = false)            AS unread_notifications

FROM public.profiles p;

-- Grant to authenticated users only
GRANT SELECT ON public.dashboard_summary TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────
SELECT 'MASTER_MIGRATION complete ✓' AS result,
  NOW() AS run_at;
