export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// POST /api/events/rsvp  { event_id }
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event_id } = await request.json()
  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  // Verify event exists
  const { data: event } = await supabase
    .from('campus_events')
    .select('id, rsvp_count')
    .eq('id', event_id)
    .maybeSingle()
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const { error } = await supabase
    .from('event_rsvps')
    .upsert({ event_id, user_id: user.id }, { onConflict: 'user_id,event_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recompute rsvp_count from the actual rows and store it on the event
  const { count } = await supabase
    .from('event_rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event_id)

  await supabase
    .from('campus_events')
    .update({ rsvp_count: count ?? 0 })
    .eq('id', event_id)

  return NextResponse.json({ ok: true, rsvp_count: count ?? 0 })
}

// DELETE /api/events/rsvp?event_id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event_id = new URL(request.url).searchParams.get('event_id')
  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  await supabase.from('event_rsvps').delete().eq('event_id', event_id).eq('user_id', user.id)

  // Keep rsvp_count in sync after removal
  const { count } = await supabase
    .from('event_rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event_id)

  await supabase
    .from('campus_events')
    .update({ rsvp_count: count ?? 0 })
    .eq('id', event_id)

  return NextResponse.json({ ok: true, rsvp_count: count ?? 0 })
}
