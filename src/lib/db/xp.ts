// ============================================================
// XP Engine Data Access Layer — VarsityOS
// Client-side functions for persisting XP state and daily
// challenges to Supabase.
//
// Tables:
//   user_xp_state        (id, user_id UNIQUE, total_xp,
//                         event_counts, daily_event_log,
//                         recent_gains, updated_at)
//   user_daily_challenges (id, user_id, challenge_date DATE,
//                         completed_ids text[], updated_at)
// ============================================================

import { createClient } from '@/lib/supabase/client'
import type { XPState } from '@/lib/xp-engine'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the current authenticated user id, or throws if unauthenticated. */
async function getAuthUserId(): Promise<string> {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw error ?? new Error('Not authenticated')
  }

  return user.id
}

/** The empty / default XP state used when no DB row exists yet. */
function emptyXPState(): XPState {
  return {
    totalXP: 0,
    eventCounts: {},
    dailyEventLog: {},
    recentGains: [],
    dailyChallenges: [],
  }
}

// ---------------------------------------------------------------------------
// loadXPStateFromDB
// Loads XP state for the currently authenticated user.
// Falls back to an empty state if no row exists yet.
// ---------------------------------------------------------------------------

export async function loadXPStateFromDB(): Promise<XPState> {
  const userId = await getAuthUserId()
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_xp_state')
    .select('total_xp, event_counts, daily_event_log, recent_gains')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[xp.ts] loadXPStateFromDB error:', error.message)
    return emptyXPState()
  }

  if (!data) {
    return emptyXPState()
  }

  return {
    totalXP: (data.total_xp as number) ?? 0,
    eventCounts: (data.event_counts as Record<string, number>) ?? {},
    dailyEventLog: (data.daily_event_log as Record<string, string[]>) ?? {},
    recentGains:
      (data.recent_gains as { xp: number; label: string; ts: number }[]) ?? [],
    // dailyChallenges are loaded separately via loadDailyChallengesFromDB
    dailyChallenges: [],
  }
}

// ---------------------------------------------------------------------------
// saveXPStateToDB
// Upserts the XP state row for the currently authenticated user.
// onConflict: 'user_id' — one row per user.
// ---------------------------------------------------------------------------

export async function saveXPStateToDB(state: XPState): Promise<void> {
  const userId = await getAuthUserId()
  const supabase = createClient()

  const { error } = await supabase.from('user_xp_state').upsert(
    {
      user_id: userId,
      total_xp: state.totalXP,
      event_counts: state.eventCounts,
      daily_event_log: state.dailyEventLog,
      recent_gains: state.recentGains,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    console.error('[xp.ts] saveXPStateToDB error:', error.message)
    throw new Error(error.message)
  }
}

// ---------------------------------------------------------------------------
// loadDailyChallengesFromDB
// Returns the array of completed challenge ids for the given date (YYYY-MM-DD).
// Returns [] when no row exists for that date.
// ---------------------------------------------------------------------------

export async function loadDailyChallengesFromDB(date: string): Promise<string[]> {
  const userId = await getAuthUserId()
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_daily_challenges')
    .select('completed_ids')
    .eq('user_id', userId)
    .eq('challenge_date', date)
    .maybeSingle()

  if (error) {
    console.error('[xp.ts] loadDailyChallengesFromDB error:', error.message)
    return []
  }

  if (!data) {
    return []
  }

  return (data.completed_ids as string[]) ?? []
}

// ---------------------------------------------------------------------------
// saveDailyChallengesDB
// Upserts the completed challenge ids for a given date.
// onConflict: 'user_id,challenge_date' — one row per user per day.
// ---------------------------------------------------------------------------

export async function saveDailyChallengesDB(
  date: string,
  completedIds: string[]
): Promise<void> {
  const userId = await getAuthUserId()
  const supabase = createClient()

  const { error } = await supabase.from('user_daily_challenges').upsert(
    {
      user_id: userId,
      challenge_date: date,
      completed_ids: completedIds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,challenge_date' }
  )

  if (error) {
    console.error('[xp.ts] saveDailyChallengesDB error:', error.message)
    throw new Error(error.message)
  }
}
