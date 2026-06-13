export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

function phpUrlencode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28')
    .replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/~/g, '%7E')
    .replace(/%20/g, '+')
}

function buildApiSignature(headers: Record<string, string>, passphrase: string): string {
  const sorted = Object.entries({ ...headers, passphrase })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${phpUrlencode(v.trim())}`)
    .join('&')
  return createHash('md5').update(sorted).digest('hex')
}

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminSupabaseClient()

    // Fetch subscription token
    const { data: sub } = await admin
      .from('subscriptions')
      .select('payfast_subscription_token, plan, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!sub?.payfast_subscription_token) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    if (sub.status === 'cancelled') {
      return NextResponse.json({ error: 'Subscription already cancelled' }, { status: 409 })
    }

    const merchantId = (process.env.PAYFAST_MERCHANT_ID || '').trim()
    const passphrase = (process.env.PAYFAST_PASSPHRASE || '').trim()
    const isSandbox  = process.env.PAYFAST_SANDBOX === 'true'

    if (!merchantId || !passphrase) {
      return NextResponse.json({ error: 'PayFast not configured' }, { status: 500 })
    }

    const timestamp = new Date().toISOString().replace('Z', '+00:00')
    const apiHeaders: Record<string, string> = {
      'merchant-id': merchantId,
      'version': 'v1',
      'timestamp': timestamp,
    }
    const signature = buildApiSignature(apiHeaders, passphrase)

    const baseUrl = isSandbox
      ? 'https://api.sandbox.payfast.co.za'
      : 'https://api.payfast.co.za'

    const pfRes = await fetch(
      `${baseUrl}/subscriptions/${sub.payfast_subscription_token}/cancel`,
      {
        method: 'PUT',
        headers: { ...apiHeaders, signature },
      }
    )

    // PayFast returns 200 on success; treat non-200 as failure
    if (!pfRes.ok) {
      const text = await pfRes.text().catch(() => '')
      console.error('[PayFast cancel] API error', pfRes.status, text)
      return NextResponse.json(
        { error: 'PayFast could not cancel your subscription. Please try again or contact support.' },
        { status: 502 }
      )
    }

    // Immediately revert profile to free (webhook will also fire, this is optimistic)
    await admin.from('profiles').update({
      plan: 'free',
      subscription_tier: 'free',
      is_premium: false,
      nova_messages_limit: 20,
    }).eq('id', user.id)

    await admin.from('subscriptions').update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id)

    return NextResponse.json({ cancelled: true })
  } catch (error) {
    console.error('[PayFast cancel] error:', error)
    return NextResponse.json({ error: 'Cancellation failed. Please try again.' }, { status: 500 })
  }
}
