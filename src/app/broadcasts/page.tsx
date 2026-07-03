import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import BroadcastOS from '@/components/broadcasts/BroadcastOS'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata = { title: 'Broadcasts · VarsityOS' }

export default async function BroadcastsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('university')
    .eq('id', user.id)
    .single()

  const university = profile?.university ?? ''
  const now = new Date().toISOString()

  const { data: broadcasts } = await supabase
    .from('institution_broadcasts')
    .select('id, university, title, body, priority, sent_by, sent_at, expires_at')
    .eq('university', university)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('sent_at', { ascending: false })
    .limit(30)

  const { data: reads } = await supabase
    .from('broadcast_reads')
    .select('broadcast_id')
    .eq('user_id', user.id)

  const readIds = (reads ?? []).map((r: { broadcast_id: string }) => r.broadcast_id)

  const { data: srcMember } = await supabase
    .from('src_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative', overflowX: 'hidden' }}>
      <AmbientImage zone="amoled" opacity={0.32} blurPx={2} saturation={1.4} />
      <TopBar title="Broadcasts" />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px' }}>
        <BroadcastOS
          userId={user.id}
          broadcasts={broadcasts ?? []}
          readIds={readIds}
          university={university}
          isSrcMember={!!srcMember}
        />
      </div>
    </div>
  )
}
