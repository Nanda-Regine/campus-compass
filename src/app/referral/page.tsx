import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import ReferralPageClient from '@/components/referral/ReferralPageClient'
import { AmbientImage } from '@/components/ui/AmbientImage'

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
    .select('referral_code, name')
    .eq('id', user.id)
    .single()

  const { count: referralCount } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', user.id)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://varsityos.co.za'
  const referralUrl = `${appUrl}/auth/signup?ref=${profile?.referral_code}`
  const REFERRER_XP = 250

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      <AmbientImage zone="dashboard" opacity={0.40} blurPx={8} saturation={1.1} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <ReferralPageClient
          referralCode={profile?.referral_code ?? ''}
          referralUrl={referralUrl}
          referralCount={referralCount ?? 0}
          xpEarned={(referralCount ?? 0) * REFERRER_XP}
          name={profile?.name ?? 'Student'}
        />
      </div>
    </div>
  )
}
