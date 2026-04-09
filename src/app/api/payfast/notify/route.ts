import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import crypto from 'crypto'

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

// Verify PayFast MD5 signature per their ITN specification
function verifySignature(data: Record<string, string>, passphrase: string | undefined): boolean {
  const { signature, ...rest } = data

  // Build query string from all params except signature, in received order
  // PayFast expects params in the order they were received
  const paramString = Object.entries(rest)
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`)
    .join('&')

  const stringToHash = passphrase
    ? `${paramString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
    : paramString

  const computed = crypto.createHash('md5').update(stringToHash).digest('hex')
  return computed === signature
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

    // ─── MD5 signature verification ───────────────────────────────────────
    const passphrase = process.env.PAYFAST_PASSPHRASE
    if (!verifySignature(data, passphrase)) {
      console.warn('[PayFast ITN] Signature verification failed')
      try {
        await supabase.from('payment_logs').insert({
          payfast_payment_id: data.pf_payment_id ?? null,
          amount: parseFloat(data.amount_gross ?? '0'),
          status: 'REJECTED_SIGNATURE',
          item_name: data.item_name ?? null,
          raw_data: data,
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
      // Determine nova_messages_limit for this plan
      const novaLimit = tier === 'nova_unlimited' ? 9999
        : tier === 'premium' ? 250
        : 100 // scholar

      await supabase
        .from('profiles')
        .update({
          plan: tier,
          subscription_tier: tier,
          is_premium: true,
          nova_messages_limit: novaLimit,
        })
        .eq('id', userId)
    }

    // Handle subscription cancellation — revert to free tier
    if (data.payment_status === 'CANCELLED' && userId) {
      await supabase
        .from('profiles')
        .update({
          plan: 'free',
          subscription_tier: 'free',
          is_premium: false,
          nova_messages_limit: 15,
        })
        .eq('id', userId)
    }

    // PayFast REQUIRES 200 — always
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[PayFast ITN Error]', error)
    return new NextResponse('OK', { status: 200 })
  }
}
