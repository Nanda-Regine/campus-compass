import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const VALID_REASONS = ['spam', 'harassment', 'hate_speech', 'misinformation', 'other'] as const
type Reason = typeof VALID_REASONS[number]

// POST /api/feed/report — report a campus post
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { post_id, reason, details } = await req.json()
  if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 })
  if (!VALID_REASONS.includes(reason as Reason)) {
    return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
  }

  const { error } = await supabase.from('post_reports').insert({
    post_id,
    reporter_id: user.id,
    reason,
    details: details?.trim().slice(0, 300) ?? null,
  })

  // Unique constraint (post_id, reporter_id) — silently ignore duplicate reports
  if (error && !error.message.includes('duplicate')) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
