import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import GroupsClient from '@/components/groups/GroupsClient'

export const metadata = { title: 'Group Assignments — VarsityOS' }

export default async function StudyGroupsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <TopBar title="Group Assignments" />
      <div className="flex-1">
        <GroupsClient userId={user.id} />
      </div>
    </div>
  )
}
