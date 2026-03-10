import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import TopBar from '@/components/layout/TopBar'
import Link from 'next/link'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Upgrade to Premium' }

const PRICE = 49

function buildPayFastForm(userId: string, name: string, email: string) {
  const isSandbox = process.env.PAYFAST_SANDBOX === 'true'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://campuscompass.co.za'
  const passphrase = process.env.PAYFAST_PASSPHRASE || ''

  const data: Record<string, string> = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID!,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
    return_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/upgrade?cancelled=1`,
    notify_url: `${appUrl}/api/payfast/notify`,
    name_first: name.split(' ')[0] || 'Student',
    email_address: email,
    m_payment_id: userId,
    amount: PRICE.toFixed(2),
    item_name: 'Campus Compass Premium',
    subscription_type: '1',
    billing_date: new Date().toISOString().split('T')[0],
    recurring_amount: PRICE.toFixed(2),
    frequency: '3',
    cycles: '0',
  }

  const queryString = Object.entries(data)
    .filter(([, v]) => v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
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

const FEATURES = [
  { icon: '🌟', label: 'Unlimited Nova messages', sub: 'Chat as much as you need' },
  { icon: '🍲', label: 'AI Recipe Generator', sub: 'Budget-smart meals made easy' },
  { icon: '📊', label: 'AI Budget Coach', sub: 'Personalised spending insights' },
  { icon: '📚', label: 'AI Study Plans', sub: 'Auto-generated exam prep' },
  { icon: '📥', label: 'CSV Export Reports', sub: 'Download your expenses & tasks' },
  { icon: '⚡', label: 'Priority support', sub: 'Faster help when you need it' },
]

export default async function UpgradePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, is_premium')
    .eq('id', user.id)
    .single()

  if (profile?.is_premium) redirect('/dashboard')

  const payfast = buildPayFastForm(
    user.id,
    profile?.name || 'Student',
    user.email || '',
  )

  return (
    <div className="min-h-screen bg-[#080f0e] pb-24">
      <TopBar title="Upgrade to Premium" />

      <div className="max-w-sm mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⭐</div>
          <h1 className="font-display font-black text-2xl text-white mb-2">
            Campus Compass Premium
          </h1>
          <p className="font-mono text-sm text-white/40">
            Unlock unlimited AI — cancel anytime
          </p>
        </div>

        {/* Pricing card */}
        <div
          className="rounded-2xl p-6 mb-5"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03))',
            border: '1px solid rgba(245,158,11,0.25)',
          }}
        >
          <div className="font-mono text-[0.62rem] text-amber-400 uppercase tracking-widest mb-2">
            Premium · Monthly
          </div>
          <div className="flex items-end gap-1 mb-5">
            <span className="font-display font-black text-5xl text-white">R{PRICE}</span>
            <span className="font-mono text-sm text-white/30 mb-1.5">/month</span>
          </div>

          <ul className="space-y-3 mb-6">
            {FEATURES.map(f => (
              <li key={f.label} className="flex items-start gap-3">
                <span className="text-base mt-0.5">{f.icon}</span>
                <div>
                  <div className="font-display font-semibold text-sm text-white/85">{f.label}</div>
                  <div className="font-mono text-[0.58rem] text-white/35">{f.sub}</div>
                </div>
              </li>
            ))}
          </ul>

          {/* PayFast form — posts directly to PayFast payment page */}
          <form action={payfast.action} method="POST">
            {Object.entries(payfast.fields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <button
              type="submit"
              className="w-full font-display font-bold text-sm bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black px-5 py-3.5 rounded-xl transition-all"
            >
              Subscribe for R{PRICE}/month
            </button>
          </form>

          <p className="font-mono text-[0.55rem] text-white/25 text-center mt-3">
            Secured by PayFast · Cancel anytime · Billed monthly
          </p>
        </div>

        {/* Free tier reminder */}
        <div className="rounded-2xl border border-white/7 p-4 mb-5">
          <div className="font-mono text-[0.6rem] text-white/30 uppercase tracking-widest mb-2">
            Free tier includes
          </div>
          <ul className="space-y-1.5">
            {['10 Nova messages/month', 'Full Study Planner', 'Budget & NSFAS Tracker', 'Meal Planner'].map(f => (
              <li key={f} className="flex items-center gap-2 font-display text-xs text-white/50">
                <span className="text-teal-500 text-[0.6rem]">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/dashboard"
          className="block text-center font-display text-sm text-white/40 hover:text-white/70 transition-all py-2"
        >
          Maybe later
        </Link>
      </div>
    </div>
  )
}
