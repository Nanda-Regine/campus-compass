export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

function phpUrlencode(str: string): string {
  // Replicate PHP urlencode(): encode everything except A-Za-z0-9-_.~, spaces→+
  // Note: PHP urlencode does NOT encode ~; encodeURIComponent does not encode !*'()~
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
  scholar:        { price: 29, itemName: 'VarsityOS Nova Scholar' },
  nova_unlimited: { price: 89, itemName: 'VarsityOS Nova Unlimited' },
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
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://varsityos.co.za').replace(/\/$/, '')
    const passphrase = (process.env.PAYFAST_PASSPHRASE || '').trim()
    const merchantId  = (process.env.PAYFAST_MERCHANT_ID  || '').trim()
    const merchantKey = (process.env.PAYFAST_MERCHANT_KEY || '').trim()

    if (!merchantId || !merchantKey) {
      console.error('[PayFast] Missing credentials')
      return NextResponse.json({ error: 'PayFast not configured' }, { status: 500 })
    }

    if (!passphrase) {
      console.error('[PayFast] Passphrase required for recurring billing')
      return NextResponse.json({ error: 'PayFast not configured' }, { status: 500 })
    }

    const nameParts = name.split(/\s+/)
    const nameFirst = (nameParts[0] || 'Student').slice(0, 100)
    const nameLast  = (nameParts.slice(1).join(' ') || nameFirst).slice(0, 100)

    // Canonical hub scheme: mm.varsityos.<tier>.<userId>
    // The Mirembe hub (jarvis.mirembemuse.co.za) decodes this to route the verified
    // ITN back here and to book central Finance under the varsityos revenue stream.
    const mPaymentId = `mm.varsityos.${tierId}.${user.id}`

    // Fields for the PayFast checkout form (document order for human readability).
    // Subscription fields: subscription_type=1 (subscription), frequency=3 (monthly), cycles=0 (indefinite).
    const fields: [string, string][] = [
      ['merchant_id',       merchantId],
      ['merchant_key',      merchantKey],
      ['return_url',        `${appUrl}/upgrade/success`],
      ['cancel_url',        `${appUrl}/upgrade/cancel-confirm`],
      ['notify_url',        (process.env.PAYFAST_HUB_NOTIFY_URL || 'https://jarvis.mirembemuse.co.za/api/payfast/notify')],
      ['name_first',        nameFirst],
      ['name_last',         nameLast],
      ['email_address',     email],
      ['m_payment_id',      mPaymentId],
      ['amount',            tierConfig.price.toFixed(2)],
      ['item_name',         tierConfig.itemName],
      ['subscription_type', '1'],
      ['recurring_amount',  tierConfig.price.toFixed(2)],
      ['frequency',         '3'],
      ['cycles',            '0'],
    ]

    // PayFast verifies the REQUEST signature over the fields in SUBMITTED ORDER
    // (proven live against Mirembe merchant 17030173 — alphabetical ksort produces a
    // different MD5 and PayFast rejects it). Exclude empty values, append passphrase.
    const filteredFields = fields.filter(([, v]) => v !== '')

    const sigSource = filteredFields
      .map(([k, v]) => `${k}=${phpUrlencode(v.trim())}`)
      .join('&') + `&passphrase=${phpUrlencode(passphrase)}`
    const signature = createHash('md5').update(sigSource).digest('hex')

    const formFields: Record<string, string> = Object.fromEntries(filteredFields)
    formFields.signature = signature

    const action = isSandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process'

    console.log('[PayFast] initiate | merchant:', merchantId.slice(0, 4) + '****', '| tier:', tierId, '| sandbox:', isSandbox)

    return NextResponse.json({ action, fields: formFields })

  } catch (error) {
    console.error('[PayFast] initiate exception:', error)
    return NextResponse.json({ error: 'Payment setup failed. Please try again.' }, { status: 500 })
  }
}
