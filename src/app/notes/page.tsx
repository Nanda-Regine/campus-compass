import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import TopBar from '@/components/layout/TopBar'
import NotesMarketplace from '@/components/notes/NotesMarketplace'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata = { title: 'Notes Marketplace · VarsityOS' }

export default async function NotesPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('university, faculty, year_of_study')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      <AmbientImage zone="study" opacity={0.38} blurPx={5} saturation={1.3} overlayColor="transparent" />
      <TopBar title="Notes" />
      <NotesMarketplace
        userId={user.id}
        userInstitution={profile?.university ?? null}
        userFaculty={profile?.faculty ?? null}
        userYear={profile?.year_of_study ?? null}
      />
    </div>
  )
}
