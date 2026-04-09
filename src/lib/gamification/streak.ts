import type { SupabaseClient } from '@supabase/supabase-js'

export async function incrementStreak(supabase: SupabaseClient, userId: string): Promise<number | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_count, last_activity_date')
    .eq('id', userId)
    .single()

  if (!profile) return null

  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]
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
