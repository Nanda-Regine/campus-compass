export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// POST /api/events/rsvp  { event_id, status }
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event_id, status = 'going' } = await request.json()
  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  if (!['going','maybe'].includes(String(status)))
    return NextResponse.json({ error: 'status must be going or maybe' }, { status: 400 })

  // Verify event exists and isn't cancelled
  const { data: event } = await supabase
    .from('campus_events')
    .select('id, max_attendees')
    .eq('id', event_id)
    .eq('is_cancelled', false)
    .maybeSingle()
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Check capacity if max_attendees is set
  if (event.max_attendees) {
    const { count } = await supabase
      .from('event_rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event_id)
      .eq('status', 'going')
    if ((count ?? 0) >= event.max_attendees)
      return NextResponse.json({ error: 'Event is full' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('event_rsvps')
    .upsert({ event_id, user_id: user.id, status }, { onConflict: 'event_id,user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rsvp: data })
}

// DELETE /api/events/rsvp?event_id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event_id = new URL(request.url).searchParams.get('event_id')
  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  await supabase.from('event_rsvps').delete().eq('event_id', event_id).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
