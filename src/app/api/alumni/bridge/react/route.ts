export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimitAsync } from '@/lib/rateLimit'

// POST /api/alumni/bridge/react { bridge_id, kind: 'thank'|'reply', message? }
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Shared (Upstash-backed) limiter — 30 reactions / 10 min.
  const rl = await checkRateLimitAsync(user.id, 'alumni-react', 30, 10 * 60 * 1000)
  if (!rl.allowed) return NextResponse.json({ error: 'Slow down a moment' }, { status: 429 })

  const body = await request.json().catch(() => ({}))
  const bridgeId = body.bridge_id
  const kind = body.kind === 'reply' ? 'reply' : 'thank'
  if (!bridgeId || typeof bridgeId !== 'string')
    return NextResponse.json({ error: 'bridge_id required' }, { status: 400 })
  if (kind === 'reply' && (!body.message || !String(body.message).trim()))
    return NextResponse.json({ error: 'Reply needs a message' }, { status: 400 })

  // Don't let people react to their own letter
  const { data: bridge } = await supabase
    .from('alumni_bridge')
    .select('user_id')
    .eq('id', bridgeId)
    .maybeSingle()
  if (!bridge) return NextResponse.json({ error: 'Letter not found' }, { status: 404 })
  if (bridge.user_id === user.id)
    return NextResponse.json({ error: 'That is your own letter' }, { status: 400 })

  // One "thank" per user per letter — avoid spam
  if (kind === 'thank') {
    const { data: existing } = await supabase
      .from('alumni_letter_reactions')
      .select('id')
      .eq('bridge_id', bridgeId)
      .eq('from_user', user.id)
      .eq('kind', 'thank')
      .maybeSingle()
    if (existing) return NextResponse.json({ ok: true, alreadyThanked: true })
  }

  const { error } = await supabase
    .from('alumni_letter_reactions')
    .insert({
      bridge_id: bridgeId,
      from_user: user.id,
      kind,
      message: kind === 'reply' ? String(body.message).slice(0, 500) : null,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
