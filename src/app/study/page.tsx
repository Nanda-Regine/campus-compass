import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import StudyClient from '@/components/study/StudyClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Study Planner' }

export default async function StudyPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [
    { data: modules },
    { data: tasks },
    { data: timetable },
    { data: exams },
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
  ])

  return (
    <StudyClient
      initialData={{
        modules:   modules   ?? [],
        tasks:     tasks     ?? [],
        timetable: timetable ?? [],
        exams:     exams     ?? [],
        userId:    user.id,
      }}
    />
  )
}
