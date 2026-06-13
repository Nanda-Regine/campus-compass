-- 000018: Institutional onboarding
-- institutions, institution_admins, institution_invites

CREATE TABLE IF NOT EXISTS institutions (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT    NOT NULL,
  short_name    TEXT,
  domain        TEXT    NOT NULL UNIQUE,   -- e.g. wits.ac.za
  city          TEXT,
  logo_url      TEXT,
  status        TEXT    DEFAULT 'pending'
                CHECK (status IN ('pending','active','suspended')),
  contact_name  TEXT    NOT NULL,
  contact_email TEXT    NOT NULL,
  student_count_est INTEGER,
  notes         TEXT,                      -- internal VarsityOS notes
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS institution_admins (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  role           TEXT DEFAULT 'admin' CHECK (role IN ('owner','admin','viewer')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (institution_id, user_id)
);

CREATE TABLE IF NOT EXISTS institution_invites (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  token          TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'base64url'),
  domain_lock    TEXT,            -- only emails from this domain may use it
  uses_limit     INTEGER,         -- NULL = unlimited
  uses_count     INTEGER NOT NULL DEFAULT 0,
  expires_at     TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  created_by     UUID REFERENCES profiles(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Add institution_id to profiles for auto-assignment after joining
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_institution_admins_user ON institution_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_institution_admins_inst ON institution_admins(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_invites_token ON institution_invites(token);
CREATE INDEX IF NOT EXISTS idx_profiles_institution ON profiles(institution_id);

-- RLS
ALTER TABLE institutions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_invites ENABLE ROW LEVEL SECURITY;

-- institutions: visible to their own admins
CREATE POLICY "institution_admin_can_read" ON institutions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM institution_admins ia
      WHERE ia.institution_id = institutions.id
        AND ia.user_id = auth.uid()
    )
  );

-- institution_admins: users can read their own records
CREATE POLICY "my_institution_admin_records" ON institution_admins
  FOR SELECT USING (user_id = auth.uid());

-- institution_invites: institution admins can manage their invites
CREATE POLICY "institution_admin_invite_all" ON institution_invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM institution_admins ia
      WHERE ia.institution_id = institution_invites.institution_id
        AND ia.user_id = auth.uid()
    )
  );

-- Anyone (even anon) can read an invite by token to validate it before joining
CREATE POLICY "public_invite_read" ON institution_invites
  FOR SELECT USING (true);
