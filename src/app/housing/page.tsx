import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import HousingOS from '@/components/housing/HousingOS'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata = { title: 'Housing OS · VarsityOS' }

export default async function HousingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      <AmbientImage zone="movement" opacity={0.32} blurPx={18} saturation={1.2} />
      <TopBar title="Housing" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px' }}>
        <HousingOS />
      </div>
    </div>
  )
}
