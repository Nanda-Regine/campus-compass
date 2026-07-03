export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VALID_CATEGORIES = new Set([
  'nsfas', 'study_tips', 'campus_life', 'accommodation',
  'lecturer', 'admin', 'wellness', 'finance', 'general',
])

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const institution = searchParams.get('institution')
  const category    = searchParams.get('category')

  let query = supabase
    .from('wisdom_posts')
    .select('id, user_id, title, content, category, institution, upvotes, is_verified, is_anonymous, created_at')
    .order('upvotes', { ascending: false })
    .limit(50)

  if (institution)                                     query = query.eq('institution', institution)
  if (category && category !== 'all' && VALID_CATEGORIES.has(category)) query = query.eq('category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 })
  // Strip the author's id from anonymous posts so they can't be de-anonymised.
  const safe = (data ?? []).map(r => (r.is_anonymous ? { ...r, user_id: null } : r))
  return NextResponse.json({ data: safe })
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as Record<string, unknown>
  const { title, content, category, institution, is_anonymous } = body

  if (!title || typeof title !== 'string' || !title.trim())
    return NextResponse.json({ error: 'title required' }, { status: 400 })
  if (!content || typeof content !== 'string' || !content.trim())
    return NextResponse.json({ error: 'content required' }, { status: 400 })
  if (!category || !VALID_CATEGORIES.has(String(category)))
    return NextResponse.json({ error: 'invalid category' }, { status: 400 })

  const { data, error } = await supabase
    .from('wisdom_posts')
    .insert({
      user_id:      user.id,
      title:        String(title).slice(0, 120),
      content:      String(content).slice(0, 3000),
      category:     String(category),
      institution:  typeof institution === 'string' ? institution.slice(0, 100) : null,
      is_anonymous: typeof is_anonymous === 'boolean' ? is_anonymous : true,
      upvotes:      0,
    })
    .select('id, user_id, title, content, category, institution, upvotes, is_verified, is_anonymous, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
