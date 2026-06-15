-- TABLE 1: regulation_sessions
CREATE TABLE IF NOT EXISTS regulation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_type text NOT NULL CHECK (session_type IN ('box_breathing','physiological_sigh','478_breath','somatic_shake','vagal_toning','eye_movement','progressive_muscle')),
  duration_seconds int NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE regulation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_regulation_sessions" ON regulation_sessions FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_regulation_sessions_user ON regulation_sessions(user_id, created_at DESC);

-- TABLE 2: nervous_system_scores
CREATE TABLE IF NOT EXISTS nervous_system_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score_date date NOT NULL DEFAULT CURRENT_DATE,
  ns_score int NOT NULL CHECK (ns_score BETWEEN 0 AND 100),
  contributing_factors jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, score_date)
);
ALTER TABLE nervous_system_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_ns_scores" ON nervous_system_scores FOR ALL USING (auth.uid() = user_id);

-- TABLE 3: past_papers
CREATE TABLE IF NOT EXISTS past_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id uuid REFERENCES modules(id) ON DELETE SET NULL,
  institution text,
  module_name text NOT NULL,
  module_code text NOT NULL,
  year int NOT NULL,
  paper_type text NOT NULL CHECK (paper_type IN ('exam','test','assignment')),
  file_url text,
  extracted_text text,
  ai_insights jsonb,
  question_count int,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE past_papers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_past_papers" ON past_papers FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_past_papers_user ON past_papers(user_id, created_at DESC);

-- TABLE 4: cycle_tracking
CREATE TABLE IF NOT EXISTS cycle_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  phase text NOT NULL CHECK (phase IN ('menstrual','follicular','ovulation','luteal')),
  flow_level text CHECK (flow_level IN ('none','light','medium','heavy')),
  symptoms text[] NOT NULL DEFAULT '{}',
  energy_level int CHECK (energy_level BETWEEN 1 AND 5),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_date)
);
ALTER TABLE cycle_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_cycle_tracking" ON cycle_tracking FOR ALL USING (auth.uid() = user_id);

-- TABLE 5: safe_walk_sessions
CREATE TABLE IF NOT EXISTS safe_walk_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  destination text NOT NULL,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  duration_minutes int NOT NULL DEFAULT 20,
  started_at timestamptz NOT NULL DEFAULT now(),
  check_in_at timestamptz,
  completed boolean NOT NULL DEFAULT false,
  alert_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE safe_walk_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_safe_walk" ON safe_walk_sessions FOR ALL USING (auth.uid() = user_id);

-- TABLE 6: data_budget
CREATE TABLE IF NOT EXISTS data_budget (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month_year text NOT NULL,
  data_budget_mb int NOT NULL DEFAULT 1024,
  data_used_mb int NOT NULL DEFAULT 0,
  wifi_sessions int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);
ALTER TABLE data_budget ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_data_budget" ON data_budget FOR ALL USING (auth.uid() = user_id);

-- TABLE 7: health_conditions
CREATE TABLE IF NOT EXISTS health_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  condition_name text NOT NULL,
  condition_type text NOT NULL CHECK (condition_type IN ('chronic','acute','mental_health','reproductive','other')),
  medications text[] NOT NULL DEFAULT '{}',
  triggers text[] NOT NULL DEFAULT '{}',
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE health_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_health_conditions" ON health_conditions FOR ALL USING (auth.uid() = user_id);

-- TABLE 8: wisdom_posts
CREATE TABLE IF NOT EXISTS wisdom_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution text,
  category text NOT NULL CHECK (category IN ('nsfas','study_tips','campus_life','accommodation','lecturer','admin','wellness','finance','general')),
  title text NOT NULL,
  content text NOT NULL,
  upvotes int NOT NULL DEFAULT 0,
  is_verified boolean NOT NULL DEFAULT false,
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE wisdom_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_wisdom" ON wisdom_posts FOR SELECT USING (true);
CREATE POLICY "own_wisdom_write" ON wisdom_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_wisdom_update" ON wisdom_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX idx_wisdom_posts_inst ON wisdom_posts(institution, category, created_at DESC);

-- TABLE 9: wisdom_votes
CREATE TABLE IF NOT EXISTS wisdom_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES wisdom_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);
ALTER TABLE wisdom_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_wisdom_votes" ON wisdom_votes FOR ALL USING (auth.uid() = user_id);

-- TABLE 10: mutual_aid_requests
CREATE TABLE IF NOT EXISTS mutual_aid_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('offer','request')),
  category text NOT NULL CHECK (category IN ('textbook','notes','food','transport','tutoring','accommodation','other')),
  title text NOT NULL,
  description text NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT true,
  is_fulfilled boolean NOT NULL DEFAULT false,
  institution text,
  expiry_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE mutual_aid_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_mutual_aid" ON mutual_aid_requests FOR SELECT USING (true);
CREATE POLICY "own_mutual_aid_write" ON mutual_aid_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_mutual_aid_update" ON mutual_aid_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX idx_mutual_aid_inst ON mutual_aid_requests(institution, category, is_fulfilled);

-- TABLE 11: study_accountability
CREATE TABLE IF NOT EXISTS study_accountability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  shared_goal text NOT NULL,
  goal_deadline date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','completed','cancelled')),
  requester_checkin_date date,
  partner_checkin_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE study_accountability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_accountability" ON study_accountability FOR ALL USING (auth.uid() = requester_id OR auth.uid() = partner_id);

-- TABLE 12: walking_routes
CREATE TABLE IF NOT EXISTS walking_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution text NOT NULL,
  route_name text NOT NULL,
  description text NOT NULL,
  distance_km numeric NOT NULL,
  duration_minutes int NOT NULL,
  safety_rating int NOT NULL CHECK (safety_rating BETWEEN 1 AND 5),
  scenery_rating int NOT NULL CHECK (scenery_rating BETWEEN 1 AND 5),
  times_logged int NOT NULL DEFAULT 1,
  start_point text NOT NULL,
  end_point text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE walking_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_routes" ON walking_routes FOR SELECT USING (true);
CREATE POLICY "own_routes_write" ON walking_routes FOR INSERT WITH CHECK (auth.uid() = contributor_id);
CREATE POLICY "own_routes_update" ON walking_routes FOR UPDATE USING (auth.uid() = contributor_id);
CREATE INDEX idx_walking_routes_inst ON walking_routes(institution);

-- TABLE 13: user_values
CREATE TABLE IF NOT EXISTS user_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  values_selected text[] NOT NULL DEFAULT '{}',
  top_3 text[] NOT NULL DEFAULT '{}',
  values_statement text NOT NULL DEFAULT '',
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE user_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_user_values" ON user_values FOR ALL USING (auth.uid() = user_id);

-- TABLE 14: safety_incidents
CREATE TABLE IF NOT EXISTS safety_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution text NOT NULL,
  incident_type text NOT NULL CHECK (incident_type IN ('protest','crime','unsafe_area','harassment','gbv','other')),
  severity text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  location_description text NOT NULL,
  description text NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT true,
  is_resolved boolean NOT NULL DEFAULT false,
  upvotes int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_incidents" ON safety_incidents FOR SELECT USING (true);
CREATE POLICY "own_incidents_write" ON safety_incidents FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE INDEX idx_safety_incidents_inst ON safety_incidents(institution, created_at DESC);

-- TABLE 15: side_hustle_entries
CREATE TABLE IF NOT EXISTS side_hustle_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hustle_name text NOT NULL,
  hustle_type text NOT NULL CHECK (hustle_type IN ('tutoring','crafts','food','reselling','digital','services','other')),
  description text NOT NULL DEFAULT '',
  income_this_month numeric NOT NULL DEFAULT 0,
  hours_this_month numeric NOT NULL DEFAULT 0,
  started_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE side_hustle_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_side_hustles" ON side_hustle_entries FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_side_hustles_user ON side_hustle_entries(user_id, is_active);
