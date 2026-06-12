import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// POST /api/feed/react — toggle like on a post
export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { post_id } = await req.json()
  if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('post_reactions')
    .select('post_id')
    .eq('post_id', post_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('post_reactions').delete().eq('post_id', post_id).eq('user_id', user.id)
    return NextResponse.json({ reacted: false })
  } else {
    await supabase.from('post_reactions').insert({ post_id, user_id: user.id })
    return NextResponse.json({ reacted: true })
  }
}
