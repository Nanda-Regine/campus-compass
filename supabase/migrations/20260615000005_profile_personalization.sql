-- Profile personalization columns
-- Adds 5 new fields that enable OS-level customization per student

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS province          TEXT,
  ADD COLUMN IF NOT EXISTS monthly_allowance TEXT,
  ADD COLUMN IF NOT EXISTS study_schedule    TEXT,
  ADD COLUMN IF NOT EXISTS is_first_gen      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS commute_type      TEXT;

COMMENT ON COLUMN profiles.province          IS 'SA province where they study — enables load shedding schedules, local clinic info, weather';
COMMENT ON COLUMN profiles.monthly_allowance IS 'Budget range category e.g. R500-1500 — personalises meal planning and budget targets';
COMMENT ON COLUMN profiles.study_schedule    IS 'morning | afternoon | night — Nova suggests study sessions at optimal times';
COMMENT ON COLUMN profiles.is_first_gen      IS 'First-generation student — enables extra support messaging and process explanations';
COMMENT ON COLUMN profiles.commute_type      IS 'walk | taxi | car | bicycle | on_campus — impacts time planning and transport cost tracking';
