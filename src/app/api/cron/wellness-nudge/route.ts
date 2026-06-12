// Vercel Cron: daily at 17:00 UTC (19:00 SAST)
// Nudges users who haven't done a wellness check-in today.
// Protected by CRON_SECRET injected by Vercel automatically.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { notifyUser } from '@/lib/push-notify'
import { canSendPush } from '@/lib/webpush'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!canSendPush()) {
    return NextResponse.json({ sent: 0, reason: 'VAPID not configured' })
  }

  const supabase = createAdminSupabaseClient()
  const today = new Date().toISOString().slice(0, 10)

  // Find users who have push subscriptions but no check-in today
  const { data: subscribers } = await supabase
    .from('push_subscriptions')
    .select('user_id')

  if (!subscribers?.length) return NextResponse.json({ sent: 0 })

  const userIds = [...new Set(subscribers.map(s => s.user_id))]

  // Find which of those already checked in today
  const { data: checkedIn } = await supabase
    .from('wellness_checkins')
    .select('user_id')
    .in('user_id', userIds)
    .eq('date', today)

  const checkedInIds = new Set((checkedIn || []).map(r => r.user_id))
  const needsNudge = userIds.filter(id => !checkedInIds.has(id))

  let totalSent = 0
  const NUDGE_MESSAGES = [
    { title: '💚 How are you feeling today?', body: 'A 30-second wellness check-in helps Nova support you better.' },
    { title: '🌟 Quick check-in?', body: 'How\'s your energy and focus today? VarsityOS wants to know.' },
    { title: '💭 Pause for a moment', body: 'Rate your mood and energy — takes 30 seconds. Nova is listening.' },
  ]

  for (let i = 0; i < needsNudge.length; i++) {
    const msg = NUDGE_MESSAGES[i % NUDGE_MESSAGES.length]
    const sent = await notifyUser(supabase, needsNudge[i], {
      ...msg,
      url: '/study?tab=wellness',
      tag: `wellness-${today}`,
    })
    totalSent += sent
  }

  return NextResponse.json({ sent: totalSent, nudged: needsNudge.length, date: today })
}
