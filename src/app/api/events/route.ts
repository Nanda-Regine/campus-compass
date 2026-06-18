export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const VALID_CATEGORIES = new Set(['social','academic','sport','career','cultural','general'])

function todayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

// GET /api/events?institution=xxx&category=xxx&upcoming=true&limit=30
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = new URL(request.url).searchParams
  const institution = params.get('institution')
  const category    = params.get('category')
  const upcoming    = params.get('upcoming') !== 'false'
  const limit       = Math.min(Number(params.get('limit') || '30'), 50)

  let query = supabase
    .from('campus_events')
    .select(`
      id, user_id, institution, title, description, category, venue,
      event_date, event_time, rsvp_count, created_at,
      event_rsvps(count)
    `)
    .order('event_date', { ascending: true })
    .limit(limit)

  if (institution) query = query.eq('institution', institution)
  if (category && VALID_CATEGORIES.has(category)) query = query.eq('category', category)
  if (upcoming) query = query.gte('event_date', todayDateString())

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

  const { title, description, category, venue, event_date, event_time } = await request.json()

  const trimmedTitle = typeof title === 'string' ? title.trim() : ''
  if (trimmedTitle.length < 3 || trimmedTitle.length > 120)
    return NextResponse.json({ error: 'title must be 3–120 characters' }, { status: 400 })
  if (!event_date) return NextResponse.json({ error: 'event_date required' }, { status: 400 })
  if (category && !VALID_CATEGORIES.has(String(category)))
    return NextResponse.json({ error: 'invalid category' }, { status: 400 })

  const trimmedDescription = description != null ? String(description).trim() : ''
  if (trimmedDescription.length > 600)
    return NextResponse.json({ error: 'description must be 600 characters or fewer' }, { status: 400 })

  const trimmedVenue = venue != null ? String(venue).trim() : ''
  if (trimmedVenue.length > 120)
    return NextResponse.json({ error: 'venue must be 120 characters or fewer' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('university')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.university) return NextResponse.json({ error: 'Profile must have a university set' }, { status: 400 })

  // event_date is a DATE column — store as 'YYYY-MM-DD'
  const eventDateString = new Date(event_date).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('campus_events')
    .insert({
      user_id: user.id,
      institution: profile.university,
      title: trimmedTitle,
      description: trimmedDescription || null,
      category: VALID_CATEGORIES.has(String(category)) ? String(category) : 'general',
      venue: trimmedVenue || null,
      event_date: eventDateString,
      event_time: event_time ? String(event_time).slice(0, 5) : null,
    })
    .select('id, user_id, institution, title, description, category, venue, event_date, event_time, rsvp_count, created_at')
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
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
