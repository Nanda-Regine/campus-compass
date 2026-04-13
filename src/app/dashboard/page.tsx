import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/dashboard/DashboardClient'
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
  ])

  // Redirect to setup if profile incomplete
  if (!profile?.onboarding_complete) redirect('/setup')

  return (
    <DashboardClient
      initialData={{
        profile:        profile!,
        budget:         budget ?? null,
        tasks:          tasks ?? [],
        exams:          exams ?? [],
        modules:        modules ?? [],
        timetable:      timetable ?? [],
        recentExpenses: recentExpenses ?? [],
        incomeEntries:  incomeEntries ?? [],
        subscription:   null,
      }}
    />
  )
}
