-- ============================================================
-- Movement OS — saved routes + campus lift club
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_routes (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  label          text NOT NULL,
  from_address   text NOT NULL,
  to_address     text NOT NULL,
  transport_type text NOT NULL DEFAULT 'taxi'
                      CHECK (transport_type IN ('taxi','bus','walk','uber','lift_club','campus_shuttle','minibus')),
  estimated_minutes int,
  fare_rands     numeric(8,2),
  is_default     bool NOT NULL DEFAULT false,
  deleted_at     timestamptz,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE saved_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_routes_own"
  ON saved_routes FOR ALL
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── Lift Club ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lift_club_posts (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  university       text NOT NULL,
  from_location    text NOT NULL,
  to_location      text NOT NULL,
  departure_time   timestamptz NOT NULL,
  seats_available  int NOT NULL DEFAULT 1 CHECK (seats_available BETWEEN 1 AND 8),
  fare_rands       numeric(8,2),
  recurring        text NOT NULL DEFAULT 'once'
                        CHECK (recurring IN ('once','daily','weekdays')),
  contact_whatsapp text,
  is_active        bool NOT NULL DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE lift_club_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lift_club_select_university"
  ON lift_club_posts FOR SELECT
  TO authenticated USING (is_active = true);

CREATE POLICY "lift_club_insert_own"
  ON lift_club_posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lift_club_update_own"
  ON lift_club_posts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);
