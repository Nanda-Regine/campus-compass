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

    // m_payment_id: varsityos_{uuid36}_{tier}_{timestamp}
    // Universal hub on creativelynanda.co.za parses the "varsityos_" prefix to route to this app's Supabase.
    const mPaymentId = `varsityos_${user.id}_${tierId}_${Date.now()}`

    // Fields for the PayFast checkout form (document order for human readability).
    // Subscription fields: subscription_type=1 (subscription), frequency=3 (monthly), cycles=0 (indefinite).
    const fields: [string, string][] = [
      ['merchant_id',       merchantId],
      ['merchant_key',      merchantKey],
      ['return_url',        'https://creativelynanda.co.za/payfast/return?app=varsityos'],
      ['cancel_url',        'https://creativelynanda.co.za/payfast/cancel?app=varsityos'],
      ['notify_url',        'https://creativelynanda.co.za/api/payfast/universal-notify'],
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

    // PayFast verifies the signature by sorting received params with ksort() (alphabetical)
    // before computing the MD5. The signature MUST be built from alphabetically sorted fields.
    const sortedFields = [...filteredFields].sort(([a], [b]) => a.localeCompare(b))
    const sigSource = sortedFields
      .map(([k, v]) => `${k}=${phpUrlencode(v.trim())}`)
      .join('&') + `&passphrase=${phpUrlencode(passphrase)}`
    const signature = createHash('md5').update(sigSource).digest('hex')

    const formFields: Record<string, string> = Object.fromEntries(filteredFields)
    formFields.signature = signature

    const action = isSandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process'

    console.log('[PayFast] initiate | merchant:', merchantId.slice(0, 4) + '****', '| tier:', tierId, '| sandbox:', isSandbox)
    console.log('[PayFast] sig source:', sigSource.replace(passphrase, '***'))
    console.log('[PayFast] signature:', signature)

    return NextResponse.json({ action, fields: formFields })

  } catch (error) {
    console.error('[PayFast] initiate exception:', error)
    return NextResponse.json({ error: 'Payment setup failed. Please try again.' }, { status: 500 })
  }
}
