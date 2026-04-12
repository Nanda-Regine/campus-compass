-- ============================================================
-- MIGRATION: Create wallet tables (income_entries, savings_goals, savings_contributions)
-- Run in Supabase SQL Editor — safe to re-run
-- ============================================================

-- 1. income_entries
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

-- 2. savings_goals
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

-- 3. savings_contributions
CREATE TABLE IF NOT EXISTS public.savings_contributions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id           UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  amount            NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.income_entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "own_rows" ON public.income_entries;
CREATE POLICY "own_rows" ON public.income_entries      FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_rows" ON public.savings_goals;
CREATE POLICY "own_rows" ON public.savings_goals       FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_rows" ON public.savings_contributions;
CREATE POLICY "own_rows" ON public.savings_contributions FOR ALL USING (auth.uid() = user_id);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_income_user_month ON public.income_entries(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_contrib_goal ON public.savings_contributions(goal_id);

-- 7. Auto-update month_year on income_entries
CREATE OR REPLACE FUNCTION public.set_month_year()
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
  FOR EACH ROW EXECUTE FUNCTION public.set_month_year();

SELECT 'wallet tables migration complete' AS result;
