-- ─────────────────────────────────────────────────────────────
-- Migration: Notes view_count + Feed moderation + Tutor verification
-- Run in Supabase SQL editor or via: supabase db push
-- ─────────────────────────────────────────────────────────────

-- 1. Add view_count to community_notes
ALTER TABLE community_notes
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS community_notes_view_count_idx
  ON community_notes (view_count DESC);

CREATE INDEX IF NOT EXISTS community_notes_save_count_idx
  ON community_notes (save_count DESC);

-- RPC to increment view count atomically (avoids race conditions)
CREATE OR REPLACE FUNCTION increment_note_view(p_note_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE community_notes
  SET view_count = view_count + 1
  WHERE id = p_note_id;
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Campus Feed moderation — post_reports table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES campus_posts(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason      text NOT NULL CHECK (reason IN ('spam','harassment','hate_speech','misinformation','other')),
  details     text,
  resolved    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, reporter_id)
);

ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reports, admins can see all
CREATE POLICY "Users can report posts"
  ON post_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON post_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update reports"
  ON post_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Index for admin view: unresolved reports first
CREATE INDEX IF NOT EXISTS post_reports_unresolved_idx
  ON post_reports (resolved, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 3. is_admin flag on profiles (for moderation)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────────────────────
-- 4. Tutor verification columns
-- ─────────────────────────────────────────────────────────────
ALTER TABLE tutor_profiles
  ADD COLUMN IF NOT EXISTS is_verified         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified_pending boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS student_card_url    text;

-- Storage bucket for student card uploads (run separately in Supabase SQL editor):
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('student-cards', 'student-cards', false)
--   ON CONFLICT DO NOTHING;
--
-- Storage RLS — authenticated users can upload to their own folder:
-- CREATE POLICY "Users upload own card"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'student-cards' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- Admins can read all cards:
-- CREATE POLICY "Admins read all cards"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'student-cards' AND
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Storage bucket for student card uploads (run separately if needed):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('student-cards', 'student-cards', false)
-- ON CONFLICT DO NOTHING;
