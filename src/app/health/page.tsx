import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import WhenYouAreSick from '@/components/health/WhenYouAreSick'
import { AmbientImage } from '@/components/ui/AmbientImage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Health OS',
  description:
    "Look after your body and mind at varsity — campus clinic info, what to do when you're sick, cycle tracking and wellbeing tools for SA students.",
}

const ProcrastinationProfiler = dynamic(
  () => import('@/components/study/ProcrastinationProfiler'),
  { ssr: false }
)

const healthRooms = [
  {
    href: '/health/sexual',
    icon: '💜',
    title: 'Sexual & Reproductive Health',
    description: 'HIV, PrEP, GBV support, emergency contraception',
    color: '#f472b6',
  },
  {
    href: '/safe-walk',
    icon: '🛡️',
    title: 'Safe Walk',
    description: 'Walk safely with a live check-in timer',
    color: '#f87171',
  },
]

export default async function HealthPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('university').eq('id', user.id).single()
  const university = profile?.university ?? ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      <AmbientImage zone="wellness" opacity={0.42} blurPx={8} saturation={1.2} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px' }}>

        {/* ── Featured: Cycle Tracker ── */}
        <Link href="/health/cycle" style={{ display: 'block', textDecoration: 'none', marginBottom: 20 }}>
          <div style={{
            borderRadius: 20, overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(244,114,182,0.07))',
            border: '1px solid rgba(167,139,250,0.22)',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(167,139,250,0.18)', fontSize: 26,
              }}>🌸</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: 16, marginBottom: 2 }}>Cycle Tracker</div>
                <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: 12, lineHeight: 1.5 }}>
                  Track your phase, symptoms & sync with study planning
                </div>
              </div>
              <span style={{ color: '#a78bfa', fontSize: 20 }}>→</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['🩸 Period tracking', '💊 Contraception', '⚡ Phase intelligence', '📊 7-day forecast'].map(tag => (
                <span key={tag} style={{
                  padding: '3px 9px', borderRadius: 20, fontSize: 10,
                  background: 'rgba(167,139,250,0.1)', color: '#a78bfa',
                  fontFamily: '"JetBrains Mono",monospace',
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </Link>

        <WhenYouAreSick university={university} />

        {/* Mind OS — Procrastination Profiler */}
        <div style={{ marginTop: '28px' }}>
          <h2 style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '17px', marginBottom: '12px' }}>
            🧠 Mind Fitness
          </h2>
          <ProcrastinationProfiler />
        </div>

        {/* More health rooms */}
        <div style={{ marginTop: '28px' }}>
          <h2 style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '17px', marginBottom: '12px' }}>
            More Health Rooms
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
            {healthRooms.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  textDecoration: 'none',
                }}
              >
                <div style={{
                  fontSize: '24px', width: '44px', height: '44px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${f.color}20`, borderRadius: '12px',
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '15px' }}>{f.title}</div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginTop: '2px' }}>{f.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
