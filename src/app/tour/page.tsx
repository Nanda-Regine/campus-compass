import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'

const TourWizard = dynamic(() => import('@/components/tour/TourWizard'), { ssr: false })

export const metadata = { title: 'Welcome Tour · VarsityOS' }

export default async function TourPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_language')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <TourWizard defaultLang={(profile?.preferred_language as string) ?? 'en'} />
    </div>
  )
}
