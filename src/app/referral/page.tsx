import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import ReferralPageClient from '@/components/referral/ReferralPageClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Refer a Friend | VarsityOS',
  robots: { index: false },
}

export default async function ReferralPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

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

  return (
    <ReferralPageClient
      referralCode={profile?.referral_code ?? ''}
      referralUrl={referralUrl}
      referralCount={referralCount ?? 0}
      creditsEarned={profile?.referral_credits ?? 0}
      name={profile?.name ?? 'Student'}
    />
  )
}
