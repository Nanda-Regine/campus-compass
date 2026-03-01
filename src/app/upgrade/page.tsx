import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import TopBar from '@/components/layout/TopBar'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Upgrade to Premium' }

const NOVA_PREMIUM_PRICE = 49

export default async function UpgradePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const FEATURES = [
    'Everything in Free',
    'Unlimited Nova messages',
    'AI Recipe Generator',
    'CSV export reports',
    'Priority support',
  ]

  return (
    <div className="min-h-screen bg-[#080f0e] pb-24">
      <TopBar title="Upgrade" />
      <div className="max-w-sm mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⭐</div>
          <h1 className="font-display font-black text-2xl text-white mb-2">Campus Compass Premium</h1>
          <p className="font-mono text-sm text-white/40">Unlock unlimited Nova + AI features</p>
        </div>

        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.04))',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <div className="font-mono text-xs text-amber-400 uppercase tracking-widest mb-2">Premium Plan</div>
          <div className="font-display font-black text-4xl text-white mb-0.5">
            R{NOVA_PREMIUM_PRICE}
          </div>
          <div className="font-mono text-xs text-white/30 mb-5">per month</div>

          <ul className="space-y-3 mb-6">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                <span className="text-amber-400 text-xs">✓</span>
                {f}
              </li>
            ))}
          </ul>

          <div className="font-mono text-[0.65rem] text-white/30 text-center">
            PayFast payment integration coming soon.
          </div>
        </div>

        <Link
          href="/dashboard"
          className="block text-center font-display font-bold text-sm border border-white/15 hover:border-white/30 text-white/60 hover:text-white px-5 py-2.5 rounded-xl transition-all"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
