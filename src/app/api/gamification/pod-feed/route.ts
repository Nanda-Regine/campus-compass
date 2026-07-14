import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sastDatePlus } from '@/lib/utils'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const admin = createAdminSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Study "pod" members = the other party in every accepted pod connection.
  // There is no pods/pod_members table — the model is peer-to-peer connections
  // (study_pod_connections: requester_id ↔ recipient_id, status).
  const { data: connections } = await admin
    .from('study_pod_connections')
    .select('requester_id, recipient_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .limit(50)

  if (!connections?.length) return NextResponse.json({ feed: [] })

  const memberIds = [...new Set(
    connections.map(c => (c.requester_id === user.id ? c.recipient_id : c.requester_id)),
  )].slice(0, 10)

  if (!memberIds.length) return NextResponse.json({ feed: [] })

  const since = sastDatePlus(-3)

  const [{ data: compoundDays }, { data: profiles }] = await Promise.all([
    admin.from('compound_days')
      .select('user_id, day_date, domains_hit, xp_bonus')
      .in('user_id', memberIds)
      .gte('day_date', since)
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
