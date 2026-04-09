import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// PayFast production IP ranges (from PayFast documentation)
// https://developers.payfast.co.za/docs#step_5_notify_url
const PAYFAST_IPS = [
  '197.97.145.144',
  '197.97.145.145',
  '197.97.145.146',
  '197.97.145.147',
  '197.97.145.148',
  // Sandbox IPs
  '127.0.0.1',
  '::1',
]

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    '0.0.0.0'
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const data: Record<string, string> = {}
    params.forEach((value, key) => { data[key] = value })

    const supabase = createServiceRoleClient()

    // ─── IP whitelist check ────────────────────────────────────────────────
    const clientIp = getClientIp(request)
    const isSandbox = process.env.PAYFAST_SANDBOX === 'true'
    if (!isSandbox && !PAYFAST_IPS.includes(clientIp)) {
      console.warn(`[PayFast ITN] Rejected request from unknown IP: ${clientIp}`)
      // Still return 200 to avoid PayFast retry loops, but don't process
      try {
        await supabase.from('payment_logs').insert({
          payfast_payment_id: data.pf_payment_id ?? null,
          amount: parseFloat(data.amount_gross ?? '0'),
          status: 'REJECTED_IP',
          item_name: data.item_name ?? null,
          raw_data: { ...data, rejected_ip: clientIp },
          user_id: null,
        })
      } catch { /* non-fatal */ }
      return new NextResponse('OK', { status: 200 })
    }

    // m_payment_id is encoded as "userId|tierId" (e.g. "abc123|scholar" or "abc123|premium")
    // Legacy format was "userId|months" — handle both gracefully
    const parts = (data.m_payment_id ?? '').split('|')
    const userId = parts[0]
    const tierOrMonths = parts[1] ?? 'premium'

    // Determine tier: 'scholar', 'premium', or 'nova_unlimited' (legacy numeric = premium)
    const tier: 'scholar' | 'premium' | 'nova_unlimited' =
      tierOrMonths === 'scholar' ? 'scholar'
      : tierOrMonths === 'nova_unlimited' ? 'nova_unlimited'
      : 'premium'

    // Always log — non-fatal
    try {
      await supabase.from('payment_logs').insert({
        payfast_payment_id: data.pf_payment_id ?? null,
        amount: parseFloat(data.amount_gross ?? '0'),
        status: data.payment_status ?? 'unknown',
        item_name: data.item_name ?? null,
        raw_data: data,
        user_id: userId || null,
      })
    } catch { /* non-fatal */ }

    if (data.payment_status === 'COMPLETE' && userId) {
      const now = new Date()
      const nextBillingDate = new Date(now)
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
      const nextBillingStr = nextBillingDate.toISOString()

      await Promise.all([
        supabase
          .from('profiles')
          .update({
            is_premium: true,
            subscription_tier: tier,
            premium_until: nextBillingStr,
          })
          .eq('id', userId),
        supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan: tier,
            status: 'active',
            payfast_payment_id: data.pf_payment_id ?? null,
            payfast_subscription_token: data.token ?? null,
            amount: parseFloat(data.amount_gross ?? '0'),
            billing_date: now.toISOString().split('T')[0],
            next_billing_date: nextBillingStr,
            updated_at: now.toISOString(),
          }, { onConflict: 'user_id' }),
      ])
    }

    // Handle subscription cancellation / charge_failed
    if (data.payment_status === 'CANCELLED' && userId) {
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('user_id', userId)
    }

    // PayFast REQUIRES 200 — always
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[PayFast ITN Error]', error)
    return new NextResponse('OK', { status: 200 })
  }
}
