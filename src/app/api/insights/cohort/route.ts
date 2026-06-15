export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

// GET /api/insights/cohort
// Returns anonymous percentile ranks vs same-degree peers at the same university.
// Privacy: only aggregate counts returned, never individual rows.
// Requires >= 5 peers to show data (anonymity threshold).
export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminSupabaseClient()

  // Get student's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('university, degree, year_of_study, streak_count')
    .eq('id', user.id)
    .single()

  if (!profile?.university || !profile?.degree || !profile?.year_of_study) {
    return NextResponse.json({ insufficient: true, reason: 'profile_incomplete' })
  }

  const now = new Date()
  const week7Ago = new Date(now.getTime() - 7 * 86_400_000).toISOString()
  const week30Ago = new Date(now.getTime() - 30 * 86_400_000).toISOString().split('T')[0]

  // Get cohort peers (same degree + year + university, excluding self)
  const { data: peers } = await admin
    .from('profiles')
    .select('id, streak_count')
    .eq('university', profile.university)
    .eq('degree', profile.degree)
    .eq('year_of_study', profile.year_of_study)
    .neq('id', user.id)
    .limit(500)  // cap for performance

  const cohortSize = (peers ?? []).length

  if (cohortSize < 5) {
    return NextResponse.json({ insufficient: true, reason: 'cohort_too_small', cohortSize })
  }

  // ── Streak percentile ─────────────────────────────────────────
  const myStreak = (profile.streak_count as number) ?? 0
  const peerStreaks = (peers ?? []).map(p => (p.streak_count as number) ?? 0)
  const streakPercentile = computePercentile(myStreak, peerStreaks)

  // ── Study velocity percentile (last 7 days) ───────────────────
  // Cap peer IDs for downstream .in() queries — 100 is statistically sufficient
  // for percentile estimates and prevents URL/query size blowout at 500 peers.
  const peerIds = (peers ?? []).map(p => p.id as string).slice(0, 100)

  const { data: peerSessions } = await admin
    .from('study_sessions')
    .select('user_id, duration_minutes')
    .in('user_id', peerIds)
    .gte('started_at', week7Ago)

  const { data: mySessions } = await supabase
    .from('study_sessions')
    .select('duration_minutes')
    .eq('user_id', user.id)
    .gte('started_at', week7Ago)

  const myStudyMins = (mySessions ?? []).reduce((s, r) => s + ((r.duration_minutes as number) ?? 0), 0)

  // Group peer sessions by user_id and sum
  const peerStudyTotals: Record<string, number> = {}
  for (const s of peerSessions ?? []) {
    const uid = s.user_id as string
    peerStudyTotals[uid] = (peerStudyTotals[uid] ?? 0) + ((s.duration_minutes as number) ?? 0)
  }
  // Peers with no sessions at all get 0
  const peerStudyMins = peerIds.map(id => peerStudyTotals[id] ?? 0)
  const studyPercentile = computePercentile(myStudyMins, peerStudyMins)

  // ── Task completion percentile (last 30 days) ─────────────────
  const { data: peerTasks } = await admin
    .from('tasks')
    .select('user_id, status, due_date')
    .in('user_id', peerIds)
    .gte('due_date', week30Ago)
    .not('due_date', 'is', null)

  const { data: myTasks } = await supabase
    .from('tasks')
    .select('status, due_date')
    .eq('user_id', user.id)
    .gte('due_date', week30Ago)
    .not('due_date', 'is', null)

  function completionPct(tasks: { status: string }[]): number {
    if (!tasks.length) return -1
    return tasks.filter(t => t.status === 'done').length / tasks.length * 100
  }

  const myCompletion = completionPct(myTasks ?? [])

  const peerTaskMap: Record<string, { status: string }[]> = {}
  for (const t of peerTasks ?? []) {
    const uid = t.user_id as string
    if (!peerTaskMap[uid]) peerTaskMap[uid] = []
    peerTaskMap[uid].push({ status: t.status as string })
  }
  const peerCompletions = peerIds
    .map(id => completionPct(peerTaskMap[id] ?? []))
    .filter(v => v >= 0)

  const completionPercentile = myCompletion >= 0 && peerCompletions.length >= 5
    ? computePercentile(myCompletion, peerCompletions)
    : null

  return NextResponse.json({
    cohortSize,
    cohortLabel: `${profile.degree} · Year ${profile.year_of_study}`,
    university: profile.university,
    metrics: {
      streak: {
        myValue:    myStreak,
        percentile: streakPercentile,
        label:      'Study streak',
        unit:       'days',
      },
      studyVelocity: {
        myValue:    Math.round(myStudyMins / 60 * 10) / 10,
        percentile: studyPercentile,
        label:      'Study hours (7 days)',
        unit:       'hrs',
      },
      ...(completionPercentile !== null ? {
        taskCompletion: {
          myValue:    Math.round(myCompletion),
          percentile: completionPercentile,
          label:      'Task completion (30 days)',
          unit:       '%',
        },
      } : {}),
    },
  })
}

// Returns what percentile `value` is in relative to `peers`.
// e.g. 75 means "better than 75% of peers"
function computePercentile(value: number, peers: number[]): number {
  if (peers.length === 0) return 50
  const below = peers.filter(p => p < value).length
  return Math.round((below / peers.length) * 100)
}
