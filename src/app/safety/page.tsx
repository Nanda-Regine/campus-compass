import { createServerSupabaseClient as createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import SafetyOS from '@/components/safety/SafetyOS'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata = { title: 'Safety OS | VarsityOS' }

const safetyQuickLinks = [
  {
    href: '/safe-walk',
    icon: '🛡️',
    title: 'Safe Walk',
    description: 'Walk safely with a check-in timer',
    color: '#f87171',
  },
  {
    href: '/health/sexual',
    icon: '💜',
    title: 'GBV & Sexual Health Support',
    description: 'HIV, PrEP, GBV support, emergency contraception',
    color: '#f472b6',
  },
]

export default async function SafetyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)', position: 'relative' }}>
      <AmbientImage zone="safety" opacity={0.42} blurPx={8} saturation={1.2} />
      <TopBar title="Safety OS" />
      <div style={{ padding: '16px 16px 100px', maxWidth: 600, margin: '0 auto' }}>
        {/* Quick-access safety links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '20px' }}>
          {safetyQuickLinks.map((f) => (
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
                <div style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '15px' }}>
                  {f.title}
                </div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginTop: '2px' }}>
                  {f.description}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <SafetyOS />
      </div>
    </div>
  )
}
