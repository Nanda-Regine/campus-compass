-- 000019: Study Pods — AI-matched peer study partners

-- Opt-in profile: student declares they want a study partner
CREATE TABLE IF NOT EXISTS study_pod_profiles (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  study_style   TEXT    NOT NULL DEFAULT 'mixed'
                CHECK (study_style IN ('silent','discussion','mixed')),
  preferred_times TEXT[] NOT NULL DEFAULT '{}',  -- ['morning','afternoon','evening','weekend']
  bio           TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Connection requests between students
CREATE TABLE IF NOT EXISTS study_pod_connections (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','declined','blocked')),
  shared_modules TEXT[]  NOT NULL DEFAULT '{}',
  match_score   INTEGER NOT NULL DEFAULT 0,
  ai_blurb      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CHECK (requester_id <> recipient_id),
  UNIQUE (requester_id, recipient_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_study_pod_profiles_user    ON study_pod_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_study_pod_profiles_active  ON study_pod_profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_study_pod_conn_requester   ON study_pod_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_study_pod_conn_recipient   ON study_pod_connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_study_pod_conn_status      ON study_pod_connections(status);

-- RLS
ALTER TABLE study_pod_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_pod_connections  ENABLE ROW LEVEL SECURITY;

-- study_pod_profiles: own row full access; others can read active profiles (for matching)
CREATE POLICY "pod_profile_own"    ON study_pod_profiles FOR ALL  USING (user_id = auth.uid());
CREATE POLICY "pod_profile_read_active" ON study_pod_profiles FOR SELECT USING (is_active = true);

-- study_pod_connections: parties can see and manage their own connections
CREATE POLICY "pod_conn_parties_read" ON study_pod_connections
  FOR SELECT USING (requester_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "pod_conn_requester_insert" ON study_pod_connections
  FOR INSERT WITH CHECK (requester_id = auth.uid());

-- Recipient accepts/declines; requester can cancel (update their own)
CREATE POLICY "pod_conn_update" ON study_pod_connections
  FOR UPDATE USING (requester_id = auth.uid() OR recipient_id = auth.uid());
