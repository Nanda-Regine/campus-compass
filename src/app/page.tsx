import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'VarsityOS — Free Student Super-App for South African University Students',
  description:
    'VarsityOS is the free super-app built for South African university students. Track NSFAS allowances, manage your student budget, organise exams and assignments, plan affordable meals, and get AI mental health support from Nova. Works at UCT, Wits, UP, UKZN, UJ, UWC and all SA universities.',
  alternates: {
    canonical: 'https://varsityos.co.za',
  },
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
        {
          '@type': 'Offer',
          name: 'Free Plan',
          price: '0',
          priceCurrency: 'ZAR',
          description: 'Full access to Study Planner, Budget Tracker, Meal Prep, and 10 Nova AI messages per month.',
        },
        {
          '@type': 'Offer',
          name: 'Premium Plan',
          price: '49',
          priceCurrency: 'ZAR',
          billingDuration: 'P1M',
          description: 'Everything in Free plus unlimited Nova AI messages, AI Recipe Generator, CSV export, and priority support.',
        },
      ],
      featureList: [
        'NSFAS allowance tracker',
        'Student budget management',
        'Study planner with exam countdowns',
        'Assignment and timetable management',
        'Affordable meal planning for SA students',
        'AI recipe generator for budget meals',
        'Nova AI mental health companion',
        'CBT-based mental health support',
        'Crisis detection with SA helpline resources',
        'Load-shedding study schedule planner',
        'NSFAS N+ rule guidance',
      ],
      audience: {
        '@type': 'EducationalAudience',
        educationalRole: 'student',
        geographicArea: {
          '@type': 'Country',
          name: 'South Africa',
        },
      },
      creator: {
        '@type': 'Organization',
        name: 'Mirembe Muse (Pty) Ltd',
        url: 'https://creativelynanda.co.za',
        foundingLocation: 'East London, Eastern Cape, South Africa',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://varsityos.co.za/#org',
      name: 'Mirembe Muse (Pty) Ltd',
      url: 'https://varsityos.co.za',
      logo: 'https://varsityos.co.za/favicon.jpg',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        availableLanguage: ['English', 'Afrikaans'],
        areaServed: 'ZA',
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'East London',
        addressRegion: 'Eastern Cape',
        addressCountry: 'ZA',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is VarsityOS free for South African students?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. VarsityOS is free forever with full access to the Study Planner, Budget & NSFAS tracker, Meal Prep module, and 10 Nova AI messages per month. Premium is R49/month for unlimited Nova access.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is NSFAS and how does VarsityOS help me track it?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'NSFAS (National Student Financial Aid Scheme) is South Africa\'s government student funding programme covering tuition, accommodation, meals, books, and transport. VarsityOS lets you log and track your NSFAS allowances, set spending categories, and monitor your balance in real time so you never run short before month-end.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is Nova and how does it help students?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Nova is VarsityOS\'s AI companion built specifically for South African students. Nova provides CBT-based mental health support, crisis detection with SA helpline resources (SADAG, LifeLine), imposter syndrome coaching, evidence-based study strategies (spaced repetition, retrieval practice), NSFAS financial guidance, and load-shedding study plans — all in a culturally aware, empathetic way.',
          },
        },
        {
          '@type': 'Question',
          name: 'Which South African universities does VarsityOS support?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'VarsityOS works for students at all South African universities including UCT, Wits, UP (University of Pretoria), Stellenbosch, UKZN, UJ, UWC, NMU, Rhodes, UFH, WSU, UNISA, DUT, CPUT, and TUT.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I install VarsityOS on my phone?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. VarsityOS is a Progressive Web App (PWA) — you can install it on your Android or iPhone home screen directly from your browser. No app store needed, and it works offline so load shedding won\'t stop you.',
          },
        },
      ],
    },
  ],
}

const FEATURES = [
  {
    icon: '📚',
    colour: 'teal',
    title: 'Study Planner',
    desc: 'Timetable, assignment tracker, exam countdowns, and module management — synced to your account. AI study plans built around your actual load-shedding schedule.',
  },
  {
    icon: '💰',
    colour: 'coral',
    title: 'Budget & NSFAS',
    desc: 'Track every rand. Monitor NSFAS allowances, log expenses by category, get AI budget health analysis, and export CSV reports. Know your R33/day food budget down to the cent.',
  },
  {
    icon: '🍲',
    colour: 'amber',
    title: 'Meal Prep',
    desc: 'Weekly meal plans, grocery lists, and budget SA recipes under R50 — with an AI recipe generator. Batch cooking guides for when load shedding hits mid-week.',
  },
  {
    icon: '🌟',
    colour: 'purple',
    title: 'Nova AI Companion',
    desc: 'A warm, SA-coded AI mental health companion. Understands NSFAS stress, load shedding, imposter syndrome, and first-gen student pressure — not just generic wellness advice.',
  },
]

const NOVA_CAPABILITIES = [
  {
    icon: '🧠',
    colour: 'purple',
    title: 'Evidence-based mental health',
    desc: 'CBT techniques, crisis detection with 24/7 SA hotlines, burnout recognition, imposter syndrome coaching — built for first-gen students, not textbook cases.',
  },
  {
    icon: '📖',
    colour: 'teal',
    title: 'Learning science, not just tips',
    desc: 'Spaced repetition, retrieval practice, interleaving, exam-day strategy by subject type (STEM, law, essays). Load-shedding study schedules that actually work around Eskom.',
  },
  {
    icon: '💳',
    colour: 'coral',
    title: 'Real NSFAS & money coaching',
    desc: 'R33/day meal budgets, NSFAS N+ rules, debt spiral prevention, side hustles that fit around lectures. Actual numbers — not generic advice about "spending less".',
  },
  {
    icon: '🏠',
    colour: 'amber',
    title: 'SA student life, deeply understood',
    desc: 'Township backgrounds, language barriers, family pressure, res culture, taxi strikes, data poverty. Nova speaks your reality — including Zulu/Xhosa/Sotho code-switching.',
  },
]

const UNIVERSITIES = [
  'UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UJ', 'UWC', 'NMU',
  'Rhodes', 'UFH', 'WSU', 'UNISA', 'DUT', 'CPUT', 'TUT',
]

export default function LandingPage() {
  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        strategy="afterInteractive"
      />

      <div className="min-h-screen bg-[#080f0e] text-white overflow-x-hidden">

        {/* Nav */}
        <nav className="flex items-center justify-between px-5 py-4 max-w-5xl mx-auto" aria-label="Main navigation">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-400 flex items-center justify-center text-lg" aria-hidden="true">
              🧭
            </div>
            <span className="font-display font-bold text-white">VarsityOS</span>
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
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
            aria-hidden="true"
            style={{
              background: 'radial-gradient(ellipse at center top, rgba(13,148,136,0.2) 0%, transparent 70%)',
            }}
          />

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-teal-600/10 border border-teal-600/20 rounded-full px-4 py-1.5 font-mono text-xs text-teal-400 mb-6">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" aria-hidden="true" />
              Built for 11 million South African students
            </div>

            <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-white leading-[1.08] mb-5">
              The OS for your{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #0d9488, #14b8a6, #06b6d4)' }}
              >
                varsity life.
              </span>
            </h1>

            <p className="text-white/60 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              NSFAS tracking, student budget management, study planner, affordable meal prep, and Nova — an AI companion that actually understands what it means to study in South Africa.
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
              Free forever · No credit card needed · Works on any device · Install as app
            </p>
          </div>
        </section>

        {/* Feature grid */}
        <section className="px-5 pb-20 max-w-5xl mx-auto" aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only">VarsityOS Features</h2>
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
                <article
                  key={f.title}
                  className={`bg-[#111a18] border ${c.border} ${c.glow} rounded-2xl p-5 transition-all duration-200 group`}
                >
                  <div className={`w-11 h-11 ${c.iconBg} rounded-xl flex items-center justify-center text-xl mb-4`} aria-hidden="true">
                    {f.icon}
                  </div>
                  <h3 className="font-display font-bold text-white text-base mb-2">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                </article>
              )
            })}
          </div>
        </section>

        {/* Nova Deep Dive */}
        <section className="px-5 pb-20 max-w-5xl mx-auto" aria-labelledby="nova-heading">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-purple-600/10 border border-purple-600/20 rounded-full px-4 py-1.5 font-mono text-xs text-purple-400 mb-4">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" aria-hidden="true" />
              Nova AI — Built different
            </div>
            <h2 id="nova-heading" className="font-display font-black text-3xl text-white mb-3">
              Not just a chatbot.<br />A system built for SA student life.
            </h2>
            <p className="text-white/50 text-sm max-w-lg mx-auto leading-relaxed">
              Nova runs on a comprehensive knowledge base of South African university context — loaded with NSFAS rules, load-shedding strategies, CBT techniques, imposter syndrome coaching, and real-rand financial guidance. It knows the difference between ordinary stress and a mental health crisis, and responds accordingly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {NOVA_CAPABILITIES.map((cap) => {
              const colourMap: Record<string, { border: string; iconBg: string }> = {
                purple: { border: 'border-purple-500/20', iconBg: 'bg-purple-500/15' },
                teal:   { border: 'border-teal-500/20',   iconBg: 'bg-teal-500/15' },
                coral:  { border: 'border-orange-500/20', iconBg: 'bg-orange-500/15' },
                amber:  { border: 'border-amber-500/20',  iconBg: 'bg-amber-500/15' },
              }
              const c = colourMap[cap.colour]
              return (
                <article
                  key={cap.title}
                  className={`bg-[#111a18] border ${c.border} rounded-2xl p-5`}
                >
                  <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center text-xl mb-4`} aria-hidden="true">
                    {cap.icon}
                  </div>
                  <h3 className="font-display font-bold text-white text-sm mb-2">{cap.title}</h3>
                  <p className="text-white/45 text-xs leading-relaxed">{cap.desc}</p>
                </article>
              )
            })}
          </div>

          {/* Prompt caching / cost callout */}
          <div className="bg-[#111a18] border border-white/7 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-teal-600/15 rounded-xl flex items-center justify-center text-xl flex-shrink-0" aria-hidden="true">
              ⚡
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-sm mb-1">
                Prompt caching = 90% cost savings → more AI for you
              </h3>
              <p className="text-white/45 text-xs leading-relaxed">
                Nova preloads its entire SA student knowledge base using Claude prompt caching. Faster responses, lower costs — which means more Nova messages included in your free plan without compromise.
              </p>
            </div>
          </div>

          {/* Crisis support callout */}
          <div className="bg-[#0d1f1a] border border-teal-600/15 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 bg-teal-600/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" aria-hidden="true">
              🆘
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-sm mb-1">
                Crisis detection built in
              </h3>
              <p className="text-white/45 text-xs leading-relaxed">
                Nova detects distress signals in real time and immediately surfaces free SA crisis resources — SADAG (0800 567 567), LifeLine (0861 322 322), and on-campus counselling — before anything else. No algorithm, no delay.
              </p>
            </div>
          </div>
        </section>

        {/* University trust bar */}
        <section className="px-5 pb-20 max-w-5xl mx-auto text-center" aria-labelledby="unis-heading">
          <p id="unis-heading" className="font-mono text-xs text-white/30 tracking-widest uppercase mb-5">
            For students at South African universities
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2" role="list">
            {UNIVERSITIES.map(uni => (
              <span
                key={uni}
                role="listitem"
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

        {/* FAQ section — SEO value */}
        <section className="px-5 pb-20 max-w-3xl mx-auto" aria-labelledby="faq-heading">
          <div className="text-center mb-10">
            <h2 id="faq-heading" className="font-display font-black text-3xl text-white mb-3">Common questions</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'Is VarsityOS free for SA students?',
                a: 'Yes. The free plan gives you full access to the Study Planner, Budget & NSFAS tracker, Meal Prep module, and 10 Nova AI messages every month — forever. Premium is R49/month for unlimited Nova access.',
              },
              {
                q: 'How does VarsityOS help me track my NSFAS?',
                a: 'You can log your NSFAS meal, book, and transport allowances, track spending by category, and see exactly how much you have left for the month. Nova can also answer questions about NSFAS rules like the N+ funding limit and what happens if you fail modules.',
              },
              {
                q: 'Which universities does VarsityOS work for?',
                a: 'VarsityOS works for students at all SA universities — UCT, Wits, UP, Stellenbosch, UKZN, UJ, UWC, NMU, Rhodes, UFH, WSU, UNISA, DUT, CPUT, TUT, and more.',
              },
              {
                q: 'Can I install VarsityOS on my phone without an app store?',
                a: 'Yes. VarsityOS is a Progressive Web App (PWA). Open it in Chrome or Safari and tap "Add to Home Screen". It installs like a native app, works offline, and takes up almost no storage.',
              },
              {
                q: 'What makes Nova different from ChatGPT?',
                a: 'Nova is built specifically for SA students. It knows NSFAS rules, understands load shedding, speaks to imposter syndrome in first-gen students, uses evidence-based CBT techniques, and detects mental health crises with instant access to SA helplines. ChatGPT gives generic answers — Nova gives SA answers.',
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="bg-[#111a18] border border-white/7 rounded-2xl p-5 group"
              >
                <summary className="font-display font-bold text-white text-sm cursor-pointer list-none flex items-center justify-between gap-3">
                  {faq.q}
                  <span className="text-white/30 text-xs flex-shrink-0 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-white/50 text-sm leading-relaxed mt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="px-5 pb-20 max-w-5xl mx-auto" aria-labelledby="pricing-heading">
          <div className="text-center mb-10">
            <h2 id="pricing-heading" className="font-display font-black text-3xl text-white mb-3">Simple pricing</h2>
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
                    <span className="text-teal-400 text-xs" aria-hidden="true">✓</span>
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
                    <span className="text-teal-400 text-xs" aria-hidden="true">✓</span>
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
            <div className="text-4xl mb-4" aria-hidden="true">🧭</div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white mb-3">
              Ready to take control of your varsity life?
            </h2>
            <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
              Join thousands of SA students who use VarsityOS to stay organised, stress-free, and on top of their finances.
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
              <div className="w-7 h-7 rounded-lg bg-teal-600/20 flex items-center justify-center text-sm" aria-hidden="true">🧭</div>
              <span className="font-display font-bold text-white/60 text-sm">VarsityOS</span>
            </div>
            <p className="font-mono text-[0.6rem] text-white/25 text-center">
              Built by{' '}
              <a href="https://creativelynanda.co.za" target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:text-teal-400">
                Nanda Regine
              </a>
              {' '}· Mirembe Muse (Pty) Ltd · East London, Eastern Cape
            </p>
            <nav aria-label="Footer navigation">
              <div className="flex items-center gap-4">
                <Link href="/terms" className="font-mono text-[0.6rem] text-white/30 hover:text-white/60 transition-colors">
                  Terms
                </Link>
                <Link href="/privacy" className="font-mono text-[0.6rem] text-white/30 hover:text-white/60 transition-colors">
                  Privacy
                </Link>
                <Link href="/auth/login" className="font-mono text-[0.6rem] text-white/30 hover:text-white/60 transition-colors">
                  Log in
                </Link>
                <Link href="/auth/signup" className="font-mono text-[0.6rem] text-white/30 hover:text-white/60 transition-colors">
                  Sign up
                </Link>
              </div>
            </nav>
          </div>
        </footer>
      </div>
    </>
  )
}
