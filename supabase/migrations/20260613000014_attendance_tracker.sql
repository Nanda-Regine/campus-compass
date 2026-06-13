-- ================================================================
-- VarsityOS — Attendance Tracker
-- Per-module attendance records with streak + percentage tracking.
-- 80% minimum attendance is a common SA university rule for exam entry.
-- ================================================================

CREATE TABLE IF NOT EXISTS attendance_records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id  UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  status     TEXT NOT NULL DEFAULT 'present'
    CHECK (status IN ('present','absent','late','online','cancelled')),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, module_id, date)
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_records_own" ON attendance_records
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_attendance_user_module
  ON attendance_records (user_id, module_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_user_date
  ON attendance_records (user_id, date DESC);
