import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const institution = searchParams.get('institution')
  const type = searchParams.get('type')
  const category = searchParams.get('category')
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabase
    .from('mutual_aid_requests')
    .select('id, title, description, type, category, institution, is_urgent, status, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(60)

  if (institution) query = query.eq('institution', institution)
  if (type && type !== 'all') query = query.eq('type', type)
  if (category && category !== 'all') query = query.eq('category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as Record<string, unknown>
  const { title, description, type, category, institution, is_urgent, contact_info } = body
  if (!title || typeof title !== 'string' || !title.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })
  if (!type || typeof type !== 'string') return NextResponse.json({ error: 'type required' }, { status: 400 })
  if (!category || typeof category !== 'string') return NextResponse.json({ error: 'category required' }, { status: 400 })
  const { data, error } = await supabase
    .from('mutual_aid_requests')
    .insert({
      title: String(title).slice(0, 200),
      description: typeof description === 'string' ? description.slice(0, 2000) : null,
      type: String(type).slice(0, 50),
      category: String(category).slice(0, 50),
      institution: typeof institution === 'string' ? institution.slice(0, 100) : null,
      is_urgent: typeof is_urgent === 'boolean' ? is_urgent : false,
      contact_info: typeof contact_info === 'string' ? contact_info.slice(0, 200) : null,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as Record<string, unknown>
  const { id, title, description, type, category, institution, is_urgent, contact_info, status } = body

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data, error } = await supabase
    .from('mutual_aid_requests')
    .update({ title, description, type, category, institution, is_urgent, contact_info, status })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
