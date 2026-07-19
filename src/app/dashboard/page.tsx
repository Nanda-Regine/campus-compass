import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/dashboard/DashboardClient'
import './dashboard.css'
import { currentMonthRange, sastToday, sastDatePlus } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { start, end } = currentMonthRange()

  // Date ranges shared by the core + enhancement queries (Monday-start week).
  // All anchored to the SAST calendar day (UTC+2). Deriving these from the
  // server's UTC toISOString() shifted every range back a day during the
  // 00:00–02:00 SAST window — e.g. the exam filter dropped an exam on its
  // actual day and "this week" counts were off.
  const todayStr      = sastToday()
  const jsDay         = new Date(`${todayStr}T00:00:00Z`).getUTCDay() // 0=Sun..6=Sat
  const mondayOffset  = jsDay === 0 ? 6 : jsDay - 1
  const weekStartStr  = sastDatePlus(-mondayOffset)
  const weekEndStr    = sastDatePlus(6 - mondayOffset)
  const sevenDaysStr  = sastDatePlus(7)
  const week7AgoStr   = sastDatePlus(-7)

  // Core data (must succeed) runs alongside the enhancement data (best-effort). Folding the
  // enhancement queries into SSR removes the ~9 client-side round-trips the dashboard used to
  // fire on mount — a big win on prepaid / low-end devices, and it works under Data Saver too.
  const [core, enh] = await Promise.all([
    Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('budgets').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('tasks')
        .select('*, module:modules(id,module_name,color)')
        .eq('user_id', user.id)
        .not('status', 'eq', 'done')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(50),
      supabase
        .from('exams')
        .select('*, module:modules(id,module_name,color)')
        .eq('user_id', user.id)
        .gte('exam_date', todayStr)
        .order('exam_date', { ascending: true })
        .limit(20),
      supabase
        .from('modules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(100),
      supabase
        .from('timetable_slots')
        .select('*, module:modules(id,module_name,color)')
        .eq('user_id', user.id)
        .limit(200),
      supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('expense_date', start)
        .lte('expense_date', end)
        .order('expense_date', { ascending: false })
        .limit(10),
      supabase
        .from('income_entries')
        .select('id,source_type,label,amount,received_date,is_recurring')
        .eq('user_id', user.id)
        .gte('received_date', start)
        .order('received_date', { ascending: false })
        .limit(100),
      supabase
        .from('work_shifts')
        .select('earnings,start_time,end_time,shift_date')
        .eq('student_id', user.id)
        .eq('status', 'worked')
        .gte('shift_date', start)
        .lte('shift_date', end),
    ]),
    Promise.allSettled([
      supabase.from('meal_plans').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('week_start', weekStartStr).lte('week_start', weekEndStr),
      supabase.from('work_shifts').select('id', { count: 'exact', head: true }).eq('student_id', user.id).gte('shift_date', todayStr).lte('shift_date', sevenDaysStr),
      supabase.from('group_members').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('nsfas_disbursements').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'expected').lt('expected_date', todayStr),
      supabase.from('study_sessions').select('duration_minutes').eq('user_id', user.id).gte('started_at', `${todayStr}T00:00:00`),
      supabase.from('sleep_logs').select('bedtime,wake_time').eq('user_id', user.id).order('sleep_date', { ascending: false }).limit(1),
      supabase.from('workout_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('date', weekStartStr).is('deleted_at', null),
      supabase.from('study_sessions').select('duration_minutes').eq('user_id', user.id).gte('started_at', `${week7AgoStr}T00:00:00`),
      supabase.from('sleep_logs').select('bedtime,wake_time,sleep_date').eq('user_id', user.id).gte('sleep_date', week7AgoStr).order('sleep_date', { ascending: false }),
    ]),
  ])

  const [
    { data: profile },
    { data: budget },
    { data: tasks },
    { data: exams },
    { data: modules },
    { data: timetable },
    { data: recentExpenses },
    { data: incomeEntries },
    { data: workedShifts },
  ] = core

  // Redirect to setup if profile incomplete
  if (!profile?.onboarding_complete) redirect('/setup')

  // ── Parse the best-effort enhancement results (a failed table just yields a default) ──
  const settled = (i: number): { count?: number | null; data?: unknown } | null =>
    enh[i].status === 'fulfilled' ? (enh[i] as PromiseFulfilledResult<{ count?: number | null; data?: unknown }>).value : null
  const countAt = (i: number) => settled(i)?.count ?? 0
  const rowsAt = <T,>(i: number) => (settled(i)?.data as T[] | null) ?? []

  const sleepHrs = (bedtime: string, wake: string) => {
    const [bh, bm] = bedtime.split(':').map(Number)
    const [wh, wm] = wake.split(':').map(Number)
    let h = (wh + wm / 60) - (bh + bm / 60)
    if (h < 0) h += 24
    return h
  }

  const mealPlanExists = countAt(0) > 0
  const shiftsThisWeek = countAt(1)
  const activeGroups   = countAt(2)
  const nsfasDelayed   = countAt(3) > 0
  const weekWorkouts   = countAt(6)

  const todayStudyMins = rowsAt<{ duration_minutes: number }>(4).reduce((s, r) => s + (r.duration_minutes ?? 0), 0)

  const lastSleepRow = rowsAt<{ bedtime: string | null; wake_time: string | null }>(5)[0]
  const lastSleepHours = lastSleepRow?.bedtime && lastSleepRow?.wake_time
    ? parseFloat(sleepHrs(lastSleepRow.bedtime, lastSleepRow.wake_time).toFixed(1))
    : null

  const study7 = rowsAt<{ duration_minutes: number }>(7)
  const studyVelocity7d = study7.length > 0
    ? parseFloat((study7.reduce((s, r) => s + (r.duration_minutes ?? 0), 0) / (7 * 60)).toFixed(2))
    : 0

  let sleepDebt = 0
  for (const r of rowsAt<{ bedtime: string | null; wake_time: string | null }>(8)) {
    if (!r.bedtime || !r.wake_time) continue
    sleepDebt += Math.max(0, 7 - sleepHrs(r.bedtime, r.wake_time))
  }
  sleepDebt = parseFloat(sleepDebt.toFixed(1))

  // Compute shift earnings and weekly work hours from the month's worked shifts
  type WorkedShift = { earnings: number | null; start_time: string | null; end_time: string | null; shift_date: string }
  const shifts = (workedShifts ?? []) as WorkedShift[]
  const shiftEarnings = shifts.reduce((s, sh) => s + (sh.earnings ?? 0), 0)

  let shiftHoursThisWeek = 0
  for (const sh of shifts) {
    if (!sh.shift_date || sh.shift_date < weekStartStr) continue
    if (sh.start_time && sh.end_time) {
      const [sh2, sm] = sh.start_time.split(':').map(Number)
      const [eh, em] = sh.end_time.split(':').map(Number)
      let hrs = (eh + em / 60) - (sh2 + sm / 60)
      if (hrs < 0) hrs += 24
      shiftHoursThisWeek += hrs
    } else {
      shiftHoursThisWeek += 4  // fallback: assume 4h per untimed shift
    }
  }

  return (
    <DashboardClient
      initialData={{
        profile:             profile!,
        budget:              budget ?? null,
        tasks:               tasks ?? [],
        exams:               exams ?? [],
        modules:             modules ?? [],
        timetable:           timetable ?? [],
        recentExpenses:      recentExpenses ?? [],
        incomeEntries:       incomeEntries ?? [],
        shiftEarnings,
        shiftHoursThisWeek:  parseFloat(shiftHoursThisWeek.toFixed(1)),
        subscription:        null,
        mealPlanExists,
        shiftsThisWeek,
        activeGroups,
        nsfasDelayed,
        weekWorkouts,
        todayStudyMins,
        lastSleepHours,
        studyVelocity7d,
        sleepDebt,
      }}
    />
  )
}
