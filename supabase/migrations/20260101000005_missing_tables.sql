-- ============================================================
-- VarsityOS — MISSING TABLES MIGRATION
-- Run this AFTER full-new-schema.sql + MIGRATION_NOVA_UNLIMITED.sql
--   + MIGRATION_PROFILE_COLUMNS.sql
-- Date: 2026-04-10
-- This migration creates all tables referenced by app code
-- that are absent from full-new-schema.sql.
-- ALL statements are idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES — add referral columns
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE DEFAULT LOWER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_credits INTEGER NOT NULL DEFAULT 0;

-- Backfill referral codes for existing users
UPDATE public.profiles
  SET referral_code = LOWER(SUBSTRING(MD5(id::TEXT) FROM 1 FOR 8))
  WHERE referral_code IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. EXAMS — add start_time column (ExamsTab inserts it)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS start_time TEXT;

-- ─────────────────────────────────────────────────────────────
-- 3. NOVA INSIGHTS
--    Used by: /api/insights, /api/budget/alert, /api/study/assist
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
-- 4. PUSH SUBSCRIPTIONS
--    Used by: /api/push/subscribe, /api/push/check-exams, /api/push/notify
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
-- 5. PAYMENT LOGS
--    Used by: /api/payfast/notify (non-fatal logging)
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
-- Service role only — no user-facing RLS needed. Allow service role unrestricted access.
-- Users should never read payment_logs directly.

CREATE INDEX IF NOT EXISTS idx_payment_logs_user ON public.payment_logs(user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 6. SUBSCRIPTIONS (lightweight table — queried by BudgetPage)
--    The primary subscription state lives on profiles.plan.
--    This table is a legacy compatibility shim.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan       TEXT NOT NULL DEFAULT 'free'
               CHECK (plan IN ('free','scholar','premium','nova_unlimited')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_rows" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Backfill subscriptions from profiles
INSERT INTO public.subscriptions (user_id, plan)
SELECT id, plan FROM public.profiles
ON CONFLICT (user_id) DO UPDATE SET plan = EXCLUDED.plan;

-- ─────────────────────────────────────────────────────────────
-- 7. REFERRALS
--    Used by: /api/referral (GET/POST + apply_referral RPC)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (referred_id)  -- a user can only be referred once
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_rows" ON public.referrals FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);

-- apply_referral RPC — called by /api/referral POST
CREATE OR REPLACE FUNCTION public.apply_referral(
  p_referred_id   UUID,
  p_referral_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id UUID;
  referrer_bonus INTEGER := 5;
  referred_bonus INTEGER := 10;
BEGIN
  -- Find referrer by code
  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = p_referral_code
  LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid referral code');
  END IF;

  IF v_referrer_id = p_referred_id THEN
    RETURN jsonb_build_object('error', 'Cannot use your own referral code');
  END IF;

  -- Check if already referred
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = p_referred_id) THEN
    RETURN jsonb_build_object('error', 'You have already used a referral code');
  END IF;

  -- Record referral
  INSERT INTO public.referrals (referrer_id, referred_id)
  VALUES (v_referrer_id, p_referred_id)
  ON CONFLICT (referred_id) DO NOTHING;

  -- Give bonuses
  UPDATE public.profiles
    SET nova_messages_used = GREATEST(0, nova_messages_used - referred_bonus)
    WHERE id = p_referred_id;

  UPDATE public.profiles
    SET referral_credits = referral_credits + referrer_bonus
    WHERE id = v_referrer_id;

  RETURN jsonb_build_object(
    'success', true,
    'referrer_bonus', referrer_bonus,
    'referred_bonus', referred_bonus
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 8. STREAKS (referenced in account/delete but no route exists yet)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.streaks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak  INTEGER NOT NULL DEFAULT 0,
  longest_streak  INTEGER NOT NULL DEFAULT 0,
  last_activity   DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_rows" ON public.streaks FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 9. PART TIME JOBS
--    Used by: /api/work/jobs (full CRUD), /api/work/shifts (JOIN)
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
-- 10. WORK SHIFTS — add missing columns
--     The base table (user_id, employer_name, shift_date, start_time,
--     end_time, hourly_rate, total_earned, notes, conflicts_with_class)
--     already exists from full-new-schema.sql.
--     App code additionally needs: student_id, job_id, status,
--     earnings, duration_hours, has_study_conflict, conflict_type,
--     conflict_detail.
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

-- Make employer_name nullable (app derives it from job_id join)
ALTER TABLE public.work_shifts ALTER COLUMN employer_name DROP NOT NULL;

-- Backfill student_id from user_id for any existing rows
UPDATE public.work_shifts SET student_id = user_id WHERE student_id IS NULL;

-- Update RLS: allow access by either user_id or student_id
DROP POLICY IF EXISTS "own_rows" ON public.work_shifts;
CREATE POLICY "own_rows" ON public.work_shifts
  FOR ALL USING (auth.uid() = user_id OR auth.uid() = student_id);

CREATE INDEX IF NOT EXISTS idx_shifts_student ON public.work_shifts(student_id, shift_date);

-- ─────────────────────────────────────────────────────────────
-- 11. GROUP ASSIGNMENTS
--     Used by: /api/groups/assignments, /api/groups/invite, /api/groups/tasks
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
-- 12. GROUP MEMBERS — add missing columns for assignment-based groups
--     Existing columns: id, group_id, user_id, role, joined_at
--     App needs: assignment_id, email, display_name, status
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.group_assignments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'joined'
    CHECK (status IN ('pending','joined','declined'));

-- Make group_id nullable (assignment-based members don't have a group_id)
ALTER TABLE public.group_members ALTER COLUMN group_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gm_assignment ON public.group_members(assignment_id, user_id);

-- member_select on group_assignments — added HERE (after assignment_id column exists)
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
-- 13. GROUP TASKS — add missing columns for assignment-based tasks
--     Existing columns: id, group_id, created_by, assigned_to,
--       title, description, due_date, priority, status
--     App needs: assignment_id, done (boolean), assigned_to_email, notes
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.group_tasks
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.group_assignments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS done BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS assigned_to_email TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Make group_id nullable (assignment tasks use assignment_id)
ALTER TABLE public.group_tasks ALTER COLUMN group_id DROP NOT NULL;

-- Update RLS to also allow assignment-based access
DROP POLICY IF EXISTS "member_all" ON public.group_tasks;
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

CREATE INDEX IF NOT EXISTS idx_gt_assignment ON public.group_tasks(assignment_id);

-- ─────────────────────────────────────────────────────────────
-- 14. GROUP INVITES
--     Used by: /api/groups/invite (POST/GET/PATCH)
--     Uses accept_group_invite RPC
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
  -- Service role can always read (used for token lookups)
  CREATE POLICY "token_lookup" ON public.group_invites
    FOR SELECT USING (true);
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
  v_invite       RECORD;
  v_assignment   RECORD;
BEGIN
  SELECT * INTO v_invite FROM public.group_invites
  WHERE token = p_token LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invite not found');
  END IF;
  IF v_invite.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Invite already used');
  END IF;
  IF v_invite.expires_at < NOW() THEN
    RETURN jsonb_build_object('error', 'Invite has expired');
  END IF;

  -- Check not already a member
  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE assignment_id = v_invite.assignment_id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('error', 'You are already a member of this group');
  END IF;

  SELECT * INTO v_assignment FROM public.group_assignments
  WHERE id = v_invite.assignment_id;

  -- Add member
  INSERT INTO public.group_members (assignment_id, user_id, email, display_name, role, status)
  VALUES (v_invite.assignment_id, p_user_id, p_email, p_name, 'member', 'joined');

  -- Mark invite as used
  UPDATE public.group_invites SET accepted_at = NOW() WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', v_invite.assignment_id,
    'assignment_title', v_assignment.title
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 15. GROCERY ITEMS (referenced in account/delete)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grocery_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  unit        TEXT,
  category    TEXT,
  estimated_cost NUMERIC(6,2),
  is_purchased BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own_rows" ON public.grocery_items FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 16. NOVA MESSAGES, NOVA USAGE, NOVA ABUSE FLAGS
--     Referenced in account/delete — nova stores messages in
--     nova_conversations.messages JSONB (which already exists),
--     but account delete expects separate tables. Create stubs.
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
-- 17. TIMETABLE SLOTS — fix day_of_week type mismatch
--     Schema has day_of_week INTEGER (0-6)
--     App uses TEXT ('Monday', 'Tuesday' ...) in conflictDetector
--     Add a text alias column for compatibility
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.timetable_slots
  ADD COLUMN IF NOT EXISTS day_of_week_text TEXT;

-- Backfill existing rows
UPDATE public.timetable_slots
  SET day_of_week_text = (ARRAY['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'])[day_of_week + 1]
  WHERE day_of_week_text IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 18. MOOD CHECKINS
--     Used by: MoodCheckin component (dashboard)
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
-- 19. VERIFY — show table counts
-- ─────────────────────────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  hasindexes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
