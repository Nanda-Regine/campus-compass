-- ================================================================
-- VarsityOS — Cloud Sync Tables
-- nova_conversations (multi-conversation history)
-- user_goals (GoalArchitecture JSONB sync)
-- user_habits_state (HabitBuilder JSONB sync)
-- push_cooldowns (deduplication per rule per user)
-- ================================================================

-- ── Nova Conversations ────────────────────────────────────────────
-- One row per conversation. user_id has NO unique constraint
-- so users can have multiple conversations.
CREATE TABLE IF NOT EXISTS nova_conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             TEXT,
  messages          JSONB NOT NULL DEFAULT '[]'::jsonb,
  conversation_type TEXT NOT NULL DEFAULT 'general'
    CHECK (conversation_type IN ('general', 'crisis', 'academic', 'financial', 'wellness')),
  crisis_detected   BOOLEAN NOT NULL DEFAULT FALSE,
  message_count     INTEGER NOT NULL DEFAULT 0,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE nova_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nova_conversations_own" ON nova_conversations
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_nova_conversations_user_updated
  ON nova_conversations (user_id, updated_at DESC);

-- ── GoalArchitecture Cloud Sync ───────────────────────────────────
-- One row per user. Entire GoalState stored as JSONB.
-- localStorage stays as instant read cache; Supabase is the source of truth.
CREATE TABLE IF NOT EXISTS user_goals (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_goals_own" ON user_goals
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── HabitBuilder Cloud Sync ───────────────────────────────────────
-- One row per user. Habits array stored as JSONB.
CREATE TABLE IF NOT EXISTS user_habits_state (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  habits     JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_habits_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_habits_state_own" ON user_habits_state
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Push Cooldowns ────────────────────────────────────────────────
-- Prevents sending the same rule notification twice to the same user.
-- Keyed by (user_id, rule_id). Inngest functions can check this before
-- sending to avoid spam.
CREATE TABLE IF NOT EXISTS push_cooldowns (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id    TEXT NOT NULL,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, rule_id)
);

ALTER TABLE push_cooldowns ENABLE ROW LEVEL SECURITY;

-- Admin/cron access only — users don't need to read their own cooldowns
CREATE POLICY "push_cooldowns_service_only" ON push_cooldowns
  FOR ALL USING (FALSE);

-- ── updated_at triggers ───────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_nova_conversations_updated_at') THEN
    CREATE TRIGGER set_nova_conversations_updated_at
      BEFORE UPDATE ON nova_conversations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_user_goals_updated_at') THEN
    CREATE TRIGGER set_user_goals_updated_at
      BEFORE UPDATE ON user_goals
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_user_habits_state_updated_at') THEN
    CREATE TRIGGER set_user_habits_state_updated_at
      BEFORE UPDATE ON user_habits_state
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
