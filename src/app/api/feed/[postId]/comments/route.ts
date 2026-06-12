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

// GET /api/feed/[postId]/comments
export async function GET(
  _req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: comments, error } = await supabase
    .from('post_comments')
    .select(`
      id, content, created_at, user_id,
      author:profiles!post_comments_user_id_fkey(name, emoji)
    `)
    .eq('post_id', params.postId)
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = (comments ?? []).map((c: Record<string, unknown>) => {
    const author = c.author as { name: string; emoji: string } | null
    return {
      id:           c.id,
      content:      c.content,
      created_at:   c.created_at,
      user_id:      c.user_id,
      author_name:  author?.name ?? 'Student',
      author_emoji: author?.emoji ?? '🎓',
      is_own:       c.user_id === user.id,
    }
  })

  return NextResponse.json({ comments: result })
}

// POST /api/feed/[postId]/comments
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })
  if (content.trim().length > 300) return NextResponse.json({ error: 'Too long' }, { status: 400 })

  const { data: comment, error } = await supabase
    .from('post_comments')
    .insert({ post_id: params.postId, user_id: user.id, content: content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment }, { status: 201 })
}
