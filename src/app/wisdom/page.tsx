import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WisdomArchive from '@/components/community/WisdomArchive'

export const metadata = { title: 'Student Wisdom Archive — VarsityOS' }

export default async function WisdomPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase
    .from('profiles')
    .select('university')
    .eq('id', user.id)
    .single()
  return <WisdomArchive userId={user.id} university={profile?.university ?? null} />
}
