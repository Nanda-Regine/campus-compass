import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { webpush, canSendPush } from '@/lib/webpush'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    if (!canSendPush()) {
      return NextResponse.json({ error: 'Push not configured' }, { status: 503 })
    }

    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, body, url = '/study' } = await req.json()
    if (!title || !body) return NextResponse.json({ error: 'title and body required' }, { status: 400 })

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user.id)

    if (!subs?.length) return NextResponse.json({ sent: 0 })

    const payload = JSON.stringify({ title, body, url, icon: '/favicon.jpg' })
    const results = await Promise.allSettled(
      subs.map(s =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        )
      )
    )

    // Remove expired subscriptions (410 Gone)
    const expired = subs.filter((_, i) => {
      const r = results[i]
      return r.status === 'rejected' && (r.reason as {statusCode?: number})?.statusCode === 410
    })
    if (expired.length) {
      await supabase.from('push_subscriptions')
        .delete()
        .in('endpoint', expired.map(s => s.endpoint))
    }

    const sent = results.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ sent })
  } catch (error) {
    console.error('Push notify error:', error)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
