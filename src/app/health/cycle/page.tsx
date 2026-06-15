import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CycleTracker from '@/components/health/CycleTracker'

export const metadata = { title: 'Cycle Tracker — VarsityOS' }

export default async function CyclePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return <CycleTracker userId={user.id} />
}
