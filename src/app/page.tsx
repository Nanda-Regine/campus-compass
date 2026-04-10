import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'VarsityOS — Free Student Super-App for South African University Students',
  description:
    'VarsityOS is the free super-app built for South African university students. Track NSFAS allowances, manage your student budget, organise exams and assignments, plan affordable meals, and get AI mental health support from Nova. Works at UCT, Wits, UP, UKZN, UJ, UWC and all SA universities.',
  alternates: { canonical: 'https://varsityos.co.za' },
  openGraph: {
    title: 'VarsityOS — Free Student Super-App for South African University Students',
    description:
      'Free app for SA students: NSFAS tracker, student budget manager, study planner, affordable meal prep, and Nova AI mental health companion. Built for varsity life in South Africa.',
    url: 'https://varsityos.co.za',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://varsityos.co.za/#app',
      name: 'VarsityOS',
      alternateName: ['Varsity OS', 'VarsityOS Student App'],
      url: 'https://varsityos.co.za',
      description:
        'The free super-app for South African university students. Track NSFAS allowances, manage your budget, plan meals, organise studies, and get AI mental health support.',
      applicationCategory: 'EducationApplication',
      operatingSystem: 'Web, iOS, Android (PWA)',
      offers: [
        { '@type': 'Offer', name: 'Free Plan', price: '0', priceCurrency: 'ZAR', description: 'Full access to Study Planner, Budget & NSFAS tracker, Flexible Wallet, Savings Goals, Meal Prep, Work tracker, and 15 Nova AI messages per month. Works offline.' },
        { '@type': 'Offer', name: 'Scholar Plan', price: '39', priceCurrency: 'ZAR', billingDuration: 'P1M', description: '100 Nova messages per month, AI Recipe Generator, study session tracking, and priority support.' },
        { '@type': 'Offer', name: 'Premium Plan', price: '79', priceCurrency: 'ZAR', billingDuration: 'P1M', description: '250 Nova messages per month, all features, CSV export, and early access to new features.' },
        { '@type': 'Offer', name: 'Nova Unlimited Plan', price: '129', priceCurrency: 'ZAR', billingDuration: 'P1M', description: 'Unlimited Nova messages, all Premium features, first access to new Nova capabilities, and a direct feedback channel to the builder.' },
      ],
      featureList: [
        'NSFAS allowance tracker', 'Student budget management', 'Flexible spending wallet',
        'Savings goals tracker', 'Study planner with exam countdowns',
        'Affordable meal planning for SA students', 'Nova AI mental health companion',
        'CBT-based mental health support', 'Crisis detection with SA helpline resources',
        'Load-shedding study schedule planner', 'NSFAS N+ rule guidance',
        'Group assignment manager', 'Part-time work and shift tracker',
        'Offline PWA — works without internet',
      ],
      audience: { '@type': 'EducationalAudience', educationalRole: 'student', geographicArea: { '@type': 'Country', name: 'South Africa' } },
      creator: { '@type': 'Organization', name: 'Mirembe Muse (Pty) Ltd', url: 'https://creativelynanda.co.za', foundingLocation: 'East London, Eastern Cape, South Africa' },
    },
    {
      '@type': 'Organization', '@id': 'https://varsityos.co.za/#org',
      name: 'Mirembe Muse (Pty) Ltd', url: 'https://varsityos.co.za', logo: 'https://varsityos.co.za/favicon.jpg',
      contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', availableLanguage: ['English', 'Afrikaans'], areaServed: 'ZA' },
      address: { '@type': 'PostalAddress', addressLocality: 'East London', addressRegion: 'Eastern Cape', addressCountry: 'ZA' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Is VarsityOS free for South African students?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. VarsityOS is free forever with full access to the Study Planner, Budget & NSFAS tracker, Flexible Wallet, Savings Goals, Meal Prep, Work tracker, and 15 Nova AI messages per month. Scholar is R39/month for 100 messages, Premium is R79/month for 250 messages, and Nova Unlimited is R129/month for unlimited messages.' } },
        { '@type': 'Question', name: 'What is NSFAS and how does VarsityOS help me track it?', acceptedAnswer: { '@type': 'Answer', text: "NSFAS (National Student Financial Aid Scheme) is South Africa's government student funding programme. VarsityOS lets you log and track your NSFAS allowances, set spending categories, and monitor your balance in real time so you never run short before month-end." } },
        { '@type': 'Question', name: 'What is Nova and how does it help students?', acceptedAnswer: { '@type': 'Answer', text: "Nova is VarsityOS's AI companion built specifically for SA students. Nova provides CBT-based mental health support, crisis detection with SA helpline resources, imposter syndrome coaching, study strategies, NSFAS financial guidance, and load-shedding study plans." } },
        { '@type': 'Question', name: 'Which South African universities does VarsityOS support?', acceptedAnswer: { '@type': 'Answer', text: 'VarsityOS works for students at all South African universities including UCT, Wits, UP, Stellenbosch, UKZN, UJ, UWC, NMU, Rhodes, UFH, WSU, UNISA, DUT, CPUT, and TUT.' } },
        { '@type': 'Question', name: 'Can I install VarsityOS on my phone?', acceptedAnswer: { '@type': 'Answer', text: "Yes. VarsityOS is a Progressive Web App (PWA). Open it in Chrome or Safari and tap 'Add to Home Screen'. No app store needed, and it works offline." } },
      ],
    },
  ],
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: '💰', title: 'Budget & NSFAS',    desc: 'Track every rand. Log NSFAS allowances, monitor spending by category, and get AI budget coaching.' },
  { icon: '🏦', title: 'Flexible Wallet',   desc: 'Manage your own spending buckets beyond NSFAS — part-time income, bursaries, family support.', isNew: true },
  { icon: '🎯', title: 'Savings Goals',     desc: 'Set goals like a laptop or textbooks, track progress, and celebrate every milestone with confetti.', isNew: true },
  { icon: '📚', title: 'Study Planner',     desc: 'Timetable, exam countdowns, tasks, and AI study plans built around your actual schedule.' },
  { icon: '🍲', title: 'Meal Prep',         desc: 'Budget SA recipes under R50, weekly meal plans, and an AI recipe generator using what you have.' },
  { icon: '🌟', title: 'Nova AI',           desc: 'Your AI companion for mental health, study strategy, NSFAS guidance, and crisis support. 15 free messages/month.' },
  { icon: '💼', title: 'Work & Shifts',     desc: 'Track part-time jobs, log shifts and earnings, and get conflict alerts with your lectures.' },
  { icon: '👥', title: 'Group Assignments', desc: 'Create group spaces, share tasks and deadlines, and collaborate with classmates — no WhatsApp chaos.', isNew: true },
]

const PAIN_POINTS = [
  { icon: '💸', text: "Your NSFAS money runs out 10 days before month-end — and you're not sure where it went." },
  { icon: '😰', text: "You missed another deadline because it was buried in a WhatsApp group at 11pm." },
  { icon: '🌑', text: "Load shedding hit during your only study block. No plan B." },
  { icon: '🤯', text: "You're stressed, you can't afford a therapist, and generic wellness apps don't understand SA." },
]

const NOVA_CHAT = [
  { role: 'user', text: "I'm really stressed about my exams and haven't been sleeping properly 😔" },
  { role: 'nova', text: "That combination is genuinely hard — and very common before exams. Let's start with tonight, not the whole exam period. What's actually keeping you awake?" },
  { role: 'user', text: "I keep thinking about failing and losing my NSFAS funding." },
  { role: 'nova', text: "That fear is real and it makes sense — NSFAS is tied to your academic progress. But catastrophising now makes it harder to perform. Let's separate what you can control tonight. What's your first exam and when?" },
]

const PRICING = [
  {
    name: 'Free',
    price: 'R0',
    sub: 'forever, no catch',
    colour: 'neutral',
    features: ['Full Study Planner', 'Budget & NSFAS tracker', 'Flexible Wallet', 'Savings Goals', 'Meal Prep & Work tracker', '15 Nova messages / month', 'Works offline (PWA)'],
    cta: 'Get started free',
    href: '/auth/signup',
    highlight: false,
    gold: false,
  },
  {
    name: 'Scholar',
    price: 'R39',
    sub: 'per month',
    colour: 'coral',
    features: ['Everything in Free', '100 Nova messages / month', 'AI Recipe Generator', 'Study session tracking', 'Priority support'],
    cta: 'Go Scholar',
    href: '/upgrade',
    highlight: true,
    badge: 'Best value',
    gold: false,
  },
  {
    name: 'Premium',
    price: 'R79',
    sub: 'per month',
    colour: 'teal',
    features: ['Everything in Scholar', '250 Nova messages / month', 'CSV data export', 'Early access to new features', 'Priority support'],
    cta: 'Go Premium',
    href: '/upgrade',
    highlight: false,
    gold: false,
  },
  {
    name: 'Nova Unlimited',
    price: 'R129',
    sub: 'per month',
    colour: 'gold',
    features: ['Everything in Premium', 'Unlimited Nova messages', 'First access to new Nova features', 'Direct feedback channel to the builder'],
    cta: 'Go Unlimited',
    href: '/upgrade',
    highlight: false,
    badge: 'Most Nova',
    gold: true,
  },
]

const TESTIMONIALS = [
  { quote: "Nova talked me through a full breakdown before my CHEM3 exam. Didn't feel like a chatbot — it felt like someone who actually got it.", name: 'Lethabo M.', role: '3rd year BSc, Wits', colour: 'teal' },
  { quote: "I finally know exactly where my NSFAS money goes. The budget tracker is the first thing I open every month.", name: 'Ayasha P.', role: '2nd year Law, UCT', colour: 'coral' },
  { quote: "Set up my whole semester timetable in 10 minutes. No more missed assignments buried in WhatsApp.", name: 'Siyanda D.', role: '1st year Engineering, UKZN', colour: 'amber' },
]

const UNIVERSITIES = ['UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'UWC', 'NMU', 'Rhodes', 'UFH', 'WSU', 'UNISA', 'DUT', 'CPUT', 'TUT']

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <Script id="json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} strategy="afterInteractive" />

      <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#0b0907' }}>

        {/* ── 1. NAVBAR ──────────────────────────────────────────────────────── */}
        <nav
          className="sticky top-0 z-50 flex items-center justify-between px-5 py-3.5 max-w-6xl mx-auto"
          aria-label="Main navigation"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', background: 'rgba(11,9,7,0.9)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-white/10">
              <Image src="/logo.jpg" alt="VarsityOS" width={32} height={32} className="object-contain" />
            </div>
            <span className="font-display font-bold text-white text-sm">VarsityOS</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="font-display text-xs font-medium px-3.5 py-2 rounded-lg transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Log in
            </Link>
            <Link href="/auth/signup" className="font-display text-xs font-bold px-4 py-2 rounded-lg" style={{ background: '#0d9488', color: '#fff' }}>
              Get started free
            </Link>
          </div>
        </nav>

        {/* ── 2. HERO ────────────────────────────────────────────────────────── */}
        <section className="relative px-5 pt-20 pb-16 max-w-6xl mx-auto text-center overflow-hidden" aria-labelledby="hero-heading">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
            aria-hidden="true"
            style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(211,107,73,0.13) 0%, rgba(13,148,136,0.09) 40%, transparent 70%)' }}
          />
          <div className="relative">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-xs mb-7"
              style={{ background: 'rgba(211,107,73,0.1)', border: '1px solid rgba(211,107,73,0.2)', color: '#d9845a' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#d9845a' }} aria-hidden="true" />
              Built for 11 million SA students
            </div>

            <h1 id="hero-heading" className="font-display font-black text-white leading-[1.05] mb-5" style={{ fontSize: 'clamp(2.4rem, 7vw, 4.5rem)' }}>
              Your varsity life,{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(120deg, #e07858, #e8a87c)' }}>
                finally under control.
              </span>
            </h1>

            <p className="text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Budget, savings goals, study planner, group projects, meal prep, and Nova — your AI companion who actually understands SA student life. Works offline. No app store needed.
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap mb-5">
              <Link
                href="/auth/signup"
                className="font-display font-bold text-sm px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: '#fff', boxShadow: '0 4px 24px rgba(13,148,136,0.3)' }}
              >
                Start for free — no card needed
              </Link>
              <Link
                href="/auth/login"
                className="font-display font-bold text-sm px-7 py-3.5 rounded-xl transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)' }}
              >
                I have an account
              </Link>
            </div>
            <p className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Free forever · Works offline · Install on your phone</p>
          </div>
        </section>

        {/* ── 3. SOCIAL PROOF ────────────────────────────────────────────────── */}
        <section className="px-5 pb-12 max-w-6xl mx-auto" aria-label="Social proof">
          {/* Stat bar */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 rounded-2xl overflow-hidden mb-6"
            style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#120e0a' }}
          >
            {[
              { value: 'R0', label: 'forever', sub: 'no credit card' },
              { value: '8+', label: 'tools, one app', sub: 'no switching' },
              { value: '15+', label: 'SA universities', sub: 'UCT to TUT' },
              { value: '📶', label: 'Works offline', sub: 'load shedding ready' },
            ].map((stat, i) => (
              <div key={stat.label} className="flex flex-col items-center justify-center py-6 px-4 text-center" style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : undefined }}>
                <span className="font-display font-black text-2xl sm:text-3xl text-white mb-0.5">{stat.value}</span>
                <span className="font-display text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{stat.label}</span>
                <span className="font-mono text-[0.55rem] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>{stat.sub}</span>
              </div>
            ))}
          </div>

          {/* University trust */}
          <p className="font-mono text-xs text-center uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.22)' }}>
            For students at South African universities
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2" role="list">
            {UNIVERSITIES.map(uni => (
              <span key={uni} role="listitem" className="font-mono text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.33)' }}>
                {uni}
              </span>
            ))}
            <span className="font-mono text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.22)' }}>+ more</span>
          </div>
        </section>

        {/* ── 4. PROBLEM ─────────────────────────────────────────────────────── */}
        <section className="px-5 py-20 max-w-6xl mx-auto" aria-labelledby="problem-heading">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: 'rgba(217,120,84,0.7)' }}>Sound familiar?</p>
              <h2 id="problem-heading" className="font-display font-black text-3xl sm:text-4xl text-white">
                SA varsity life is hard<br />enough without the chaos.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PAIN_POINTS.map((p) => (
                <div
                  key={p.text}
                  className="flex items-start gap-4 rounded-2xl p-5"
                  style={{ background: 'rgba(217,120,84,0.05)', border: '1px solid rgba(217,120,84,0.12)' }}
                >
                  <span className="text-2xl flex-shrink-0 mt-0.5" aria-hidden="true">{p.icon}</span>
                  <p className="font-display text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{p.text}</p>
                </div>
              ))}
            </div>
            <p className="text-center font-display font-bold text-white mt-8 text-lg">
              You&apos;re not failing. You just don&apos;t have the right tools yet.
            </p>
          </div>
        </section>

        {/* ── 5. SOLUTION ────────────────────────────────────────────────────── */}
        <section className="px-5 pb-20 max-w-6xl mx-auto" aria-labelledby="solution-heading">
          <div className="text-center mb-8">
            <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: 'rgba(13,148,136,0.8)' }}>Enter VarsityOS</p>
            <h2 id="solution-heading" className="font-display font-black text-3xl sm:text-4xl text-white">
              Everything you need.<br />One place. Built for SA.
            </h2>
          </div>

          {/* App preview */}
          <div className="rounded-3xl p-5 sm:p-8 relative overflow-hidden" style={{ background: '#120e0a', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none" aria-hidden="true" style={{ background: 'radial-gradient(circle at top right, rgba(13,148,136,0.08), transparent 60%)' }} />
            <div className="absolute bottom-0 left-0 w-72 h-72 pointer-events-none" aria-hidden="true" style={{ background: 'radial-gradient(circle at bottom left, rgba(211,107,73,0.06), transparent 60%)' }} />

            <div className="relative grid sm:grid-cols-3 gap-3">
              {/* Budget card */}
              <div className="rounded-2xl p-4" style={{ background: '#1a1410', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="font-mono text-[0.55rem] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Budget · March</p>
                <div className="space-y-2.5 mb-4">
                  {[
                    { label: 'NSFAS food', amount: 'R890', pct: 72, colour: '#0d9488' },
                    { label: 'Transport', amount: 'R340', pct: 45, colour: '#d97b54' },
                    { label: 'Books', amount: 'R210', pct: 30, colour: '#d4a847' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="font-display text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                        <span className="font-mono text-xs" style={{ color: item.colour }}>{item.amount}</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <div className="h-1 rounded-full" style={{ width: `${item.pct}%`, background: item.colour, opacity: 0.7 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.15)' }}>
                  <p className="font-mono text-[0.6rem] text-teal-400">R1,840 remaining this month</p>
                </div>
              </div>

              {/* Study + streak */}
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl p-4 flex-1" style={{ background: '#1a1410', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="font-mono text-[0.55rem] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Upcoming</p>
                  <div className="space-y-2">
                    {[
                      { label: 'CHEM3 exam', date: 'Mon 14 Apr', urgent: true },
                      { label: 'Physics assignment', date: 'Wed 16 Apr', urgent: false },
                      { label: 'Group presentation', date: 'Fri 18 Apr', urgent: false },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.urgent ? '#d97b54' : 'rgba(255,255,255,0.2)' }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-xs truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{item.label}</p>
                          <p className="font-mono text-[0.55rem]" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl p-4" style={{ background: 'rgba(217,120,84,0.08)', border: '1px solid rgba(217,120,84,0.15)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden="true">🔥</span>
                    <div>
                      <p className="font-display font-bold text-white text-sm">12 day streak</p>
                      <p className="font-mono text-[0.55rem]" style={{ color: 'rgba(255,255,255,0.35)' }}>Keep it going</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nova chat */}
              <div className="rounded-2xl p-4" style={{ background: '#1a1410', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}>✦</div>
                  <p className="font-display font-bold text-xs text-white">Nova</p>
                  <span className="font-mono text-[0.5rem] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(13,148,136,0.15)', color: '#4db6ac' }}>AI companion</span>
                </div>
                <div className="space-y-2">
                  <div className="rounded-xl rounded-tl-sm px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <p className="font-display text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>stressed about exams + not sleeping 😔</p>
                  </div>
                  <div className="rounded-xl rounded-tr-sm px-3 py-2" style={{ background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.15)' }}>
                    <p className="font-display text-xs leading-relaxed text-teal-300">Let&apos;s start with tonight — what&apos;s actually keeping you awake?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. FEATURES ────────────────────────────────────────────────────── */}
        <section className="px-5 pb-20 max-w-6xl mx-auto" aria-labelledby="features-heading">
          <div className="text-center mb-10">
            <h2 id="features-heading" className="font-display font-black text-3xl sm:text-4xl text-white">
              Everything you need.<br />Nothing you don&apos;t.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <article key={f.title} className="rounded-2xl p-5 relative" style={{ background: '#120e0a', border: '1px solid rgba(255,255,255,0.07)' }}>
                {f.isNew && (
                  <span className="absolute top-3 right-3 font-mono text-[0.5rem] uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: 'rgba(13,148,136,0.15)', color: '#4db6ac', border: '1px solid rgba(13,148,136,0.25)' }}>New</span>
                )}
                <div className="text-2xl mb-3" aria-hidden="true">{f.icon}</div>
                <h3 className="font-display font-bold text-white text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Nova spotlight (within solution context) ──────────────────────── */}
        <section className="px-5 pb-20 max-w-6xl mx-auto" aria-labelledby="nova-heading">
          <div className="rounded-3xl p-6 sm:p-10 overflow-hidden relative" style={{ background: '#0e1714', border: '1px solid rgba(13,148,136,0.18)' }}>
            <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none" aria-hidden="true" style={{ background: 'radial-gradient(circle at top right, rgba(13,148,136,0.08), transparent 60%)' }} />
            <div className="relative grid lg:grid-cols-2 gap-10 items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs mb-5" style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)', color: '#4db6ac' }}>✦ Nova AI companion</div>
                <h2 id="nova-heading" className="font-display font-black text-3xl sm:text-4xl text-white mb-4">
                  Not a chatbot.<br />Someone who gets it.
                </h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Nova runs on a comprehensive SA student knowledge base — NSFAS rules, load-shedding strategies, CBT techniques, imposter syndrome coaching, real-rand financial guidance. It knows the difference between ordinary stress and a crisis.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: '🧠', label: 'CBT-based mental health support', desc: 'Crisis detection + SADAG & LifeLine hotlines built in' },
                    { icon: '📖', label: 'Evidence-based study strategies', desc: 'Spaced repetition, retrieval practice, load-shedding plans' },
                    { icon: '💳', label: 'Real NSFAS & money coaching', desc: 'N+ rules, debt prevention, side hustles around lectures' },
                    { icon: '🌍', label: 'SA student life, deeply understood', desc: 'Township backgrounds, language barriers, family pressure, res culture' },
                  ].map(item => (
                    <div key={item.label} className="flex items-start gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-base flex-shrink-0 mt-0.5" aria-hidden="true">{item.icon}</span>
                      <div>
                        <p className="font-display font-bold text-white text-xs mb-0.5">{item.label}</p>
                        <p className="font-mono text-[0.58rem]" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="rounded-2xl p-5" style={{ background: '#0b1210', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}>✦</div>
                    <div>
                      <p className="font-display font-bold text-white text-sm">Nova</p>
                      <p className="font-mono text-[0.55rem] text-teal-400">Online · SA Student AI</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {NOVA_CHAT.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className="max-w-[85%] rounded-2xl px-4 py-2.5"
                          style={{
                            background: msg.role === 'user' ? 'rgba(255,255,255,0.07)' : 'rgba(13,148,136,0.12)',
                            border: msg.role === 'nova' ? '1px solid rgba(13,148,136,0.18)' : undefined,
                          }}
                        >
                          <p className="font-display text-xs leading-relaxed" style={{ color: msg.role === 'nova' ? '#b2dfdb' : 'rgba(255,255,255,0.7)' }}>
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex-1 rounded-xl px-3 py-2 font-display text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.07)' }}>Talk to Nova...</div>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: 'rgba(13,148,136,0.2)' }} aria-hidden="true">↑</div>
                  </div>
                </div>
                <p className="font-mono text-[0.55rem] text-center mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>15 free messages/month · 100 with Scholar · 250 with Premium · ∞ with Nova Unlimited</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. HOW IT WORKS ────────────────────────────────────────────────── */}
        <section className="px-5 pb-20 max-w-6xl mx-auto" aria-labelledby="how-heading">
          <div className="text-center mb-10">
            <h2 id="how-heading" className="font-display font-black text-3xl text-white">Up and running in 3 minutes.</h2>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>No app store. No credit card. Just sign up.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
            {[
              { step: '01', icon: '✉️', title: 'Create your account', desc: 'Sign up with email or Google in under a minute. No payment details required.' },
              { step: '02', icon: '🎓', title: 'Set up your profile', desc: 'Add your university, degree, and year. We personalise everything around you.' },
              { step: '03', icon: '🚀', title: 'Take control', desc: 'Add your modules, load your budget or NSFAS, set savings goals, and meet Nova. Everything syncs and works offline.' },
            ].map((step, i) => (
              <div key={step.step} className="rounded-2xl p-5 relative overflow-hidden" style={{ background: '#120e0a', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="absolute top-4 right-5 font-display font-black text-5xl pointer-events-none select-none" style={{ color: 'rgba(255,255,255,0.04)', lineHeight: 1 }} aria-hidden="true">{step.step}</span>
                <div className="text-2xl mb-3" aria-hidden="true">{step.icon}</div>
                <h3 className="font-display font-bold text-white text-sm mb-2">{step.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{step.desc}</p>
                {i < 2 && <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 font-display text-lg" style={{ color: 'rgba(255,255,255,0.18)' }} aria-hidden="true">→</div>}
              </div>
            ))}
          </div>
        </section>

        {/* ── 8. PRICING ─────────────────────────────────────────────────────── */}
        <section className="px-5 pb-20 max-w-6xl mx-auto" aria-labelledby="pricing-heading">
          <div className="text-center mb-10">
            <h2 id="pricing-heading" className="font-display font-black text-3xl text-white mb-2">Simple, honest pricing.</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Start free. Upgrade only when you need more Nova.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {PRICING.map((tier) => {
              const isHighlight = tier.highlight
              const isGold = tier.gold
              return (
                <div
                  key={tier.name}
                  className="relative rounded-2xl p-6"
                  style={{
                    background: isGold ? 'linear-gradient(145deg, #1a1508, #1c1609)' : isHighlight ? 'linear-gradient(145deg, #1c0e08, #200f08)' : '#120e0a',
                    border: isGold ? '1px solid rgba(212,168,71,0.4)' : isHighlight ? '1px solid rgba(217,120,84,0.35)' : '1px solid rgba(255,255,255,0.09)',
                    boxShadow: isGold ? '0 0 40px rgba(212,168,71,0.08)' : isHighlight ? '0 0 40px rgba(217,120,84,0.08)' : undefined,
                  }}
                >
                  {tier.badge && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-[0.6rem] uppercase tracking-widest px-3 py-1 rounded-full"
                      style={{ background: isGold ? '#d4a847' : '#d97b54', color: '#fff' }}
                    >
                      {tier.badge}
                    </div>
                  )}
                  <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: isGold ? '#d4a847' : isHighlight ? '#e8956e' : 'rgba(255,255,255,0.3)' }}>{tier.name}</div>
                  <div className="font-display font-black text-4xl text-white mb-0.5">{tier.price}</div>
                  <div className="font-mono text-xs mb-5" style={{ color: 'rgba(255,255,255,0.25)' }}>{tier.sub}</div>
                  <ul className="space-y-2.5 mb-6">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        <span className="text-xs flex-shrink-0" style={{ color: isGold ? '#d4a847' : isHighlight ? '#e8956e' : '#4db6ac' }} aria-hidden="true">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.href}
                    className="block text-center font-display font-bold text-sm py-2.5 rounded-xl transition-all"
                    style={{
                      background: isGold ? '#d4a847' : isHighlight ? '#d97b54' : 'transparent',
                      color: isGold || isHighlight ? '#fff' : 'rgba(255,255,255,0.55)',
                      border: isGold || isHighlight ? undefined : '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    {tier.cta}
                  </Link>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── 9. TESTIMONIALS ────────────────────────────────────────────────── */}
        <section className="px-5 pb-20 max-w-6xl mx-auto" aria-labelledby="testimonials-heading">
          <div className="text-center mb-10">
            <h2 id="testimonials-heading" className="font-display font-black text-3xl text-white">What students are saying</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => {
              const colours: Record<string, { bg: string; border: string; nameColor: string }> = {
                teal:  { bg: '#0e1714', border: 'rgba(13,148,136,0.2)',   nameColor: '#4db6ac' },
                coral: { bg: '#160e0b', border: 'rgba(217,120,84,0.2)',   nameColor: '#e8956e' },
                amber: { bg: '#14110a', border: 'rgba(212,168,71,0.2)',   nameColor: '#d4a847' },
              }
              const c = colours[t.colour]
              return (
                <blockquote key={t.name} className="rounded-2xl p-5" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                  <p className="font-display text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.65)' }}>&ldquo;{t.quote}&rdquo;</p>
                  <footer>
                    <p className="font-display font-bold text-xs" style={{ color: c.nameColor }}>{t.name}</p>
                    <p className="font-mono text-[0.55rem] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>{t.role}</p>
                  </footer>
                </blockquote>
              )
            })}
          </div>
        </section>

        {/* ── 10. FAQ ────────────────────────────────────────────────────────── */}
        <section className="px-5 pb-20 max-w-3xl mx-auto" aria-labelledby="faq-heading">
          <div className="text-center mb-10">
            <h2 id="faq-heading" className="font-display font-black text-3xl text-white">Common questions</h2>
          </div>
          <div className="space-y-2">
            {[
              { q: 'Is VarsityOS actually free?', a: 'Yes. The free plan gives you full access to the Study Planner, Budget & NSFAS tracker, Flexible Wallet, Savings Goals, Meal Prep, Work tracker, and 15 Nova messages every month — forever. Paid plans unlock more Nova.' },
              { q: 'How does VarsityOS help me track my NSFAS?', a: "Log your NSFAS allowances, track spending by category, and see exactly how much you have left. Nova can also answer questions about N+ rules and what happens if you fail modules." },
              { q: 'What makes Nova different from ChatGPT?', a: 'Nova is built specifically for SA students. It knows NSFAS rules, understands load shedding, speaks to imposter syndrome in first-gen students, uses CBT techniques, and detects mental health crises with instant access to SA helplines. It speaks your reality.' },
              { q: 'Which universities does VarsityOS work for?', a: 'All SA universities — UCT, Wits, UP, Stellenbosch, UKZN, UJ, UWC, NMU, Rhodes, UFH, WSU, UNISA, DUT, CPUT, TUT, and more.' },
              { q: 'Does VarsityOS work offline (during load shedding)?', a: "Yes. VarsityOS is a Progressive Web App (PWA). Once loaded, your budget, tasks, timetable, and study data are available offline. Changes sync automatically when you reconnect. Open it in Chrome or Safari and tap 'Add to Home Screen' to install it like a native app." },
              { q: 'I\'m not on NSFAS — can I still use it?', a: "Absolutely. The Flexible Wallet lets you track any income source — bursaries, family support, part-time work. The budget and savings tools work for every SA student, not just NSFAS recipients." },
              { q: 'What does the Scholar plan include vs Premium vs Nova Unlimited?', a: 'Scholar (R39/month) gives you 100 Nova messages per month and the AI Recipe Generator. Premium (R79/month) gives you 250 Nova messages, CSV export, and early access to new features. Nova Unlimited (R129/month) removes all Nova limits entirely — unlimited messages, first access to new Nova capabilities, and a direct line to the builder.' },
              { q: 'Is my data safe? How does VarsityOS comply with POPIA?', a: 'VarsityOS is registered under POPIA (Act 4 of 2013), Registration No. 2026-005658. Your data is stored securely in South Africa via Supabase. We never sell your data. You can request deletion at any time. See our Privacy Policy for full details.' },
            ].map((faq, i) => (
              <details key={i} className="rounded-2xl group overflow-hidden" style={{ background: '#120e0a', border: '1px solid rgba(255,255,255,0.07)' }}>
                <summary className="font-display font-bold text-sm cursor-pointer flex items-center justify-between gap-3 px-5 py-4 text-white" style={{ listStyle: 'none' }}>
                  {faq.q}
                  <span className="text-xs flex-shrink-0 transition-transform group-open:rotate-180" style={{ color: 'rgba(255,255,255,0.3)' }}>▼</span>
                </summary>
                <p className="text-sm leading-relaxed px-5 pb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── 11. FINAL CTA ──────────────────────────────────────────────────── */}
        <section className="px-5 pb-24 max-w-6xl mx-auto">
          <div
            className="rounded-3xl px-8 py-16 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1a0e08 0%, #0b1a14 60%, #0e1714 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="absolute top-0 left-0 w-96 h-96 pointer-events-none" aria-hidden="true" style={{ background: 'radial-gradient(circle at top left, rgba(217,120,84,0.1), transparent 60%)' }} />
            <div className="absolute bottom-0 right-0 w-96 h-96 pointer-events-none" aria-hidden="true" style={{ background: 'radial-gradient(circle at bottom right, rgba(13,148,136,0.1), transparent 60%)' }} />
            <div className="relative">
              <div className="text-5xl mb-5" aria-hidden="true">🧭</div>
              <h2 className="font-display font-black text-white mb-3" style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}>
                Ready to actually get on top of it?
              </h2>
              <p className="text-sm max-w-md mx-auto mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Your budget, your studies, your mental health — in one app built for the reality of SA varsity life. Free to start.
              </p>
              <Link
                href="/auth/signup"
                className="inline-block font-display font-bold text-base px-10 py-4 rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #e07858, #c96040)', color: '#fff', boxShadow: '0 4px 24px rgba(217,120,84,0.3)' }}
              >
                Create your free account
              </Link>
              <p className="font-mono text-xs mt-4" style={{ color: 'rgba(255,255,255,0.2)' }}>No credit card · No app store · Works on any device</p>
              <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-mono text-[0.6rem] mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>Already using VarsityOS? A quick review helps the next student find us.</p>
                <a
                  href="https://g.page/r/CdPIXBcTmJE6EAI/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-mono text-xs px-5 py-2.5 rounded-xl transition-all hover:opacity-80"
                  style={{ background: 'rgba(212,168,71,0.12)', color: '#d4a847', border: '1px solid rgba(212,168,71,0.25)' }}
                >
                  ⭐ Leave a Google Review
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── 12. FOOTER ─────────────────────────────────────────────────────── */}
        <footer className="px-5 py-8 max-w-6xl mx-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-white/10">
                <Image src="/logo.jpg" alt="VarsityOS" width={28} height={28} className="object-contain" />
              </div>
              <span className="font-display font-bold text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>VarsityOS</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="font-mono text-[0.6rem] text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Built by{' '}
                <a
                  href="https://creativelynanda.co.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold transition-colors"
                  style={{ color: '#4db6ac' }}
                >
                  Nanda Regine
                </a>
                {' '}· Mirembe Muse (Pty) Ltd
              </p>
              <a
                href="https://creativelynanda.co.za"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[0.58rem] transition-colors"
                style={{ color: 'rgba(77,182,172,0.5)' }}
              >
                creativelynanda.co.za ↗
              </a>
              <p className="font-mono text-[0.52rem] text-center mt-1" style={{ color: 'rgba(255,255,255,0.15)' }}>
                POPIA Reg. No. 2026-005658
              </p>
            </div>
            <nav aria-label="Footer navigation">
              <div className="flex items-center gap-4">
                {[{ href: '/terms', label: 'Terms' }, { href: '/privacy', label: 'Privacy' }, { href: '/auth/login', label: 'Log in' }, { href: '/auth/signup', label: 'Sign up' }].map(link => (
                  <Link key={link.href} href={link.href} className="font-mono text-[0.6rem] transition-colors" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </footer>

      </div>
    </>
  )
}
