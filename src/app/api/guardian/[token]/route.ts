export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

// GET — public endpoint: return safe read-only student summary for a guardian link
// Uses admin client to bypass RLS (token lookup is public-facing).
// Never exposes amounts, individual records, or PII beyond first name + university.
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const admin = createAdminSupabaseClient()

  // 1. Validate token
  const rawToken = params.token?.slice(0, 128) ?? ''
  if (!rawToken || !/^[a-f0-9]+$/.test(rawToken)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const { data: tokenRow } = await admin
    .from('guardian_access_tokens')
    .select('student_id, label, expires_at')
    .eq('token', rawToken)
    .single()

  if (!tokenRow) return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  if (new Date(tokenRow.expires_at as string).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 })
  }

  const studentId = tokenRow.student_id as string
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const week7Ago = new Date(now.getTime() - 7 * 86_400_000).toISOString().split('T')[0]
  const exam14Ahead = new Date(now.getTime() + 14 * 86_400_000).toISOString().split('T')[0]
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  // 2. Parallel fetch — only safe fields, no financial amounts
  const [profileRes, examsRes, sessionsRes, tasksRes, budgetRes, expensesRes, streakRes] =
    await Promise.all([
      admin.from('profiles').select('name, full_name, university, year_of_study, streak_count, emoji').eq('id', studentId).single(),
      admin.from('exams').select('exam_name, exam_date, module:modules(module_name)').eq('user_id', studentId).gte('exam_date', todayStr).lte('exam_date', exam14Ahead).order('exam_date', { ascending: true }).limit(5),
      admin.from('study_sessions').select('duration_minutes').eq('user_id', studentId).gte('started_at', `${week7Ago}T00:00:00`),
      admin.from('tasks').select('status, due_date').eq('user_id', studentId).neq('status', 'done'),
      admin.from('budgets').select('monthly_budget, nsfas_enabled, nsfas_living, nsfas_accom, nsfas_books').eq('user_id', studentId).maybeSingle(),
      admin.from('expenses').select('amount').eq('user_id', studentId).gte('expense_date', monthStart).lte('expense_date', todayStr),
      admin.from('streaks').select('current_streak').eq('user_id', studentId).maybeSingle(),
    ])

  const profile = profileRes.data
  const firstName = (profile?.name || profile?.full_name || 'Student').split(' ')[0]

  // Study hours this week
  const studyMinutes = (sessionsRes.data ?? []).reduce((s, r) => s + ((r.duration_minutes as number) ?? 0), 0)
  const studyHours = Math.round(studyMinutes / 60 * 10) / 10

  // Academic risk (task-based, no module names exposed)
  const allTasks = tasksRes.data ?? []
  const overdue = allTasks.filter(t => t.due_date && t.due_date < todayStr).length
  const academicRisk: 'safe' | 'watch' | 'critical' =
    overdue >= 5 ? 'critical' : overdue >= 2 ? 'watch' : 'safe'

  // Budget health (ratio only, no rand amounts)
  const rawBudget = budgetRes.data
  const nsfasTotal = rawBudget?.nsfas_enabled
    ? ((rawBudget.nsfas_living || 0) + (rawBudget.nsfas_accom || 0) + (rawBudget.nsfas_books || 0))
    : 0
  const totalBudget = (rawBudget?.monthly_budget || 0) + nsfasTotal
  const totalSpent = (expensesRes.data ?? []).reduce((s, e) => s + ((e.amount as number) || 0), 0)
  const spentPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : -1
  const budgetHealth: 'good' | 'watch' | 'tight' | 'unknown' =
    spentPct < 0 ? 'unknown' : spentPct < 60 ? 'good' : spentPct < 85 ? 'watch' : 'tight'

  // Upcoming exams
  const upcomingExams = (examsRes.data ?? []).map(e => ({
    name: e.exam_name as string,
    date: e.exam_date as string,
    module: (e.module as { module_name?: string } | null)?.module_name ?? null,
    daysAway: Math.ceil((new Date(e.exam_date as string).getTime() - now.getTime()) / 86_400_000),
  }))

  const streakDays = (streakRes.data?.current_streak as number | null)
    ?? (profile?.streak_count as number | null)
    ?? 0

  return NextResponse.json({
    guardianLabel: tokenRow.label as string,
    firstName,
    emoji: (profile?.emoji as string | null) ?? '🎓',
    university: profile?.university ?? null,
    yearOfStudy: profile?.year_of_study ?? null,
    streakDays,
    studyHoursThisWeek: studyHours,
    academicRisk,
    budgetHealth,
    upcomingExams,
    overdueTaskCount: overdue,
    generatedAt: now.toISOString(),
  })
}
