-- =============================================
-- Campus Compass — Supabase Database Schema
-- Run this in your Supabase SQL editor
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT,
  name            TEXT NOT NULL DEFAULT '',
  emoji           TEXT NOT NULL DEFAULT '🎓',
  university      TEXT,
  year_of_study   TEXT,
  faculty         TEXT,
  funding_type    TEXT, -- nsfas | bursary | self | loan | mixed
  dietary_pref    TEXT DEFAULT 'No restrictions',
  living_situation TEXT,
  is_premium      BOOLEAN NOT NULL DEFAULT FALSE,
  premium_until   TIMESTAMPTZ,
  payfast_token   TEXT,
  setup_complete  BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- BUDGET
-- ─────────────────────────────────────────────
CREATE TABLE public.budgets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  monthly_budget  NUMERIC(10,2) NOT NULL DEFAULT 0,
  food_budget     NUMERIC(10,2) NOT NULL DEFAULT 0,
  nsfas_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  nsfas_living    NUMERIC(10,2) NOT NULL DEFAULT 0,
  nsfas_accom     NUMERIC(10,2) NOT NULL DEFAULT 0,
  nsfas_books     NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE public.expenses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Other',
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- STUDY PLANNER
-- ─────────────────────────────────────────────
CREATE TABLE public.modules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  code        TEXT,
  colour      TEXT NOT NULL DEFAULT 'teal',
  lecturer    TEXT,
  venue       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id   UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  task_type   TEXT NOT NULL DEFAULT 'Assignment', -- Assignment | Test | Project | Presentation | Reading | Other
  due_date    DATE,
  priority    TEXT NOT NULL DEFAULT 'normal', -- normal | high | urgent
  notes       TEXT,
  done        BOOLEAN NOT NULL DEFAULT FALSE,
  done_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.timetable_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id   UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL, -- Monday | Tuesday | ...
  start_time  TEXT NOT NULL, -- HH:MM
  end_time    TEXT,
  venue       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.exams (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id   UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  exam_date   DATE NOT NULL,
  start_time  TEXT,
  venue       TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- MEAL PREP
-- ─────────────────────────────────────────────
CREATE TABLE public.meal_plans (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  meal_slot   TEXT NOT NULL, -- Breakfast | Lunch | Supper | Snack
  meal_name   TEXT NOT NULL,
  cost        NUMERIC(6,2),
  week_start  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.grocery_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  quantity    TEXT,
  price       NUMERIC(8,2),
  checked     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- NOVA CHAT HISTORY
-- ─────────────────────────────────────────────
CREATE TABLE public.nova_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL, -- user | assistant
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- SUBSCRIPTIONS (PayFast)
-- ─────────────────────────────────────────────
CREATE TABLE public.subscriptions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payfast_payment_id    TEXT,
  payfast_subscription_token TEXT,
  plan                  TEXT NOT NULL DEFAULT 'free', -- free | premium
  status                TEXT NOT NULL DEFAULT 'active', -- active | cancelled | expired | pending
  amount                NUMERIC(8,2),
  billing_date          DATE,
  next_billing_date     DATE,
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─────────────────────────────────────────────
-- PAYMENT LOGS
-- ─────────────────────────────────────────────
CREATE TABLE public.payment_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payfast_payment_id TEXT,
  amount            NUMERIC(8,2),
  status            TEXT, -- COMPLETE | FAILED | CANCELLED
  item_name         TEXT,
  raw_data          JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- NOVA USAGE TRACKING (for free tier limits)
-- ─────────────────────────────────────────────
CREATE TABLE public.nova_usage (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month_year  TEXT NOT NULL, -- YYYY-MM
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- ─────────────────────────────────────────────
-- INDEXES for performance
-- ─────────────────────────────────────────────
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_date ON public.expenses(date);
CREATE INDEX idx_expenses_category ON public.expenses(category);

CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_done ON public.tasks(done);

CREATE INDEX idx_modules_user_id ON public.modules(user_id);
CREATE INDEX idx_timetable_user_id ON public.timetable_entries(user_id);
CREATE INDEX idx_exams_user_id ON public.exams(user_id);
CREATE INDEX idx_exams_date ON public.exams(exam_date);

CREATE INDEX idx_meal_plans_user_id ON public.meal_plans(user_id);
CREATE INDEX idx_grocery_user_id ON public.grocery_items(user_id);

CREATE INDEX idx_nova_messages_user_id ON public.nova_messages(user_id);
CREATE INDEX idx_nova_messages_created ON public.nova_messages(created_at);

CREATE INDEX idx_nova_usage_user_month ON public.nova_usage(user_id, month_year);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nova_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nova_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Generic "own data" policies helper macro (applied per table)
-- Budgets
CREATE POLICY "Own budget" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

-- Expenses
CREATE POLICY "Own expenses" ON public.expenses
  FOR ALL USING (auth.uid() = user_id);

-- Modules
CREATE POLICY "Own modules" ON public.modules
  FOR ALL USING (auth.uid() = user_id);

-- Tasks
CREATE POLICY "Own tasks" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);

-- Timetable
CREATE POLICY "Own timetable" ON public.timetable_entries
  FOR ALL USING (auth.uid() = user_id);

-- Exams
CREATE POLICY "Own exams" ON public.exams
  FOR ALL USING (auth.uid() = user_id);

-- Meal plans
CREATE POLICY "Own meal plans" ON public.meal_plans
  FOR ALL USING (auth.uid() = user_id);

-- Grocery
CREATE POLICY "Own grocery" ON public.grocery_items
  FOR ALL USING (auth.uid() = user_id);

-- Nova messages
CREATE POLICY "Own nova messages" ON public.nova_messages
  FOR ALL USING (auth.uid() = user_id);

-- Nova usage
CREATE POLICY "Own nova usage" ON public.nova_usage
  FOR ALL USING (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Payment logs - users can only view own
CREATE POLICY "Own payment logs" ON public.payment_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for webhooks)
CREATE POLICY "Service role full access to subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to payment logs" ON public.payment_logs
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to profiles" ON public.profiles
  FOR ALL USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.budgets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-mark task done_at
CREATE OR REPLACE FUNCTION public.handle_task_done()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.done = TRUE AND OLD.done = FALSE THEN
    NEW.done_at = NOW();
  ELSIF NEW.done = FALSE THEN
    NEW.done_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_task_done_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_task_done();

-- ─────────────────────────────────────────────
-- DASHBOARD SUMMARY VIEW (for fast dashboard loads)
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
  (
    SELECT COUNT(*)
    FROM public.tasks t
    WHERE t.user_id = p.id AND t.done = FALSE AND t.due_date IS NOT NULL
      AND t.due_date >= CURRENT_DATE
  ) AS pending_tasks,
  (
    SELECT COUNT(*)
    FROM public.modules m
    WHERE m.user_id = p.id
  ) AS module_count,
  (
    SELECT COUNT(*)
    FROM public.exams ex
    WHERE ex.user_id = p.id AND ex.exam_date >= CURRENT_DATE
  ) AS upcoming_exams
FROM public.profiles p
LEFT JOIN public.budgets b ON b.user_id = p.id;

-- Grant view access
GRANT SELECT ON public.dashboard_summary TO authenticated;
