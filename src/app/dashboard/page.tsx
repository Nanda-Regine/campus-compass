import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/dashboard/DashboardClient'
import './dashboard.css'
import { currentMonthRange } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch all dashboard data in parallel
  const { start, end } = currentMonthRange()

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
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('budgets').select('*').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('tasks')
      .select('*, module:modules(id,module_name,color)')
      .eq('user_id', user.id)
      .not('status', 'eq', 'done')
      .order('due_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('exams')
      .select('*, module:modules(id,module_name,color)')
      .eq('user_id', user.id)
      .gte('exam_date', new Date().toISOString().split('T')[0])
      .order('exam_date', { ascending: true }),
    supabase
      .from('modules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('timetable_slots')
      .select('*, module:modules(id,module_name,color)')
      .eq('user_id', user.id),
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
      .order('received_date', { ascending: false }),
    supabase
      .from('work_shifts')
      .select('earnings,start_time,end_time,shift_date')
      .eq('student_id', user.id)
      .eq('status', 'worked')
      .gte('shift_date', start)
      .lte('shift_date', end),
  ])

  // Redirect to setup if profile incomplete
  if (!profile?.onboarding_complete) redirect('/setup')

  // Compute shift earnings and weekly work hours from the month's worked shifts
  type WorkedShift = { earnings: number | null; start_time: string | null; end_time: string | null; shift_date: string }
  const shifts = (workedShifts ?? []) as WorkedShift[]
  const shiftEarnings = shifts.reduce((s, sh) => s + (sh.earnings ?? 0), 0)

  // Compute hours for THIS week only (to seed the burnout calculation)
  const now = new Date()
  const jsDay = now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - (jsDay === 0 ? 6 : jsDay - 1))
  weekStart.setHours(0, 0, 0, 0)
  const weekStartStr = weekStart.toISOString().split('T')[0]

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
      }}
    />
  )
}
