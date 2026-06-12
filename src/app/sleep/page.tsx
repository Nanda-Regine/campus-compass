import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import TopBar from '@/components/layout/TopBar'
import SleepModule from '@/components/health/SleepModule'

export const metadata: Metadata = { title: 'Sleep Science' }

export default async function SleepPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date().toISOString().split('T')[0]

  // Last 14 days of sleep logs
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)

  const [{ data: logs }, { data: profile }] = await Promise.all([
    supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('sleep_date', cutoff.toISOString().split('T')[0])
      .order('sleep_date', { ascending: false }),
    supabase
      .from('profiles')
      .select('ambient_image_url')
      .eq('id', user.id)
      .single(),
  ])

  const ambientImage = profile?.ambient_image_url ?? null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      {ambientImage && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <img
            src={ambientImage}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.38 }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.75) 100%)' }} />
        </div>
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <TopBar title="Sleep Science" />
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 100px' }}>
          <SleepModule
            initialLogs={logs || []}
            userId={user.id}
            today={today}
          />
        </div>
      </div>
    </div>
  )
}
