export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { notifyUser } from '@/lib/push-notify'
import { NextRequest, NextResponse } from 'next/server'

const IN_LIMIT   = 200   // max students per broadcast
const BATCH_SIZE = 50    // concurrent notifyUser calls per wave
const RATE_LIMIT = 3     // max broadcasts per institution per 24 h

// ─── GET — list last 10 broadcasts for the institution ────────────────────────

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminRow } = await supabase
      .from('institution_admins')
      .select('institution_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRow) return NextResponse.json({ error: 'Not an institution admin' }, { status: 403 })

    const { data: broadcasts, error } = await supabase
      .from('institution_broadcasts')
      .select('id, title, body, url, priority, sent_count, failed_count, created_at')
      .eq('institution_id', adminRow.institution_id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    return NextResponse.json({ broadcasts: broadcasts ?? [] })
  } catch (err) {
    console.error('[admin/broadcast GET]', err)
    return NextResponse.json({ error: 'Failed to load broadcasts' }, { status: 500 })
  }
}

// ─── POST — send a broadcast to all linked students ───────────────────────────

interface BroadcastBody {
  title: string
  body: string
  url?: string
  priority?: 'info' | 'warning' | 'urgent'
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminRow } = await supabase
      .from('institution_admins')
      .select('institution_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRow) return NextResponse.json({ error: 'Not an institution admin' }, { status: 403 })

    const institutionId = adminRow.institution_id

    // ── Validate payload ────────────────────────────────────────────────────
    let body: BroadcastBody
    try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const title    = (body.title ?? '').trim().slice(0, 100)
    const message  = (body.body ?? '').trim().slice(0, 300)
    const url      = (body.url ?? '').trim() || undefined
    const priority = (['info','warning','urgent'] as const).includes(body.priority as never)
      ? (body.priority as 'info' | 'warning' | 'urgent')
      : 'info'

    if (!title)   return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    if (!message) return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
    if (url && !url.startsWith('/') && !url.startsWith('https://')) {
      return NextResponse.json({ error: 'URL must start with / or https://' }, { status: 400 })
    }

    // ── Rate limit: max 3 broadcasts per institution per 24 h ───────────────
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('institution_broadcasts')
      .select('id', { count: 'exact', head: true })
      .eq('institution_id', institutionId)
      .gte('created_at', since24h)

    if ((recentCount ?? 0) >= RATE_LIMIT) {
      return NextResponse.json(
        { error: `Rate limit: max ${RATE_LIMIT} broadcasts per 24 hours` },
        { status: 429 },
      )
    }

    // ── Get linked student IDs (admin client to bypass RLS) ─────────────────
    const admin = createAdminSupabaseClient()
    const { data: students } = await admin
      .from('profiles')
      .select('id')
      .eq('institution_id', institutionId)
      .limit(IN_LIMIT)

    const studentIds = students?.map(s => s.id as string) ?? []
    const total = studentIds.length

    if (total === 0) {
      // Record the broadcast even with 0 students (the institution is empty)
      await supabase.from('institution_broadcasts').insert({
        institution_id: institutionId,
        sent_by: user.id,
        title,
        body: message,
        url: url ?? null,
        priority,
        sent_count: 0,
        failed_count: 0,
      })
      return NextResponse.json({ sent: 0, failed: 0, total: 0 })
    }

    // ── Batch push notifications in waves of BATCH_SIZE ─────────────────────
    const payload = {
      title,
      body: message,
      url: url || '/dashboard',
      tag: `broadcast-${institutionId}`,
    }

    let sent = 0
    let failed = 0

    for (let i = 0; i < studentIds.length; i += BATCH_SIZE) {
      const batch = studentIds.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(
        batch.map(uid => notifyUser(admin, uid, payload))
      )
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value > 0) {
          sent++
        } else {
          // Either rejected or returned 0 (no subscriptions / push disabled)
          // Count as failed only when the promise rejected (actual send error)
          if (r.status === 'rejected') failed++
        }
      }
    }

    // ── Persist broadcast record ─────────────────────────────────────────────
    await supabase.from('institution_broadcasts').insert({
      institution_id: institutionId,
      sent_by: user.id,
      title,
      body: message,
      url: url ?? null,
      priority,
      sent_count: sent,
      failed_count: failed,
    })

    return NextResponse.json({ sent, failed, total })
  } catch (err) {
    console.error('[admin/broadcast POST]', err)
    return NextResponse.json({ error: 'Broadcast failed' }, { status: 500 })
  }
}
