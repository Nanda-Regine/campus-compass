export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ─── Types ─────────────────────────────────────────────────────

interface WeekBucket {
  label: string           // "Week of Jun 2"
  sleepAvg: number        // avg nightly hours (0 = no data)
  studyHrs: number        // total study hours
  completionPct: number   // -1 = no tasks due that week
}

interface Insight {
  key: string
  text: string
  detail: string
  strength: 'strong' | 'moderate' | 'weak'
}

// ─── Helpers ───────────────────────────────────────────────────

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0
}

function formatHour(h: number): string {
  if (h === 0)  return '12am'
  if (h < 12)  return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

// ─── GET /api/insights/correlations ────────────────────────────

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000)
  const thirtyDaysAgoStr = isoDate(thirtyDaysAgo)
  const todayStr = isoDate(now)

  // Parallel fetch of all 3 data sources
  const [sleepRes, studyRes, tasksRes] = await Promise.allSettled([
    supabase
      .from('sleep_logs')
      .select('sleep_date, bedtime, wake_time')
      .eq('user_id', user.id)
      .gte('sleep_date', thirtyDaysAgoStr)
      .lte('sleep_date', todayStr),
    supabase
      .from('study_sessions')
      .select('started_at, duration_minutes')
      .eq('user_id', user.id)
      .gte('started_at', `${thirtyDaysAgoStr}T00:00:00`)
      .lte('started_at', `${todayStr}T23:59:59`),
    supabase
      .from('tasks')
      .select('due_date, status')
      .eq('user_id', user.id)
      .gte('due_date', thirtyDaysAgoStr)
      .lte('due_date', todayStr)
      .not('due_date', 'is', null),
  ])

  const sleepRows = sleepRes.status === 'fulfilled' ? (sleepRes.value.data ?? []) : []
  const studyRows = studyRes.status === 'fulfilled' ? (studyRes.value.data ?? []) : []
  const taskRows  = tasksRes.status === 'fulfilled' ? (tasksRes.value.data ?? []) : []

  // ── Build week buckets: 4 complete weeks ending yesterday ──
  const buckets: WeekBucket[] = Array.from({ length: 4 }, (_, i) => {
    const weekEnd = new Date(now.getTime() - (i * 7 + 1) * 86_400_000)
    const weekStart = new Date(weekEnd.getTime() - 6 * 86_400_000)
    const ws = isoDate(weekStart)
    const we = isoDate(weekEnd)

    // Sleep avg for this week
    const weekSleepRows = sleepRows.filter(r => r.sleep_date >= ws && r.sleep_date <= we)
    let sleepAvg = 0
    if (weekSleepRows.length > 0) {
      const hoursArr = weekSleepRows
        .filter(r => r.bedtime && r.wake_time)
        .map(r => {
          const [bh, bm] = (r.bedtime as string).split(':').map(Number)
          const [wh, wm] = (r.wake_time as string).split(':').map(Number)
          let hrs = (wh + wm / 60) - (bh + bm / 60)
          if (hrs < 0) hrs += 24
          return hrs
        })
      if (hoursArr.length > 0) sleepAvg = avg(hoursArr)
    }

    // Study hours for this week
    const weekStudyRows = studyRows.filter(r => {
      const d = isoDate(new Date(r.started_at as string))
      return d >= ws && d <= we
    })
    const studyHrs = weekStudyRows.reduce((s, r) => s + ((r.duration_minutes as number) ?? 0), 0) / 60

    // Task completion for this week
    const weekTasks = taskRows.filter(r => (r.due_date as string) >= ws && (r.due_date as string) <= we)
    const completionPct = weekTasks.length > 0
      ? Math.round(weekTasks.filter(r => r.status === 'done').length / weekTasks.length * 100)
      : -1

    const label = `Week of ${weekStart.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}`
    return { label, sleepAvg, studyHrs, completionPct }
  }).reverse() // chronological order

  // ── Compute insights ───────────────────────────────────────
  const insights: Insight[] = []

  // Insight 1: Sleep → task completion correlation
  const highSleepWeeks = buckets.filter(w => w.sleepAvg >= 7 && w.completionPct >= 0)
  const lowSleepWeeks  = buckets.filter(w => w.sleepAvg > 0 && w.sleepAvg < 7 && w.completionPct >= 0)
  if (highSleepWeeks.length >= 1 && lowSleepWeeks.length >= 1) {
    const highAvg = Math.round(avg(highSleepWeeks.map(w => w.completionPct)))
    const lowAvg  = Math.round(avg(lowSleepWeeks.map(w => w.completionPct)))
    const delta   = highAvg - lowAvg
    if (delta >= 5) {
      insights.push({
        key:      'sleep_completion',
        text:     `In weeks where you sleep 7h+, your task completion is ${delta}% higher`,
        detail:   `${highAvg}% on well-rested weeks vs ${lowAvg}% on sleep-deprived weeks`,
        strength: delta >= 25 ? 'strong' : delta >= 12 ? 'moderate' : 'weak',
      })
    }
  }

  // Insight 2: Study hours → completion correlation
  const highStudyWeeks = buckets.filter(w => w.studyHrs >= 7 && w.completionPct >= 0)
  const lowStudyWeeks  = buckets.filter(w => w.studyHrs > 0 && w.studyHrs < 7 && w.completionPct >= 0)
  if (highStudyWeeks.length >= 1 && lowStudyWeeks.length >= 1) {
    const highAvg = Math.round(avg(highStudyWeeks.map(w => w.completionPct)))
    const lowAvg  = Math.round(avg(lowStudyWeeks.map(w => w.completionPct)))
    const delta   = highAvg - lowAvg
    if (delta >= 10) {
      insights.push({
        key:      'study_completion',
        text:     `Weeks with 7h+ of study show ${delta}% better task completion`,
        detail:   `${highAvg}% vs ${lowAvg}% in low-study weeks — consistency is the multiplier`,
        strength: delta >= 30 ? 'strong' : delta >= 15 ? 'moderate' : 'weak',
      })
    }
  }

  // Insight 3: Peak study time window
  if (studyRows.length >= 5) {
    const hourCounts = new Array(24).fill(0)
    studyRows.forEach(r => {
      const h = new Date(r.started_at as string).getHours()
      hourCounts[h]++
    })
    let maxCount = 0, peakHour = 9
    for (let h = 0; h < 22; h++) {
      const count = hourCounts[h] + hourCounts[h + 1]
      if (count > maxCount) { maxCount = count; peakHour = h }
    }
    const peakPct = Math.round(maxCount / studyRows.length * 100)
    if (peakPct >= 35) {
      insights.push({
        key:      'peak_study_time',
        text:     `${peakPct}% of your study sessions start between ${formatHour(peakHour)} and ${formatHour(peakHour + 2)}`,
        detail:   'Protect this window — it is your natural deep-work zone',
        strength: peakPct >= 60 ? 'strong' : peakPct >= 45 ? 'moderate' : 'weak',
      })
    }
  }

  // Sort by strength
  const strengthOrder = { strong: 0, moderate: 1, weak: 2 }
  insights.sort((a, b) => strengthOrder[a.strength] - strengthOrder[b.strength])

  const totalDataPoints = sleepRows.length + studyRows.length + taskRows.length
  return NextResponse.json({
    insights: insights.slice(0, 3),
    buckets,
    insufficientData: insights.length === 0,
    dataPoints: totalDataPoints,
  })
}
