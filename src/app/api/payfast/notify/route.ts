export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// PayFast production IP ranges (from PayFast documentation)
// https://developers.payfast.co.za/docs#step_5_notify_url
const PAYFAST_IPS = [
  '197.97.145.144',
  '197.97.145.145',
  '197.97.145.146',
  '197.97.145.147',
  '197.97.145.148',
  '41.74.179.194',
  '41.74.179.195',
  '41.74.179.196',
  '41.74.179.197',
  '102.216.36.3',
  '102.216.36.4',
  '102.216.36.5',
  '102.216.36.6',
]

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    '0.0.0.0'
  )
}

// PHP urlencode-compatible encoder (PayFast signs params using PHP's urlencode)
// PHP urlencode encodes everything except A-Za-z0-9-_. — including ~ as %7E
function phpUrlencode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .replace(/~/g, '%7E')
    .replace(/%20/g, '+')
}

// Verify PayFast MD5 signature per their ITN specification
function verifySignature(data: Record<string, string>, passphrase: string | undefined): boolean {
  const { signature, ...rest } = data

  // PayFast builds the ITN signature from alphabetically sorted (ksort) params.
  // Filter empty strings — PayFast omits empty fields when building their verification hash.
  const paramString = Object.entries(rest)
    .filter(([, v]) => v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${phpUrlencode(v.trim())}`)
    .join('&')

  const trimmedPassphrase = passphrase?.trim()
  const stringToHash = trimmedPassphrase
    ? `${paramString}&passphrase=${phpUrlencode(trimmedPassphrase)}`
    : paramString

  const computed = crypto.createHash('md5').update(stringToHash).digest('hex')
  return computed === signature
}

function safeAmount(raw: string | undefined): number {
  const n = parseFloat(raw ?? '0')
  return Number.isFinite(n) ? n : 0
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const data: Record<string, string> = {}
    params.forEach((value, key) => { data[key] = value })

    const supabase = createAdminClient()

    // ─── IP whitelist check ────────────────────────────────────────────────
    // Bypass: requests forwarded by the universal PayFast hub on creativelynanda.co.za
    // authenticate themselves with x-hub-secret so we skip IP validation.
    const clientIp = getClientIp(request)
    const isSandbox = process.env.PAYFAST_SANDBOX === 'true'
    const hubSecret = process.env.HUB_INTERNAL_SECRET
    const fromHub =
      hubSecret &&
      request.headers.get('x-hub-secret') === hubSecret &&
      request.headers.get('x-hub-source') === 'mirembe'

    if (!isSandbox && !fromHub && !PAYFAST_IPS.includes(clientIp)) {
      console.warn(`[PayFast ITN] Rejected request from unknown IP: ${clientIp}`)
      try {
        await supabase.from('payment_logs').insert({
          payfast_payment_id: data.pf_payment_id ?? null,
          amount: safeAmount(data.amount_gross),
          status: 'REJECTED_IP',
          item_name: data.item_name ?? null,
          raw_data: { ...data, rejected_ip: clientIp },
          user_id: null,
        })
      } catch { /* non-fatal */ }
      return new NextResponse('OK', { status: 200 })
    }
    if (fromHub) {
      console.info('[PayFast ITN] Accepted via hub forward — IP check bypassed')
    }

    // ─── MD5 signature verification ───────────────────────────────────────
    // When forwarded by the Mirembe hub, the ITN signature was already validated
    // there (with the correct include-empty algorithm) and authenticated by the hub
    // secret — so we trust it and skip the local check (which is the legacy ksort form).
    const passphrase = process.env.PAYFAST_PASSPHRASE
    if (!fromHub && !verifySignature(data, passphrase)) {
      console.warn('[PayFast ITN] Signature verification failed')
      try {
        await supabase.from('payment_logs').insert({
          payfast_payment_id: data.pf_payment_id ?? null,
          amount: safeAmount(data.amount_gross),
          status: 'REJECTED_SIGNATURE',
          item_name: data.item_name ?? null,
          raw_data: data,
          user_id: null,
        })
      } catch { /* non-fatal */ }
      return new NextResponse('OK', { status: 200 })
    }

    // m_payment_id formats supported:
    //   "mm.varsityos.<tier>.<uuid36>"           — Mirembe hub (canonical, new)
    //   "varsityos_{uuid36}_{tier}_{timestamp}"  — legacy universal hub
    //   "{uuid36}_{tier}_{timestamp}"            — legacy direct notify
    const mpid = data.m_payment_id ?? ''
    let userId = ''
    let tier: 'scholar' | 'nova_unlimited' = 'scholar'
    if (mpid.startsWith('mm.varsityos.')) {
      const parts = mpid.split('.') // [mm, varsityos, tier, uuid]
      tier = parts[2] === 'nova_unlimited' ? 'nova_unlimited' : 'scholar'
      userId = parts.slice(3).join('.')
    } else {
      const stripped = mpid.startsWith('varsityos_') ? mpid.slice(10) : mpid
      userId = stripped.slice(0, 36)
      tier = stripped.slice(37).startsWith('nova_unlimited') ? 'nova_unlimited' : 'scholar'
    }
    // Validate that userId is a well-formed UUID before using it in DB queries
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (userId && !UUID_RE.test(userId)) {
      console.warn('[PayFast ITN] Malformed userId in m_payment_id:', mpid)
      return new NextResponse('OK', { status: 200 })
    }

    // The signature only proves PayFast sent the ITN, not that the correct amount was paid,
    // and the tier is derived from the client-influenced m_payment_id. Without this check a
    // user could complete a R1 (or R0) payment and still be granted a premium tier.
    const TIER_PRICES: Record<typeof tier, number> = { scholar: 29, nova_unlimited: 89 }
    const expectedPrice = TIER_PRICES[tier]
    const paidAmount = safeAmount(data.amount_gross)
    const amountOk = paidAmount >= expectedPrice - 0.01 // allow only sub-cent rounding

    // Idempotency: PayFast retries ITNs, and a valid one can be replayed. If we've already
    // recorded a successful payment for this pf_payment_id, acknowledge and stop — otherwise
    // each retry re-runs the upgrade and writes duplicate payment_logs rows.
    if (data.pf_payment_id && (data.payment_status === 'COMPLETE' || data.payment_status === 'SUBSCR_PAYMENT')) {
      const { data: prior } = await supabase
        .from('payment_logs')
        .select('id')
        .eq('payfast_payment_id', data.pf_payment_id)
        .eq('status', data.payment_status)
        .limit(1)
        .maybeSingle()
      if (prior) {
        console.log('[PayFast ITN] Duplicate ITN ignored', { pf_payment_id: data.pf_payment_id })
        return new NextResponse('OK', { status: 200 })
      }
    }

    // Always log — non-fatal
    try {
      await supabase.from('payment_logs').insert({
        payfast_payment_id: data.pf_payment_id ?? null,
        amount: safeAmount(data.amount_gross),
        status: data.payment_status ?? 'unknown',
        item_name: data.item_name ?? null,
        raw_data: data,
        user_id: userId || null,
      })
    } catch { /* non-fatal */ }

    if ((data.payment_status === 'COMPLETE' || data.payment_status === 'SUBSCR_PAYMENT') && userId && !amountOk) {
      console.error('[PayFast ITN] Amount mismatch — refusing upgrade', { userId, tier, expectedPrice, paidAmount })
      try {
        await supabase.from('payment_logs').insert({
          payfast_payment_id: data.pf_payment_id ?? null,
          amount: paidAmount,
          status: 'REJECTED_AMOUNT',
          item_name: data.item_name ?? null,
          raw_data: { ...data, expected_price: expectedPrice, tier },
          user_id: userId,
        })
      } catch { /* non-fatal */ }
    } else if ((data.payment_status === 'COMPLETE' || data.payment_status === 'SUBSCR_PAYMENT') && userId && amountOk) {
      const novaLimit = tier === 'nova_unlimited' ? 9999 : 150 // scholar

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          plan: tier,
          subscription_tier: tier,
          is_premium: true,
          nova_messages_limit: novaLimit,
        })
        .eq('id', userId)

      if (updateError) {
        console.error('[PayFast ITN] Profile upgrade failed', { userId, tier, error: updateError.message })
        try {
          await supabase.from('payment_logs').insert({
            payfast_payment_id: data.pf_payment_id ?? null,
            amount: safeAmount(data.amount_gross),
            status: 'UPGRADE_FAILED',
            item_name: data.item_name ?? null,
            raw_data: { ...data, upgrade_error: updateError.message },
            user_id: userId,
          })
        } catch { /* non-fatal */ }
      } else {
        console.log(`[PayFast ITN] Upgraded user ${userId} to ${tier}`)

        // Also upsert into subscriptions table for subscription management
        // Requires migration 20260425000000_subscriptions_payfast_token.sql to be run first
        try {
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            plan: tier,
            status: 'active',
            payfast_subscription_token: data.token ?? null,
            payfast_payment_id: data.pf_payment_id ?? null,
            amount: safeAmount(data.amount_gross),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
        } catch { /* non-fatal — run migration 20260425000000 to enable */ }
      }
    }

    // Handle subscription cancellation — revert to free tier
    if (data.payment_status === 'CANCELLED' && userId) {
      const { error: cancelError } = await supabase
        .from('profiles')
        .update({
          plan: 'free',
          subscription_tier: 'free',
          is_premium: false,
          nova_messages_limit: 20,
        })
        .eq('id', userId)

      if (cancelError) {
        console.error('[PayFast ITN] Profile cancellation failed', { userId, error: cancelError.message })
      } else {
        console.log(`[PayFast ITN] Cancelled subscription for user ${userId}`)
        // Update subscriptions record (non-fatal — requires migration 20260425000000)
        try {
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            plan: 'free',
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
        } catch { /* non-fatal */ }
      }
    }

    // PayFast REQUIRES 200 — always
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[PayFast ITN Error]', error)
    return new NextResponse('OK', { status: 200 })
  }
}
