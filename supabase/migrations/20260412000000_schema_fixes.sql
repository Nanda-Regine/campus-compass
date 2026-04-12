-- =====================================================================
-- VarsityOS — Schema Fixes Migration
-- Generated: 2026-04-12
-- Run in Supabase SQL Editor
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. PROFILES → AUTH.USERS FK (ON DELETE CASCADE)
--    Ensures profile is deleted when auth user is deleted
-- ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public'
      AND table_name = 'profiles'
      AND constraint_name = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. MISSING PROFILE COLUMNS
-- ─────────────────────────────────────────────────────────────────────

-- name (display alias — some components use name, others full_name)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- emoji (avatar emoji chosen during onboarding)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '🎓';

-- degree_name (descriptive name of the degree program)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS degree_name TEXT;

-- faculty (was added in MIGRATION_PROFILE_COLUMNS.sql — safe to re-add)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faculty TEXT;

-- accommodation_type (res / off-campus / home / other)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accommodation_type TEXT;

-- dietary_preferences (array of strings)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dietary_preferences TEXT[] DEFAULT '{}';

-- languages (home languages / preferred languages)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';

-- study_style (visual / reading / kinesthetic / auditory)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS study_style TEXT;

-- biggest_challenges (array — stress, money, time, social, etc.)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS biggest_challenges TEXT[] DEFAULT '{}';

-- emergency contact info
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_number TEXT;

-- onboarding_completed (canonical boolean — mirrors onboarding_complete)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- nsfas_monthly_amount (convenience field — how much NSFAS pays per month)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nsfas_monthly_amount NUMERIC(10,2);

-- subscription_tier (mirrors plan — added for forward compatibility)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT
  CHECK (subscription_tier IN ('free','scholar','premium','nova_unlimited'))
  DEFAULT 'free';

-- dietary_pref (singular, added in MIGRATION_PROFILE_COLUMNS.sql)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dietary_pref TEXT DEFAULT 'No restrictions';

-- living_situation (added in MIGRATION_PROFILE_COLUMNS.sql)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS living_situation TEXT;

-- ai_language (for language-aware Nova responses)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_language TEXT DEFAULT 'English';

-- ─────────────────────────────────────────────────────────────────────
-- 3. SYNC name ← full_name FOR EXISTING ROWS
-- ─────────────────────────────────────────────────────────────────────
UPDATE public.profiles
SET name = full_name
WHERE name IS NULL AND full_name IS NOT NULL;

-- Sync onboarding_completed ← onboarding_complete
UPDATE public.profiles
SET onboarding_completed = onboarding_complete
WHERE onboarding_completed = false AND onboarding_complete = true;

-- Sync subscription_tier ← plan
UPDATE public.profiles
SET subscription_tier = plan
WHERE subscription_tier IS NULL OR subscription_tier = 'free';

-- ─────────────────────────────────────────────────────────────────────
-- 4. NOVA_MESSAGES — PROMPT CACHE COST MONITORING COLUMNS
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.nova_messages ADD COLUMN IF NOT EXISTS cache_creation_input_tokens INTEGER DEFAULT 0;
ALTER TABLE public.nova_messages ADD COLUMN IF NOT EXISTS cache_read_input_tokens INTEGER DEFAULT 0;
ALTER TABLE public.nova_messages ADD COLUMN IF NOT EXISTS input_tokens INTEGER DEFAULT 0;
ALTER TABLE public.nova_messages ADD COLUMN IF NOT EXISTS output_tokens INTEGER DEFAULT 0;

-- ─────────────────────────────────────────────────────────────────────
-- 5. AUTO-CREATE PROFILE TRIGGER ON AUTH.USERS INSERT
--    Creates a profile row whenever a new user signs up
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    name,
    onboarding_complete,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    false,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop old trigger if it exists under a different name
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────
-- 6. KEEP subscription_tier IN SYNC WITH plan AUTOMATICALLY
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_subscription_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.subscription_tier := NEW.plan;
  IF NEW.onboarding_complete THEN
    NEW.onboarding_completed := true;
  END IF;
  IF NEW.name IS NULL AND NEW.full_name IS NOT NULL THEN
    NEW.name := NEW.full_name;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_derived ON public.profiles;
CREATE TRIGGER trg_sync_profile_derived
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_subscription_tier();

-- ─────────────────────────────────────────────────────────────────────
-- 7. MISSING RLS: profiles DELETE policy (service role only)
-- ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY service_role_all ON public.profiles
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 8. VERIFY
-- ─────────────────────────────────────────────────────────────────────
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;
