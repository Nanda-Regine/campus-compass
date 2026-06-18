export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const VALID_CATEGORIES = new Set(['announcement', 'consultation', 'minutes', 'event', 'urgent'])

// GET /api/src — posts for current user's university
export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('university')
    .eq('id', user.id)
    .maybeSingle()

  const university = profile?.university ?? ''

  const { data, error } = await supabase
    .from('src_posts')
    .select('id, author_id, university, title, body, category, pinned, likes_count, views_count, created_at')
    .eq('university', university)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/src — create a post (SRC members only)
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify active SRC membership
  const { data: membership } = await supabase
    .from('src_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Only active SRC members can post' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>

  const title    = typeof body.title === 'string' ? body.title.trim() : ''
  const bodyText = typeof body.body  === 'string' ? body.body.trim()  : ''
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const pinned   = body.pinned === true

  if (title.length < 3 || title.length > 120) {
    return NextResponse.json({ error: 'title must be 3–120 characters' }, { status: 400 })
  }
  if (bodyText.length < 10 || bodyText.length > 5000) {
    return NextResponse.json({ error: 'body must be 10–5000 characters' }, { status: 400 })
  }
  if (!VALID_CATEGORIES.has(category)) {
    return NextResponse.json({ error: 'invalid category' }, { status: 400 })
  }

  // Fetch university from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('university')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.university) {
    return NextResponse.json({ error: 'Profile must have a university set' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('src_posts')
    .insert({
      author_id: user.id,
      university: profile.university,
      title,
      body: bodyText,
      category,
      pinned,
    })
    .select('id, author_id, university, title, body, category, pinned, likes_count, views_count, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
