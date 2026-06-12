// ============================================================
// Wellness Check-in Data Access Layer
// Client-side: saveWellnessCheckin, loadWellnessCheckins
// Server-side: getWellnessCheckins
// Table: wellness_checkins (id, user_id, date, sleep, stress,
//         social, energy, motivation, score, created_at)
// ============================================================

import { createClient } from '@/lib/supabase/client'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface CheckIn {
  id: string
  user_id: string
  date: string          // YYYY-MM-DD
  sleep: number         // 1-5
  stress: number        // 1-5
  social: number        // 1-5
  energy: number        // 1-5
  motivation: number    // 1-5
  score: number         // 0-100
  created_at: string
}

type CheckInInput = Pick<
  CheckIn,
  'date' | 'sleep' | 'stress' | 'social' | 'energy' | 'motivation' | 'score'
>

// ---------------------------------------------------------------------------
// CLIENT-SIDE: saveWellnessCheckin
// Upserts a check-in for the currently authenticated user.
// Conflict target: (user_id, date) — one record per user per day.
// ---------------------------------------------------------------------------

export async function saveWellnessCheckin(
  data: CheckInInput
): Promise<{ error: Error | null }> {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: authError ?? new Error('Not authenticated') }
  }

  const { error } = await supabase
    .from('wellness_checkins')
    .upsert(
      {
        user_id: user.id,
        date: data.date,
        sleep: data.sleep,
        stress: data.stress,
        social: data.social,
        energy: data.energy,
        motivation: data.motivation,
        score: data.score,
      },
      { onConflict: 'user_id,date' }
    )

  return { error: error ? new Error(error.message) : null }
}

// ---------------------------------------------------------------------------
// CLIENT-SIDE: loadWellnessCheckins
// Returns the last 30 check-ins for the current user, newest first.
// ---------------------------------------------------------------------------

export async function loadWellnessCheckins(): Promise<{
  data: CheckIn[]
  error: Error | null
}> {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      data: [],
      error: authError ?? new Error('Not authenticated'),
    }
  }

  const { data, error } = await supabase
    .from('wellness_checkins')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  return {
    data: (data as CheckIn[]) ?? [],
    error: error ? new Error(error.message) : null,
  }
}

// ---------------------------------------------------------------------------
// SERVER-SIDE: getWellnessCheckins
// Returns all check-ins for a given userId — intended for Server Components,
// API routes, and server actions where the userId is already known.
// ---------------------------------------------------------------------------

export async function getWellnessCheckins(userId: string): Promise<{
  data: CheckIn[]
  error: Error | null
}> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('wellness_checkins')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  return {
    data: (data as CheckIn[]) ?? [],
    error: error ? new Error(error.message) : null,
  }
}
