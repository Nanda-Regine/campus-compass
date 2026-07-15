export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const VALID_CATEGORIES = new Set(['academic', 'cultural', 'sport', 'faith', 'political', 'social', 'entrepreneurship', 'other'])

// GET /api/social/societies?institution=...
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const institution = new URL(request.url).searchParams.get('institution')

  let q = supabase.from('societies').select('*').order('created_at', { ascending: false }).limit(200)
  if (institution) q = q.or(`institution.eq."${String(institution).replace(/"/g, '')}",institution.is.null`)
  const { data: societies, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (societies || []).map(s => s.id)
  const counts: Record<string, number> = {}
  const mine = new Set<string>()
  if (ids.length) {
    const { data: members } = await supabase
      .from('society_members')
      .select('society_id, user_id')
      .in('society_id', ids)
    for (const m of members || []) {
      counts[m.society_id] = (counts[m.society_id] || 0) + 1
      if (m.user_id === user.id) mine.add(m.society_id)
    }
  }

  const result = (societies || []).map(s => ({
    ...s,
    member_count: counts[s.id] || 0,
    is_member: mine.has(s.id),
    is_owner: s.created_by === user.id,
  }))
  return NextResponse.json({ societies: result })
}

// POST /api/social/societies — create a society
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const category = VALID_CATEGORIES.has(body.category) ? body.category : 'other'

  const { data, error } = await supabase
    .from('societies')
    .insert({
      name: String(body.name).slice(0, 100),
      category,
      description: body.description ? String(body.description).slice(0, 600) : null,
      institution: body.institution ? String(body.institution).slice(0, 120) : null,
      contact: body.contact ? String(body.contact).slice(0, 200) : null,
      created_by: user.id,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-join the creator
  await supabase.from('society_members').insert({ society_id: data.id, user_id: user.id })
  return NextResponse.json({ society: data }, { status: 201 })
}

// PATCH /api/social/societies?id=xxx&action=join|leave
export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const action = url.searchParams.get('action')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  if (action === 'join') {
    const { error } = await supabase.from('society_members').upsert(
      { society_id: id, user_id: user.id }, { onConflict: 'society_id,user_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, joined: true })
  }
  if (action === 'leave') {
    const { error } = await supabase.from('society_members').delete().eq('society_id', id).eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, joined: false })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// DELETE /api/social/societies?id=xxx (creator only — enforced by RLS)
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('societies').delete().eq('id', id).eq('created_by', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
