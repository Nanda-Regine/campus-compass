-- ================================================================
-- VarsityOS — Skill Progress sync
-- One row per user: maps lesson IDs → completion boolean as JSONB.
-- Mirrors the localStorage 'varsityos-skills' key.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.skill_progress (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  progress   JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.skill_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skill_progress_own" ON public.skill_progress
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
