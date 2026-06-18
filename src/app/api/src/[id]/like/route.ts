export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// POST /api/src/[id]/like — toggle like on a post
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid post id' }, { status: 400 })
  }

  // Verify post exists before toggling like
  const { data: post, error: postError } = await supabase
    .from('src_posts')
    .select('id, likes_count')
    .eq('id', id)
    .single()

  if (postError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Try inserting a like
  const { error: insertError } = await supabase
    .from('src_post_likes')
    .insert({ post_id: id, user_id: user.id })

  // Unique violation code = '23505' — already liked, so unlike
  const alreadyLiked = insertError?.code === '23505'

  if (insertError && !alreadyLiked) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (alreadyLiked) {
    // Remove the like
    const { error: deleteError } = await supabase
      .from('src_post_likes')
      .delete()
      .eq('post_id', id)
      .eq('user_id', user.id)
    if (deleteError) return NextResponse.json({ error: 'Database error' }, { status: 500 })

    const newCount = Math.max(0, (post.likes_count ?? 1) - 1)
    await supabase.from('src_posts').update({ likes_count: newCount }).eq('id', id)

    return NextResponse.json({ liked: false, likes_count: newCount })
  }

  // Increment likes_count
  const newCount = (post.likes_count ?? 0) + 1
  await supabase.from('src_posts').update({ likes_count: newCount }).eq('id', id)

  return NextResponse.json({ liked: true, likes_count: newCount })
}
