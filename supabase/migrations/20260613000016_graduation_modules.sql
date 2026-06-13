-- ================================================================
-- VarsityOS — Graduation Audit: academic history per student
-- Stores all modules attempted across all years, with grades and
-- pass/fail status. Used by GraduationAudit to calculate
-- GPA, credit count, exclusion risk, and degree completion %.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.graduation_modules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_code  TEXT NOT NULL,
  module_name  TEXT NOT NULL,
  credits      INTEGER NOT NULL DEFAULT 16,
  year_taken   SMALLINT NOT NULL DEFAULT 1 CHECK (year_taken BETWEEN 1 AND 8),
  semester     SMALLINT CHECK (semester BETWEEN 1 AND 2),
  grade        NUMERIC(5,2) CHECK (grade BETWEEN 0 AND 100),
  status       TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','passed','failed','exempted','dropped')),
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, module_code, year_taken, semester)
);

ALTER TABLE public.graduation_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "graduation_modules_own" ON public.graduation_modules
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_grad_modules_user
  ON public.graduation_modules (user_id, year_taken, semester);

CREATE OR REPLACE FUNCTION public.grad_modules_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS grad_modules_updated_at ON public.graduation_modules;
CREATE TRIGGER grad_modules_updated_at
  BEFORE UPDATE ON public.graduation_modules
  FOR EACH ROW EXECUTE FUNCTION public.grad_modules_set_updated_at();

-- degree_config stores target credits, max years, university-specific rules
CREATE TABLE IF NOT EXISTS public.degree_config (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  degree_name      TEXT,
  total_credits    INTEGER NOT NULL DEFAULT 360,
  max_years        SMALLINT NOT NULL DEFAULT 6,
  exclusion_mark   NUMERIC(5,2) NOT NULL DEFAULT 50,
  current_year     SMALLINT NOT NULL DEFAULT 1,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.degree_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "degree_config_own" ON public.degree_config
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
