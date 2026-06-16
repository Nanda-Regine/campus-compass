export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VALID_TYPES      = new Set(['offer', 'request'])
const VALID_CATEGORIES = new Set(['textbook', 'notes', 'food', 'transport', 'tutoring', 'accommodation', 'other'])

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type     = searchParams.get('type')
  const category = searchParams.get('category')

  let query = supabase
    .from('mutual_aid_requests')
    .select('id, user_id, title, description, request_type, category, institution, is_anonymous, is_fulfilled, expiry_date, created_at')
    .eq('is_fulfilled', false)
    .order('created_at', { ascending: false })
    .limit(60)

  if (type && type !== 'all' && VALID_TYPES.has(type))           query = query.eq('request_type', type)
  if (category && category !== 'all' && VALID_CATEGORIES.has(category)) query = query.eq('category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as Record<string, unknown>
  const { title, description, request_type, category, institution, is_anonymous, expiry_date } = body

  if (!title || typeof title !== 'string' || !title.trim())
    return NextResponse.json({ error: 'title required' }, { status: 400 })
  if (!request_type || !VALID_TYPES.has(String(request_type)))
    return NextResponse.json({ error: 'invalid request_type' }, { status: 400 })
  if (!category || !VALID_CATEGORIES.has(String(category)))
    return NextResponse.json({ error: 'invalid category' }, { status: 400 })
  if (!description || typeof description !== 'string' || !description.trim())
    return NextResponse.json({ error: 'description required' }, { status: 400 })

  const { data, error } = await supabase
    .from('mutual_aid_requests')
    .insert({
      user_id:      user.id,
      title:        String(title).slice(0, 120),
      description:  String(description).slice(0, 2000),
      request_type: String(request_type),
      category:     String(category),
      institution:  typeof institution === 'string' ? institution.slice(0, 100) : null,
      is_anonymous: typeof is_anonymous === 'boolean' ? is_anonymous : true,
      is_fulfilled: false,
      expiry_date:  typeof expiry_date === 'string' && expiry_date ? expiry_date : null,
    })
    .select('id, user_id, title, description, request_type, category, institution, is_anonymous, is_fulfilled, expiry_date, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as Record<string, unknown>
  const { id, is_fulfilled } = body

  if (!id || typeof id !== 'string') return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (typeof is_fulfilled !== 'boolean') return NextResponse.json({ error: 'is_fulfilled required' }, { status: 400 })

  const { data, error } = await supabase
    .from('mutual_aid_requests')
    .update({ is_fulfilled })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, user_id, title, description, request_type, category, institution, is_anonymous, is_fulfilled, expiry_date, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
