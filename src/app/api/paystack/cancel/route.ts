export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * ⚠️⚠️ PAYMENTS — Paystack subscription cancellation. DO NOT REVERT TO PAYFAST ⚠️⚠️
 * The user's in-app "Cancel subscription" button calls this. We ask the Mirembe hub
 * (jarvis.mirembemuse.co.za) to disable the Paystack subscription for this user, then
 * downgrade the local profile so the UI reflects it immediately. Paystack will also fire
 * subscription.disable → /api/paystack/webhook as the source of truth.
 *
 * NOTE FOR NANDA: confirm PAYSTACK_HUB_CANCEL_URL with your Jarvis hub. The default below
 * follows the same pattern as the checkout endpoint; if the hub exposes a different path,
 * set the env var. If the hub call fails we DO NOT downgrade locally (so the user is never
 * told "cancelled" while Paystack keeps billing).
 */
import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'

const HUB_CANCEL = process.env.PAYSTACK_HUB_CANCEL_URL || 'https://jarvis.mirembemuse.co.za/api/paystack/cancel'

export async function POST() {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hubSecret = process.env.HUB_INTERNAL_SECRET
  if (!hubSecret) {
    console.error('[paystack cancel] HUB_INTERNAL_SECRET not configured')
    return NextResponse.json({ error: 'Cancellation is temporarily unavailable. Please contact support.' }, { status: 500 })
  }

  try {
    const hubRes = await fetch(HUB_CANCEL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-hub-secret': hubSecret },
      body: JSON.stringify({ ref: user.id, email: user.email }),
      signal: AbortSignal.timeout(10000),
    })

    if (!hubRes.ok) {
      const text = await hubRes.text().catch(() => '')
      console.error('[paystack cancel] hub error', hubRes.status, text)
      return NextResponse.json(
        { error: 'Could not cancel your subscription right now. Please try again or contact support.' },
        { status: 502 },
      )
    }

    // Hub confirmed cancellation — downgrade locally so the UI updates instantly.
    // (Paystack's subscription.disable webhook will reconcile this as source of truth.)
    const admin = createAdminClient()
    await admin.from('profiles').update({
      plan: 'free', subscription_tier: 'free', is_premium: false, nova_messages_limit: 20,
    }).eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[paystack cancel] error', e)
    return NextResponse.json(
      { error: 'Network error cancelling your subscription. Please try again.' },
      { status: 500 },
    )
  }
}
