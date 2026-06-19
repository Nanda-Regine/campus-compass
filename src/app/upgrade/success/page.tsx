import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import TopBar from '@/components/layout/TopBar'
import Link from 'next/link'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Welcome to Nova — VarsityOS' }

const TIER_META: Record<string, { name: string; colour: string; messages: string; emoji: string }> = {
  scholar:        { name: 'Nova Scholar', colour: '#e8956e', messages: '150', emoji: '🌟' },
  nova_unlimited: { name: 'Nova Unlimited', colour: '#d4a847', messages: '∞', emoji: '♾️' },
}

export default async function UpgradeSuccessPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, subscription_tier, plan')
    .eq('id', user.id)
    .single()

  const tier =
    (profile as { subscription_tier?: string | null } | null)?.subscription_tier ||
    (profile as { plan?: string | null } | null)?.plan ||
    'free'

  const meta = TIER_META[tier]
  const name = ((profile as { full_name?: string | null } | null)?.full_name || '').split(' ')[0] || 'there'

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-base)', position: 'relative', overflowX: 'hidden' }}>
      <AmbientImage zone="nova" opacity={0.38} blurPx={5} saturation={1.4} overlayColor="transparent" />
      <TopBar title="" />

      <div className="max-w-sm mx-auto px-4 py-12 flex flex-col items-center text-center">

        {meta ? (
          <>
            {/* Icon */}
            <div style={{
              width: 72, height: 72, borderRadius: 'var(--radius-xl)',
              background: `${meta.colour}18`,
              border: `1px solid ${meta.colour}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', marginBottom: 24,
            }}>
              {meta.emoji}
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.75rem',
              color: 'var(--text-primary)', marginBottom: 8,
            }}>
              Welcome, {name}!
            </h1>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
              color: meta.colour, marginBottom: 4,
            }}>
              {meta.name} · {meta.messages} messages/month
            </p>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
              color: 'var(--text-tertiary)', marginBottom: 40,
            }}>
              Your subscription is active. Cancel anytime from your profile.
            </p>

            {/* Perks */}
            <div style={{
              width: '100%', background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)',
              padding: '20px', marginBottom: 32, textAlign: 'left',
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 14 }}>
                What&apos;s unlocked
              </p>
              {[
                `${meta.messages} Nova messages this month`,
                'AI Study Plans & Exam Prep',
                'AI Budget Coach',
                'AI Recipe Generator',
                ...(tier === 'nova_unlimited' ? ['CSV Export Reports', 'First access to new features'] : []),
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ color: meta.colour, fontWeight: 700, fontSize: '0.7rem' }}>✓</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{f}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Webhook hasn't fired yet — show processing state */
          <>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', marginBottom: 24,
            }}>⏳</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: 8 }}>
              Payment received!
            </h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 40, lineHeight: 1.7 }}>
              Your subscription is being activated — this usually takes under a minute. Refresh the app if Nova still shows the free limit.
            </p>
          </>
        )}

        <Link
          href="/nova"
          style={{
            display: 'block', width: '100%',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem',
            padding: '14px 0', borderRadius: 'var(--radius-md)', textAlign: 'center',
            background: meta?.colour || 'var(--teal)',
            color: tier === 'nova_unlimited' ? '#1a1200' : '#fff',
            textDecoration: 'none', marginBottom: 12,
          }}
        >
          Chat with Nova →
        </Link>

        <Link
          href="/dashboard"
          style={{
            display: 'block', fontFamily: 'var(--font-display)', fontSize: '0.875rem',
            color: 'var(--text-tertiary)', padding: '8px 0', textDecoration: 'none',
          }}
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
