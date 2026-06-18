import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const admin = createAdminSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Find study pod members
  const { data: podMember } = await admin
    .from('study_pod_members')
    .select('pod_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!podMember) return NextResponse.json({ feed: [] })

  const { data: members } = await admin
    .from('study_pod_members')
    .select('user_id')
    .eq('pod_id', podMember.pod_id)
    .neq('user_id', user.id)
    .limit(10)

  if (!members?.length) return NextResponse.json({ feed: [] })
  const memberIds = members.map(m => m.user_id)

  const since = new Date()
  since.setDate(since.getDate() - 3)

  const [{ data: compoundDays }, { data: profiles }] = await Promise.all([
    admin.from('compound_days')
      .select('user_id, day_date, domains_hit, xp_bonus')
      .in('user_id', memberIds)
      .gte('day_date', since.toISOString().split('T')[0])
      .order('day_date', { ascending: false })
      .limit(20),
    admin.from('profiles')
      .select('id, full_name, avatar_url, archetype')
      .in('id', memberIds),
  ])

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  const feed = (compoundDays ?? []).map(cd => ({
    type: 'compound_day',
    user: profileMap[cd.user_id] ?? { full_name: 'A pod member', avatar_url: null },
    day_date: cd.day_date,
    domains_hit: cd.domains_hit,
    xp_bonus: cd.xp_bonus,
  }))

  return NextResponse.json({ feed })
}
