-- ─────────────────────────────────────────────────────────────────────────────
-- Hot-path indexes (2026-07-19 scale audit)
--
-- Live-DB index check (via Management API) found the hottest user-filtered tables
-- already indexed EXCEPT `modules` and `timetable_slots`, which had only their
-- primary key. Both are filtered by user_id on every dashboard/study load and
-- embedded widely (module:modules(...)). Added here so a fresh DB matches live.
--
-- Also adds a composite index for the campus feed's combined institution-filter +
-- created_at-order query (live had two separate single-column indexes; the
-- composite lets Postgres satisfy filter+sort from one index).
--
-- All IF NOT EXISTS — safe to re-run and safe against the live DB.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_modules_user_id
  ON public.modules (user_id);

CREATE INDEX IF NOT EXISTS idx_timetable_slots_user_id
  ON public.timetable_slots (user_id);

CREATE INDEX IF NOT EXISTS idx_campus_posts_institution_created
  ON public.campus_posts (institution, created_at DESC);
