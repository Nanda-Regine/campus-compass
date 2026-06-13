// ============================================================
// VarsityOS — Intelligence Field Sync
// Re-fetches computed AppStore intelligence fields from
// Supabase after the relevant signal fires, so StudentState
// always has fresh data regardless of which page the student
// is on when they take an action.
//
// Called from:
//   - initOrchestration() signal handlers (signals.ts)
//   - DashboardClient on mount (initial population)
//
// Each function is a fire-and-forget async. When it updates
// the AppStore, the useAppStore.subscribe in initOrchestration
// automatically triggers runRecompute — no explicit call needed.
// ============================================================

import { useAppStore } from '@/store'

// ─── Sleep debt ───────────────────────────────────────────────
// 7h target per night; debt = sum(max(0, 7 - actual)) over logged nights

export async function refreshSleepDebt(): Promise<void> {
  const userId = useAppStore.getState().userId
  if (!userId || typeof window === 'undefined') return
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const week7Ago = new Date(Date.now() - 7 * 86_400_000).toISOString().split('T')[0]
    const { data: rows } = await supabase
      .from('sleep_logs')
      .select('bedtime,wake_time')
      .eq('user_id', userId)
      .gte('sleep_date', week7Ago)
    if (!rows) return
    let debt = 0
    for (const row of rows as Array<{ bedtime: string | null; wake_time: string | null }>) {
      if (!row.bedtime || !row.wake_time) continue
      const [bh, bm] = row.bedtime.split(':').map(Number)
      const [wh, wm] = row.wake_time.split(':').map(Number)
      let hrs = (wh + wm / 60) - (bh + bm / 60)
      if (hrs < 0) hrs += 24
      debt += Math.max(0, 7 - hrs)
    }
    useAppStore.getState().setSleepDebt(parseFloat(debt.toFixed(1)))
  } catch { /* silent — non-critical */ }
}

// ─── Study velocity ───────────────────────────────────────────
// avg study hours/day over the last 7 days

export async function refreshStudyVelocity(): Promise<void> {
  const userId = useAppStore.getState().userId
  if (!userId || typeof window === 'undefined') return
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const week7Ago = new Date(Date.now() - 7 * 86_400_000).toISOString().split('T')[0]
    const { data: rows } = await supabase
      .from('study_sessions')
      .select('duration_minutes')
      .eq('user_id', userId)
      .gte('started_at', `${week7Ago}T00:00:00`)
    const totalMins = (rows ?? []).reduce(
      (s, r) => s + ((r as { duration_minutes: number }).duration_minutes ?? 0), 0
    )
    useAppStore.getState().setStudyVelocity7d(parseFloat((totalMins / (7 * 60)).toFixed(2)))
  } catch { /* silent */ }
}

// ─── Study streak ─────────────────────────────────────────────
// Calls /api/streak; clears the session cache so next
// page load doesn't serve stale data.

export async function refreshStreak(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const res = await fetch('/api/streak')
    if (!res.ok) return
    const d = await res.json()
    if (d?.error) return
    const store = useAppStore.getState()
    store.setStreakDays(d.streak ?? 0)
    store.setStreakTodayDone(d.todayDone ?? false)
    const today = new Date().toISOString().split('T')[0]
    try { sessionStorage.removeItem(`streak_${today}`) } catch { /* quota */ }
  } catch { /* silent */ }
}

// ─── NSFAS delayed status ─────────────────────────────────────
// Any expected disbursement whose expected_date has passed

export async function refreshNsfas(): Promise<void> {
  const userId = useAppStore.getState().userId
  if (!userId || typeof window === 'undefined') return
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const todayStr = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('nsfas_disbursements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'expected')
      .lt('expected_date', todayStr)
    useAppStore.getState().setNsfasDelayed((count ?? 0) > 0)
  } catch { /* silent */ }
}
