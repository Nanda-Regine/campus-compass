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

    // Always log — silently ignore errors here
    try {
      await supabase.from('payment_logs').insert({
        payfast_payment_id: data.pf_payment_id ?? null,
        amount: parseFloat(data.amount_gross ?? '0'),
        status: data.payment_status ?? 'unknown',
        item_name: data.item_name ?? null,
        raw_data: data,
        user_id: data.m_payment_id ?? null,
      })
    } catch { /* log failure is non-fatal */ }

    const userId = data.m_payment_id

    if (data.payment_status === 'COMPLETE' && userId) {
      await Promise.all([
        supabase
          .from('profiles')
          .update({ is_premium: true })
          .eq('id', userId),
        supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan: 'premium',
            status: 'active',
            payfast_payment_id: data.pf_payment_id ?? null,
            payfast_subscription_token: data.token ?? null,
            amount: parseFloat(data.amount_gross ?? '49'),
            billing_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' }),
      ])
    }

    if (data.payment_status === 'CANCELLED' && userId) {
      await Promise.all([
        supabase
          .from('profiles')
          .update({ is_premium: false })
          .eq('id', userId),
        supabase
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId),
      ])
    }

    // PayFast REQUIRES 200 — always
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[PayFast ITN Error]', error)
    return new NextResponse('OK', { status: 200 }) // still 200
  }
}
