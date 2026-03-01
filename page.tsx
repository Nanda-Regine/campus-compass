import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Campus Compass — Your Varsity Life, Fully Organised',
  description:
    'The go-to super-app for South African university students. Track NSFAS, manage your budget, plan meals, organise assignments, and get AI mental health support — all in one place. Free to start.',
}

const FEATURES = [
  {
    icon: '📚',
    colour: 'teal',
    title: 'Study Planner',
    desc: 'Timetable, assignment tracker, exam countdowns, and module management — all synced to your account.',
  },
  {
    icon: '💰',
    colour: 'coral',
    title: 'Budget & NSFAS',
    desc: 'Track every rand. Monitor your NSFAS allowances, log expenses by category, and export CSV reports.',
  },
  {
    icon: '🍲',
    colour: 'amber',
    title: 'Meal Prep',
    desc: 'Weekly meal plans, grocery lists, and budget SA recipes under R50 — with an AI recipe generator.',
  },
  {
    icon: '🌟',
    colour: 'purple',
    title: 'Nova AI Companion',
    desc: 'A warm, empathetic SA-coded AI mental health companion. Understands NSFAS stress, load shedding, imposter syndrome.',
  },
]

const UNIVERSITIES = [
  'UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'UWC', 'NMU',
  'Rhodes', 'UFH', 'WSU', 'UNISA', 'DUT', 'CPUT', 'TUT',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080f0e] text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-400 flex items-center justify-center text-lg">
            🧭
          </div>
          <span className="font-display font-bold text-white">Campus Compass</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="font-display text-sm text-white/60 hover:text-white transition-colors px-3 py-2"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="font-display text-sm font-bold bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-xl transition-all"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-5 pt-16 pb-20 max-w-5xl mx-auto text-center">
        {/* Glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center top, rgba(13,148,136,0.2) 0%, transparent 70%)',
          }}
        />

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-teal-600/10 border border-teal-600/20 rounded-full px-4 py-1.5 font-mono text-xs text-teal-400 mb-6">
            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
            Built for 11 million South African students
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-white leading-[1.08] mb-5">
            Your varsity life,{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #0d9488, #14b8a6, #06b6d4)' }}
            >
              fully organised.
            </span>
          </h1>

          <p className="text-white/60 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            NSFAS tracking, budget management, study planner, meal prep, and an AI mental health companion — all in one free app built specifically for SA students.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/auth/signup"
              className="font-display font-bold text-base bg-teal-600 hover:bg-teal-500 text-white px-7 py-3.5 rounded-xl transition-all shadow-teal hover:shadow-teal-lg hover:-translate-y-0.5"
            >
              Start for free 🚀
            </Link>
            <Link
              href="/auth/login"
              className="font-display font-bold text-base border border-white/15 hover:border-white/30 text-white/70 hover:text-white px-7 py-3.5 rounded-xl transition-all"
            >
              I have an account
            </Link>
          </div>

          <p className="mt-4 font-mono text-xs text-white/25">
            Free forever · No credit card needed · Works on any device
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-5 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => {
            const colourMap: Record<string, { border: string; iconBg: string; glow: string }> = {
              teal:   { border: 'border-teal-600/20',   iconBg: 'bg-teal-600/15',   glow: 'hover:border-teal-600/40' },
              coral:  { border: 'border-orange-500/20', iconBg: 'bg-orange-500/15', glow: 'hover:border-orange-500/40' },
              amber:  { border: 'border-amber-500/20',  iconBg: 'bg-amber-500/15',  glow: 'hover:border-amber-500/40' },
              purple: { border: 'border-purple-500/20', iconBg: 'bg-purple-500/15', glow: 'hover:border-purple-500/40' },
            }
            const c = colourMap[f.colour]
            return (
              <div
                key={f.title}
                className={`bg-[#111a18] border ${c.border} ${c.glow} rounded-2xl p-5 transition-all duration-200 group`}
              >
                <div className={`w-11 h-11 ${c.iconBg} rounded-xl flex items-center justify-center text-xl mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-display font-bold text-white text-base mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Social proof — universities */}
      <section className="px-5 pb-20 max-w-5xl mx-auto text-center">
        <p className="font-mono text-xs text-white/30 tracking-widest uppercase mb-5">
          For students at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {UNIVERSITIES.map(uni => (
            <span
              key={uni}
              className="bg-white/5 border border-white/10 rounded-full px-3 py-1 font-mono text-xs text-white/40"
            >
              {uni}
            </span>
          ))}
          <span className="bg-white/5 border border-white/10 rounded-full px-3 py-1 font-mono text-xs text-white/30">
            + more
          </span>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-5 pb-20 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display font-black text-3xl text-white mb-3">Simple pricing</h2>
          <p className="text-white/50 text-sm">Start free. Upgrade when you need more from Nova.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Free */}
          <div className="bg-[#111a18] border border-white/10 rounded-2xl p-6">
            <div className="font-mono text-xs text-white/40 uppercase tracking-widest mb-2">Free</div>
            <div className="font-display font-black text-3xl text-white mb-1">R0</div>
            <div className="font-mono text-xs text-white/30 mb-5">forever</div>
            <ul className="space-y-2.5 mb-6">
              {[
                'Full Study Planner',
                'Full Budget & NSFAS tracker',
                'Full Meal Prep module',
                '10 Nova messages / month',
              ].map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-white/70">
                  <span className="text-teal-400 text-xs">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/signup"
              className="block text-center font-display font-bold text-sm border border-white/15 hover:border-white/30 text-white/70 hover:text-white px-4 py-2.5 rounded-xl transition-all"
            >
              Get started
            </Link>
          </div>

          {/* Premium */}
          <div className="relative bg-gradient-to-br from-teal-900/40 to-teal-950/40 border border-teal-600/30 rounded-2xl p-6">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white font-mono text-[0.6rem] uppercase tracking-widest px-3 py-1 rounded-full">
              Most popular
            </div>
            <div className="font-mono text-xs text-teal-400 uppercase tracking-widest mb-2">Premium</div>
            <div className="font-display font-black text-3xl text-white mb-1">R49</div>
            <div className="font-mono text-xs text-white/30 mb-5">per month</div>
            <ul className="space-y-2.5 mb-6">
              {[
                'Everything in Free',
                'Unlimited Nova messages',
                'AI Recipe Generator',
                'CSV export',
                'Priority support',
              ].map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-white/80">
                  <span className="text-teal-400 text-xs">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/signup"
              className="block text-center font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-xl transition-all"
            >
              Start free, upgrade anytime
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-24 max-w-5xl mx-auto text-center">
        <div
          className="rounded-3xl p-10"
          style={{ background: 'linear-gradient(135deg, #134e4a 0%, #0f3d39 100%)', border: '1px solid rgba(13,148,136,0.3)' }}
        >
          <div className="text-4xl mb-4">🧭</div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white mb-3">
            Ready to take control of your varsity life?
          </h2>
          <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
            Join thousands of SA students who use Campus Compass to stay organised, stress-free, and on top of their finances.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block font-display font-bold text-base bg-white text-teal-900 hover:bg-teal-50 px-8 py-3.5 rounded-xl transition-all shadow-lg"
          >
            Create your free account 🚀
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/7 px-5 py-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-teal-600/20 flex items-center justify-center text-sm">🧭</div>
            <span className="font-display font-bold text-white/60 text-sm">Campus Compass</span>
          </div>
          <p className="font-mono text-[0.6rem] text-white/25 text-center">
            Built by{' '}
            <a href="https://creativelynanda.co.za" target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:text-teal-400">
              Nanda Regine
            </a>
            {' '}· Mirembe Muse (Pty) Ltd · East London, Eastern Cape
          </p>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="font-mono text-[0.6rem] text-white/30 hover:text-white/60 transition-colors">
              Log in
            </Link>
            <Link href="/auth/signup" className="font-mono text-[0.6rem] text-white/30 hover:text-white/60 transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
