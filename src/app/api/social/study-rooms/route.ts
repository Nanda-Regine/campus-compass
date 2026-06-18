export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

async function displayName(supabase: ReturnType<typeof createServerSupabaseClient>, userId: string): Promise<string> {
  const { data } = await supabase.from('profiles').select('name').eq('id', userId).maybeSingle()
  const n = (data?.name as string | undefined)?.trim()
  return n ? n.split(' ')[0] : 'Student'
}

// GET /api/social/study-rooms?institution=...  → live rooms with members
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const institution = new URL(request.url).searchParams.get('institution')
  const nowIso = new Date().toISOString()

  let q = supabase.from('study_rooms').select('*').gt('ends_at', nowIso).order('created_at', { ascending: false }).limit(60)
  if (institution) q = q.or(`institution.eq.${institution},institution.is.null`)
  const { data: rooms, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (rooms || []).map(r => r.id)
  const membersByRoom: Record<string, string[]> = {}
  const mine = new Set<string>()
  if (ids.length) {
    const { data: members } = await supabase
      .from('study_room_members')
      .select('room_id, user_id, display_name')
      .in('room_id', ids)
    for (const m of members || []) {
      (membersByRoom[m.room_id] ||= []).push(m.display_name || 'Student')
      if (m.user_id === user.id) mine.add(m.room_id)
    }
  }

  const result = (rooms || []).map(r => ({
    ...r,
    members: membersByRoom[r.id] || [],
    member_count: (membersByRoom[r.id] || []).length,
    is_member: mine.has(r.id),
    is_host: r.host_id === user.id,
  }))
  return NextResponse.json({ rooms: result })
}

// POST /api/social/study-rooms — create + auto-join
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.name?.trim()) return NextResponse.json({ error: 'Room name required' }, { status: 400 })
  const focus = [25, 50, 90].includes(Number(body.focus_minutes)) ? Number(body.focus_minutes) : 50
  const endsAt = new Date(Date.now() + focus * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('study_rooms')
    .insert({
      name: String(body.name).slice(0, 80),
      topic: body.topic ? String(body.topic).slice(0, 120) : null,
      institution: body.institution ? String(body.institution).slice(0, 120) : null,
      host_id: user.id,
      focus_minutes: focus,
      ends_at: endsAt,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('study_room_members').insert({ room_id: data.id, user_id: user.id, display_name: await displayName(supabase, user.id) })
  return NextResponse.json({ room: data }, { status: 201 })
}

// PATCH /api/social/study-rooms?id=xxx&action=join|leave
export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const action = url.searchParams.get('action')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  if (action === 'join') {
    const { error } = await supabase.from('study_room_members').upsert(
      { room_id: id, user_id: user.id, display_name: await displayName(supabase, user.id) }, { onConflict: 'room_id,user_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, joined: true })
  }
  if (action === 'leave') {
    const { error } = await supabase.from('study_room_members').delete().eq('room_id', id).eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, joined: false })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// DELETE /api/social/study-rooms?id=xxx (host ends the room)
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('study_rooms').delete().eq('id', id).eq('host_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
