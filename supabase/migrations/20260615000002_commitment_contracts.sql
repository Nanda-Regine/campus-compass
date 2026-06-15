-- Commitment Contracts — students pre-commit to tasks with XP stakes.
-- Loss aversion: failing a contract deducts the staked XP.

CREATE TABLE IF NOT EXISTS commitment_contracts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_description TEXT        NOT NULL,
  deadline         TIMESTAMPTZ NOT NULL,
  xp_stake         INTEGER     NOT NULL DEFAULT 50,
  status           TEXT        NOT NULL DEFAULT 'active',  -- 'active' | 'completed' | 'failed'
  completed_at     TIMESTAMPTZ,
  failed_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE commitment_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contracts"
  ON commitment_contracts FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS commitment_contracts_user_status
  ON commitment_contracts(user_id, status);
