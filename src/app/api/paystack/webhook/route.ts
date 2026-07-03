export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * ⚠️⚠️ PAYMENTS — Paystack subscription receiver. DO NOT REMOVE ⚠️⚠️
 * The Mirembe hub (jarvis.mirembemuse.co.za) forwards verified Paystack events here,
 * authenticated with x-hub-secret == HUB_INTERNAL_SECRET. We activate the user's tier
 * from the transaction metadata (ref = this app's user id, tier = plan key).
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const TIER_MAP: Record<string, { tier: string; limit: number }> = {
  varsityos_scholar: { tier: 'scholar', limit: 150 },
  varsityos_nova: { tier: 'nova_unlimited', limit: 9999 },
}

export async function POST(request: NextRequest) {
  try {
    const hubSecret = process.env.HUB_INTERNAL_SECRET
    if (!hubSecret || request.headers.get('x-hub-secret') !== hubSecret) {
      return new NextResponse('Forbidden', { status: 403 })
    }
    const evt = await request.json().catch(() => null)
    if (!evt) return new NextResponse('OK', { status: 200 })

    const data = evt.data || {}
    const meta = (data.metadata && typeof data.metadata === 'object') ? data.metadata : {}
    const userId: string | undefined = meta.ref
    const map = TIER_MAP[meta.tier as string]
    const supabase = createAdminClient()

    if (evt.event === 'charge.success' && userId && map) {
      const { error } = await supabase.from('profiles').update({
        plan: map.tier, subscription_tier: map.tier, is_premium: true, nova_messages_limit: map.limit,
      }).eq('id', userId)
      // Return non-2xx on DB failure so the hub RETRIES — otherwise the user paid
      // but their tier never activates and the 200 tells the hub all is well.
      if (error) { console.error('[paystack] activation failed', userId, error.message); return new NextResponse('DB error', { status: 500 }) }
      console.log('[paystack] activated', userId, map.tier)
    } else if ((evt.event === 'subscription.disable' || evt.event === 'subscription.not_renew') && userId) {
      const { error } = await supabase.from('profiles').update({
        plan: 'free', subscription_tier: 'free', is_premium: false, nova_messages_limit: 20,
      }).eq('id', userId)
      if (error) { console.error('[paystack] downgrade failed', userId, error.message); return new NextResponse('DB error', { status: 500 }) }
    }
    return new NextResponse('OK', { status: 200 })
  } catch (e) {
    console.error('[paystack] webhook error', e)
    // Transient failure — signal retry rather than silently acking.
    return new NextResponse('error', { status: 500 })
  }
}
