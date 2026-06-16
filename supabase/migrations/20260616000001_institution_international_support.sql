-- ============================================================
-- Migration 000026: Institution type + International student support
-- Adds institution_type, student_status, country_of_origin,
-- study_permit_expiry, tvet_qualification to profiles.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS institution_type  TEXT DEFAULT 'university'
    CHECK (institution_type IN ('university', 'tvet', 'private', 'unisa')),
  ADD COLUMN IF NOT EXISTS student_status    TEXT DEFAULT 'sa_citizen'
    CHECK (student_status IN ('sa_citizen', 'permanent_resident', 'sadc_citizen', 'international')),
  ADD COLUMN IF NOT EXISTS country_of_origin TEXT,
  ADD COLUMN IF NOT EXISTS study_permit_expiry DATE,
  ADD COLUMN IF NOT EXISTS tvet_qualification  TEXT
    CHECK (tvet_qualification IN ('nated', 'ncv', NULL));

-- Index for cohort queries (institution_type-aware filtering)
CREATE INDEX IF NOT EXISTS idx_profiles_institution_type ON profiles(institution_type);
CREATE INDEX IF NOT EXISTS idx_profiles_student_status   ON profiles(student_status);

COMMENT ON COLUMN profiles.institution_type IS
  'university=public uni, tvet=TVET college, private=private HEI, unisa=distance';
COMMENT ON COLUMN profiles.student_status IS
  'sa_citizen=RSA ID, permanent_resident=PR, sadc_citizen=SADC national, international=study permit holder';
COMMENT ON COLUMN profiles.tvet_qualification IS
  'nated=N1-N6 Nated programmes, ncv=NCV Level 2-4';
