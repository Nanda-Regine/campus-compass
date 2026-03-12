import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import TopBar from '@/components/layout/TopBar'
import Link from 'next/link'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Upgrade to Premium' }

const PLANS = [
  { months: 1, price: 49,  label: '1 Month',   badge: null,          saving: null },
  { months: 3, price: 129, label: '3 Months',  badge: 'Best value',  saving: 'Save R18' },
]

const FEATURES = [
  { icon: '🌟', label: 'Unlimited Nova messages' },
  { icon: '🍲', label: 'AI Recipe Generator' },
  { icon: '📊', label: 'AI Budget Coach' },
  { icon: '📚', label: 'AI Study Plans & Exam Prep' },
  { icon: '📥', label: 'CSV Export Reports' },
]

function buildPayFastForm(userId: string, name: string, email: string, months: number, price: number) {
  const isSandbox = process.env.PAYFAST_SANDBOX === 'true'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://campuscompass.co.za'
  const passphrase = process.env.PAYFAST_PASSPHRASE || ''

  const data: Record<string, string> = {
    merchant_id:   process.env.PAYFAST_MERCHANT_ID!,
    merchant_key:  process.env.PAYFAST_MERCHANT_KEY!,
    return_url:    `${appUrl}/dashboard?upgraded=1`,
    cancel_url:    `${appUrl}/upgrade?cancelled=1`,
    notify_url:    `${appUrl}/api/payfast/notify`,
    name_first:    name.split(' ')[0] || 'Student',
    email_address: email,
    m_payment_id:  `${userId}|${months}`,   // parsed in webhook
    amount:        price.toFixed(2),
    item_name:     `VarsityOS Premium — ${months} Month${months > 1 ? 's' : ''}`,
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

export default async function UpgradePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, is_premium, premium_until')
    .eq('id', user.id)
    .single()

  if (profile?.is_premium) redirect('/dashboard')

  const forms = PLANS.map(plan => ({
    ...plan,
    payfast: buildPayFastForm(user.id, profile?.name || 'Student', user.email || '', plan.months, plan.price),
  }))

  return (
    <div className="min-h-screen bg-[#080f0e] pb-24">
      <TopBar title="Go Premium" />

      <div className="max-w-sm mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">⭐</div>
          <h1 className="font-display font-black text-2xl text-white mb-1">VarsityOS Premium</h1>
          <p className="font-mono text-xs text-white/40">One-off payment · No auto-renewal · Cancel anytime</p>
        </div>

        {/* Feature list */}
        <div className="bg-[#111a18] border border-white/7 rounded-2xl p-4 mb-6">
          <p className="font-mono text-[0.6rem] text-white/30 uppercase tracking-widest mb-3">What you unlock</p>
          <ul className="space-y-2.5">
            {FEATURES.map(f => (
              <li key={f.label} className="flex items-center gap-2.5">
                <span className="text-sm">{f.icon}</span>
                <span className="font-display text-sm text-white/75">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Plan cards */}
        <div className="space-y-3 mb-6">
          {forms.map(plan => (
            <div
              key={plan.months}
              className="relative rounded-2xl p-5"
              style={{
                background: plan.badge
                  ? 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.04))'
                  : 'rgba(255,255,255,0.03)',
                border: plan.badge ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {plan.badge && (
                <div className="absolute -top-2.5 left-4 bg-amber-500 text-black font-mono text-[0.55rem] uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                  {plan.badge}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-display font-bold text-white text-base">{plan.label}</div>
                  {plan.saving && (
                    <div className="font-mono text-[0.6rem] text-amber-400">{plan.saving}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-display font-black text-2xl text-white">R{plan.price}</div>
                  <div className="font-mono text-[0.58rem] text-white/30">
                    R{Math.round(plan.price / plan.months)}/month
                  </div>
                </div>
              </div>

              <form action={plan.payfast.action} method="POST">
                {Object.entries(plan.payfast.fields).map(([name, value]) => (
                  <input key={name} type="hidden" name={name} value={value} />
                ))}
                <button
                  type="submit"
                  className="w-full font-display font-bold text-sm py-3 rounded-xl transition-all active:scale-[0.98]"
                  style={{
                    background: plan.badge ? '#f59e0b' : 'rgba(13,148,136,0.2)',
                    color: plan.badge ? '#000' : '#2dd4bf',
                    border: plan.badge ? 'none' : '1px solid rgba(13,148,136,0.3)',
                  }}
                >
                  Pay R{plan.price} via PayFast
                </button>
              </form>
            </div>
          ))}
        </div>

        <p className="font-mono text-[0.56rem] text-white/20 text-center mb-6">
          Secured by PayFast · Once-off payment · Access expires after your chosen period
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
