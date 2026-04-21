import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

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

// GET /api/payfast/preview?tier=scholar
// Returns the exact fields that would be sent to PayFast for the current user
export async function GET(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tierId = searchParams.get('tier') || 'scholar'

  const PRICES: Record<string, { price: number; itemName: string }> = {
    scholar:        { price: 39,  itemName: 'VarsityOS Scholar - Monthly' },
    premium:        { price: 79,  itemName: 'VarsityOS Premium - Monthly' },
    nova_unlimited: { price: 129, itemName: 'VarsityOS Nova Unlimited - Monthly' },
  }
  const tierConfig = PRICES[tierId] ?? PRICES.scholar

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const name = (profile as { full_name?: string | null } | null)?.full_name || 'Student'
  const email = user.email || ''

  const isSandbox = process.env.PAYFAST_SANDBOX === 'true'
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://varsityos.co.za').trim().replace(/\/$/, '')
  const passphrase = (process.env.PAYFAST_PASSPHRASE || '').trim()
  const merchantId  = (process.env.PAYFAST_MERCHANT_ID  || '').trim()
  const merchantKey = (process.env.PAYFAST_MERCHANT_KEY || '').trim()

  const now = new Date()
  now.setMinutes(now.getMinutes() + 120)
  const billingDate = now.toISOString().split('T')[0]

  const data: Record<string, string> = {
    merchant_id:       merchantId,
    merchant_key:      merchantKey,
    return_url:        `${appUrl}/dashboard`,
    cancel_url:        `${appUrl}/upgrade`,
    notify_url:        `${appUrl}/api/payfast/notify`,
    name_first:        (name.split(' ')[0] || 'Student').slice(0, 100),
    name_last:         (name.split(' ').slice(1).join(' ') || name.split(' ')[0] || 'Student').slice(0, 100),
    email_address:     email,
    m_payment_id:      `${user.id}_${tierId}`,
    amount:            tierConfig.price.toFixed(2),
    item_name:         tierConfig.itemName,
    subscription_type: '1',
    billing_date:      billingDate,
    recurring_amount:  tierConfig.price.toFixed(2),
    frequency:         '3',
    cycles:            '0',
  }

  const queryString = Object.entries(data)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${k}=${phpUrlencode(v)}`)
    .join('&')

  const sigSource = passphrase
    ? `${queryString}&passphrase=${phpUrlencode(passphrase)}`
    : queryString

  const signature = createHash('md5').update(sigSource).digest('hex')

  return NextResponse.json({
    action: isSandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process',
    isSandbox,
    merchantId: merchantId ? `${merchantId.slice(0, 4)}****` : 'MISSING',
    merchantKey: merchantKey ? `${merchantKey.slice(0, 4)}****` : 'MISSING',
    passphraseSet: !!passphrase,
    fields: { ...data, merchant_key: merchantKey ? '****' : 'MISSING' },
    queryString,
    signature,
    billingDate,
    email,
  })
}
