export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * ⚠️⚠️ PAYMENTS — DO NOT REVERT TO PAYFAST ⚠️⚠️
 * VarsityOS subscriptions run through PAYSTACK via the Mirembe hub, NOT PayFast.
 * PayFast recurring billing failed persistently (their own 500s). This route returns
 * a redirect to the JarvisOS Paystack checkout, which initialises the subscription
 * and sends the buyer to Paystack. On payment: Paystack → JarvisOS hub →
 * /api/paystack/webhook (here) activates the user. Keep this flow.
 */
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const HUB_CHECKOUT = 'https://jarvis.mirembemuse.co.za/api/paystack/checkout'
const TIER_PLAN: Record<string, string> = { scholar: 'varsityos_scholar', nova_unlimited: 'varsityos_nova' }

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({} as any))
  const tier = body?.tier === 'nova_unlimited' ? 'nova_unlimited' : 'scholar'
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://varsityos.co.za').replace(/\/$/, '')

  const url =
    `${HUB_CHECKOUT}?plan=${TIER_PLAN[tier]}` +
    `&email=${encodeURIComponent(user.email || '')}` +
    `&ref=${encodeURIComponent(user.id)}` +
    `&callback=${encodeURIComponent(appUrl + '/upgrade/success')}`

  return NextResponse.json({ redirect: url })
}
