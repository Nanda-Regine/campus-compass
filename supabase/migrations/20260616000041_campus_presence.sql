-- ============================================================================
-- Campus presence — "Who's around now"
-- Ephemeral, auto-expiring status so students at the same university can find
-- each other to study/meet. One row per user; presence_read is university-scoped
-- by RLS so a student only ever sees their own campus.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campus_presence (
  user_id     uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  university  text,
  status      text NOT NULL CHECK (status = ANY (ARRAY['on_campus','library','studying','free_to_meet','in_class','gym'])),
  spot        text CHECK (spot IS NULL OR char_length(spot) <= 80),
  note        text CHECK (note IS NULL OR char_length(note) <= 140),
  expires_at  timestamptz NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campus_presence_university_expiry
  ON public.campus_presence (university, expires_at);

ALTER TABLE public.campus_presence ENABLE ROW LEVEL SECURITY;

-- A student manages only their own presence row.
DROP POLICY IF EXISTS presence_own ON public.campus_presence;
CREATE POLICY presence_own ON public.campus_presence
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- A student can read presence only for their own university.
DROP POLICY IF EXISTS presence_read ON public.campus_presence;
CREATE POLICY presence_read ON public.campus_presence
  FOR SELECT TO authenticated
  USING (university = (SELECT university FROM public.profiles WHERE id = auth.uid()));
