import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { incrementStreak } from './streak'

const sastDate = (ms: number) =>
  new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })
const today = sastDate(Date.now())
const yesterday = sastDate(Date.now() - 86_400_000)

// Minimal Supabase stub: a fixed profile for the select chain, and a captured
// list of update() payloads for the update chain. Shapes match the exact call
// chains incrementStreak uses (.from().select().eq().maybeSingle() and
// .from().update().eq()).
function fakeSupabase(profile: Record<string, unknown> | null) {
  const updates: Record<string, unknown>[] = []
  const client = {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile }) }) }),
      update: (vals: Record<string, unknown>) => ({
        eq: async () => { updates.push(vals); return { data: null, error: null } },
      }),
    }),
  } as unknown as SupabaseClient
  return { client, updates }
}

describe('incrementStreak', () => {
  it('returns null when there is no profile', async () => {
    const { client, updates } = fakeSupabase(null)
    expect(await incrementStreak(client, 'u1')).toBeNull()
    expect(updates).toHaveLength(0)
  })

  it('is a no-op when already active today', async () => {
    const { client, updates } = fakeSupabase({ streak_count: 5, last_activity_date: today })
    expect(await incrementStreak(client, 'u1')).toBe(5)
    expect(updates).toHaveLength(0) // no write — avoids double increment
  })

  it('increments when the last activity was yesterday', async () => {
    const { client, updates } = fakeSupabase({ streak_count: 5, last_activity_date: yesterday })
    expect(await incrementStreak(client, 'u1')).toBe(6)
    expect(updates[0]).toMatchObject({ streak_count: 6, last_activity_date: today })
  })

  it('resets to 1 after a gap (missed a day)', async () => {
    const old = sastDate(Date.now() - 10 * 86_400_000)
    const { client, updates } = fakeSupabase({ streak_count: 12, last_activity_date: old })
    expect(await incrementStreak(client, 'u1')).toBe(1)
    expect(updates[0]).toMatchObject({ streak_count: 1, last_activity_date: today })
  })

  it('starts at 1 for a first-ever activity (null last_activity_date)', async () => {
    const { client, updates } = fakeSupabase({ streak_count: 0, last_activity_date: null })
    expect(await incrementStreak(client, 'u1')).toBe(1)
    expect(updates[0]).toMatchObject({ streak_count: 1, last_activity_date: today })
  })
})
