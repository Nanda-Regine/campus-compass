import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/referral — get current user's referral code, count, and credits earned
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code, referral_credits, name')
      .eq('id', user.id)
      .single()

    const { count: referralCount } = await supabase
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', user.id)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://varsityos.co.za'
    const referralUrl = `${appUrl}/auth/signup?ref=${profile?.referral_code}`

    return NextResponse.json({
      referralCode: profile?.referral_code,
      referralUrl,
      referralCount: referralCount || 0,
      creditsEarned: profile?.referral_credits || 0,
      // Each referral gives 50 credits to referrer, so pending = (count * 50) - creditsEarned could indicate reversals
    })
  } catch (error) {
    console.error('Referral GET error:', error)
    return NextResponse.json({ error: 'Failed to load referral data' }, { status: 500 })
  }
}

// POST /api/referral — apply a referral code (new user flow)
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { code } = await request.json()
    if (!code?.trim()) return NextResponse.json({ error: 'Referral code required' }, { status: 400 })

    const result = await supabase.rpc('apply_referral', {
      p_referred_id: user.id,
      p_referral_code: code.toLowerCase().trim(),
    })

    if (result.error) throw result.error

    const data = result.data as { error?: string; success?: boolean; referrer_bonus?: number; referred_bonus?: number }
    if (data?.error) return NextResponse.json({ error: data.error }, { status: 400 })

    return NextResponse.json({
      success: true,
      bonusMessages: data?.referred_bonus || 10,
      message: `You got ${data?.referred_bonus || 10} bonus Nova messages! Your friend got a reward too.`,
    })
  } catch (error) {
    console.error('Referral POST error:', error)
    return NextResponse.json({ error: 'Failed to apply referral code' }, { status: 500 })
  }
}
