-- ============================================================
-- Mentor Network + Textbook Marketplace tables
-- Both were referenced by components but never migrated.
-- ============================================================

-- ─── Mentor Profiles ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mentor_profiles (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  display_name  text NOT NULL,
  institution   text NOT NULL,
  degree        text NOT NULL,
  grad_year     int,
  career_field  text NOT NULL DEFAULT 'Technology',
  company       text,
  job_title     text,
  bio           text CHECK (char_length(bio) <= 500),
  linkedin_url  text,
  available_for text[] NOT NULL DEFAULT '{}',
  response_rate int NOT NULL DEFAULT 100 CHECK (response_rate BETWEEN 0 AND 100),
  total_mentees int NOT NULL DEFAULT 0,
  is_active     bool NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mentors_select_authenticated"
  ON mentor_profiles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "mentors_insert_own"
  ON mentor_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mentors_update_own"
  ON mentor_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

-- ─── Mentor Requests ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mentor_requests (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id   uuid REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
  mentee_id   uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  topic       text NOT NULL DEFAULT 'career_chat',
  message     text,
  status      text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','accepted','declined','completed','cancelled')),
  mentor_note text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (mentor_id, mentee_id)
);

ALTER TABLE mentor_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mentor_requests_select"
  ON mentor_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = mentee_id OR auth.uid() = (
    SELECT user_id FROM mentor_profiles WHERE id = mentor_id LIMIT 1
  ));

CREATE POLICY "mentor_requests_insert"
  ON mentor_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "mentor_requests_update_mentor"
  ON mentor_requests FOR UPDATE
  TO authenticated USING (auth.uid() = (
    SELECT user_id FROM mentor_profiles WHERE id = mentor_id LIMIT 1
  ));

-- ─── Textbook Listings ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS textbook_listings (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title        text NOT NULL,
  author       text,
  edition      text,
  subject      text,
  isbn         text,
  university   text,
  price_cents  int NOT NULL DEFAULT 0,
  condition    text NOT NULL DEFAULT 'good'
                   CHECK (condition IN ('new','like_new','good','fair','poor')),
  listing_type text NOT NULL DEFAULT 'sell'
                   CHECK (listing_type IN ('sell','swap','free')),
  description  text,
  is_sold      bool NOT NULL DEFAULT false,
  deleted_at   timestamptz,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE textbook_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "textbooks_select_authenticated"
  ON textbook_listings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "textbooks_insert_own"
  ON textbook_listings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "textbooks_update_own"
  ON textbook_listings FOR UPDATE
  TO authenticated USING (auth.uid() = seller_id);

-- ─── Textbook Interests ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS textbook_interests (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid REFERENCES textbook_listings(id) ON DELETE CASCADE NOT NULL,
  buyer_id   uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message    text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (listing_id, buyer_id)
);

ALTER TABLE textbook_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "textbook_interests_select"
  ON textbook_interests FOR SELECT
  TO authenticated
  USING (
    auth.uid() = buyer_id OR
    auth.uid() = (SELECT seller_id FROM textbook_listings WHERE id = listing_id LIMIT 1)
  );

CREATE POLICY "textbook_interests_insert"
  ON textbook_interests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = buyer_id);
