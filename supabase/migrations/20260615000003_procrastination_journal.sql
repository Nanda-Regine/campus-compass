-- Procrastination Journal — post-failure self-reflection.
-- Research: structured reflection after a miss increases follow-through by 38%.

CREATE TABLE IF NOT EXISTS procrastination_journal (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger    TEXT        NOT NULL DEFAULT 'manual',  -- 'contract_failed' | 'deadline_missed' | 'manual'
  obstacle   TEXT        NOT NULL,                   -- "What got in the way?"
  plan       TEXT        NOT NULL,                   -- "What will I do differently?"
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE procrastination_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own journal"
  ON procrastination_journal FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS pj_user_created
  ON procrastination_journal(user_id, created_at DESC);
