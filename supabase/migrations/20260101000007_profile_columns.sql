-- =============================================
-- VarsityOS — Missing Profile Columns Migration
-- Run this in Supabase SQL editor AFTER full-new-schema.sql + MIGRATION_NOVA_UNLIMITED.sql
-- Date: 2026-04-10
-- =============================================
-- Adds columns that the app code expects but are not present
-- in full-new-schema.sql or MIGRATION_NOVA_UNLIMITED.sql
-- =============================================

-- ─────────────────────────────────────────────
-- 1. AI response language preference
--    Used by: Nova, meals, study assist, budget insights, check-in
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_language TEXT NOT NULL DEFAULT 'English';

-- ─────────────────────────────────────────────
-- 2. Dietary preference
--    Used by: meals/recipe API, MealsClient, ProfileClient
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dietary_pref TEXT NOT NULL DEFAULT 'No restrictions';

-- ─────────────────────────────────────────────
-- 3. Living situation (res, off-campus, home)
--    Used by: meals/recipe API, ProfileClient
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS living_situation TEXT;

-- ─────────────────────────────────────────────
-- 4. Faculty / department
--    Used by: budget/insights NSFAS appeal, study/assist, SetupFlow, ProfileClient
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS faculty TEXT;

-- ─────────────────────────────────────────────
-- 5. Verify — should now show all new columns
-- ─────────────────────────────────────────────
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'profiles'
  AND column_name  IN ('ai_language', 'dietary_pref', 'living_situation', 'faculty', 'name', 'emoji', 'subscription_tier')
ORDER BY column_name;
