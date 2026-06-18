export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import TopBar from '@/components/layout/TopBar'
import SRCAnalyticsOS from '@/components/src/SRCAnalyticsOS'

export const metadata = { title: 'SRC · VarsityOS' }

export default async function SRCPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('university')
    .eq('id', user.id)
    .maybeSingle()

  const university = profile?.university ?? ''

  // Fetch posts for this university — pinned first, then newest
  const { data: postsRaw } = await supabase
    .from('src_posts')
    .select('id, author_id, university, title, body, category, pinned, likes_count, views_count, created_at')
    .eq('university', university)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch active SRC members for this university
  const { data: membersRaw } = await supabase
    .from('src_members')
    .select('id, user_id, university, role, portfolio, bio, is_active')
    .eq('university', university)
    .eq('is_active', true)

  // Check if current user is an SRC member
  const { data: myMembership } = await supabase
    .from('src_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  const isSrcMember = !!myMembership

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <TopBar title="SRC" />
      <SRCAnalyticsOS
        userId={user.id}
        initialPosts={postsRaw ?? []}
        members={membersRaw ?? []}
        isSrcMember={isSrcMember}
        university={university}
      />
    </div>
  )
}
