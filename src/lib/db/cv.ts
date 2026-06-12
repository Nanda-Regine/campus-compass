// ============================================================
// CV Builder + Career OS — Data Access Layer
// Client-side: loadCVProfile, saveCVProfile
// Table: user_cv_profile
//   id, user_id (UNIQUE), skills (text[]), activities (text[]),
//   languages (text[]), summary (text), career_path (text),
//   career_skills (text[]), updated_at
// ============================================================

import { createClient } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CVProfile {
  skills: string[]
  activities: string[]
  languages: string[]
  summary: string
  careerPath: string
  careerSkills: string[]
}

/** Shape of a row as stored in Supabase (snake_case column names). */
interface CVProfileRow {
  id: string
  user_id: string
  skills: string[] | null
  activities: string[] | null
  languages: string[] | null
  summary: string | null
  career_path: string | null
  career_skills: string[] | null
  updated_at: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMPTY_PROFILE: CVProfile = {
  skills: [],
  activities: [],
  languages: [],
  summary: '',
  careerPath: '',
  careerSkills: [],
}

function rowToProfile(row: CVProfileRow): CVProfile {
  return {
    skills: row.skills ?? [],
    activities: row.activities ?? [],
    languages: row.languages ?? [],
    summary: row.summary ?? '',
    careerPath: row.career_path ?? '',
    careerSkills: row.career_skills ?? [],
  }
}

// ---------------------------------------------------------------------------
// loadCVProfile
// Fetches the current user's CV profile row.
// Returns empty defaults when no row exists yet.
// ---------------------------------------------------------------------------

export async function loadCVProfile(): Promise<CVProfile> {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('[cv] loadCVProfile: not authenticated', authError?.message)
    return { ...EMPTY_PROFILE }
  }

  const { data, error } = await supabase
    .from('user_cv_profile')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[cv] loadCVProfile error:', error.message)
    return { ...EMPTY_PROFILE }
  }

  if (!data) {
    return { ...EMPTY_PROFILE }
  }

  return rowToProfile(data as CVProfileRow)
}

// ---------------------------------------------------------------------------
// saveCVProfile
// Upserts the current user's CV profile, merging the supplied partial data
// with whatever is already stored so callers can update a single field
// without clobbering the rest.
// Conflict target: user_id (UNIQUE constraint on the table).
// ---------------------------------------------------------------------------

export async function saveCVProfile(data: Partial<CVProfile>): Promise<void> {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error(authError?.message ?? 'Not authenticated')
  }

  // Load the existing row so we can merge rather than overwrite.
  const existing = await loadCVProfile()

  const merged: CVProfile = {
    skills:      data.skills      ?? existing.skills,
    activities:  data.activities  ?? existing.activities,
    languages:   data.languages   ?? existing.languages,
    summary:     data.summary     ?? existing.summary,
    careerPath:  data.careerPath  ?? existing.careerPath,
    careerSkills: data.careerSkills ?? existing.careerSkills,
  }

  const { error } = await supabase
    .from('user_cv_profile')
    .upsert(
      {
        user_id:      user.id,
        skills:       merged.skills,
        activities:   merged.activities,
        languages:    merged.languages,
        summary:      merged.summary,
        career_path:  merged.careerPath,
        career_skills: merged.careerSkills,
        updated_at:   new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) {
    throw new Error(`[cv] saveCVProfile error: ${error.message}`)
  }
}
