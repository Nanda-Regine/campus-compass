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

// GET /api/feed?scope=campus|all&category=&cursor=
export async function GET(req: NextRequest) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const scope    = searchParams.get('scope') ?? 'campus'
  const category = searchParams.get('category') ?? ''
  const cursor   = searchParams.get('cursor') ?? ''
  const limit    = 20

  // Get user's institution for campus-scoped feed
  const { data: profile } = await supabase
    .from('profiles').select('university').eq('id', user.id).single()
  const institution = profile?.university ?? null

  let query = supabase
    .from('campus_posts')
    .select(`
      id, content, category, institution, created_at, user_id,
      author:profiles!campus_posts_user_id_fkey(name, emoji)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (scope === 'campus' && institution) {
    query = query.eq('institution', institution)
  }
  if (category) {
    query = query.eq('category', category)
  }
  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: posts, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const postIds = (posts ?? []).map((p: Record<string, unknown>) => p.id as string)

  const [reactionsRes, myReactionsRes, commentCountsRes] = await Promise.all([
    postIds.length
      ? supabase.from('post_reactions').select('post_id').in('post_id', postIds)
      : Promise.resolve({ data: [] }),
    postIds.length
      ? supabase.from('post_reactions').select('post_id').in('post_id', postIds).eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
    postIds.length
      ? supabase.from('post_comments').select('post_id').in('post_id', postIds)
      : Promise.resolve({ data: [] }),
  ])

  const reactionCounts: Record<string, number> = {}
  const myReacted = new Set<string>()
  const commentCounts: Record<string, number> = {}

  for (const r of reactionsRes.data ?? []) {
    const row = r as { post_id: string }
    reactionCounts[row.post_id] = (reactionCounts[row.post_id] ?? 0) + 1
  }
  for (const r of myReactionsRes.data ?? []) {
    myReacted.add((r as { post_id: string }).post_id)
  }
  for (const c of commentCountsRes.data ?? []) {
    const row = c as { post_id: string }
    commentCounts[row.post_id] = (commentCounts[row.post_id] ?? 0) + 1
  }

  const result = (posts ?? []).map((p: Record<string, unknown>) => {
    const author = p.author as { name: string; emoji: string } | null
    return {
      id:             p.id,
      content:        p.content,
      category:       p.category,
      institution:    p.institution,
      created_at:     p.created_at,
      user_id:        p.user_id,
      author_name:    author?.name ?? 'Student',
      author_emoji:   author?.emoji ?? '🎓',
      is_own:         p.user_id === user.id,
      reaction_count: reactionCounts[p.id as string] ?? 0,
      reacted:        myReacted.has(p.id as string),
      comment_count:  commentCounts[p.id as string] ?? 0,
    }
  })

  return NextResponse.json({ posts: result })
}

// POST /api/feed — create a post
export async function POST(req: NextRequest) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, category } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })
  if (content.trim().length > 500) return NextResponse.json({ error: 'Too long' }, { status: 400 })

  const validCategories = ['general', 'opportunity', 'academic', 'campus', 'sell_swap']
  const cat = validCategories.includes(category) ? category : 'general'

  const { data: profile } = await supabase
    .from('profiles').select('university').eq('id', user.id).single()

  const { data: post, error } = await supabase
    .from('campus_posts')
    .insert({
      user_id:     user.id,
      institution: profile?.university ?? null,
      content:     content.trim(),
      category:    cat,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post }, { status: 201 })
}

// DELETE /api/feed?id=
export async function DELETE(req: NextRequest) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('campus_posts').delete().eq('id', id).eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
