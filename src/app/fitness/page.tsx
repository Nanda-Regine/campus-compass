import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FitnessTracker from '@/components/health/FitnessTracker'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata = { title: 'Fitness Tracker — VarsityOS' }

export default async function FitnessPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      <AmbientImage zone="body" opacity={0.38} blurPx={8} saturation={1.3} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px' }}>
        <FitnessTracker />
      </div>
    </div>
  )
}
