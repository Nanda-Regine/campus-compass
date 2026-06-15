import { NextRequest, NextResponse } from 'next/server'
import arcjet, { tokenBucket } from '@arcjet/next'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [tokenBucket({ mode: 'LIVE', refillRate: 20, interval: 60, capacity: 40 })],
})

// GET /api/notes — list notes, optionally filtered
export async function GET(req: NextRequest) {
  const decision = await aj.protect(req, { requested: 1 })
  if (decision.isDenied()) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const module_code = searchParams.get('module')
  const institution = searchParams.get('institution')
  const mine = searchParams.get('mine') === '1'
  const sort = searchParams.get('sort') // 'newest' | 'most_saved' | 'most_viewed'

  const orderCol = sort === 'most_saved' ? 'save_count' : sort === 'most_viewed' ? 'view_count' : 'created_at'

  let query = supabase
    .from('community_notes')
    .select(`
      id, user_id, title, module_code, description, institution, faculty,
      year_of_study, link_url, file_type, tags, save_count, view_count, created_at,
      profiles!inner(name, emoji)
    `)
    .order(orderCol, { ascending: false })
    .limit(50)

  if (mine) query = query.eq('user_id', user.id)
  if (module_code) query = query.ilike('module_code', `%${module_code}%`)
  if (institution) query = query.eq('institution', institution)

  const { data: notes, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch which notes the current user has saved
  const noteIds = (notes || []).map((n: Record<string, unknown>) => n.id)
  const { data: saves } = noteIds.length
    ? await supabase.from('note_saves').select('note_id').eq('user_id', user.id).in('note_id', noteIds)
    : { data: [] }
  const savedSet = new Set((saves || []).map((s: { note_id: string }) => s.note_id))

  const result = (notes || []).map((n: Record<string, unknown>) => {
    const profile = n.profiles as { name: string; emoji: string } | null
    return {
      ...n,
      profiles: undefined,
      uploader_name:  profile?.name  ?? 'Student',
      uploader_emoji: profile?.emoji ?? '🎓',
      is_saved: savedSet.has(n.id as string),
    }
  })

  return NextResponse.json({ notes: result })
}

// POST /api/notes — create a note
export async function POST(req: NextRequest) {
  const decision = await aj.protect(req, { requested: 2 })
  if (decision.isDenied()) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, module_code, description, institution, faculty, year_of_study, link_url, file_type, tags } = body

  if (!title?.trim() || !module_code?.trim() || !link_url?.trim()) {
    return NextResponse.json({ error: 'title, module_code, and link_url are required' }, { status: 400 })
  }

  const { data, error } = await supabase.from('community_notes').insert({
    user_id: user.id,
    title: title.trim().slice(0, 120),
    module_code: module_code.trim().toUpperCase().slice(0, 20),
    description: description?.trim().slice(0, 500) ?? null,
    institution: institution ?? null,
    faculty: faculty ?? null,
    year_of_study: year_of_study ?? null,
    link_url: link_url.trim().slice(0, 500),
    file_type: file_type ?? 'link',
    tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note: data }, { status: 201 })
}

// DELETE /api/notes — delete a note (by id in body)
export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('community_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
