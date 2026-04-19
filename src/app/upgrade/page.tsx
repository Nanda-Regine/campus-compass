import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import TopBar from '@/components/layout/TopBar'
import Link from 'next/link'
import { createHash } from 'crypto'
import UpgradeButton from '@/components/upgrade/UpgradeButton'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Upgrade — VarsityOS' }

// ─── Tier definitions ─────────────────────────────────────────────────────────

const TIERS = [
  {
    id: 'scholar',
    name: 'Scholar',
    price: 39,
    highlight: true,
    badge: 'Most popular',
    novaMessages: '100',
    features: [
      { icon: '🌟', label: '100 Nova messages / month' },
      { icon: '🍲', label: 'AI Recipe Generator' },
      { icon: '📊', label: 'AI Budget Coach' },
      { icon: '📚', label: 'AI Study Plans & Exam Prep' },
      { icon: '⚡', label: 'Priority support' },
    ],
    itemName: 'VarsityOS Scholar - Monthly',
    colour: '#e8956e',
    gold: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 79,
    highlight: false,
    badge: null,
    novaMessages: '250',
    features: [
      { icon: '🌟', label: '250 Nova messages / month' },
      { icon: '🍲', label: 'AI Recipe Generator' },
      { icon: '📊', label: 'AI Budget Coach' },
      { icon: '📚', label: 'AI Study Plans & Exam Prep' },
      { icon: '📥', label: 'CSV Export Reports' },
      { icon: '🚀', label: 'Early access to new features' },
    ],
    itemName: 'VarsityOS Premium - Monthly',
    colour: '#0d9488',
    gold: false,
  },
  {
    id: 'nova_unlimited',
    name: 'Nova Unlimited',
    price: 129,
    highlight: false,
    badge: 'Most Nova',
    novaMessages: '∞',
    features: [
      { icon: '♾️', label: 'Unlimited Nova messages' },
      { icon: '🍲', label: 'AI Recipe Generator' },
      { icon: '📊', label: 'AI Budget Coach' },
      { icon: '📚', label: 'AI Study Plans & Exam Prep' },
      { icon: '📥', label: 'CSV Export Reports' },
      { icon: '🚀', label: 'First access to new Nova features' },
      { icon: '💬', label: 'Direct feedback channel to builder' },
    ],
    itemName: 'VarsityOS Nova Unlimited - Monthly',
    colour: '#d4a847',
    gold: true,
  },
]

// PHP urlencode-compatible encoder — must match PayFast's server-side encoding exactly
function phpUrlencode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .replace(/~/g, '%7E')
    .replace(/%20/g, '+')
}

// ─── PayFast recurring subscription builder ───────────────────────────────────

function buildPayFastForm(
  userId: string,
  name: string,
  email: string,
  tierId: string,
  price: number,
  itemName: string,
) {
  const isSandbox = process.env.PAYFAST_SANDBOX === 'true'
  const appUrl = 'https://varsityos.co.za'
  const passphrase = (process.env.PAYFAST_PASSPHRASE || '').trim()

  const data: Record<string, string> = {
    merchant_id:       process.env.PAYFAST_MERCHANT_ID || '',
    merchant_key:      process.env.PAYFAST_MERCHANT_KEY || '',
    return_url:        `${appUrl}/dashboard`,
    cancel_url:        `${appUrl}/upgrade`,
    notify_url:        `${appUrl}/api/payfast/notify`,
    name_first:        name.split(' ')[0] || 'Student',
    email_address:     email,
    m_payment_id:      `${userId}_${tierId}`,
    amount:            price.toFixed(2),
    item_name:         itemName,
    subscription_type: '1',
    billing_date:      new Date().toISOString().split('T')[0],
    recurring_amount:  price.toFixed(2),
    frequency:         '3',
    cycles:            '0',
  }

  // Do NOT sort — PayFast verifies in the order fields arrive in the form POST.
  // Use phpUrlencode to match PayFast's PHP server-side signature computation exactly.
  const queryString = Object.entries(data)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${k}=${phpUrlencode(v)}`)
    .join('&')

  const sigSource = passphrase
    ? `${queryString}&passphrase=${phpUrlencode(passphrase)}`
    : queryString

  data.signature = createHash('md5').update(sigSource).digest('hex')

  return {
    action: isSandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process',
    fields: data,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function UpgradePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, is_premium, subscription_tier, plan')
    .eq('id', user.id)
    .single()

  const currentTier =
    (profile as { subscription_tier?: string | null } | null)?.subscription_tier ||
    (profile as { plan?: string | null } | null)?.plan ||
    (profile?.is_premium ? 'premium' : 'free')

  // Already on Nova Unlimited — no higher tier to offer
  if (currentTier === 'nova_unlimited') redirect('/dashboard')

  const tiersWithForms = TIERS.map(tier => ({
    ...tier,
    payfast: buildPayFastForm(
      user.id,
      (profile as { full_name?: string | null } | null)?.full_name || 'Student',
      user.email || '',
      tier.id,
      tier.price,
      tier.itemName,
    ),
    isCurrent: currentTier === tier.id,
  }))

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-base)' }}>
      <TopBar title="Upgrade" />

      <div className="max-w-sm mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--radius-lg)',
            background: 'var(--nova-dim)', border: '0.5px solid var(--nova-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '1.5rem',
          }}>✦</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: 4 }}>
            Unlock more Nova
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Monthly subscription · Cancel anytime
          </p>
        </div>

        {/* Free tier info card */}
        <div
          className="card-base"
          style={{ padding: 16, marginBottom: 16, position: 'relative', overflow: 'hidden' }}
        >
          <div style={{
            position: 'absolute', top: 10, right: 10,
            fontFamily: 'var(--font-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em',
            padding: '2px 8px', borderRadius: 'var(--radius-pill)',
            background: 'var(--teal-dim)', color: 'var(--teal)', border: '0.5px solid var(--teal-border)',
          }}>Works offline</div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 6 }}>
            Free — forever
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 14 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.75rem', color: 'var(--text-primary)' }}>R0</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>/month</span>
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: '15 Nova messages / month' },
              { label: 'Full Study Planner' },
              { label: 'Budget & NSFAS tracker' },
              { label: 'Flexible Wallet + Savings Goals' },
              { label: 'Meal Prep & Work tracker' },
            ].map(f => (
              <li key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 14, height: 14, color: 'var(--teal)', fontSize: '0.6rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✓</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{f.label}</span>
              </li>
            ))}
          </ul>
          {currentTier === 'free' && (
            <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)' }}>
              Your current plan
            </div>
          )}
        </div>

        {/* Paid tier cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {tiersWithForms.map(tier => (
            <div
              key={tier.id}
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                background: tier.id === 'nova_unlimited'
                  ? 'var(--nova-bg)'
                  : tier.highlight
                    ? `linear-gradient(135deg, ${tier.colour}18, ${tier.colour}08)`
                    : 'var(--bg-surface)',
                border: tier.id === 'nova_unlimited'
                  ? '0.5px solid var(--nova-border)'
                  : tier.highlight
                    ? `0.5px solid ${tier.colour}60`
                    : '0.5px solid var(--border-subtle)',
                boxShadow: tier.id === 'nova_unlimited' ? '0 0 40px rgba(130,100,255,0.08)' : undefined,
              }}
            >
              {tier.badge && (
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  fontFamily: 'var(--font-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                  padding: '4px 12px',
                  borderRadius: '0 var(--radius-xl) 0 var(--radius-md)',
                  background: tier.colour,
                  color: tier.gold ? '#1a1200' : '#fff',
                }}>
                  {tier.badge}
                </div>
              )}

              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: tier.colour, marginBottom: 4 }}>
                      {tier.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.75rem', color: 'var(--text-primary)' }}>R{tier.price}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>/month</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.81rem', color: tier.colour }}>{tier.novaMessages} Nova</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>messages/mo</p>
                  </div>
                </div>

                <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {tier.features.map(f => (
                    <li key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 14, height: 14, color: tier.colour, fontSize: '0.6rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✓</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{f.label}</span>
                    </li>
                  ))}
                </ul>

                {tier.isCurrent ? (
                  <div style={{
                    width: '100%', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem',
                    padding: '12px 0', borderRadius: 'var(--radius-md)', textAlign: 'center',
                    background: 'var(--bg-surface)', color: 'var(--text-tertiary)',
                  }}>
                    Current plan
                  </div>
                ) : (
                  <UpgradeButton
                    tier={tier.id}
                    price={tier.price}
                    action={tier.payfast.action}
                    fields={tier.payfast.fields}
                    colour={tier.colour}
                    gold={tier.gold}
                    highlight={tier.highlight}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 16 }}>
          Secured by PayFast · Recurring monthly · Cancel anytime in your profile
        </p>

        <Link
          href="/dashboard"
          style={{ display: 'block', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '0.875rem', color: 'var(--text-tertiary)', padding: '8px 0', textDecoration: 'none' }}
        >
          Maybe later
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 }}>
          <Link href="/terms" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}>
            Terms &amp; Conditions
          </Link>
          <span style={{ color: 'var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.55rem' }}>·</span>
          <Link href="/privacy" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}
