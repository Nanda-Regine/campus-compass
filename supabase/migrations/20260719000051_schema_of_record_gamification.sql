-- ─────────────────────────────────────────────────────────────────────────────
-- Schema-of-record: Phase-21 gamification tables (2026-07-19)
--
-- These tables (semester_chapters, user_chapter_xp, compound_days,
-- mystery_box_claims) were created directly in the live DB via the Management
-- API and had NO migration file — so a fresh `supabase db reset` / CI provision
-- produced a DB where /api/gamification/{chapter,compound-day,mystery-box}
-- 400/500'd. This migration reproduces the live schema exactly (introspected
-- from information_schema + pg_constraint + pg_policies) so the repo can rebuild
-- the database. Idempotent — safe against the live DB where they already exist.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── semester_chapters ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.semester_chapters (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  emoji      text DEFAULT '📖',
  start_date date NOT NULL,
  end_date   date NOT NULL,
  is_active  boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.semester_chapters ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Anyone can read chapters" ON public.semester_chapters
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── user_chapter_xp ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_chapter_xp (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES public.semester_chapters(id) ON DELETE CASCADE,
  xp         integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, chapter_id)
);
ALTER TABLE public.user_chapter_xp ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage own chapter xp" ON public.user_chapter_xp
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── compound_days ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.compound_days (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_date    date NOT NULL DEFAULT CURRENT_DATE,
  domains_hit text[] NOT NULL DEFAULT '{}'::text[],
  xp_bonus    integer DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, day_date)
);
ALTER TABLE public.compound_days ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage own compound_days" ON public.compound_days
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── mystery_box_claims ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mystery_box_claims (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  claimed_date date NOT NULL DEFAULT CURRENT_DATE,
  reward_type  text NOT NULL,
  reward_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  xp_awarded   integer DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (user_id, claimed_date)
);
ALTER TABLE public.mystery_box_claims ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage own mystery_box_claims" ON public.mystery_box_claims
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helpful indexes for the per-user lookups these tables get.
CREATE INDEX IF NOT EXISTS idx_user_chapter_xp_user      ON public.user_chapter_xp (user_id);
CREATE INDEX IF NOT EXISTS idx_compound_days_user        ON public.compound_days (user_id);
CREATE INDEX IF NOT EXISTS idx_mystery_box_claims_user   ON public.mystery_box_claims (user_id);
