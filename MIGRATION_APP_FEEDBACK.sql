-- ============================================================
-- VarsityOS — app_feedback table migration
-- Run in Supabase SQL Editor
-- Stream 5: Reviews & Feedback system
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_feedback (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  category     TEXT CHECK (category IN (
                 'bug', 'feature_request', 'general', 'nova_feedback',
                 'budget', 'study', 'meals', 'groups', 'savings', 'other'
               )),
  message      TEXT NOT NULL,
  app_version  TEXT,
  platform     TEXT,         -- 'web' | 'pwa_android' | 'pwa_ios'
  is_resolved  BOOLEAN DEFAULT false,
  admin_notes  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback (including unauthenticated)
CREATE POLICY "Anyone can submit feedback"
  ON public.app_feedback
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users see own feedback"
  ON public.app_feedback
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.app_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_rating  ON public.app_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_user    ON public.app_feedback(user_id);
