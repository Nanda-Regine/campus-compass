-- ============================================================
-- VarsityOS — Gamification & Wellness Migration
-- Safe to re-run: all statements use IF NOT EXISTS / DO $$ patterns
-- Tables: wellness_checkins, user_xp_state, user_daily_challenges,
--         user_cv_profile, flashcard_decks, flashcard_cards
-- Date: 2026-06-12
-- ============================================================

-- Ensure uuid-ossp is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 1. WELLNESS_CHECKINS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wellness_checkins (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  sleep       INTEGER     NOT NULL CHECK (sleep BETWEEN 1 AND 5),
  stress      INTEGER     NOT NULL CHECK (stress BETWEEN 1 AND 5),
  social      INTEGER     NOT NULL CHECK (social BETWEEN 1 AND 5),
  energy      INTEGER     NOT NULL CHECK (energy BETWEEN 1 AND 5),
  motivation  INTEGER     NOT NULL CHECK (motivation BETWEEN 1 AND 5),
  score       INTEGER     NOT NULL CHECK (score BETWEEN 0 AND 100),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_wellness_checkins_user_date
  ON public.wellness_checkins (user_id, date DESC);

ALTER TABLE public.wellness_checkins ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY own_rows ON public.wellness_checkins
    FOR ALL
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. USER_XP_STATE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_xp_state (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  total_xp         INTEGER     NOT NULL DEFAULT 0,
  event_counts     JSONB       NOT NULL DEFAULT '{}',
  daily_event_log  JSONB       NOT NULL DEFAULT '{}',
  recent_gains     JSONB       NOT NULL DEFAULT '[]',
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_xp_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY own_rows ON public.user_xp_state
    FOR ALL
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 3. USER_DAILY_CHALLENGES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_daily_challenges (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
  completed_ids   TEXT[]      NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, challenge_date)
);

ALTER TABLE public.user_daily_challenges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY own_rows ON public.user_daily_challenges
    FOR ALL
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 4. USER_CV_PROFILE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_cv_profile (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  skills        TEXT[]      NOT NULL DEFAULT '{}',
  activities    TEXT[]      NOT NULL DEFAULT '{}',
  languages     TEXT[]      NOT NULL DEFAULT '{}',
  summary       TEXT        NOT NULL DEFAULT '',
  career_path   TEXT        NOT NULL DEFAULT '',
  career_skills TEXT[]      NOT NULL DEFAULT '{}',
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_cv_profile ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY own_rows ON public.user_cv_profile
    FOR ALL
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 5. FLASHCARD_DECKS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  module_id    UUID        REFERENCES public.modules(id) ON DELETE SET NULL,
  module_name  TEXT        NOT NULL DEFAULT '',
  color        TEXT        NOT NULL DEFAULT '#4ecf9e',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user_id
  ON public.flashcard_decks (user_id);

ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY own_rows ON public.flashcard_decks
    FOR ALL
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 6. FLASHCARD_CARDS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.flashcard_cards (
  id            UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id       UUID           NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  user_id       UUID           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  front         TEXT           NOT NULL,
  back          TEXT           NOT NULL,
  interval_days INTEGER        NOT NULL DEFAULT 0,
  ease_factor   NUMERIC(4,2)   NOT NULL DEFAULT 2.5,
  repetitions   INTEGER        NOT NULL DEFAULT 0,
  next_review   DATE           NOT NULL DEFAULT CURRENT_DATE,
  last_review   DATE,
  created_at    TIMESTAMPTZ    DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flashcard_cards_user_next_review
  ON public.flashcard_cards (user_id, next_review);

CREATE INDEX IF NOT EXISTS idx_flashcard_cards_deck_id
  ON public.flashcard_cards (deck_id);

ALTER TABLE public.flashcard_cards ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY own_rows ON public.flashcard_cards
    FOR ALL
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
