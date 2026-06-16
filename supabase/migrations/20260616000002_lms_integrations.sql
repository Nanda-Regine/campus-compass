-- ============================================================
-- Migration 000027: LMS Integrations (Moodle / Canvas)
-- ============================================================

-- Add external_id + source to tasks for LMS sync deduplication
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS source      TEXT DEFAULT 'manual';

-- Unique index: one task per (user, external_id) — prevents duplicate imports
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_external_id
  ON tasks(user_id, external_id)
  WHERE external_id IS NOT NULL;

-- LMS integration credentials (user-scoped, RLS-protected)
CREATE TABLE IF NOT EXISTS lms_integrations (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID    REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lms_type      TEXT    NOT NULL CHECK (lms_type IN ('moodle', 'canvas')),
  site_url      TEXT    NOT NULL,
  token         TEXT    NOT NULL,
  display_name  TEXT,
  last_synced_at TIMESTAMPTZ,
  sync_count    INTEGER DEFAULT 0,
  sync_error    TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lms_type, site_url)
);

ALTER TABLE lms_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_integrations_own" ON lms_integrations
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_lms_integrations_user ON lms_integrations(user_id);

COMMENT ON TABLE lms_integrations IS
  'Stores student LMS connection credentials. Tokens are user-scoped API tokens (Moodle personal token / Canvas PAT) — they can only read the student own data.';
COMMENT ON COLUMN lms_integrations.lms_type IS 'moodle=Moodle LMS, canvas=Canvas LMS by Instructure';
COMMENT ON COLUMN tasks.external_id IS 'Unique ID from external source (format: lms:{type}:{id})';
COMMENT ON COLUMN tasks.source IS 'Origin of task: manual | moodle | canvas';
