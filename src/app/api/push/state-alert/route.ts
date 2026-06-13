export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { notifyUser } from '@/lib/push-notify'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const ruleId: string = typeof body?.ruleId === 'string' ? body.ruleId.slice(0, 100) : ''
    const urgency: number = typeof body?.urgency === 'number' ? body.urgency : 0
    const title: string = typeof body?.title === 'string' ? body.title.slice(0, 100) : ''
    const notifBody: string = typeof body?.body === 'string' ? body.body.slice(0, 300) : ''
    const rawUrl: unknown = body?.url
    const url = typeof rawUrl === 'string' && rawUrl.startsWith('/') ? rawUrl.slice(0, 200) : '/dashboard'
    const cooldownHours: number = typeof body?.cooldownHours === 'number'
      ? Math.min(Math.max(body.cooldownHours, 0), 168)
      : 24

    if (!ruleId || !title || !notifBody) {
      return NextResponse.json({ error: 'ruleId, title, and body are required' }, { status: 400 })
    }

    // Only send for urgency >= 3 to avoid notification noise
    if (urgency < 3) {
      return NextResponse.json({ sent: 0, reason: 'urgency_too_low' })
    }

    // Check cooldown via admin client (push_cooldowns RLS blocks user access)
    const admin = createAdminSupabaseClient()
    const { data: existing } = await admin
      .from('push_cooldowns')
      .select('sent_at')
      .eq('user_id', user.id)
      .eq('rule_id', ruleId)
      .maybeSingle()

    if (existing?.sent_at) {
      const msSince = Date.now() - new Date(existing.sent_at as string).getTime()
      const cooldownMs = cooldownHours * 3_600_000
      if (msSince < cooldownMs) {
        return NextResponse.json({ sent: 0, cooled: true, retryInMs: cooldownMs - msSince })
      }
    }

    const sent = await notifyUser(supabase, user.id, { title, body: notifBody, url, tag: ruleId })

    if (sent > 0) {
      await admin.from('push_cooldowns').upsert(
        { user_id: user.id, rule_id: ruleId, sent_at: new Date().toISOString() },
        { onConflict: 'user_id,rule_id' },
      )
    }

    return NextResponse.json({ sent })
  } catch (error) {
    console.error('Push state-alert error:', error)
    return NextResponse.json({ error: 'Failed to send alert' }, { status: 500 })
  }
}
