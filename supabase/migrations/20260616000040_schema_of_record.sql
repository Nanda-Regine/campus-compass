-- ============================================================================
-- Schema of record — capture tables that exist in the live database but were
-- created out-of-band (via the Management API) and never recorded in a migration.
-- Without this, a from-scratch rebuild (supabase db reset / fresh environment)
-- would be missing these tables and the features that depend on them fail
-- silently — the exact class of bug found in the June 2026 audit.
--
-- Fully idempotent: CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS, so running
-- it against the live database is a safe no-op while a fresh build gets everything.
-- UUID defaults use gen_random_uuid() (built-in) rather than the live
-- uuid_generate_v4() to avoid an uuid-ossp extension dependency.
-- ============================================================================

-- ── Campus feed: posts, comments, reactions ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campus_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution text,
  content     text NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 500),
  category    text NOT NULL DEFAULT 'general'
              CHECK (category = ANY (ARRAY['general','opportunity','academic','campus','sell_swap'])),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.campus_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    text NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_reactions (
  post_id uuid NOT NULL REFERENCES public.campus_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

-- ── Exam confidence ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exam_confidence (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_id    uuid NOT NULL,
  confidence integer NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, exam_id)
);

-- ── Saved bursaries ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_bursaries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bursary_id   text NOT NULL,
  bursary_name text NOT NULL DEFAULT '',
  saved_at     timestamptz DEFAULT now(),
  UNIQUE (user_id, bursary_id)
);

-- ── Student grades data (Grades tab persistence) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.student_grades_data (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  grade_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  gpa_rows      jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- ── Peer tutoring: profiles, sessions, reviews ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.tutor_profiles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bio                 text,
  subjects            text[] NOT NULL DEFAULT '{}'::text[],
  institution         text,
  faculty             text,
  year_of_study       text,
  rate_per_hour       numeric(8,2) NOT NULL DEFAULT 50,
  availability        text,
  is_available        boolean DEFAULT true,
  session_count       integer DEFAULT 0,
  average_rating      numeric(3,2),
  created_at          timestamptz DEFAULT now(),
  is_verified         boolean NOT NULL DEFAULT false,
  is_verified_pending boolean NOT NULL DEFAULT false,
  student_card_url    text,
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.tutoring_sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id           uuid NOT NULL REFERENCES auth.users(id),
  student_id         uuid NOT NULL REFERENCES auth.users(id),
  subject            text NOT NULL,
  scheduled_date     date,
  duration_hours     numeric(3,1) DEFAULT 1.0,
  rate_per_hour      numeric(8,2) NOT NULL,
  total_amount       numeric(8,2) NOT NULL,
  payment_method     text DEFAULT 'in_person' CHECK (payment_method = ANY (ARRAY['in_person','online'])),
  status             text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','confirmed','completed','cancelled'])),
  notes              text,
  payfast_payment_id text,
  created_at         timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tutor_reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES public.tutoring_sessions(id) ON DELETE CASCADE,
  tutor_id    uuid NOT NULL REFERENCES auth.users(id),
  reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  rating      integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (session_id, reviewer_id)
);

-- ── Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE public.campus_posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_confidence     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_bursaries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_grades_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutoring_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_reviews       ENABLE ROW LEVEL SECURITY;

-- campus_posts: world-readable to authenticated, owner-write
DROP POLICY IF EXISTS campus_posts_select ON public.campus_posts;
CREATE POLICY campus_posts_select ON public.campus_posts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS campus_posts_insert ON public.campus_posts;
CREATE POLICY campus_posts_insert ON public.campus_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS campus_posts_delete ON public.campus_posts;
CREATE POLICY campus_posts_delete ON public.campus_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- post_comments
DROP POLICY IF EXISTS comments_select ON public.post_comments;
CREATE POLICY comments_select ON public.post_comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS comments_insert ON public.post_comments;
CREATE POLICY comments_insert ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS comments_delete ON public.post_comments;
CREATE POLICY comments_delete ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- post_reactions
DROP POLICY IF EXISTS reactions_select ON public.post_reactions;
CREATE POLICY reactions_select ON public.post_reactions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS reactions_insert ON public.post_reactions;
CREATE POLICY reactions_insert ON public.post_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS reactions_delete ON public.post_reactions;
CREATE POLICY reactions_delete ON public.post_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- own-row tables
DROP POLICY IF EXISTS own_rows ON public.exam_confidence;
CREATE POLICY own_rows ON public.exam_confidence FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS own_rows ON public.saved_bursaries;
CREATE POLICY own_rows ON public.saved_bursaries FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS own_rows ON public.student_grades_data;
CREATE POLICY own_rows ON public.student_grades_data FOR ALL USING (auth.uid() = user_id);

-- tutor_profiles: world-readable, owner-managed
DROP POLICY IF EXISTS "Tutor profiles viewable by all" ON public.tutor_profiles;
CREATE POLICY "Tutor profiles viewable by all" ON public.tutor_profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users manage own tutor profile" ON public.tutor_profiles;
CREATE POLICY "Users manage own tutor profile" ON public.tutor_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- tutor_reviews: world-readable, reviewer-write
DROP POLICY IF EXISTS "Reviews viewable by all" ON public.tutor_reviews;
CREATE POLICY "Reviews viewable by all" ON public.tutor_reviews FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Reviewers insert own reviews" ON public.tutor_reviews;
CREATE POLICY "Reviewers insert own reviews" ON public.tutor_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);

-- tutoring_sessions: visible/updatable by either party, student creates
DROP POLICY IF EXISTS "Parties see own sessions" ON public.tutoring_sessions;
CREATE POLICY "Parties see own sessions" ON public.tutoring_sessions FOR SELECT TO authenticated USING (auth.uid() = tutor_id OR auth.uid() = student_id);
DROP POLICY IF EXISTS "Parties update own sessions" ON public.tutoring_sessions;
CREATE POLICY "Parties update own sessions" ON public.tutoring_sessions FOR UPDATE TO authenticated USING (auth.uid() = tutor_id OR auth.uid() = student_id);
DROP POLICY IF EXISTS "Students create sessions" ON public.tutoring_sessions;
CREATE POLICY "Students create sessions" ON public.tutoring_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

-- ── public_profiles view (safe subset of profiles) ─────────────────────────
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, name AS display_name, emoji, university FROM public.profiles;
