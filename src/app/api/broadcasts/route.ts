import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const VALID_PRIORITIES = ['normal', 'important', 'urgent'] as const
type Priority = typeof VALID_PRIORITIES[number]

// GET /api/broadcasts — list active broadcasts for the user's university
export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('university')
    .eq('id', user.id)
    .single()

  const university = profile?.university ?? ''
  const now = new Date().toISOString()

  const { data: broadcasts, error } = await supabase
    .from('institution_broadcasts')
    .select('id, university, title, body, priority, sent_by, sent_at, expires_at')
    .eq('university', university)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('sent_at', { ascending: false })
    .limit(40)

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })

  const broadcastIds = (broadcasts ?? []).map(b => b.id as string)
  const { data: reads } = broadcastIds.length
    ? await supabase
        .from('broadcast_reads')
        .select('broadcast_id')
        .eq('user_id', user.id)
        .in('broadcast_id', broadcastIds)
    : { data: [] }

  const read_ids = (reads ?? []).map((r: { broadcast_id: string }) => r.broadcast_id)

  return NextResponse.json({ broadcasts: broadcasts ?? [], read_ids })
}

// POST /api/broadcasts — create a new broadcast (SRC members only)
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('university')
    .eq('id', user.id)
    .single()

  const university = profile?.university ?? ''
  if (!university) {
    return NextResponse.json({ error: 'No university associated with your profile' }, { status: 400 })
  }

  // Only active SRC members may send institution-wide broadcasts
  const { data: membership } = await supabase
    .from('src_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('university', university)
    .eq('is_active', true)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Only active SRC members can send broadcasts' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate title
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : ''
  if (title.length < 3) {
    return NextResponse.json({ error: 'title must be 3–120 characters' }, { status: 400 })
  }

  // Validate body text
  const bodyText = typeof body.body === 'string' ? body.body.trim().slice(0, 2000) : ''
  if (bodyText.length < 10) {
    return NextResponse.json({ error: 'body must be 10–2000 characters' }, { status: 400 })
  }

  // Validate priority
  const rawPriority = typeof body.priority === 'string' ? body.priority : 'normal'
  const priority: Priority = (VALID_PRIORITIES as readonly string[]).includes(rawPriority)
    ? (rawPriority as Priority)
    : 'normal'

  // Validate expires_at
  let expires_at: string | null = null
  if (body.expires_at && typeof body.expires_at === 'string') {
    const parsed = new Date(body.expires_at)
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'expires_at must be a valid date' }, { status: 400 })
    }
    if (parsed.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'expires_at must be in the future' }, { status: 400 })
    }
    expires_at = parsed.toISOString()
  }

  const { data, error } = await supabase
    .from('institution_broadcasts')
    .insert({
      university,
      title,
      body: bodyText,
      priority,
      sent_by: user.id,
      expires_at,
    })
    .select('id, university, title, body, priority, sent_by, sent_at, expires_at')
    .single()

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
