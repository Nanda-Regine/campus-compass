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
    .replace(/%20/g, '+')
  // ~ is intentionally left unencoded — PHP urlencode keeps it as-is
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

    if (!passphrase) {
      console.error('[PayFast] Passphrase required for recurring billing')
      return NextResponse.json({ error: 'PayFast not configured' }, { status: 500 })
    }

    const nameParts = name.split(/\s+/)
    const nameFirst = (nameParts[0] || 'Student').slice(0, 100)
    const nameLast  = (nameParts.slice(1).join(' ') || nameFirst).slice(0, 100)

    // m_payment_id: {uuid36}_{tier}_{timestamp} — notify route parses userId as first 36 chars
    const mPaymentId = `${user.id}_${tierId}_${Date.now()}`

    // Fields for the PayFast checkout form (document order for human readability).
    // Subscription fields: subscription_type=1 (subscription), frequency=3 (monthly), cycles=0 (indefinite).
    const fields: [string, string][] = [
      ['merchant_id',       merchantId],
      ['merchant_key',      merchantKey],
      ['return_url',        `${appUrl}/dashboard`],
      ['cancel_url',        `${appUrl}/upgrade`],
      ['notify_url',        `${appUrl}/api/payfast/notify`],
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

    // PayFast signature MUST be built from fields sorted alphabetically (ksort).
    // PayFast's server-side verification uses ksort() before computing the MD5.
    // This is true for BOTH the checkout form and the API — do NOT use document order for the hash.
    const filteredFields = fields.filter(([, v]) => v !== '')
    const sortedForSig = [...filteredFields]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${phpUrlencode(v)}`)
      .join('&')

    const sigSource = `${sortedForSig}&passphrase=${phpUrlencode(passphrase)}`
    const signature = createHash('md5').update(sigSource).digest('hex')

    // Form fields object — keep document order for the HTML form submission
    const formFields: Record<string, string> = Object.fromEntries(filteredFields)
    formFields.signature = signature

    const action = isSandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process'

    console.log('[PayFast] subscription initiated | merchant:', merchantId.slice(0, 4) + '****', '| tier:', tierId, '| sandbox:', isSandbox, '| sigFields:', sortedForSig.slice(0, 80) + '...')

    return NextResponse.json({ action, fields: formFields })

  } catch (error) {
    console.error('[PayFast] initiate exception:', error)
    return NextResponse.json({ error: 'Payment setup failed. Please try again.' }, { status: 500 })
  }
}
