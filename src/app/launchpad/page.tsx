import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import LaunchPadOS from '@/components/launchpad/LaunchPadOS'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata = { title: 'Launch Pad · VarsityOS' }

export default async function LaunchPadPage({ searchParams }: { searchParams: { tab?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      <AmbientImage zone="habits" opacity={0.40} blurPx={8} saturation={1.2} />
      <TopBar title="Launch Pad" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px' }}>
        <LaunchPadOS initialTab={searchParams?.tab} />
      </div>
    </div>
  )
}
