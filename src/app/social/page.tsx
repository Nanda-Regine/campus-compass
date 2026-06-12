import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import TopBar from '@/components/layout/TopBar'
import SocialClient from '@/components/social/SocialClient'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata = { title: 'Campus Feed · VarsityOS' }

export default async function SocialPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('university, study_twin_opt_in, whatsapp_number')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      <AmbientImage zone="community" opacity={0.055} blurPx={8} saturation={1.3} overlayColor="transparent" />
      <TopBar title="Social" />
      <SocialClient
        userId={user.id}
        userInstitution={profile?.university ?? null}
        initialOptIn={profile?.study_twin_opt_in ?? false}
        initialWhatsapp={profile?.whatsapp_number ?? null}
      />
    </div>
  )
}
