-- ─── part_time_jobs: ensure student_id exists ────────────────────────────────
ALTER TABLE public.part_time_jobs
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Backfill student_id from user_id if that column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'part_time_jobs' AND column_name = 'user_id') THEN
    UPDATE public.part_time_jobs SET student_id = user_id WHERE student_id IS NULL;
  END IF;
END $$;

-- Enable RLS (idempotent)
ALTER TABLE public.part_time_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_rows" ON public.part_time_jobs;
CREATE POLICY "own_rows" ON public.part_time_jobs FOR ALL USING (auth.uid() = student_id);

CREATE INDEX IF NOT EXISTS idx_jobs_student ON public.part_time_jobs(student_id, is_active);

-- ─── work_shifts: add all columns required by the API ────────────────────────
ALTER TABLE public.work_shifts
  ADD COLUMN IF NOT EXISTS student_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS job_id             UUID REFERENCES public.part_time_jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duration_hours     NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS earnings           NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS has_study_conflict BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS conflict_type      TEXT,
  ADD COLUMN IF NOT EXISTS conflict_detail    TEXT;

-- Backfill student_id from user_id if that column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_shifts' AND column_name = 'user_id') THEN
    UPDATE public.work_shifts SET student_id = user_id WHERE student_id IS NULL;
  END IF;
END $$;

-- Make employer_name nullable (old schema had it NOT NULL)
ALTER TABLE public.work_shifts
  ALTER COLUMN employer_name DROP NOT NULL;

-- Enable RLS (idempotent)
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_shifts" ON public.work_shifts;
CREATE POLICY "own_shifts" ON public.work_shifts FOR ALL USING (auth.uid() = student_id);

CREATE INDEX IF NOT EXISTS idx_work_shifts_student ON public.work_shifts(student_id, shift_date DESC);

-- ─── profiles: subscription_tier and plan columns ────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT,
  ADD COLUMN IF NOT EXISTS plan              TEXT;

UPDATE public.profiles
  SET subscription_tier = 'premium'
  WHERE is_premium = true AND subscription_tier IS NULL;
