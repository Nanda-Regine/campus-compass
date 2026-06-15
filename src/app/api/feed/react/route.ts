import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// POST /api/feed/react — toggle like on a post
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
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
