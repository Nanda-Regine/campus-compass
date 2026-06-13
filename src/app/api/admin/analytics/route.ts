export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// Max student IDs to pass in a single .in() call (URL length guard)
const IN_LIMIT = 200

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify the caller is an institution admin — get institution_id from their record
    const { data: adminRow } = await supabase
      .from('institution_admins')
      .select('institution_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRow) return NextResponse.json({ error: 'Not an institution admin' }, { status: 403 })

    const admin         = createAdminSupabaseClient()
    const institutionId = adminRow.institution_id

    // ── 1. Linked students ──────────────────────────────────────────────────
    const { data: students } = await admin
      .from('profiles')
      .select('id, year_of_study')
      .eq('institution_id', institutionId)
      .limit(IN_LIMIT)

    const totalStudents = students?.length ?? 0
    const studentIds    = students?.map(s => s.id) ?? []

    // Year distribution
    const yearDist: Record<string, number> = {}
    for (const s of students ?? []) {
      const yr = s.year_of_study ? String(s.year_of_study) : 'Unknown'
      yearDist[yr] = (yearDist[yr] ?? 0) + 1
    }

    if (totalStudents === 0) {
      return NextResponse.json({
        totalStudents: 0,
        activeStudentsThisWeek: 0,
        upcomingExams7Days: 0,
        studyPodsAdoption: 0,
        tasksCompletedThisWeek: 0,
        totalTasksThisWeek: 0,
        completionRate: null,
        yearDistribution: {},
        topModules: [],
        novaSessionsThisWeek: null,
        truncated: false,
      })
    }

    const now      = new Date()
    const weekAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const in7Days  = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const todayStr = now.toISOString()

    // ── Run all aggregations in parallel, tolerate individual failures ──────
    const [taskRes, examRes, podsRes, modulesRes, novaRes] = await Promise.allSettled([

      // 2. Task activity this week (created or completed)
      admin
        .from('tasks')
        .select('user_id, status, created_at, updated_at')
        .in('user_id', studentIds)
        .or(`created_at.gte.${weekAgo},updated_at.gte.${weekAgo}`),

      // 3. Exams in next 7 days
      admin
        .from('exams')
        .select('id', { count: 'exact', head: true })
        .in('user_id', studentIds)
        .gte('exam_date', todayStr)
        .lte('exam_date', in7Days),

      // 4. Study Pods adoption
      admin
        .from('study_pod_profiles')
        .select('user_id')
        .in('user_id', studentIds)
        .eq('is_active', true),

      // 5. Module popularity (top 8)
      admin
        .from('modules')
        .select('module_code, module_name')
        .in('user_id', studentIds)
        .not('module_code', 'is', null),

      // 6. Nova conversations this week (may fail if table name differs)
      admin
        .from('nova_conversations')
        .select('user_id')
        .in('user_id', studentIds)
        .gte('created_at', weekAgo),
    ])

    // ── 2. Task metrics ─────────────────────────────────────────────────────
    let activeStudentsThisWeek = 0
    let tasksCompletedThisWeek = 0
    let totalTasksThisWeek     = 0

    if (taskRes.status === 'fulfilled' && taskRes.value.data) {
      const tasks = taskRes.value.data
      const activeSet = new Set<string>()
      for (const t of tasks) {
        activeSet.add(t.user_id)
        if (new Date(t.created_at) >= new Date(weekAgo)) totalTasksThisWeek++
        if (t.status === 'done' && new Date(t.updated_at) >= new Date(weekAgo)) tasksCompletedThisWeek++
      }
      activeStudentsThisWeek = activeSet.size
    }

    // ── 3. Exams ────────────────────────────────────────────────────────────
    const upcomingExams7Days =
      examRes.status === 'fulfilled' ? (examRes.value.count ?? 0) : 0

    // ── 4. Study Pods ────────────────────────────────────────────────────────
    const studyPodsAdoption =
      podsRes.status === 'fulfilled' ? (podsRes.value.data?.length ?? 0) : 0

    // ── 5. Top modules ───────────────────────────────────────────────────────
    const topModules: { code: string; name: string; count: number }[] = []
    if (modulesRes.status === 'fulfilled' && modulesRes.value.data) {
      const counts: Record<string, { name: string; count: number }> = {}
      for (const m of modulesRes.value.data) {
        const code = m.module_code as string
        if (!counts[code]) counts[code] = { name: (m.module_name as string | null) ?? code, count: 0 }
        counts[code].count++
      }
      topModules.push(
        ...Object.entries(counts)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 8)
          .map(([code, { name, count }]) => ({ code, name, count }))
      )
    }

    // ── 6. Nova engagement ───────────────────────────────────────────────────
    const novaSessionsThisWeek =
      novaRes.status === 'fulfilled' && novaRes.value.data
        ? new Set(novaRes.value.data.map((r: { user_id: string }) => r.user_id)).size
        : null   // null = data unavailable, UI shows "—"

    const completionRate =
      totalTasksThisWeek > 0
        ? Math.round((tasksCompletedThisWeek / totalTasksThisWeek) * 100)
        : null

    return NextResponse.json({
      totalStudents,
      activeStudentsThisWeek,
      upcomingExams7Days,
      studyPodsAdoption,
      tasksCompletedThisWeek,
      totalTasksThisWeek,
      completionRate,
      yearDistribution: yearDist,
      topModules,
      novaSessionsThisWeek,
      truncated: totalStudents >= IN_LIMIT,   // warn UI if we hit the cap
    })
  } catch (err) {
    console.error('[admin/analytics]', err)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}
