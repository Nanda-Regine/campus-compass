import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your Campus Compass dashboard — tasks, budget, exams, and more.',
}

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: profile },
    { data: budget },
    { data: tasks },
    { data: exams },
    { data: modules },
    { data: timetable },
    { data: recentExpenses },
    { data: subscription },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('budgets').select('*').eq('user_id', user.id).single(),
    supabase
      .from('tasks')
      .select('*, module:modules(id,name,colour)')
      .eq('user_id', user.id)
      .eq('done', false)
      .order('due_date', { ascending: true })
      .limit(10),
    supabase
      .from('exams')
      .select('*, module:modules(id,name,colour)')
      .eq('user_id', user.id)
      .gte('exam_date', new Date().toISOString().split('T')[0])
      .order('exam_date', { ascending: true })
      .limit(5),
    supabase.from('modules').select('*').eq('user_id', user.id).order('created_at'),
    supabase
      .from('timetable_entries')
      .select('*, module:modules(id,name,colour)')
      .eq('user_id', user.id),
    supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
  ])

  if (!profile?.setup_complete) redirect('/setup')

  return (
    <DashboardClient
      initialData={{
        profile: profile!,
        budget: budget!,
        tasks: tasks ?? [],
        exams: exams ?? [],
        modules: modules ?? [],
        timetable: timetable ?? [],
        recentExpenses: recentExpenses ?? [],
        subscription: subscription ?? null,
      }}
    />
  )
}
