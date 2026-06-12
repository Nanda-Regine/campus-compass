-- ─────────────────────────────────────────────────────────────
-- Migration: Campus Life OS — library check-ins, campus events
-- Run in Supabase SQL editor or via: supabase db push
-- ─────────────────────────────────────────────────────────────

-- ── 1. Library zone check-ins ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS library_checkins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution     text NOT NULL,
  zone            text NOT NULL,
  checked_in_at   timestamptz NOT NULL DEFAULT now(),
  checked_out_at  timestamptz,
  -- Only one active check-in per user at a time
  CONSTRAINT unique_active_checkin_per_user UNIQUE (user_id)
);

ALTER TABLE library_checkins ENABLE ROW LEVEL SECURITY;

-- Users can see checkins at their own institution
CREATE POLICY "Users can view checkins at their institution"
  ON library_checkins FOR SELECT
  USING (
    institution = (SELECT university FROM profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can insert own checkin"
  ON library_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkin"
  ON library_checkins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkin"
  ON library_checkins FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS library_checkins_institution_zone_idx
  ON library_checkins (institution, zone)
  WHERE checked_out_at IS NULL;

-- Auto-expire check-ins older than 8 hours via a function (run as cron or trigger)
CREATE OR REPLACE FUNCTION expire_library_checkins()
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE library_checkins
  SET checked_out_at = now()
  WHERE checked_out_at IS NULL
    AND checked_in_at < now() - INTERVAL '8 hours';
$$;

-- ── 2. Campus events ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campus_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description text CHECK (char_length(description) <= 600),
  venue       text CHECK (char_length(venue) <= 120),
  event_date  date NOT NULL,
  event_time  text,
  category    text NOT NULL DEFAULT 'general'
              CHECK (category IN ('social','academic','sport','career','cultural','general')),
  institution text,
  rsvp_count  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE campus_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events"
  ON campus_events FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create events"
  ON campus_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Event creator can delete their event"
  ON campus_events FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS campus_events_date_idx
  ON campus_events (event_date, institution);

-- ── 3. Event RSVPs ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_rsvps (
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  event_id   uuid REFERENCES campus_events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own RSVPs"
  ON event_rsvps FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RPC to toggle RSVP atomically (avoids race on rsvp_count)
CREATE OR REPLACE FUNCTION toggle_event_rsvp(p_event_id uuid)
RETURNS boolean -- true = now RSVP'd, false = un-RSVP'd
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  already boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM event_rsvps
    WHERE user_id = auth.uid() AND event_id = p_event_id
  ) INTO already;

  IF already THEN
    DELETE FROM event_rsvps
    WHERE user_id = auth.uid() AND event_id = p_event_id;
    UPDATE campus_events SET rsvp_count = GREATEST(rsvp_count - 1, 0) WHERE id = p_event_id;
    RETURN false;
  ELSE
    INSERT INTO event_rsvps (user_id, event_id) VALUES (auth.uid(), p_event_id);
    UPDATE campus_events SET rsvp_count = rsvp_count + 1 WHERE id = p_event_id;
    RETURN true;
  END IF;
END;
$$;
