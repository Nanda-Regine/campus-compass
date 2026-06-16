export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const VALID_TYPES = new Set(['study_session','social','career','workshop','sport','protest','notice','other'])

// GET /api/events?institution=xxx&type=xxx&upcoming=true&limit=30
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = new URL(request.url).searchParams
  const institution = params.get('institution')
  const type        = params.get('type')
  const upcoming    = params.get('upcoming') !== 'false'
  const limit       = Math.min(Number(params.get('limit') || '30'), 50)

  let query = supabase
    .from('campus_events')
    .select(`
      id, user_id, institution, title, description, event_type, venue,
      event_date, duration_minutes, max_attendees, is_anonymous, is_cancelled, created_at,
      event_rsvps(count)
    `)
    .eq('is_cancelled', false)
    .order('event_date', { ascending: true })
    .limit(limit)

  if (institution) query = query.eq('institution', institution)
  if (type && VALID_TYPES.has(type)) query = query.eq('event_type', type)
  if (upcoming) query = query.gte('event_date', new Date().toISOString())

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch user's RSVPs for these events
  const eventIds = (data || []).map((e: { id: string }) => e.id)
  let myRsvps: string[] = []
  if (eventIds.length > 0) {
    const { data: rsvps } = await supabase
      .from('event_rsvps')
      .select('event_id')
      .eq('user_id', user.id)
      .in('event_id', eventIds)
    myRsvps = (rsvps || []).map((r: { event_id: string }) => r.event_id)
  }

  const events = (data || []).map((e: Record<string, unknown>) => ({
    ...e,
    rsvp_count: Array.isArray(e.event_rsvps) ? (e.event_rsvps[0] as { count: number } | undefined)?.count ?? 0 : 0,
    user_rsvped: myRsvps.includes(e.id as string),
    event_rsvps: undefined,
  }))

  return NextResponse.json({ events })
}

// POST /api/events
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description, event_type, venue, event_date, duration_minutes, max_attendees, is_anonymous } = await request.json()

  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })
  if (!event_date) return NextResponse.json({ error: 'event_date required' }, { status: 400 })
  if (event_type && !VALID_TYPES.has(String(event_type)))
    return NextResponse.json({ error: 'invalid event_type' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('university')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.university) return NextResponse.json({ error: 'Profile must have a university set' }, { status: 400 })

  const { data, error } = await supabase
    .from('campus_events')
    .insert({
      user_id: user.id,
      institution: profile.university,
      title: String(title).slice(0, 120),
      description: description ? String(description).slice(0, 800) : null,
      event_type: VALID_TYPES.has(String(event_type)) ? String(event_type) : 'other',
      venue: venue ? String(venue).slice(0, 120) : null,
      event_date: new Date(event_date).toISOString(),
      duration_minutes: duration_minutes ? Math.min(Number(duration_minutes), 1440) : null,
      max_attendees: max_attendees ? Math.min(Number(max_attendees), 10000) : null,
      is_anonymous: Boolean(is_anonymous),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event: data }, { status: 201 })
}

// DELETE /api/events?id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('campus_events')
    .update({ is_cancelled: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
