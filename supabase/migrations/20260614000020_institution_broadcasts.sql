-- 000020: Institution Broadcast — admin push announcements to all linked students

CREATE TABLE IF NOT EXISTS institution_broadcasts (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  sent_by        UUID NOT NULL REFERENCES profiles(id),
  title          TEXT NOT NULL,
  body           TEXT NOT NULL,
  url            TEXT,
  priority       TEXT NOT NULL DEFAULT 'info'
                 CHECK (priority IN ('info','warning','urgent')),
  sent_count     INTEGER NOT NULL DEFAULT 0,    -- students reached (≥1 device)
  failed_count   INTEGER NOT NULL DEFAULT 0,    -- students with subs but all sends failed
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_institution_broadcasts_inst
  ON institution_broadcasts(institution_id, created_at DESC);

ALTER TABLE institution_broadcasts ENABLE ROW LEVEL SECURITY;

-- Institution admins can read their broadcasts
CREATE POLICY "broadcast_admin_select" ON institution_broadcasts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM institution_admins ia
      WHERE ia.institution_id = institution_broadcasts.institution_id
        AND ia.user_id = auth.uid()
    )
  );

-- Institution admins can create broadcasts
CREATE POLICY "broadcast_admin_insert" ON institution_broadcasts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM institution_admins ia
      WHERE ia.institution_id = institution_broadcasts.institution_id
        AND ia.user_id = auth.uid()
    )
  );
