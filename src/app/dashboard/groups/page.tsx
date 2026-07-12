import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import GroupsClient from '@/components/groups/GroupsClient'
import { AmbientImage } from '@/components/ui/AmbientImage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Study Groups',
  description:
    'Create and join study groups, share resources and collaborate with classmates on VarsityOS.',
}

export default async function GroupsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)', position: 'relative', overflowX: 'clip' }}>
      <AmbientImage zone="community" opacity={0.26} blurPx={8} saturation={1.2} overlayColor="rgba(5,4,12,0.55)" />
      <TopBar title="Group Assignments" />
      <div className="flex-1">
        <GroupsClient userId={user.id} />
      </div>
    </div>
  )
}
