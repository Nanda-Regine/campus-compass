export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const VALID_PLEDGES = new Set(['mentor', 'wisdom', 'refer', 'donate', 'stay'])

// GET /api/alumni/bridge            → your row + community count
// GET /api/alumni/bridge?letters=1  → recent public letters (for first-years)
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const wantLetters = new URL(request.url).searchParams.get('letters')

  if (wantLetters) {
    const { data, error } = await supabase
      .from('alumni_bridge')
      .select('id, display_name, course, grad_year, letter, created_at')
      .eq('is_public', true)
      .not('letter', 'is', null)
      .order('created_at', { ascending: false })
      .limit(24)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const letters = (data || []).filter(l => l.letter && l.letter.trim().length > 0)
    return NextResponse.json({ letters })
  }

  const [{ data: mine }, { count }] = await Promise.all([
    supabase.from('alumni_bridge').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('alumni_bridge').select('id', { count: 'exact', head: true }),
  ])

  // Reactions to your own letter (thanks count + any replies)
  let thanks = 0
  let replies: { message: string; created_at: string }[] = []
  if (mine?.id) {
    const { data: reacts } = await supabase
      .from('alumni_letter_reactions')
      .select('kind, message, created_at')
      .eq('bridge_id', mine.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (reacts) {
      thanks = reacts.filter(r => r.kind === 'thank').length
      replies = reacts.filter(r => r.kind === 'reply' && r.message).map(r => ({ message: r.message as string, created_at: r.created_at }))
    }
  }

  return NextResponse.json({ record: mine ?? null, memberCount: count ?? 0, thanks, replies })
}

// POST /api/alumni/bridge → create/update your pledge + letter
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const pledges = Array.isArray(body.pledges)
    ? [...new Set(body.pledges.filter((p: unknown) => typeof p === 'string' && VALID_PLEDGES.has(p)))].slice(0, 5)
    : []

  const gradYear = body.grad_year ? Math.max(1990, Math.min(2100, parseInt(body.grad_year) || 0)) || null : null

  const update = {
    user_id:      user.id,
    pledges,
    letter:       body.letter ? String(body.letter).slice(0, 1000) : null,
    display_name: body.display_name ? String(body.display_name).slice(0, 60) : null,
    course:       body.course ? String(body.course).slice(0, 80) : null,
    grad_year:    gradYear,
    is_public:    body.is_public !== false,
    updated_at:   new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('alumni_bridge')
    .upsert(update, { onConflict: 'user_id' })
    .select('*')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ record: data })
}
