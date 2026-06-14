-- ============================================================
-- Migration 000023: Guardian Access Tokens
-- Students can generate magic-link tokens so parents/guardians
-- can view a read-only summary dashboard (no login required).
-- ============================================================

CREATE TABLE IF NOT EXISTS guardian_access_tokens (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token        TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  label        TEXT        NOT NULL DEFAULT 'Guardian',
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '90 days',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardian_tokens_token   ON guardian_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_guardian_tokens_student ON guardian_access_tokens(student_id);

ALTER TABLE guardian_access_tokens ENABLE ROW LEVEL SECURITY;

-- Students can create, read, and delete their own tokens
CREATE POLICY "students_manage_guardian_tokens" ON guardian_access_tokens
  FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);
-- Note: the public guardian page uses the service role (admin) client to
-- look up tokens — no anon RLS policy needed.
