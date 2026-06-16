import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const institution = searchParams.get('institution')
  const category = searchParams.get('category')

  let query = supabase
    .from('wisdom_posts')
    .select('id, title, content, category, tags, institution, upvotes, is_anonymous, created_at, user_id')
    .order('upvotes', { ascending: false })
    .limit(50)

  if (institution) query = query.eq('institution', institution)
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
  const { title, content, category, tags, institution, is_anonymous } = body
  if (!title || typeof title !== 'string' || !title.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })
  if (!content || typeof content !== 'string' || !content.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })
  if (!category || typeof category !== 'string') return NextResponse.json({ error: 'category required' }, { status: 400 })
  const { data, error } = await supabase
    .from('wisdom_posts')
    .insert({
      title: String(title).slice(0, 200),
      content: String(content).slice(0, 3000),
      category: String(category).slice(0, 50),
      tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
      institution: typeof institution === 'string' ? institution.slice(0, 100) : null,
      is_anonymous: typeof is_anonymous === 'boolean' ? is_anonymous : false,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
