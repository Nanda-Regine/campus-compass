import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function makeSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

const VALID_CATEGORIES = ['social', 'academic', 'sport', 'career', 'cultural', 'general']

// GET /api/campus/events
export async function GET(req: NextRequest) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? ''

  const { data: profile } = await supabase
    .from('profiles').select('university').eq('id', user.id).single()
  const institution = profile?.university ?? null

  const todayStr = new Date().toISOString().slice(0, 10)

  let query = supabase
    .from('campus_events')
    .select(`
      id, title, description, venue, event_date, event_time,
      category, institution, rsvp_count, created_at, user_id,
      profiles!inner(name, emoji)
    `)
    .gte('event_date', todayStr)
    .order('event_date', { ascending: true })
    .limit(40)

  if (institution) {
    query = query.or(`institution.eq.${institution},institution.is.null`)
  }
  if (category) query = query.eq('category', category)

  const { data: events, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const eventIds = (events ?? []).map((e: Record<string, unknown>) => e.id as string)
  const { data: myRsvps } = eventIds.length
    ? await supabase.from('event_rsvps').select('event_id').eq('user_id', user.id).in('event_id', eventIds)
    : { data: [] }
  const rsvpSet = new Set((myRsvps ?? []).map((r: { event_id: string }) => r.event_id))

  const result = (events ?? []).map((e: Record<string, unknown>) => {
    const creator = e.profiles as { name: string; emoji: string } | null
    return {
      ...e,
      profiles: undefined,
      creator_name:  creator?.name  ?? 'Student',
      creator_emoji: creator?.emoji ?? '🎓',
      is_own: e.user_id === user.id,
      is_going: rsvpSet.has(e.id as string),
    }
  })

  return NextResponse.json({ events: result })
}

// POST /api/campus/events — create an event
export async function POST(req: NextRequest) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, venue, event_date, event_time, category } = body

  if (!title?.trim() || !event_date) {
    return NextResponse.json({ error: 'title and event_date required' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles').select('university').eq('id', user.id).single()

  const { data: event, error } = await supabase
    .from('campus_events')
    .insert({
      user_id:     user.id,
      title:       title.trim().slice(0, 120),
      description: description?.trim().slice(0, 600) ?? null,
      venue:       venue?.trim().slice(0, 120) ?? null,
      event_date,
      event_time:  event_time ?? null,
      category:    VALID_CATEGORIES.includes(category) ? category : 'general',
      institution: profile?.university ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event }, { status: 201 })
}

// DELETE /api/campus/events?id=
export async function DELETE(req: NextRequest) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await supabase.from('campus_events').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
