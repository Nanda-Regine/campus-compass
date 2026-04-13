-- ============================================================
-- VarsityOS CLEAN BUILD — April 2026
-- No generated columns. Triggers handle computed fields.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CORE FUNCTIONS (create before tables that reference them)
-- ============================================================

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_income_month_year()
RETURNS TRIGGER AS $$
BEGIN
  NEW.month_year := TO_CHAR(NEW.received_date, 'YYYY-MM');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_expense_month_year()
RETURNS TRIGGER AS $$
BEGIN
  NEW.month_year := TO_CHAR(NEW.expense_date, 'YYYY-MM');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.wallet_config (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_savings_goal_amount()
RETURNS TRIGGER AS $$
DECLARE
  v_total NUMERIC;
  v_target NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM public.savings_contributions WHERE goal_id = NEW.goal_id;

  SELECT target_amount INTO v_target
  FROM public.savings_goals WHERE id = NEW.goal_id;

  UPDATE public.savings_goals SET
    current_amount = v_total,
    is_completed   = (v_total >= v_target),
    completed_at   = CASE WHEN v_total >= v_target AND completed_at IS NULL THEN NOW() ELSE completed_at END,
    updated_at     = NOW()
  WHERE id = NEW.goal_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT,
  full_name             TEXT,
  university            TEXT,
  degree                TEXT,
  year_of_study         INTEGER CHECK (year_of_study BETWEEN 1 AND 7),
  student_number        TEXT,
  avatar_url            TEXT,
  plan                  TEXT NOT NULL DEFAULT 'free'
                          CHECK (plan IN ('free','scholar','premium','nova_unlimited')),
  nova_messages_used    INTEGER NOT NULL DEFAULT 0,
  nova_messages_limit   INTEGER NOT NULL DEFAULT 15,
  streak_count          INTEGER NOT NULL DEFAULT 0,
  last_activity_date    DATE,
  onboarding_complete   BOOLEAN NOT NULL DEFAULT false,
  funding_type          TEXT NOT NULL DEFAULT 'other'
                          CHECK (funding_type IN ('nsfas','bursary','self_funded','family','scholarship','other')),
  phone                 TEXT,
  preferred_language    TEXT NOT NULL DEFAULT 'en',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.wallet_config (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  has_nsfas               BOOLEAN NOT NULL DEFAULT false,
  has_bursary             BOOLEAN NOT NULL DEFAULT false,
  has_pocket_money        BOOLEAN NOT NULL DEFAULT false,
  has_part_time_job       BOOLEAN NOT NULL DEFAULT false,
  has_family_support      BOOLEAN NOT NULL DEFAULT false,
  has_gifts               BOOLEAN NOT NULL DEFAULT false,
  has_side_hustle         BOOLEAN NOT NULL DEFAULT false,
  has_scholarship         BOOLEAN NOT NULL DEFAULT false,
  custom_income_sources   JSONB NOT NULL DEFAULT '[]',
  currency                TEXT NOT NULL DEFAULT 'ZAR',
  monthly_budget_goal     NUMERIC(10,2),
  savings_goal            NUMERIC(10,2),
  savings_goal_name       TEXT,
  savings_goal_deadline   DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.income_entries (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type             TEXT NOT NULL
                            CHECK (source_type IN ('nsfas','bursary','pocket_money','part_time',
                              'family','gift','side_hustle','scholarship','savings_withdrawal','other')),
  label                   TEXT NOT NULL,
  amount                  NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  received_date           DATE NOT NULL,
  month_year              TEXT,
  notes                   TEXT,
  is_recurring            BOOLEAN NOT NULL DEFAULT false,
  recurring_day_of_month  INTEGER CHECK (recurring_day_of_month BETWEEN 1 AND 31),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.expenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category      TEXT NOT NULL
                  CHECK (category IN ('food','transport','accommodation','books','data',
                    'clothing','entertainment','health','toiletries',
                    'stationery','laundry','airtime','savings','other')),
  description   TEXT,
  amount        NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  expense_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  month_year    TEXT,
  receipt_url   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.savings_goals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  target_amount  NUMERIC(10,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline       DATE,
  emoji          TEXT NOT NULL DEFAULT '🎯',
  color          TEXT NOT NULL DEFAULT '#2D4A22',
  is_completed   BOOLEAN NOT NULL DEFAULT false,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.savings_contributions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id           UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  amount            NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.modules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_code   TEXT NOT NULL,
  module_name   TEXT NOT NULL,
  credits       INTEGER NOT NULL DEFAULT 0,
  lecturer_name TEXT,
  venue         TEXT,
  color         TEXT NOT NULL DEFAULT '#2D4A22',
  semester      INTEGER CHECK (semester IN (1, 2)),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.timetable_slots (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id    UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  venue        TEXT,
  slot_type    TEXT NOT NULL DEFAULT 'lecture'
                 CHECK (slot_type IN ('lecture','tutorial','practical','study','work_shift')),
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.groups (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  module_id       UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code     TEXT UNIQUE DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)),
  max_members     INTEGER NOT NULL DEFAULT 10,
  color           TEXT NOT NULL DEFAULT '#C9A84C',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  deadline        DATE,
  assignment_name TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.group_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

CREATE TABLE public.tasks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id           UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  group_id            UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,
  description         TEXT,
  due_date            TIMESTAMPTZ,
  priority            TEXT NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low','medium','high','urgent')),
  status              TEXT NOT NULL DEFAULT 'todo'
                        CHECK (status IN ('todo','in_progress','done','overdue')),
  task_type           TEXT NOT NULL DEFAULT 'assignment'
                        CHECK (task_type IN (
                          'assignment','exam','test','project','presentation',
                          'reading','tutorial','lab','group_project',
                          'reminder','meeting','appointment','chore','errand','admin',
                          'self_care','exercise','social','personal_goal',
                          'work_shift','work_task','payment_due','budget_review','other'
                        )),
  is_group_task       BOOLEAN NOT NULL DEFAULT false,
  estimated_hours     NUMERIC(4,1),
  recurrence_rule     TEXT CHECK (recurrence_rule IN ('none','daily','weekly','monthly','custom')),
  recurrence_end_date DATE,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.group_tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  due_date    TIMESTAMPTZ,
  priority    TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status      TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done','blocked')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.group_messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id     UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  content      TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','file','system')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.exams (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id        UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  exam_name        TEXT NOT NULL,
  exam_date        TIMESTAMPTZ NOT NULL,
  venue            TEXT,
  duration_minutes INTEGER,
  exam_type        TEXT NOT NULL DEFAULT 'final'
                     CHECK (exam_type IN ('test','mid_year','final','supplementary','assignment_deadline')),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.study_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id           UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at            TIMESTAMPTZ,
  duration_minutes    INTEGER,
  technique           TEXT NOT NULL DEFAULT 'pomodoro'
                        CHECK (technique IN ('pomodoro','time_blocking','free_study','group')),
  productivity_rating INTEGER CHECK (productivity_rating BETWEEN 1 AND 5),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.meal_plans (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start_date      DATE NOT NULL,
  plan_data            JSONB NOT NULL DEFAULT '{}',
  total_estimated_cost NUMERIC(10,2),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start_date)
);

CREATE TABLE public.recipes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  ingredients      JSONB NOT NULL DEFAULT '[]',
  instructions     TEXT,
  estimated_cost   NUMERIC(6,2),
  servings         INTEGER NOT NULL DEFAULT 1,
  prep_time_minutes INTEGER,
  dietary_tags     TEXT[] NOT NULL DEFAULT '{}',
  is_ai_generated  BOOLEAN NOT NULL DEFAULT false,
  is_saved         BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.work_shifts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employer_name       TEXT NOT NULL,
  shift_date          DATE NOT NULL,
  start_time          TIME NOT NULL,
  end_time            TIME NOT NULL,
  hourly_rate         NUMERIC(8,2),
  total_earned        NUMERIC(10,2),
  notes               TEXT,
  conflicts_with_class BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.nova_conversations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  messages          JSONB NOT NULL DEFAULT '[]',
  conversation_type TEXT NOT NULL DEFAULT 'general'
                      CHECK (conversation_type IN (
                        'general','mental_health','study_help',
                        'budget_advice','nsfas_help','crisis'
                      )),
  crisis_detected   BOOLEAN NOT NULL DEFAULT false,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.wellbeing_checkins (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood_score   INTEGER NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  sleep_hours  NUMERIC(3,1) CHECK (sleep_hours BETWEEN 0 AND 24),
  notes        TEXT,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, checkin_date)
);

CREATE TABLE public.notifications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  body              TEXT,
  notification_type TEXT NOT NULL DEFAULT 'info'
                      CHECK (notification_type IN (
                        'info','warning','success','deadline','nova','budget','savings'
                      )),
  is_read           BOOLEAN NOT NULL DEFAULT false,
  action_url        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.app_feedback (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  category    TEXT CHECK (category IN (
                'bug','feature_request','general','nova_feedback',
                'budget','study','meals','groups','savings','other'
              )),
  message     TEXT NOT NULL,
  app_version TEXT,
  platform    TEXT,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  admin_notes TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_income_user_month      ON public.income_entries(user_id, month_year);
CREATE INDEX idx_expenses_user_month    ON public.expenses(user_id, month_year);
CREATE INDEX idx_tasks_user_due         ON public.tasks(user_id, due_date) WHERE status != 'done';
CREATE INDEX idx_tasks_user_status      ON public.tasks(user_id, status);
CREATE INDEX idx_exams_user_date        ON public.exams(user_id, exam_date);
CREATE INDEX idx_study_user             ON public.study_sessions(user_id, started_at);
CREATE INDEX idx_gm_user                ON public.group_members(user_id);
CREATE INDEX idx_gm_group               ON public.group_members(group_id);
CREATE INDEX idx_gt_group               ON public.group_tasks(group_id);
CREATE INDEX idx_sc_goal                ON public.savings_contributions(goal_id);
CREATE INDEX idx_nova_user              ON public.nova_conversations(user_id, updated_at DESC);
CREATE INDEX idx_notif_unread           ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_shifts_user_date       ON public.work_shifts(user_id, shift_date);
CREATE INDEX idx_feedback_created       ON public.app_feedback(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_config       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_shifts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nova_conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellbeing_checkins  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_feedback        ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "own_profile_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own_profile_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own_profile_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Simple user-owns-rows tables
CREATE POLICY "own_rows" ON public.wallet_config       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rows" ON public.income_entries      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rows" ON public.expenses            FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rows" ON public.savings_goals       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rows" ON public.savings_contributions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rows" ON public.modules             FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rows" ON public.timetable_slots     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rows" ON public.tasks               FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rows" ON public.exams               FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rows" ON public.study_sessions      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rows" ON public.meal_plans          FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rows" ON public.recipes             FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rows" ON public.work_shifts         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rows" ON public.nova_conversations  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rows" ON public.wellbeing_checkins  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rows" ON public.notifications       FOR ALL USING (auth.uid() = user_id);

-- Groups
CREATE POLICY "creator_all"    ON public.groups FOR ALL    USING (auth.uid() = created_by);
CREATE POLICY "member_select"  ON public.groups FOR SELECT USING (
  id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);
CREATE POLICY "own_membership" ON public.group_members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "peer_select"    ON public.group_members FOR SELECT USING (
  group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);
CREATE POLICY "member_all"     ON public.group_tasks    FOR ALL USING (
  group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);
CREATE POLICY "member_all"     ON public.group_messages FOR ALL USING (
  group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);

-- Feedback (anonymous allowed)
CREATE POLICY "anon_insert" ON public.app_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "own_select"  ON public.app_feedback FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER trg_income_month_year
  BEFORE INSERT OR UPDATE ON public.income_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_income_month_year();

CREATE TRIGGER trg_expense_month_year
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_expense_month_year();

CREATE TRIGGER on_savings_contribution
  AFTER INSERT OR UPDATE ON public.savings_contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_savings_goal_amount();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER tud_profiles       BEFORE UPDATE ON public.profiles          FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER tud_wallet         BEFORE UPDATE ON public.wallet_config      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER tud_savings_goals  BEFORE UPDATE ON public.savings_goals      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER tud_tasks          BEFORE UPDATE ON public.tasks              FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER tud_group_tasks    BEFORE UPDATE ON public.group_tasks        FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER tud_groups         BEFORE UPDATE ON public.groups             FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER tud_meal_plans     BEFORE UPDATE ON public.meal_plans         FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER tud_nova           BEFORE UPDATE ON public.nova_conversations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- DONE ✅  22 tables · RLS · indexes · triggers
-- ============================================================