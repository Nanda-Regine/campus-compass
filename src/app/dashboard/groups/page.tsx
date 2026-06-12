import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import GroupsClient from '@/components/groups/GroupsClient'
import { AmbientImage } from '@/components/ui/AmbientImage'

export default async function GroupsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      <AmbientImage zone="community" opacity={0.38} blurPx={5} saturation={1.2} overlayColor="transparent" />
      <TopBar title="Group Assignments" />
      <div className="flex-1 overflow-hidden">
        <GroupsClient userId={user.id} />
      </div>
    </div>
  )
}
