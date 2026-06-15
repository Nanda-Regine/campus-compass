import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RegulationRoom from '@/components/regulate/RegulationRoom'

export const metadata = { title: 'Regulation Room — VarsityOS', description: 'Calm your nervous system. Breathe, release, regulate.' }

export default async function RegulatePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('university').eq('id', user.id).single()
  const { data: exams } = await supabase.from('exams').select('*').eq('user_id', user.id).gte('exam_date', new Date().toISOString().split('T')[0]).order('exam_date')

  return <RegulationRoom userId={user.id} university={profile?.university ?? null} exams={exams ?? []} />
}
