import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import TopBar from '@/components/layout/TopBar'
import TutoringMarketplace from '@/components/tutoring/TutoringMarketplace'

export const metadata = { title: 'Peer Tutoring · VarsityOS' }

export default async function TutoringPage() {
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
    .select('university')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      <TopBar title="Tutoring" />
      <TutoringMarketplace
        userId={user.id}
        userInstitution={profile?.university ?? null}
      />
    </div>
  )
}
