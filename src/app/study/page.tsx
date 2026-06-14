import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import StudyClient from '@/components/study/StudyClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Study Planner' }

export default async function StudyPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const rangeStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const rangeEnd   = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [
    { data: modules },
    { data: tasks },
    { data: timetable },
    { data: exams },
    { data: workShifts },
    { data: calendarEvents },
  ] = await Promise.all([
    supabase
      .from('modules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('tasks')
      .select('*, module:modules(id,module_name,color)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('timetable_slots')
      .select('*, module:modules(id,module_name,color)')
      .eq('user_id', user.id),
    supabase
      .from('exams')
      .select('*, module:modules(id,module_name,color)')
      .eq('user_id', user.id)
      .order('exam_date', { ascending: true }),
    supabase
      .from('work_shifts')
      .select('*, job:part_time_jobs(id,employer_name,role_title,hourly_rate)')
      .eq('student_id', user.id)
      .gte('shift_date', rangeStart)
      .order('shift_date', { ascending: true }),
    supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('event_date', rangeStart)
      .lte('event_date', rangeEnd)
      .order('event_date', { ascending: true }),
  ])

  return (
    <StudyClient
      initialData={{
        modules:        modules        ?? [],
        tasks:          tasks          ?? [],
        timetable:      timetable      ?? [],
        exams:          exams          ?? [],
        workShifts:     workShifts     ?? [],
        calendarEvents: calendarEvents ?? [],
        userId:         user.id,
      }}
    />
  )
}
