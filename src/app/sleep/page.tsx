import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import TopBar from '@/components/layout/TopBar'
import SleepModule from '@/components/health/SleepModule'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata: Metadata = { title: 'Sleep Science' }

export default async function SleepPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date().toISOString().split('T')[0]
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)

  const { data: logs } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('sleep_date', cutoff.toISOString().split('T')[0])
    .order('sleep_date', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      <AmbientImage zone="wellness" opacity={0.35} blurPx={18} saturation={1.2} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <TopBar title="Sleep Science" />
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 100px' }}>
          <SleepModule initialLogs={logs || []} userId={user.id} today={today} />
        </div>
      </div>
    </div>
  )
}
