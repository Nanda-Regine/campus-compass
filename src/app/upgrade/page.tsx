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
  // Always use production HTTPS URL for PayFast (HTTPS required)
  const appUrl = 'https://varsityos.co.za'
  const passphrase = (process.env.PAYFAST_PASSPHRASE || '').trim()

  const data: Record<string, string> = {
    merchant_id:      process.env.PAYFAST_MERCHANT_ID!,
    merchant_key:     process.env.PAYFAST_MERCHANT_KEY!,
    return_url:       `${appUrl}/dashboard`,
    cancel_url:       `${appUrl}/upgrade`,
    notify_url:       `${appUrl}/api/payfast/notify`,
    name_first:       name.split(' ')[0] || 'Student',
    email_address:    email,
    m_payment_id:     `${userId}|${tierId}`,
    amount:           price.toFixed(2),
    item_name:        itemName,
    // Recurring subscription fields
    subscription_type: '1',
    billing_date:     new Date().toISOString().split('T')[0],
    recurring_amount:  price.toFixed(2),
    frequency:        '3',  // Monthly
    cycles:           '0',  // Indefinite
  }

  // Do NOT sort — PayFast verifies in the order fields arrive in the form POST,
  // which is insertion order. Sorting would cause a signature mismatch.
  const queryString = Object.entries(data)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`)
    .join('&')

  const sigSource = passphrase
    ? `${queryString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
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
    <div className="min-h-screen bg-[#080f0e] pb-24">
      <TopBar title="Upgrade" />

      <div className="max-w-sm mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">⭐</div>
          <h1 className="font-display font-black text-2xl text-white mb-1">Unlock more Nova</h1>
          <p className="font-mono text-xs text-white/40">Monthly subscription · Cancel anytime</p>
        </div>

        {/* Free tier info card */}
        <div
          className="rounded-2xl p-4 mb-4 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="absolute top-2 right-2 font-mono text-[0.5rem] uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: 'rgba(13,148,136,0.12)', color: '#4db6ac', border: '1px solid rgba(13,148,136,0.2)' }}>
            Works offline
          </div>
          <p className="font-mono text-[0.6rem] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Free — forever</p>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="font-display font-black text-3xl text-white">R0</span>
            <span className="font-mono text-xs text-white/30">/month</span>
          </div>
          <ul className="space-y-1.5">
            {[
              { icon: '🌟', label: '15 Nova messages / month' },
              { icon: '📚', label: 'Full Study Planner' },
              { icon: '💰', label: 'Budget & NSFAS tracker' },
              { icon: '🏦', label: 'Flexible Wallet + Savings Goals' },
              { icon: '🍲', label: 'Meal Prep & Work tracker' },
            ].map(f => (
              <li key={f.label} className="flex items-center gap-2.5">
                <span className="text-sm">{f.icon}</span>
                <span className="font-display text-xs text-white/50">{f.label}</span>
              </li>
            ))}
          </ul>
          {currentTier === 'free' && (
            <div className="mt-3 font-mono text-[0.6rem] text-white/30 text-center py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              Your current plan
            </div>
          )}
        </div>

        {/* Paid tier cards */}
        <div className="space-y-4 mb-6">
          {tiersWithForms.map(tier => (
            <div
              key={tier.id}
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: tier.gold
                  ? 'linear-gradient(135deg, rgba(212,168,71,0.1), rgba(212,168,71,0.04))'
                  : tier.highlight
                    ? 'linear-gradient(135deg, rgba(232,149,110,0.1), rgba(232,149,110,0.04))'
                    : 'rgba(255,255,255,0.03)',
                border: tier.gold
                  ? '1px solid rgba(212,168,71,0.4)'
                  : tier.highlight
                    ? '1px solid rgba(232,149,110,0.35)'
                    : '1px solid rgba(255,255,255,0.08)',
                boxShadow: tier.gold ? '0 0 30px rgba(212,168,71,0.06)' : undefined,
              }}
            >
              {tier.badge && (
                <div
                  className="absolute top-0 right-0 font-mono text-[0.55rem] uppercase tracking-widest px-3 py-1 rounded-bl-xl"
                  style={{ background: tier.colour, color: tier.gold ? '#1a1200' : '#fff' }}
                >
                  {tier.badge}
                </div>
              )}

              <div className="p-5">
                {/* Header */}
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="font-mono text-[0.6rem] uppercase tracking-widest mb-1"
                      style={{ color: tier.colour }}>
                      {tier.name}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display font-black text-3xl text-white">R{tier.price}</span>
                      <span className="font-mono text-xs text-white/30">/month</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs" style={{ color: tier.colour }}>{tier.novaMessages} Nova</p>
                    <p className="font-mono text-[0.6rem] text-white/25">messages/mo</p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-4">
                  {tier.features.map(f => (
                    <li key={f.label} className="flex items-center gap-2.5">
                      <span className="text-sm">{f.icon}</span>
                      <span className="font-display text-xs text-white/70">{f.label}</span>
                    </li>
                  ))}
                </ul>

                {/* PayFast form or current plan */}
                {tier.isCurrent ? (
                  <div
                    className="w-full font-display font-bold text-sm py-3 rounded-xl text-center"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}
                  >
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

        <p className="font-mono text-[0.56rem] text-white/20 text-center mb-4">
          Secured by PayFast · Recurring monthly · Cancel anytime in your profile
        </p>

        <Link
          href="/dashboard"
          className="block text-center font-display text-sm text-white/35 hover:text-white/60 transition-all py-2"
        >
          Maybe later
        </Link>

        <div className="flex items-center justify-center gap-4 mt-4">
          <Link href="/terms" className="font-mono text-[0.55rem] text-white/20 hover:text-white/40 transition-colors">
            Terms &amp; Conditions
          </Link>
          <span className="text-white/10 font-mono text-[0.55rem]">·</span>
          <Link href="/privacy" className="font-mono text-[0.55rem] text-white/20 hover:text-white/40 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}
