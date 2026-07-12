import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/streak — current activity streak for the user.
// A streak day = at least one completed task OR one habit check-in on that day.
// All dates are compared as SAST (UTC+2) calendar days in canonical YYYY-MM-DD.
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // SAST calendar date in YYYY-MM-DD (en-CA), matching how HabitBuilder stores
    // check-in dates — so task days and habit days union cleanly.
    const sast = (ms: number) =>
      new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })

    // 400-day window: streaks up to ~13 months are reportable (the UI advertises
    // a 100-day milestone), yet the query stays bounded (one small column, ≤400
    // unique day keys). True all-time persistence would need a longest_streak
    // column on profiles — a follow-up.
    const WINDOW_DAYS = 400
    const since = new Date()
    since.setDate(since.getDate() - WINDOW_DAYS)

    const [tasksRes, habitsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('status', 'done')
        .not('completed_at', 'is', null)
        .gte('completed_at', since.toISOString()),
      supabase
        .from('user_habits_state')
        .select('habits')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    // Union of active days from tasks + habit check-ins.
    const uniqueDates = new Set<string>()
    for (const c of tasksRes.data ?? []) {
      if (c.completed_at) uniqueDates.add(sast(new Date(c.completed_at).getTime()))
    }
    const habits = (habitsRes.data?.habits ?? []) as Array<{ checkInDates?: string[]; lastCheckedIn?: string | null }>
    for (const h of habits) {
      const dates = h.checkInDates ?? (h.lastCheckedIn ? [h.lastCheckedIn] : [])
      for (const d of dates) if (typeof d === 'string' && d) uniqueDates.add(d.slice(0, 10))
    }

    // Longest consecutive run within the window. YYYY-MM-DD sorts chronologically;
    // consecutive SAST days differ by exactly 86.4M ms when parsed at UTC midnight.
    // Previously "best" was uniqueDates.size (total active days, not consecutive),
    // which over-reported and collapsed to a low number after any gap.
    const sortedDays = [...uniqueDates].sort()
    let longestStreak = 0
    let run = 0
    let prevMs: number | null = null
    for (const day of sortedDays) {
      const ms = new Date(`${day}T00:00:00Z`).getTime()
      run = (prevMs !== null && ms - prevMs === 86_400_000) ? run + 1 : 1
      prevMs = ms
      if (run > longestStreak) longestStreak = run
    }

    if (uniqueDates.size === 0) {
      return NextResponse.json({
        streak: 0, longestStreak: 0, todayDone: false,
        last7days: Array(7).fill(false),
      })
    }

    const today = sast(Date.now())
    const yesterday = sast(Date.now() - 86400000)
    const todayDone = uniqueDates.has(today)

    // Last 7 days: index 0 = 6 days ago, index 6 = today.
    const last7days = Array.from({ length: 7 }, (_, i) =>
      uniqueDates.has(sast(Date.now() - (6 - i) * 86400000)))

    // Current streak: consecutive days ending today (or yesterday if today idle).
    let streak = 0
    let cursor = Date.now()
    if (!todayDone) {
      if (!uniqueDates.has(yesterday)) {
        return NextResponse.json({ streak: 0, longestStreak, todayDone: false, last7days })
      }
      cursor = Date.now() - 86400000
    }
    for (let i = 0; i < WINDOW_DAYS; i++) {
      if (uniqueDates.has(sast(cursor))) {
        streak++
        cursor -= 86400000
      } else break
    }

    return NextResponse.json({
      streak,
      longestStreak: Math.max(streak, longestStreak),
      todayDone,
      last7days,
      today,
      yesterday,
    })
  } catch (error) {
    console.error('Streak error:', error)
    return NextResponse.json({ streak: 0, longestStreak: 0, todayDone: false, last7days: Array(7).fill(false) })
  }
}
