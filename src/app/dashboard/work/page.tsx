import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import TopBar from '@/components/layout/TopBar'
import WorkClient from '@/components/work/WorkClient'

export default async function WorkPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-[#080f0e] pb-24">
      <TopBar title="Work" />
      <div className="px-4 py-3 max-w-2xl mx-auto">
        <WorkClient userId={user.id} />
      </div>
    </div>
  )
}
