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

  const body = await req.json()
  // Explicit allowlist prevents mass-assignment of privileged columns (status, is_fulfilled, etc.)
  const { title, description, type, category, institution, is_urgent, contact_info } = body as Record<string, unknown>
  const { data, error } = await supabase
    .from('mutual_aid_requests')
    .insert({ title, description, type, category, institution, is_urgent, contact_info, user_id: user.id })
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
