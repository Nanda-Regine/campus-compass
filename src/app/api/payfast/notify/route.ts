import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const data: Record<string, string> = {}
    params.forEach((value, key) => { data[key] = value })

    const supabase = createServiceRoleClient()

    // m_payment_id is encoded as "userId|months"
    const [userId, monthsStr] = (data.m_payment_id ?? '').split('|')
    const months = parseInt(monthsStr ?? '1', 10) || 1

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
      const premiumUntil = new Date()
      premiumUntil.setMonth(premiumUntil.getMonth() + months)
      const premiumUntilStr = premiumUntil.toISOString()

      await Promise.all([
        supabase
          .from('profiles')
          .update({ is_premium: true, premium_until: premiumUntilStr })
          .eq('id', userId),
        supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan: 'premium',
            status: 'active',
            payfast_payment_id: data.pf_payment_id ?? null,
            amount: parseFloat(data.amount_gross ?? '0'),
            billing_date: new Date().toISOString().split('T')[0],
            next_billing_date: premiumUntilStr,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' }),
      ])
    }

    // PayFast REQUIRES 200 — always
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[PayFast ITN Error]', error)
    return new NextResponse('OK', { status: 200 })
  }
}
