import type { SupabaseClient } from '@supabase/supabase-js'

export async function incrementStreak(supabase: SupabaseClient, userId: string): Promise<number | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_count, last_activity_date')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) return null

  // Use SAST calendar dates (UTC+2), not UTC. toISOString() rolls the day over at
  // 22:00 SAST, which breaks/skips streaks for students studying late at night.
  const sastDate = (ms: number) =>
    new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })
  const today     = sastDate(Date.now())
  const yesterday = sastDate(Date.now() - 86_400_000)
  const lastActivity = profile.last_activity_date as string | null

  if (lastActivity === today) return profile.streak_count as number // already done today

  const newStreak = lastActivity === yesterday
    ? (profile.streak_count as number) + 1
    : 1

  await supabase
    .from('profiles')
    .update({ streak_count: newStreak, last_activity_date: today })
    .eq('id', userId)

  return newStreak
}
