import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import GroupsClient from '@/components/groups/GroupsClient'

export default async function GroupsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="flex flex-col h-screen bg-[#080f0e]">
      <TopBar title="Group Assignments" />
      <div className="flex-1 overflow-hidden">
        <GroupsClient userId={user.id} />
      </div>
    </div>
  )
}
