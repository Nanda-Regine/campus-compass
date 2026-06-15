import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MutualAidBoard from '@/components/community/MutualAidBoard'

export const metadata = { title: 'Mutual Aid Board — VarsityOS' }

export default async function MutualAidPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase
    .from('profiles')
    .select('university')
    .eq('id', user.id)
    .single()
  return <MutualAidBoard userId={user.id} university={profile?.university ?? null} />
}
