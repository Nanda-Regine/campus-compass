import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import CycleTracker from '@/components/health/CycleTracker'

export const metadata = { title: 'Cycle Tracker — VarsityOS' }

export default async function CyclePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return (
    <>
      <TopBar title="Cycle Tracker" />
      <CycleTracker userId={user.id} />
    </>
  )
}
