-- ================================================================
-- VarsityOS — Full Sync Migration
-- Moves Fitness, Weekly Plans, Stokvel, and Tax off localStorage
-- into Supabase with RLS + soft delete on every table.
-- ================================================================

-- ── Workout Logs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('run','walk','gym','yoga','sport','swim','cycle','other')),
  duration    INTEGER NOT NULL CHECK (duration > 0),
  calories    INTEGER,
  notes       TEXT,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_logs_own" ON workout_logs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date
  ON workout_logs (user_id, date) WHERE deleted_at IS NULL;

-- ── Weekly Plans ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_plans (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start           DATE NOT NULL,
  priorities           JSONB NOT NULL DEFAULT '[]',
  wins                 JSONB NOT NULL DEFAULT '[]',
  blockers             JSONB NOT NULL DEFAULT '[]',
  daily_plan           JSONB NOT NULL DEFAULT '[]',
  completed_priorities JSONB NOT NULL DEFAULT '[]',
  generated_at         TIMESTAMPTZ,
  deleted_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_plans_own" ON weekly_plans
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_week
  ON weekly_plans (user_id, week_start) WHERE deleted_at IS NULL;

-- ── Stokvel Groups ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stokvel_groups (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  contribution_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stokvel_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stokvel_groups_own" ON stokvel_groups
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_stokvel_groups_user
  ON stokvel_groups (user_id) WHERE deleted_at IS NULL;

-- ── Stokvel Members ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stokvel_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID NOT NULL REFERENCES stokvel_groups(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  phone        TEXT,
  payout_month INTEGER CHECK (payout_month BETWEEN 1 AND 12),
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stokvel_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stokvel_members_via_group" ON stokvel_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM stokvel_groups g
            WHERE g.id = group_id AND g.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_stokvel_members_group
  ON stokvel_members (group_id) WHERE deleted_at IS NULL;

-- ── Stokvel Contributions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stokvel_contributions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id          UUID NOT NULL REFERENCES stokvel_groups(id) ON DELETE CASCADE,
  member_id         UUID REFERENCES stokvel_members(id) ON DELETE SET NULL,
  member_name       TEXT NOT NULL,
  amount            DECIMAL(10,2) NOT NULL,
  contribution_date DATE NOT NULL,
  paid              BOOLEAN NOT NULL DEFAULT FALSE,
  month             TEXT NOT NULL,
  notes             TEXT,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stokvel_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stokvel_contributions_via_group" ON stokvel_contributions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM stokvel_groups g
            WHERE g.id = group_id AND g.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_stokvel_contrib_group_month
  ON stokvel_contributions (group_id, month) WHERE deleted_at IS NULL;

-- ── Stokvel Disputes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stokvel_disputes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID NOT NULL REFERENCES stokvel_groups(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  reported_by  TEXT NOT NULL,
  resolved     BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stokvel_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stokvel_disputes_via_group" ON stokvel_disputes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM stokvel_groups g
            WHERE g.id = group_id AND g.user_id = auth.uid())
  );

-- ── Tax IRP5s ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tax_irp5s (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer     TEXT NOT NULL,
  gross_income DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_withheld DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_year     INTEGER NOT NULL,
  deleted_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tax_irp5s ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tax_irp5s_own" ON tax_irp5s
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tax_irp5s_user_year
  ON tax_irp5s (user_id, tax_year) WHERE deleted_at IS NULL;
