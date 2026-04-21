export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

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

const TIERS: Record<string, { price: number; itemName: string }> = {
  scholar:        { price: 39,  itemName: 'VarsityOS Scholar' },
  premium:        { price: 79,  itemName: 'VarsityOS Premium' },
  nova_unlimited: { price: 129, itemName: 'VarsityOS Nova Unlimited' },
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const tierId: string = body.tier || 'scholar'
    const tierConfig = TIERS[tierId]
    if (!tierConfig) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const name = ((profile as { full_name?: string | null } | null)?.full_name || 'Student').trim()
    const email = user.email || ''

    const isSandbox = process.env.PAYFAST_SANDBOX === 'true'
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://varsityos.co.za').trim().replace(/\/$/, '')
    const passphrase = (process.env.PAYFAST_PASSPHRASE || '').trim()
    const merchantId  = (process.env.PAYFAST_MERCHANT_ID  || '').trim()
    const merchantKey = (process.env.PAYFAST_MERCHANT_KEY || '').trim()

    if (!merchantId || !merchantKey) {
      console.error('[PayFast] Missing credentials')
      return NextResponse.json({ error: 'PayFast not configured' }, { status: 500 })
    }

    const nameParts = name.split(/\s+/)
    const nameFirst = (nameParts[0] || 'Student').slice(0, 100)
    const nameLast  = (nameParts.slice(1).join(' ') || nameFirst).slice(0, 100)

    // m_payment_id: {uuid36}_{tier}_{timestamp} — notify route parses userId as first 36 chars
    const mPaymentId = `${user.id}_${tierId}_${Date.now()}`

    const data: Record<string, string> = {
      merchant_id:   merchantId,
      merchant_key:  merchantKey,
      return_url:    `${appUrl}/dashboard`,
      cancel_url:    `${appUrl}/upgrade`,
      notify_url:    `${appUrl}/api/payfast/notify`,
      name_first:    nameFirst,
      name_last:     nameLast,
      email_address: email,
      m_payment_id:  mPaymentId,
      amount:        tierConfig.price.toFixed(2),
      item_name:     tierConfig.itemName,
    }

    // Signature: all non-empty fields in insertion order, phpUrlencode-encoded
    const queryString = Object.entries(data)
      .filter(([, v]) => v !== '')
      .map(([k, v]) => `${k}=${phpUrlencode(v)}`)
      .join('&')

    const sigSource = passphrase
      ? `${queryString}&passphrase=${phpUrlencode(passphrase)}`
      : queryString

    data.signature = createHash('md5').update(sigSource).digest('hex')

    const pfEndpoint = isSandbox
      ? 'https://sandbox.payfast.co.za/onsite/process'
      : 'https://www.payfast.co.za/onsite/process'

    console.log('[PayFast] POST', pfEndpoint, 'merchant:', merchantId.slice(0, 4) + '****')

    const pfRes = await fetch(pfEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data).toString(),
    })

    const responseText = await pfRes.text()

    if (!pfRes.ok) {
      console.error('[PayFast] initiate error:', pfRes.status, responseText)
      return NextResponse.json({
        error: `PayFast returned ${pfRes.status}`,
        detail: responseText,
      }, { status: 502 })
    }

    let pfJson: { uuid?: string }
    try {
      pfJson = JSON.parse(responseText)
    } catch {
      console.error('[PayFast] Non-JSON response:', responseText)
      return NextResponse.json({ error: 'PayFast response parse error', detail: responseText }, { status: 502 })
    }

    if (!pfJson.uuid) {
      console.error('[PayFast] No UUID in response:', pfJson)
      return NextResponse.json({ error: 'PayFast returned no UUID', detail: pfJson }, { status: 502 })
    }

    console.log('[PayFast] UUID obtained:', pfJson.uuid)
    return NextResponse.json({ uuid: pfJson.uuid, isSandbox })

  } catch (error) {
    console.error('[PayFast] initiate exception:', error)
    return NextResponse.json({
      error: 'Internal error',
      detail: error instanceof Error ? error.message : 'Unknown',
    }, { status: 500 })
  }
}
