import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import WhenYouAreSick from '@/components/health/WhenYouAreSick'
import { AmbientImage } from '@/components/ui/AmbientImage'

const ProcrastinationProfiler = dynamic(
  () => import('@/components/study/ProcrastinationProfiler'),
  { ssr: false }
)

const newFeatures = [
  {
    href: '/health/sexual',
    icon: '💜',
    title: 'Sexual & Reproductive Health',
    description: 'HIV, PrEP, GBV support, emergency contraception',
    color: '#f472b6',
  },
  {
    href: '/health/cycle',
    icon: '🌸',
    title: 'Cycle Tracker',
    description: 'Track your cycle and sync with study planning',
    color: '#a78bfa',
  },
  {
    href: '/safe-walk',
    icon: '🛡️',
    title: 'Safe Walk',
    description: 'Walk safely with a check-in timer',
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
      <AmbientImage zone="wellness" opacity={0.35} blurPx={18} saturation={1.2} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px' }}>
        <WhenYouAreSick university={university} />

        {/* Mind OS — Procrastination Profiler */}
        <div style={{ marginTop: '28px' }}>
          <h2 style={{ color: '#e5e7eb', fontWeight: 700, fontSize: '17px', marginBottom: '12px' }}>
            🧠 Mind Fitness
          </h2>
          <ProcrastinationProfiler />
        </div>

        {/* New Features */}
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ color: '#e5e7eb', fontWeight: 700, fontSize: '17px', marginBottom: '12px' }}>
            New Features
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
            {newFeatures.map((f) => (
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
                <div
                  style={{
                    fontSize: '24px',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${f.color}20`,
                    borderRadius: '12px',
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: '15px' }}>
                    {f.title}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '13px', marginTop: '2px' }}>
                    {f.description}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
