-- ============================================================
-- COMPREHENSIVE MIGRATION — Run once in Supabase SQL Editor
-- Fixes: tasks, expenses, income_entries, savings_goals tables
-- Safe to re-run (uses IF NOT EXISTS / IF EXISTS throughout)
-- ============================================================

-- ───────────────────────────────────────────────
-- 1. TASKS TABLE
-- ───────────────────────────────────────────────
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS description         TEXT,
  ADD COLUMN IF NOT EXISTS status              TEXT NOT NULL DEFAULT 'todo',
  ADD COLUMN IF NOT EXISTS is_group_task       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_id            UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS estimated_hours     NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS recurrence_rule     TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
  ADD COLUMN IF NOT EXISTS completed_at        TIMESTAMPTZ;

-- Migrate old data
UPDATE public.tasks SET description = notes  WHERE description IS NULL AND notes IS NOT NULL;
UPDATE public.tasks SET status = CASE WHEN done = TRUE THEN 'done' ELSE 'todo' END
  WHERE status = 'todo';
UPDATE public.tasks SET completed_at = done_at WHERE completed_at IS NULL AND done_at IS NOT NULL;

-- Normalise task_type to lowercase
UPDATE public.tasks SET task_type = LOWER(task_type) WHERE task_type != LOWER(task_type);

-- Remove old check constraints if they conflict, then add new ones
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('todo','in_progress','done','overdue'));

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_task_type_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_task_type_check
  CHECK (task_type IN (
    'assignment','exam','test','project','presentation',
    'reading','tutorial','lab','group_project',
    'reminder','meeting','appointment','chore','errand','admin',
    'self_care','exercise','social','personal_goal',
    'work_shift','work_task','payment_due','budget_review','other'
  ));

-- RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_rows" ON public.tasks;
CREATE POLICY "own_rows" ON public.tasks FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date     ON public.tasks(due_date);

-- ───────────────────────────────────────────────
-- 2. EXPENSES TABLE
-- ───────────────────────────────────────────────
-- The original schema used 'date', new code uses 'expense_date'
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS expense_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS month_year    TEXT,
  ADD COLUMN IF NOT EXISTS receipt_url   TEXT;

-- Copy existing data from date → expense_date if date column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'expenses' AND column_name = 'date') THEN
    UPDATE public.expenses SET expense_date = "date" WHERE expense_date = CURRENT_DATE;
  END IF;
END $$;

-- Make description nullable (new code may not always provide it)
ALTER TABLE public.expenses ALTER COLUMN description DROP NOT NULL;

-- Populate month_year from expense_date
UPDATE public.expenses
  SET month_year = TO_CHAR(expense_date, 'YYYY-MM')
  WHERE month_year IS NULL;

-- Update category check to match new code (case-insensitive categories)
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_category_check
  CHECK (category IN (
    'food','transport','accommodation','books','data',
    'clothing','entertainment','health','toiletries',
    'stationery','laundry','airtime','savings','other',
    -- Legacy capitalised values
    'Food','Transport','Accommodation','Books','Data','Clothing',
    'Entertainment','Health','Other'
  ));

-- RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_rows" ON public.expenses;
CREATE POLICY "own_rows" ON public.expenses FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, expense_date);

-- ───────────────────────────────────────────────
-- 3. INCOME ENTRIES TABLE
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.income_entries (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type             TEXT NOT NULL DEFAULT 'other'
                            CHECK (source_type IN ('nsfas','bursary','pocket_money','part_time',
                              'family','gift','side_hustle','scholarship','savings_withdrawal','other')),
  label                   TEXT NOT NULL,
  amount                  NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  received_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  month_year              TEXT,
  notes                   TEXT,
  is_recurring            BOOLEAN NOT NULL DEFAULT false,
  recurring_day_of_month  INTEGER CHECK (recurring_day_of_month BETWEEN 1 AND 31),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.income_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_rows" ON public.income_entries;
CREATE POLICY "own_rows" ON public.income_entries FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_income_user_month ON public.income_entries(user_id, month_year);

-- ───────────────────────────────────────────────
-- 4. SAVINGS GOALS TABLE
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.savings_goals (
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

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_rows" ON public.savings_goals;
CREATE POLICY "own_rows" ON public.savings_goals FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON public.savings_goals(user_id);

-- ───────────────────────────────────────────────
-- 5. SAVINGS CONTRIBUTIONS TABLE
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.savings_contributions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id           UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  amount            NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_rows" ON public.savings_contributions;
CREATE POLICY "own_rows" ON public.savings_contributions FOR ALL USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────
-- 6. AUTO month_year TRIGGER
-- ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_income_month_year()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.month_year IS NULL THEN
    NEW.month_year := TO_CHAR(COALESCE(NEW.received_date, CURRENT_DATE), 'YYYY-MM');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_income_month_year ON public.income_entries;
CREATE TRIGGER trg_income_month_year
  BEFORE INSERT OR UPDATE ON public.income_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_income_month_year();

SELECT 'All migrations complete ✓' AS result;
