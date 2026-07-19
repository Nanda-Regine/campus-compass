import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata: Metadata = {
  title: 'VarsityOS — Student Operating System for South African University & TVET Students',
  description:
    'VarsityOS is the free Student Operating System built for South African university and TVET college students. 9 life domains: study, budget & NSFAS, fitness, safety OS, stokvel, meals, work, community, and Nova AI. Track allowances, stay safe on campus, manage your money, and thrive. Works at all 26 public universities, all 50 TVET colleges, and private HEIs. Offline ready.',
  alternates: { canonical: 'https://varsityos.co.za' },
  keywords: [
    'VarsityOS', 'NSFAS tracker', 'NSFAS app South Africa', 'student budget app South Africa',
    'peer tutoring South Africa', 'study notes marketplace SA', 'bursary finder South Africa',
    'TVET student app', 'university student app South Africa', 'Nova AI student',
    'NSFAS 2025 2026', 'NSFAS appeal', 'NSFAS payment dates', 'bursary 2025 2026',
    'UCT student app', 'Wits student app', 'UP student app', 'UKZN student app',
    'UJ student app', 'TUT student app', 'CPUT student app', 'DUT student app',
    'UNISA student app', 'load shedding study plan', 'study partner South Africa',
    'student mental health app South Africa', 'student super app South Africa',
    'free student app South Africa', 'TVET app South Africa',
  ],
  openGraph: {
    title: 'VarsityOS — Student Operating System for South African University & TVET Students',
    description:
      'Free Student OS for SA students: 9 life domains covering study, budget & NSFAS, safety OS, fitness, stokvel, meals, work, community & more. Nova AI companion built for SA varsity life. Works at all SA universities and TVET colleges. Offline ready.',
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
        'The free Student Operating System for South African university and TVET students. 9 life domains: Mind, Body, Money, Safety, Movement, Growth, Community, Work, and Future. Nova AI companion built for SA student reality.',
      applicationCategory: 'EducationApplication',
      operatingSystem: 'Web, iOS, Android (PWA)',
      offers: [
        { '@type': 'Offer', name: 'Free Plan', price: '0', priceCurrency: 'ZAR', description: 'Full access to all features including Study Planner, Budget & NSFAS tracker, Flexible Wallet, Savings Goals, Meal Prep, Work tracker, and 20 Nova AI messages per month. Works offline.' },
        { '@type': 'Offer', name: 'Nova Scholar', price: '29', priceCurrency: 'ZAR', billingDuration: 'P1M', description: '150 Nova messages per month, AI Recipe Generator, AI Budget Coach, AI Study Plans, and priority support.' },
        { '@type': 'Offer', name: 'Nova Unlimited', price: '89', priceCurrency: 'ZAR', billingDuration: 'P1M', description: 'Unlimited Nova messages, CSV export, first access to new Nova capabilities, and a direct feedback channel to the builder.' },
      ],
      featureList: [
        'NSFAS allowance tracker', 'Student budget management', 'Flexible spending wallet',
        'Savings goals tracker', 'Study planner with exam countdowns',
        'Affordable meal planning for SA students', 'Nova AI mental health companion',
        'CBT-based mental health support', 'Crisis detection with SA helpline resources',
        'Load-shedding study schedule planner', 'NSFAS N+ rule guidance',
        'Group assignment manager', 'Part-time work and shift tracker',
        'Peer tutoring marketplace', 'Community notes sharing platform',
        'Bursary finder with 100+ SA bursaries', 'Study twin matching',
        'Exam readiness panel', 'Flashcards with spaced repetition (SM-2)',
        'Daily study streaks and gamification', 'Offline PWA — works without internet',
        'Data saver mode for prepaid users',
        'Safety OS — SOS alerts, Walk Me Home timer, incident reporting',
        'Legal Rights guide for SA students',
        'Fitness tracker with workout logging',
        'Sleep tracker and wellness diary',
        'Stokvel OS — rotating savings circle manager',
        'Tax Return Helper — IRP5s and SARS eFiling guide',
        'Sunday Planning — weekly life OS ritual',
        'Attendance tracker and catch-up planner',
        'Campus social feed', 'Alumni mentor network',
        'Customisable Pomodoro timer with offline sync',
        'Entrepreneurship OS — side hustle tracker',
        'Credit score tracker', 'Career OS and SA jobs board',
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
      '@type': 'WebSite',
      '@id': 'https://varsityos.co.za/#website',
      url: 'https://varsityos.co.za',
      name: 'VarsityOS',
      description: 'The free super-app for South African university students',
      publisher: { '@id': 'https://varsityos.co.za/#org' },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://varsityos.co.za/?q={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
      inLanguage: 'en-ZA',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Is VarsityOS free for South African students?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. VarsityOS is free forever — all features plus 20 Nova AI messages per month. Nova Scholar is R29/month for 150 messages, and Nova Unlimited is R89/month for unlimited messages. No credit card required for the free plan.' } },
        { '@type': 'Question', name: 'What is NSFAS and how does VarsityOS help me track it?', acceptedAnswer: { '@type': 'Answer', text: "NSFAS (National Student Financial Aid Scheme) is South Africa's government student funding programme. VarsityOS lets you log and track your NSFAS allowances, set spending categories, and monitor your balance in real time so you never run short before month-end." } },
        { '@type': 'Question', name: 'What is Nova and how does it help students?', acceptedAnswer: { '@type': 'Answer', text: "Nova is VarsityOS's AI companion built specifically for SA students. Nova provides CBT-based mental health support, crisis detection with SA helpline resources, imposter syndrome coaching, study strategies, NSFAS financial guidance, and load-shedding study plans." } },
        { '@type': 'Question', name: 'Which South African universities and colleges does VarsityOS support?', acceptedAnswer: { '@type': 'Answer', text: 'VarsityOS works for students at all 26 South African public universities including UCT, Wits, UP, Stellenbosch, UKZN, UJ, UWC, NMU, Rhodes, UFH, WSU, UNISA, UL, UFS, UMP, SMU, SPU, Univen, UniZulu, DUT, CPUT, TUT, CUT, VUT, and MUT — plus all 50 TVET colleges and major private HEIs including Varsity College (IIE), Rosebank College, Boston City Campus, MANCOSA, Pearson, Stadio, and Damelin.' } },
        { '@type': 'Question', name: 'Can I install VarsityOS on my phone?', acceptedAnswer: { '@type': 'Answer', text: "Yes. VarsityOS is a Progressive Web App (PWA). Open it in Chrome or Safari and tap 'Add to Home Screen'. No app store needed, and it works offline during load shedding." } },
        { '@type': 'Question', name: 'How does VarsityOS help with the NSFAS N+ rule?', acceptedAnswer: { '@type': 'Answer', text: "VarsityOS tracks your credits completed vs attempted so you can monitor your N+ standing. Nova AI can explain how the N+ rule works at your specific institution and what steps to take if you're at risk of losing funding." } },
        { '@type': 'Question', name: 'Does VarsityOS work without internet / during load shedding?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. VarsityOS is a PWA with offline support. Your timetable, tasks, exams, expenses, and savings data sync to your device and remain accessible during load shedding or when you have no data.' } },
        { '@type': 'Question', name: 'How much does the Nova Scholar plan cost?', acceptedAnswer: { '@type': 'Answer', text: 'Nova Scholar costs R29 per month. It includes 150 Nova AI messages per month, the AI Recipe Generator, AI Budget Coach, AI Study Plans, and priority support — everything in Free plus AI-powered features. Nova Unlimited is R89/month for unlimited messages.' } },
        { '@type': 'Question', name: 'Is VarsityOS safe? Does it store my banking details?', acceptedAnswer: { '@type': 'Answer', text: "VarsityOS does not store any banking details. Payments are processed securely by Paystack. Your data is encrypted, stored securely with Supabase (EU/Ireland region) under POPIA-compliant safeguards, and protected by Row-Level Security so only you can see your data." } },
        { '@type': 'Question', name: 'Can I track my part-time job earnings on VarsityOS?', acceptedAnswer: { '@type': 'Answer', text: "Yes. The Work module lets you log part-time jobs, record shifts and hours, track earnings, and get conflict alerts when a shift clashes with your lecture timetable or an exam." } },
        { '@type': 'Question', name: 'What is the Flexible Wallet feature?', acceptedAnswer: { '@type': 'Answer', text: "The Flexible Wallet lets you manage spending from sources beyond NSFAS — such as bursaries, family support, part-time income, or allowances. You can create custom spending buckets and track each separately." } },
        { '@type': 'Question', name: 'How does the meal planner work for SA students?', acceptedAnswer: { '@type': 'Answer', text: "VarsityOS includes budget-friendly SA meal recipes under R50, a weekly meal planner, and an AI Recipe Generator that creates recipes based on what you have in your pantry and your weekly food budget." } },
        { '@type': 'Question', name: 'Can I use VarsityOS if I have a bursary instead of NSFAS?', acceptedAnswer: { '@type': 'Answer', text: "Yes. The Flexible Wallet lets you track any funding source — Funza Lushaka, ISFAP, Ikusasa, employer bursaries, family support, or part-time income. Create separate spending buckets for each and track them independently alongside your study budget." } },
        { '@type': 'Question', name: 'Does VarsityOS work for UNISA distance learning students?', acceptedAnswer: { '@type': 'Answer', text: "Yes. UNISA students can use the Study Planner for self-paced modules, track assignment due dates, set exam reminders, and use Nova for study support — even without a fixed class timetable. The offline PWA is especially useful when data is limited." } },
        { '@type': 'Question', name: 'I live in digs, not res. Can I still use the meal planner?', acceptedAnswer: { '@type': 'Answer', text: "Absolutely. The meal planner and AI Recipe Generator are designed for students cooking in digs with a limited weekly food budget. Input what you have in your pantry and your spend limit — Nova generates budget-friendly SA recipes under R50." } },
        { '@type': 'Question', name: 'What is the NSFAS N+ rule and how does VarsityOS help?', acceptedAnswer: { '@type': 'Answer', text: "The N+ rule means NSFAS only funds you for the minimum time to complete your qualification plus a limited number of extra years. VarsityOS helps you track module credits, flag failed or repeated modules, and Nova explains the N+ implications at your specific university so you can act before funding is cut." } },
        { '@type': 'Question', name: 'Can Nova help with imposter syndrome as a first-generation South African student?', acceptedAnswer: { '@type': 'Answer', text: "Yes. Nova is trained to recognise first-generation student challenges — the feeling of not belonging at varsity, pressure from family, financial anxiety, and academic overwhelm. Nova uses CBT-based techniques to help reframe these thoughts and gives practical, SA-specific advice that generic AI assistants don't provide." } },
        { '@type': 'Question', name: 'Which bursaries does VarsityOS support tracking?', acceptedAnswer: { '@type': 'Answer', text: "VarsityOS supports tracking any bursary or funding source including NSFAS, Funza Lushaka, ISFAP (Ikusasa Student Financial Aid Programme), employer bursaries, DHET funded bursaries, provincial bursaries, and SRC emergency funds. The Flexible Wallet lets you create a separate budget bucket for each source." } },
        { '@type': 'Question', name: 'Does VarsityOS work for TVET college students in South Africa?', acceptedAnswer: { '@type': 'Answer', text: "Yes. VarsityOS supports all 50 TVET colleges in South Africa including Buffalo City TVET, Northlink TVET, Tshwane South TVET, Coastal KZN TVET, Elangeni TVET, Capricorn TVET, Ehlanzeni TVET, and all others. NSFAS tracking, bursary finder, study planner, peer tutoring, and notes marketplace work for N2 through N6 and diploma students." } },
        { '@type': 'Question', name: 'How does the Peer Tutoring marketplace work on VarsityOS?', acceptedAnswer: { '@type': 'Answer', text: "Students register as tutors by listing their subjects, setting an hourly rate, and marking availability. Other students search tutors at their university, view their profile and star ratings, and book a session. Payment is arranged directly between student and tutor (cash or EFT) — VarsityOS does not process tutoring payments. Both tutor and student receive push notifications at each stage — booking, confirmation, and completion." } },
        { '@type': 'Question', name: 'What is the VarsityOS Notes Marketplace?', acceptedAnswer: { '@type': 'Answer', text: "The Notes Marketplace lets students share lecture notes, exam papers, summaries, and study guides by uploading a Google Drive or OneDrive link. Other students at your institution can browse by module code, download for free, and save notes to their library. It's a community-powered knowledge base built by students, for students." } },
        { '@type': 'Question', name: 'What is the VarsityOS Bursary Finder?', acceptedAnswer: { '@type': 'Answer', text: "The Bursary Finder is a searchable database of 100+ South African bursaries including Funza Lushaka, ISFAP, Eskom, Sasol, Anglo American, Standard Bank, Nedbank, provincial bursaries, and more. Each entry includes the bursary amount, eligibility requirements, application deadline, and a direct application link. Nova can help identify which bursaries match your degree, institution, and province." } },
      ],
    },
  ],
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  // Mind
  { icon: '📚', title: 'Study Planner',         desc: 'Timetable, exam countdowns, attendance tracker, and AI study plans tailored to your schedule.', accent: '#8b5cf6', domain: 'Mind' },
  { icon: '🃏', title: 'Flashcards & Pomodoro', desc: 'SM-2 spaced repetition flashcards + fully customisable Pomodoro timer. Works offline.', accent: '#8b5cf6', domain: 'Mind' },
  { icon: '🌟', title: 'Nova AI',               desc: 'Your AI companion for mental health, study strategy, NSFAS guidance, and crisis support.', accent: '#0d9488', domain: 'Mind' },
  // Money
  { icon: '💰', title: 'Budget & NSFAS',        desc: 'Track every rand. Log NSFAS allowances, monitor spending by category, and get AI budget coaching.', accent: '#d4a847', domain: 'Money' },
  { icon: '🪙', title: 'Stokvel OS',            desc: 'Manage a rotating savings circle — members, contributions, payouts, and dispute resolution.', isNew: true, accent: '#d4a847', domain: 'Money' },
  { icon: '🧾', title: 'Tax Return Helper',     desc: 'Track IRP5s, calculate your SARS refund, and navigate eFiling with an SA-specific guide.', isNew: true, accent: '#d4a847', domain: 'Money' },
  { icon: '🏆', title: 'Bursary Finder',        desc: 'Browse 100+ SA bursaries with amounts, deadlines, and direct application links. Never miss funding.', accent: '#f59e0b', domain: 'Money' },
  // Body
  { icon: '💪', title: 'Fitness Tracker',       desc: 'Log workouts — runs, gym, yoga, sport — with duration, calories, and weekly streaks.', isNew: true, accent: '#FF6B9E', domain: 'Body' },
  { icon: '😴', title: 'Sleep & Wellness',      desc: 'Track sleep quality, log mood check-ins, and monitor your wellbeing score over time.', accent: '#FF6B9E', domain: 'Body' },
  { icon: '🍲', title: 'Meal Prep',             desc: 'Budget SA recipes under R50, weekly meal plans, and an AI recipe generator using what you have.', accent: '#e07858', domain: 'Body' },
  // Safety
  { icon: '🚨', title: 'Safety OS',             desc: 'SOS alerts, Walk Me Home timer, incident reporting, and self-defence library — built for SA campuses.', isNew: true, accent: '#10b981', domain: 'Safety' },
  { icon: '⚖️', title: 'Legal Rights',          desc: 'Know your rights as an SA student — NSFAS appeals, tenant rights in digs, labour law for part-timers.', isNew: true, accent: '#10b981', domain: 'Safety' },
  // Community
  { icon: '📖', title: 'Notes Marketplace',     desc: 'Share and download lecture notes, exam papers, and study guides from students at your institution.', accent: '#4ecf9e', domain: 'Community' },
  { icon: '🎓', title: 'Peer Tutoring',         desc: 'Book verified peer tutors at your university. Earn money by tutoring what you know.', accent: '#c9a84c', domain: 'Community' },
  { icon: '🤝', title: 'Alumni Mentors',        desc: 'Connect with alumni mentors in your field. Get career guidance from people who have walked your path.', isNew: true, accent: '#9b6fd4', domain: 'Community' },
  // Movement
  { icon: '🚌', title: 'Movement OS',            desc: 'Save commute routes, post lift-club offers, compare SA transport fares, and beat load-shedding traffic.', isNew: true, accent: '#38bdf8', domain: 'Movement' },
  // Work & Future
  { icon: '💼', title: 'Work & Shifts',         desc: 'Track part-time jobs, log shifts and earnings, and get conflict alerts with your lectures.', accent: '#7090d0', domain: 'Work' },
  { icon: '🏦', title: 'Flexible Wallet',        desc: 'Manage spending buckets beyond NSFAS — part-time income, bursaries, family support.', accent: '#0d9488', domain: 'Money' },
  { icon: '📋', title: 'Sunday Planning',        desc: 'Weekly life OS ritual — set priorities, review wins and blockers, and plan the week ahead.', isNew: true, accent: '#A855F7', domain: 'Growth' },
]

const PAIN_POINTS = [
  { icon: '💸', text: "Your NSFAS allowance runs out 10 days before month-end — eish — and you genuinely don't know where it went." },
  { icon: '😰', text: "You missed another deadline because it was buried in a WhatsApp group at 11pm. Hectic." },
  { icon: '🌑', text: "Load shedding killed your only study block. No plan B, no data, no laptop battery." },
  { icon: '🤯', text: "You're stressed, you can't afford a therapist, and generic wellness apps don't understand life at a South African varsity." },
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
    features: ['All 30+ tools included', 'Budget & NSFAS tracker', 'Study Planner & Exam Prep', 'Savings Goals + Stokvel OS', 'Safety OS, Fitness, Meal Prep', '20 Nova messages / month', 'Works offline (PWA)'],
    cta: 'Get started free',
    href: '/auth/signup',
    highlight: false,
    gold: false,
    accentColor: '#3b82f6',
    checkColor: '#3b82f6',
  },
  {
    name: 'Nova Scholar',
    price: 'R29',
    sub: 'per month',
    features: ['Everything in Free', '150 Nova messages / month', 'AI Recipe Generator', 'AI Budget Coach', 'AI Study Plans & Exam Prep', 'Priority support'],
    cta: 'Go Scholar',
    href: '/upgrade',
    highlight: true,
    badge: 'Most popular',
    gold: false,
    accentColor: '#e07858',
    checkColor: '#e07858',
  },
  {
    name: 'Nova Unlimited',
    price: 'R89',
    sub: 'per month',
    features: ['Everything in Scholar', 'Unlimited Nova messages', 'CSV data export', 'First access to new Nova features', 'Direct feedback channel to builder'],
    cta: 'Go Unlimited',
    href: '/upgrade',
    highlight: false,
    badge: 'Best value',
    gold: true,
    accentColor: '#d4a847',
    checkColor: '#d4a847',
  },
]

const TESTIMONIALS = [
  { quote: "Nova talked me through a full breakdown before my CHEM3 exam. It didn't feel like a chatbot — it felt like someone who actually got what it's like being a first-gen student at varsity.", name: 'Lethabo M.', role: '3rd year BSc, Wits', accent: '#0d9488' },
  { quote: "I finally know exactly where my NSFAS money goes. Lekker app — the budget tracker is the first thing I open every month.", name: 'Ayasha P.', role: '2nd year Law, UCT', accent: '#e07858' },
  { quote: "Set up my whole semester timetable in 10 minutes. Sharp. No more missed assignments buried in WhatsApp groups.", name: 'Siyanda D.', role: '1st year Engineering, UKZN', accent: '#3b82f6' },
  { quote: "I'm from a kasi in Limpopo and my digs has terrible wifi. VarsityOS works offline. That alone makes it lekker.", name: 'Tshepiso K.', role: '2nd year Education, UL', accent: '#d4a847' },
  { quote: "Eish, I didn't know I could track my bursary money separately from NSFAS. The Flexible Wallet is exactly what I needed.", name: 'Nomvula B.', role: '3rd year Commerce, UJ', accent: '#8b5cf6' },
  { quote: "Load shedding messes with my study schedule constantly. Nova helped me build a study plan that actually works around it.", name: 'Rorisang M.', role: '1st year BCom, CUT', accent: '#06b6d4' },
  { quote: "The Walk Me Home timer saved me twice already walking from the library at night. I set it before I leave and my sister gets a text if I don't check in. No other student app has this.", name: 'Zintle M.', role: '2nd year Nursing, WSU', accent: '#10b981' },
  { quote: "Our stokvel has been a mess on WhatsApp for years. VarsityOS tracks every member, contribution, and payout. No more arguments.", name: 'Kagiso D.', role: '3rd year BCom Accounting, UJ', accent: '#d4a847' },
]

const UNIVERSITIES = [
  // Traditional Universities
  'UCT', 'Wits', 'UP', 'SU', 'UKZN', 'UWC', 'NMU', 'Rhodes', 'UFH', 'UFS', 'UL',
  // Comprehensive
  'UJ', 'WSU', 'UniZulu', 'SPU', 'Univen', 'UMP',
  // Universities of Technology
  'TUT', 'CPUT', 'DUT', 'CUT', 'VUT', 'MUT',
  // Distance
  'UNISA',
  // Sefako Makgatho
  'SMU',
  // Private HEIs
  'Varsity College', 'Rosebank College', 'Boston', 'MANCOSA', 'Pearson', 'Stadio', 'Damelin',
  // TVET Colleges
  'Buffalo City TVET', 'Ekurhuleni East TVET', 'Elangeni TVET', 'Tshwane South TVET',
  'Northlink TVET', 'College of Cape Town', 'False Bay TVET', 'South Cape TVET',
  'Capricorn TVET', 'Vhembe TVET', 'Ehlanzeni TVET', 'Gert Sibande TVET',
  'Motheo TVET', 'Coastal KZN TVET', 'Umfolozi TVET', 'Majuba TVET',
  'Boland TVET', 'West Coast TVET', 'Orbit TVET', 'Nkangala TVET',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#05040C' }}>

        {/* ── 1. NAVBAR ──────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-50 w-full" style={{ borderBottom: '1px solid rgba(59,130,246,0.12)', backdropFilter: 'blur(20px)', background: 'rgba(6,12,24,0.92)' }}>
        <nav
          className="flex items-center justify-between px-6 py-3.5 max-w-7xl mx-auto"
          aria-label="Main navigation"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center" style={{ boxShadow: '0 0 12px rgba(168,85,247,0.4)', background: 'rgba(168,85,247,0.12)' }}>
              <Image src="/favicon.jpg" alt="VarsityOS" width={32} height={32} className="object-contain" />
            </div>
            <span className="font-display font-bold text-white text-sm">VarsityOS</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/demo" className="font-display text-xs font-medium px-3.5 py-3 rounded-lg transition-colors hidden sm:block min-h-[44px] flex items-center" style={{ color: '#fff' }}>
              See demo
            </Link>
            <Link href="/auth/login" className="font-display text-xs font-medium px-3.5 py-3 rounded-lg transition-colors min-h-[44px] flex items-center" style={{ color: '#fff' }}>
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="font-display text-xs font-bold px-4 py-3 rounded-lg transition-all hover:opacity-90 min-h-[44px] flex items-center"
              style={{ background: 'linear-gradient(135deg, #A855F7, #00CFA0)', color: '#fff', boxShadow: '0 2px 12px rgba(168,85,247,0.35)' }}
            >
              Get started free
            </Link>
          </div>
        </nav>
        </div>

        {/* ── 2. HERO ────────────────────────────────────────────────────────── */}
        <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-24 overflow-hidden" style={{ transform: 'translateZ(0)' }} aria-labelledby="hero-heading">
          {/* Ambient spans full viewport width, not constrained by max-w-7xl */}
          <AmbientImage zone="onboarding" opacity={0.38} blurPx={4} saturation={1.4}
            overlayColor="linear-gradient(180deg,rgba(5,4,12,0.10) 0%,rgba(5,4,12,0.04) 100%)" />
          {/* Afrofuturist nebula glow */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-60%)', width: 'min(700px, 180vw)', height: '500px', background: 'radial-gradient(ellipse, rgba(168,85,247,0.20) 0%, transparent 65%)', filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', top: '-40px', right: '-100px', width: 'min(500px, 130vw)', height: '400px', background: 'radial-gradient(ellipse, rgba(0,207,160,0.16) 0%, transparent 65%)', filter: 'blur(50px)' }} />
            <div style={{ position: 'absolute', top: '80px', left: '-60px', width: 'min(400px, 110vw)', height: '300px', background: 'radial-gradient(ellipse, rgba(212,168,75,0.12) 0%, transparent 65%)', filter: 'blur(40px)' }} />
          </div>

          {/* Content constrained to max-w-7xl, desktop: 2-col */}
          <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: text */}
            <div className="text-center lg:text-left">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-xs mb-7"
                style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.30)', color: '#c084fc' }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#A855F7' }} aria-hidden="true" />
                Student Operating System · 9 life domains
              </div>

              <h1 id="hero-heading" className="font-display font-black text-white leading-[1.05] mb-5" style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)' }}>
                Your varsity life,{' '}
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(120deg, #A855F7, #00CFA0, #D4A84B)' }}>
                  finally under control.
                </span>
              </h1>

              <p className="text-base sm:text-lg max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed" style={{ color: '#fff' }}>
                Mind, body, money, safety, fitness, community, and career — all 9 life domains, one app, built for SA. Budget & NSFAS tracking, Safety OS with SOS alerts, Stokvel savings circles, Fitness tracker, Nova AI, and 30+ more tools. Works at every SA university and TVET college. Offline ready.
              </p>

              <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap mb-5">
                <Link
                  href="/auth/signup"
                  className="font-display font-bold text-sm px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #A855F7, #00CFA0)', color: '#fff', boxShadow: '0 4px 24px rgba(168,85,247,0.45)' }}
                >
                  Start for free — no card needed
                </Link>
                <Link
                  href="/demo"
                  className="font-display font-bold text-sm px-7 py-3.5 rounded-xl transition-all hover:bg-white/10"
                  style={{ border: '1px solid rgba(13,148,136,0.4)', color: '#5eead4' }}
                >
                  ▶ See interactive demo
                </Link>
              </div>
              <p className="font-mono text-xs text-center lg:text-left" style={{ color: '#fff' }}>Free forever · Works offline · Install on your phone</p>
            </div>

            {/* Right: mini app preview (desktop only) */}
            <div className="hidden lg:block">
              <div className="rounded-3xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #080f1c, #071018)', border: '1px solid rgba(59,130,246,0.18)' }}>
                <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(59,130,246,0.14), transparent 60%)' }} />
                <div className="space-y-3">
                  {/* Budget card */}
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)' }}>
                    <p className="font-mono text-[0.63rem] uppercase tracking-widest mb-2" style={{ color: '#93c5fd' }}>Budget · This Month</p>
                    <div className="space-y-2">
                      {[
                        { label: 'NSFAS food', amount: 'R890', pct: 72, colour: '#3b82f6' },
                        { label: 'Transport', amount: 'R340', pct: 45, colour: '#e07858' },
                      ].map(item => (
                        <div key={item.label}>
                          <div className="flex justify-between mb-1">
                            <span className="font-display text-xs text-white">{item.label}</span>
                            <span className="font-mono text-xs font-bold" style={{ color: item.colour }}>{item.amount}</span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${item.pct}%`, background: item.colour }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Nova chat */}
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: 'linear-gradient(135deg, #0d9488, #3b82f6)' }}>✦</div>
                      <p className="font-display font-bold text-xs text-white">Nova</p>
                      <span className="font-mono text-[0.6rem] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(13,148,136,0.2)', color: '#5eead4', border: '1px solid rgba(13,148,136,0.3)' }}>AI companion</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="rounded-xl rounded-tl-sm px-3 py-2" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <p className="font-display text-xs text-white">stressed about exams 😔</p>
                      </div>
                      <div className="rounded-xl rounded-tr-sm px-3 py-2" style={{ background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.25)' }}>
                        <p className="font-display text-xs leading-relaxed" style={{ color: '#5eead4' }}>Let&apos;s start with tonight — what&apos;s keeping you awake?</p>
                      </div>
                    </div>
                  </div>
                  {/* Streak + safety row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl p-3" style={{ background: 'rgba(224,120,88,0.1)', border: '1px solid rgba(224,120,88,0.25)' }}>
                      <span className="text-lg">🔥</span>
                      <p className="font-display font-bold text-white text-xs mt-1">12 day streak</p>
                      <p className="font-mono text-[0.6rem] mt-0.5" style={{ color: '#fff' }}>Keep it going</p>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <span className="text-lg">🛡️</span>
                      <p className="font-display font-bold text-white text-xs mt-1">Walk Me Home</p>
                      <p className="font-mono text-[0.6rem] mt-0.5" style={{ color: '#6ee7b7' }}>Active · 12 min left</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── 3. SOCIAL PROOF ────────────────────────────────────────────────── */}
        <section className="relative px-5 py-16 overflow-hidden" aria-label="Social proof">
          <AmbientImage zone="vibrant" opacity={0.22} blurPx={7} saturation={1.5}
            overlayColor="rgba(5,4,12,0.80)" />
          {/* asymmetric accent slab */}
          <div aria-hidden="true" className="absolute -left-24 top-1/3 w-72 h-72 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.10), transparent 70%)', transform: 'rotate(-12deg)' }} />
          <div className="relative max-w-7xl mx-auto">
          {/* Stat bar */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 rounded-2xl overflow-hidden mb-6"
            style={{ border: '1px solid rgba(59,130,246,0.2)', background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(13,148,136,0.06))', backdropFilter: 'blur(10px)' }}
          >
            {[
              { value: 'R0', label: 'forever', sub: 'no credit card', color: '#3b82f6' },
              { value: '30+', label: 'tools, one OS', sub: '9 life domains', color: '#0d9488' },
              { value: '100+', label: 'institutions', sub: 'unis · TVETs · private', color: '#06b6d4' },
              { value: '📶', label: 'Works offline', sub: 'load shedding ready', color: '#e07858' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={[
                  'flex flex-col items-center justify-center py-6 px-4 text-center',
                  // Mobile 2-col: top-row items (0,1) get border-b; left-column items (0,2) get border-r
                  // Desktop 4-col (sm): items 0,1,2 get border-r only, no border-b
                  i < 2 ? 'border-b border-white/[0.07] sm:border-b-0' : '',
                  i === 0 ? 'border-r border-white/[0.07]' :
                  i === 1 ? 'sm:border-r sm:border-white/[0.07]' :
                  i === 2 ? 'border-r border-white/[0.07]' : '',
                ].filter(Boolean).join(' ')}
              >
                <span className="font-display font-black text-2xl sm:text-3xl mb-0.5" style={{ color: stat.color }}>{stat.value}</span>
                <span className="font-display text-xs text-white">{stat.label}</span>
                <span className="font-mono text-[0.63rem] mt-0.5" style={{ color: '#fff' }}>{stat.sub}</span>
              </div>
            ))}
          </div>

          {/* University trust */}
          <p className="font-mono text-xs text-center uppercase tracking-widest mb-4" style={{ color: '#fff' }}>
            For students at all 26 public universities · all 50 TVET colleges · private HEIs
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2" role="list">
            {UNIVERSITIES.map((uni, i) => (
              <span
                key={uni}
                role="listitem"
                className="font-mono text-xs px-3 py-1 rounded-full transition-all"
                style={{
                  background: i % 3 === 0 ? 'rgba(59,130,246,0.1)' : i % 3 === 1 ? 'rgba(13,148,136,0.1)' : 'rgba(6,182,212,0.08)',
                  border: i % 3 === 0 ? '1px solid rgba(59,130,246,0.25)' : i % 3 === 1 ? '1px solid rgba(13,148,136,0.25)' : '1px solid rgba(6,182,212,0.2)',
                  color: i % 3 === 0 ? '#93c5fd' : i % 3 === 1 ? '#5eead4' : '#67e8f9',
                }}
              >
                {uni}
              </span>
            ))}
            <span className="font-mono text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>+ more</span>
          </div>
          </div>
        </section>

        {/* ── 4. PROBLEM ─────────────────────────────────────────────────────── */}
        <section className="relative px-5 py-24 overflow-hidden" aria-labelledby="problem-heading">
          <AmbientImage zone="alerts" opacity={0.36} blurPx={5} saturation={1.4}
            overlayColor="rgba(5,4,12,0.74)" />
          <div className="relative max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="font-mono text-xs uppercase tracking-[0.3em] mb-4" style={{ color: '#fb923c' }}>· Sound familiar? ·</p>
              <h2 id="problem-heading" className="font-display font-black leading-[1.05] text-white" style={{ fontSize: 'clamp(2rem, 5.5vw, 3.4rem)' }}>
                SA varsity life is hard<br />enough without the{' '}
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(120deg, #fb923c, #ef4444)' }}>chaos.</span>
              </h2>
            </div>
            {/* Asymmetric staggered pain cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PAIN_POINTS.map((p, i) => (
                <div
                  key={p.text}
                  className={`flex items-start gap-4 rounded-2xl p-5 sm:p-6 ${i % 2 === 1 ? 'sm:translate-y-8' : ''}`}
                  style={{
                    background: i % 2 === 0 ? 'linear-gradient(145deg, rgba(224,120,88,0.14), rgba(6,12,24,0.6))' : 'linear-gradient(145deg, rgba(239,68,68,0.12), rgba(6,12,24,0.6))',
                    border: i % 2 === 0 ? '1px solid rgba(224,120,88,0.28)' : '1px solid rgba(239,68,68,0.22)',
                    backdropFilter: 'blur(4px)',
                    boxShadow: i % 2 === 0 ? '0 8px 30px rgba(224,120,88,0.08)' : '0 8px 30px rgba(239,68,68,0.08)',
                  }}
                >
                  <span className="text-3xl flex-shrink-0 mt-0.5" aria-hidden="true">{p.icon}</span>
                  <p className="font-display text-sm sm:text-base leading-relaxed" style={{ color: '#fff' }}>{p.text}</p>
                </div>
              ))}
            </div>
            <p className="text-center font-display font-bold text-white mt-16 sm:mt-20" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.9rem)' }}>
              You&apos;re not failing. You just don&apos;t<br className="hidden sm:block" /> have the{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(120deg, #A855F7, #00CFA0)' }}>right tools</span> yet.
            </p>
          </div>
        </section>

        {/* ── 5. SOLUTION ────────────────────────────────────────────────────── */}
        <section className="relative px-5 py-24 overflow-hidden" aria-labelledby="solution-heading">
          <AmbientImage zone="dashboard" opacity={0.30} blurPx={5} saturation={1.4}
            overlayColor="rgba(5,4,12,0.76)" />
          <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-mono text-xs uppercase tracking-[0.3em] mb-4" style={{ color: '#5eead4' }}>· Enter VarsityOS ·</p>
            <h2 id="solution-heading" className="font-display font-black leading-[1.05] text-white" style={{ fontSize: 'clamp(2rem, 5.5vw, 3.4rem)' }}>
              Everything you need.<br />One place.{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(120deg, #00CFA0, #3b82f6)' }}>Built for SA.</span>
            </h2>
          </div>

          {/* App preview */}
          <div className="rounded-3xl p-5 sm:p-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #080f1c, #071018)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none" aria-hidden="true" style={{ background: 'radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 60%)' }} />
            <div className="absolute bottom-0 left-0 w-96 h-96 pointer-events-none" aria-hidden="true" style={{ background: 'radial-gradient(circle at bottom left, rgba(13,148,136,0.1), transparent 60%)' }} />

            <div className="relative grid sm:grid-cols-3 gap-3">
              {/* Budget card */}
              <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)' }}>
                <p className="font-mono text-[0.63rem] uppercase tracking-widest mb-3" style={{ color: '#93c5fd' }}>Budget · March</p>
                <div className="space-y-2.5 mb-4">
                  {[
                    { label: 'NSFAS food', amount: 'R890', pct: 72, colour: '#3b82f6' },
                    { label: 'Transport', amount: 'R340', pct: 45, colour: '#e07858' },
                    { label: 'Books', amount: 'R210', pct: 30, colour: '#d4a847' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="font-display text-xs text-white">{item.label}</span>
                        <span className="font-mono text-xs font-bold" style={{ color: item.colour }}>{item.amount}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${item.pct}%`, background: item.colour }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <p className="font-mono text-[0.6rem]" style={{ color: '#93c5fd' }}>R1,840 remaining this month</p>
                </div>
              </div>

              {/* Study + streak */}
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl p-4 flex-1" style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)' }}>
                  <p className="font-mono text-[0.63rem] uppercase tracking-widest mb-3" style={{ color: '#c4b5fd' }}>Upcoming</p>
                  <div className="space-y-2">
                    {[
                      { label: 'CHEM3 exam', date: 'Mon 14 Apr', urgent: true },
                      { label: 'Physics assignment', date: 'Wed 16 Apr', urgent: false },
                      { label: 'Group presentation', date: 'Fri 18 Apr', urgent: false },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.urgent ? '#f87171' : 'rgba(255,255,255,0.25)' }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-xs truncate text-white">{item.label}</p>
                          <p className="font-mono text-[0.63rem]" style={{ color: '#fff' }}>{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl p-4" style={{ background: 'rgba(224,120,88,0.1)', border: '1px solid rgba(224,120,88,0.25)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden="true">🔥</span>
                    <div>
                      <p className="font-display font-bold text-white text-sm">12 day streak</p>
                      <p className="font-mono text-[0.63rem]" style={{ color: '#fff' }}>Keep it going</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nova chat */}
              <div className="rounded-2xl p-4" style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: 'linear-gradient(135deg, #0d9488, #3b82f6)' }}>✦</div>
                  <p className="font-display font-bold text-xs text-white">Nova</p>
                  <span className="font-mono text-[0.65rem] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(13,148,136,0.2)', color: '#5eead4', border: '1px solid rgba(13,148,136,0.3)' }}>AI companion</span>
                </div>
                <div className="space-y-2">
                  <div className="rounded-xl rounded-tl-sm px-3 py-2" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="font-display text-xs text-white">stressed about exams + not sleeping 😔</p>
                  </div>
                  <div className="rounded-xl rounded-tr-sm px-3 py-2" style={{ background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.25)' }}>
                    <p className="font-display text-xs leading-relaxed" style={{ color: '#5eead4' }}>Let&apos;s start with tonight — what&apos;s actually keeping you awake?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* ── 6. FEATURES ────────────────────────────────────────────────────── */}
        <section className="relative px-5 py-24 overflow-hidden" aria-labelledby="features-heading">
          <AmbientImage zone="community" opacity={0.28} blurPx={6} saturation={1.5}
            overlayColor="rgba(5,4,12,0.80)" />
          <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.3em] mb-4" style={{ color: '#A855F7' }}>· 30+ tools · 9 life domains ·</p>
            <h2 id="features-heading" className="font-display font-black leading-[1.05] text-white" style={{ fontSize: 'clamp(2rem, 5.5vw, 3.4rem)' }}>
              Not a super-app.<br />A{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(120deg, #A855F7, #00CFA0, #D4A84B)' }}>Student Operating System.</span>
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 mt-5 max-w-2xl mx-auto">
              {['Mind','Body','Money','Safety','Movement','Growth','Community','Work','Future'].map((d, i) => (
                <span key={d} className="font-mono text-xs" style={{ color: ['#8b5cf6','#FF6B9E','#d4a847','#10b981','#38bdf8','#A855F7','#4ecf9e','#7090d0','#06b6d4'][i] }}>{d}{i < 8 ? ' ·' : ''}</span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, idx) => (
              <article
                key={f.title}
                className={`rounded-2xl p-5 relative overflow-hidden transition-transform hover:-translate-y-1 ${idx % 5 === 0 ? 'sm:row-span-1 lg:-rotate-[0.4deg]' : idx % 7 === 3 ? 'lg:rotate-[0.4deg]' : ''}`}
                style={{
                  background: `linear-gradient(145deg, rgba(6,12,24,0.72), ${f.accent}12)`,
                  border: `1px solid ${f.accent}30`,
                  boxShadow: `0 4px 20px ${f.accent}10`,
                  backdropFilter: 'blur(4px)',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${f.accent}80, transparent)` }} />
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {f.isNew && (
                    <span className="font-mono text-[0.65rem] uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: `${f.accent}20`, color: f.accent, border: `1px solid ${f.accent}40` }}>New</span>
                  )}
                  {f.domain && (
                    <span className="font-mono text-[0.58rem] uppercase tracking-widest px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}>{f.domain}</span>
                  )}
                </div>
                <div className="text-2xl mb-3" aria-hidden="true">{f.icon}</div>
                <h3 className="font-display font-bold text-white text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#fff' }}>{f.desc}</p>
              </article>
            ))}
          </div>
          </div>
        </section>

        {/* ── Nova spotlight ─────────────────────────────────────────────────── */}
        <section className="px-5 pb-20 max-w-7xl mx-auto" aria-labelledby="nova-heading">
          <div
            className="rounded-3xl p-6 sm:p-10 overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #060f1a, #071814)', border: '1px solid rgba(13,148,136,0.25)', transform: 'translateZ(0)' }}
          >
            <AmbientImage zone="nova" opacity={0.34} blurPx={4} saturation={1.6}
              overlayColor="rgba(6,15,26,0.78)" />
            <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none" aria-hidden="true" style={{ background: 'radial-gradient(circle at top right, rgba(13,148,136,0.15), transparent 60%)' }} />
            <div className="absolute bottom-0 left-0 w-72 h-72 pointer-events-none" aria-hidden="true" style={{ background: 'radial-gradient(circle at bottom left, rgba(59,130,246,0.1), transparent 60%)' }} />
            <div className="relative grid lg:grid-cols-2 gap-10 items-start">
              <div>
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs mb-5"
                  style={{ background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.35)', color: '#5eead4' }}
                >
                  ✦ Nova AI companion
                </div>
                <h2 id="nova-heading" className="font-display font-black text-3xl sm:text-4xl text-white mb-4">
                  Not a chatbot.<br />Someone who gets it.
                </h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#fff' }}>
                  Nova runs on a comprehensive SA student knowledge base — NSFAS rules, load-shedding strategies, CBT techniques, imposter syndrome coaching, real-rand financial guidance. It knows the difference between ordinary stress and a crisis.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: '🧠', label: 'CBT-based mental health support', desc: 'Crisis detection + SADAG & LifeLine hotlines built in', accent: '#0d9488' },
                    { icon: '📖', label: 'Evidence-based study strategies', desc: 'Spaced repetition, retrieval practice, load-shedding plans', accent: '#3b82f6' },
                    { icon: '💳', label: 'Real NSFAS & money coaching', desc: 'N+ rules, debt prevention, side hustles around lectures', accent: '#06b6d4' },
                    { icon: '🌍', label: 'SA student life, deeply understood', desc: 'Township backgrounds, language barriers, family pressure, res culture', accent: '#0d9488' },
                  ].map(item => (
                    <div
                      key={item.label}
                      className="flex items-start gap-3 rounded-xl p-3"
                      style={{ background: `${item.accent}0d`, border: `1px solid ${item.accent}25` }}
                    >
                      <span className="text-base flex-shrink-0 mt-0.5" aria-hidden="true">{item.icon}</span>
                      <div>
                        <p className="font-display font-bold text-white text-xs mb-0.5">{item.label}</p>
                        <p className="font-mono text-[0.65rem]" style={{ color: '#fff' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="rounded-2xl p-5" style={{ background: 'rgba(6,12,24,0.8)', border: '1px solid rgba(13,148,136,0.2)' }}>
                  <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, #0d9488, #3b82f6)', boxShadow: '0 0 16px rgba(13,148,136,0.4)' }}>✦</div>
                    <div>
                      <p className="font-display font-bold text-white text-sm">Nova</p>
                      <p className="font-mono text-[0.63rem]" style={{ color: '#5eead4' }}>Online · SA Student AI</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {NOVA_CHAT.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className="max-w-[85%] rounded-2xl px-4 py-2.5"
                          style={{
                            background: msg.role === 'user' ? 'rgba(59,130,246,0.12)' : 'rgba(13,148,136,0.15)',
                            border: msg.role === 'nova' ? '1px solid rgba(13,148,136,0.25)' : '1px solid rgba(59,130,246,0.2)',
                          }}
                        >
                          <p className="font-display text-xs leading-relaxed" style={{ color: msg.role === 'nova' ? '#5eead4' : 'rgba(255,255,255,0.8)' }}>
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex-1 rounded-xl px-3 py-2 font-display text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}>Talk to Nova...</div>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, #0d9488, #3b82f6)' }} aria-hidden="true">↑</div>
                  </div>
                </div>
                <p className="font-mono text-[0.63rem] text-center mt-2" style={{ color: '#fff' }}>15 free messages/month · 100 with Scholar · 250 with Premium · ∞ with Nova Unlimited</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Safety OS spotlight ────────────────────────────────────────────── */}
        <section className="px-5 pb-20 max-w-7xl mx-auto" aria-labelledby="safety-heading">
          <div
            className="rounded-3xl p-6 sm:p-10 overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #030d0a, #041208)', border: '1px solid rgba(16,185,129,0.25)', transform: 'translateZ(0)' }}
          >
            <AmbientImage zone="safety" opacity={0.22} blurPx={6} saturation={1.4}
              overlayColor="rgba(3,13,10,0.82)" />
            <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none" aria-hidden="true" style={{ background: 'radial-gradient(circle at top right, rgba(16,185,129,0.14), transparent 60%)' }} />
            <div className="absolute bottom-0 left-0 w-72 h-72 pointer-events-none" aria-hidden="true" style={{ background: 'radial-gradient(circle at bottom left, rgba(56,189,248,0.08), transparent 60%)' }} />
            <div className="relative grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs mb-5"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7' }}
                >
                  🛡️ Safety OS — new
                </div>
                <h2 id="safety-heading" className="font-display font-black text-3xl sm:text-4xl text-white mb-4">
                  Campus safety,<br />finally built in.
                </h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#fff' }}>
                  SA campuses can be dangerous. VarsityOS is the only student app with a built-in Safety OS — SOS alerts, a Walk Me Home timer that texts your emergency contact if you don&apos;t check in, incident reporting, a self-defence library, and a plain-language Legal Rights guide for students.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: '🚨', label: 'SOS alerts',             desc: 'One tap sends your location to emergency contacts and campus security', accent: '#10b981' },
                    { icon: '🚶', label: 'Walk Me Home timer',      desc: 'Auto-texts your contact if you don\'t check in — works offline', accent: '#10b981' },
                    { icon: '📋', label: 'Incident reporting',      desc: 'Log incidents on or near campus. Evidence is timestamped and stored', accent: '#38bdf8' },
                    { icon: '⚖️', label: 'Legal Rights guide',      desc: 'NSFAS appeals, tenant rights in digs, labour rights for part-timers', accent: '#38bdf8' },
                  ].map(item => (
                    <div
                      key={item.label}
                      className="flex items-start gap-3 rounded-xl p-3"
                      style={{ background: `${item.accent}0d`, border: `1px solid ${item.accent}25` }}
                    >
                      <span className="text-base flex-shrink-0 mt-0.5" aria-hidden="true">{item.icon}</span>
                      <div>
                        <p className="font-display font-bold text-white text-xs mb-0.5">{item.label}</p>
                        <p className="font-mono text-[0.65rem]" style={{ color: '#fff' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Safety visual */}
              <div className="rounded-2xl p-5" style={{ background: 'rgba(3,13,10,0.8)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, #10b981, #38bdf8)', boxShadow: '0 0 16px rgba(16,185,129,0.4)' }}>🛡️</div>
                  <div>
                    <p className="font-display font-bold text-white text-sm">Safety OS</p>
                    <p className="font-mono text-[0.63rem]" style={{ color: '#6ee7b7' }}>Active · All SA campuses</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[0.63rem] uppercase tracking-widest" style={{ color: '#6ee7b7' }}>Walk Me Home</span>
                      <span className="font-mono text-[0.65rem] px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7' }}>Active</span>
                    </div>
                    <p className="font-display text-xs text-white">Timer: <span style={{ color: '#6ee7b7', fontWeight: 700 }}>12:00</span> remaining</p>
                    <p className="font-mono text-[0.63rem] mt-1" style={{ color: '#fff' }}>Check-in required by 22:15 · Lethabo will be notified</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                      <p className="text-xl mb-1">🚨</p>
                      <p className="font-display font-bold text-white text-xs">SOS</p>
                      <p className="font-mono text-[0.65rem] mt-0.5" style={{ color: '#fff' }}>Hold 3s to activate</p>
                    </div>
                    <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)' }}>
                      <p className="text-xl mb-1">⚖️</p>
                      <p className="font-display font-bold text-white text-xs">Legal Rights</p>
                      <p className="font-mono text-[0.65rem] mt-0.5" style={{ color: '#fff' }}>Know your rights</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Inspiration band ───────────────────────────────────────────────── */}
        <section className="relative px-5 py-28 overflow-hidden" aria-label="Why VarsityOS exists">
          <AmbientImage zone="entrepreneurship" opacity={0.42} blurPx={4} saturation={1.7}
            overlayColor="rgba(5,4,12,0.68)" />
          {/* asymmetric rotated glow shards */}
          <div aria-hidden="true" className="absolute -top-10 right-[8%] w-64 h-64 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,207,160,0.14), transparent 70%)', transform: 'rotate(18deg)' }} />
          <div aria-hidden="true" className="absolute bottom-0 left-[6%] w-72 h-72 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.14), transparent 70%)' }} />
          <div className="relative max-w-4xl mx-auto text-center">
            <p className="font-mono text-xs uppercase tracking-[0.35em] mb-7" style={{ color: '#f9a8d4' }}>· Ubuntu · I am because we are ·</p>
            <blockquote className="font-display font-black text-white leading-[1.08]" style={{ fontSize: 'clamp(1.8rem, 5.2vw, 3.4rem)' }}>
              Built for the student on a prepaid phone,<br className="hidden sm:block" /> studying by candlelight through load shedding —{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(120deg, #00CFA0, #A855F7, #D4A84B)' }}>and everyone chasing the same dream.</span>
            </blockquote>
            <p className="text-base sm:text-lg mt-8 max-w-2xl mx-auto leading-relaxed" style={{ color: '#fff' }}>
              You don&apos;t need money, a fancy laptop, or perfect signal. You need one place that has your back — mind, money, safety, and future. That&apos;s VarsityOS.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap mt-10">
              <Link
                href="/auth/signup"
                className="font-display font-bold text-sm px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #A855F7, #00CFA0)', color: '#fff', boxShadow: '0 4px 24px rgba(168,85,247,0.45)' }}
              >
                Claim your free account
              </Link>
              <Link
                href="/demo"
                className="font-display font-bold text-sm px-7 py-3.5 rounded-xl transition-all hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}
              >
                ▶ See it in action
              </Link>
            </div>
          </div>
        </section>

        {/* ── 7. HOW IT WORKS ────────────────────────────────────────────────── */}
        <section className="relative px-5 py-24 overflow-hidden" aria-labelledby="how-heading">
          <AmbientImage zone="movement" opacity={0.26} blurPx={6} saturation={1.5}
            overlayColor="rgba(5,4,12,0.80)" />
          <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.3em] mb-4" style={{ color: '#67e8f9' }}>· Getting started ·</p>
            <h2 id="how-heading" className="font-display font-black leading-[1.05] text-white" style={{ fontSize: 'clamp(2rem, 5.5vw, 3.4rem)' }}>
              Up and running in{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(120deg, #06b6d4, #3b82f6)' }}>3 minutes.</span>
            </h2>
            <p className="text-sm mt-3" style={{ color: '#fff' }}>No app store. No credit card. Just sign up.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
            {[
              { step: '01', icon: '✉️', title: 'Create your account', desc: 'Sign up with email or Google in under a minute. No payment details required.', accent: '#3b82f6' },
              { step: '02', icon: '🎓', title: 'Set up your profile', desc: 'Add your university, degree, and year. We personalise everything around you.', accent: '#0d9488' },
              { step: '03', icon: '🚀', title: 'Take control', desc: 'Add your modules, load your budget or NSFAS, set savings goals, and meet Nova. Everything syncs and works offline.', accent: '#06b6d4' },
            ].map((step, i) => (
              <div
                key={step.step}
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background: `linear-gradient(145deg, rgba(6,12,24,0.95), ${step.accent}0d)`,
                  border: `1px solid ${step.accent}30`,
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${step.accent}, transparent)` }} />
                <span
                  className="absolute top-4 right-5 font-display font-black text-5xl pointer-events-none select-none"
                  style={{ color: `${step.accent}18`, lineHeight: 1 }}
                  aria-hidden="true"
                >
                  {step.step}
                </span>
                <div className="text-2xl mb-3" aria-hidden="true">{step.icon}</div>
                <h3 className="font-display font-bold text-white text-sm mb-2">{step.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#fff' }}>{step.desc}</p>
                {i < 2 && (
                  <div
                    className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 font-display text-lg font-bold"
                    style={{ color: step.accent }}
                    aria-hidden="true"
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
          </div>
        </section>

        {/* ── 8. PRICING ─────────────────────────────────────────────────────── */}
        <section className="relative px-5 py-24 overflow-hidden" aria-labelledby="pricing-heading">
          <AmbientImage zone="nsfas" opacity={0.30} blurPx={6} saturation={1.5}
            overlayColor="rgba(5,4,12,0.80)" />
          <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.3em] mb-4" style={{ color: '#d4a847' }}>· Simple, honest pricing ·</p>
            <h2 id="pricing-heading" className="font-display font-black leading-[1.05] text-white mb-2" style={{ fontSize: 'clamp(2rem, 5.5vw, 3.4rem)' }}>
              Free forever.{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(120deg, #d4a847, #e07858)' }}>No catch.</span>
            </h2>
            <p className="text-sm" style={{ color: '#fff' }}>Start free. Upgrade only when you want more Nova.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className="relative rounded-2xl p-6"
                style={{
                  background: tier.gold
                    ? 'linear-gradient(145deg, rgba(212,168,71,0.12), rgba(6,12,24,0.95))'
                    : tier.highlight
                      ? 'linear-gradient(145deg, rgba(224,120,88,0.12), rgba(6,12,24,0.95))'
                      : 'linear-gradient(145deg, rgba(59,130,246,0.06), rgba(6,12,24,0.95))',
                  border: tier.gold
                    ? '1px solid rgba(212,168,71,0.45)'
                    : tier.highlight
                      ? '1px solid rgba(224,120,88,0.4)'
                      : '1px solid rgba(59,130,246,0.2)',
                  boxShadow: tier.gold
                    ? '0 0 40px rgba(212,168,71,0.1)'
                    : tier.highlight
                      ? '0 0 40px rgba(224,120,88,0.1)'
                      : '0 0 20px rgba(59,130,246,0.06)',
                }}
              >
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${tier.accentColor}, transparent)` }} />

                {tier.badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-[0.6rem] uppercase tracking-widest px-3 py-1 rounded-full text-white"
                    style={{ background: tier.accentColor, boxShadow: `0 4px 12px ${tier.accentColor}40` }}
                  >
                    {tier.badge}
                  </div>
                )}

                <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: tier.accentColor }}>{tier.name}</div>
                <div className="font-display font-black text-4xl text-white mb-0.5">{tier.price}</div>
                <div className="font-mono text-xs mb-5" style={{ color: '#fff' }}>{tier.sub}</div>

                <ul className="space-y-2.5 mb-6">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: '#fff' }}>
                      <span className="text-xs flex-shrink-0 font-bold" style={{ color: tier.checkColor }} aria-hidden="true">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.href}
                  className="block text-center font-display font-bold text-sm py-2.5 rounded-xl transition-all hover:opacity-90"
                  style={{
                    background: tier.gold || tier.highlight ? tier.accentColor : 'transparent',
                    color: tier.gold || tier.highlight ? '#fff' : tier.accentColor,
                    border: tier.gold || tier.highlight ? undefined : `1px solid ${tier.accentColor}50`,
                    boxShadow: tier.gold || tier.highlight ? `0 4px 16px ${tier.accentColor}40` : undefined,
                  }}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
          </div>
        </section>

        {/* ── 9. TESTIMONIALS ────────────────────────────────────────────────── */}
        <section className="relative px-5 py-24 overflow-hidden" aria-labelledby="testimonials-heading">
          <AmbientImage zone="habits" opacity={0.26} blurPx={7} saturation={1.5}
            overlayColor="rgba(5,4,12,0.82)" />
          <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.3em] mb-4" style={{ color: '#c084fc' }}>· Real students · Real campuses ·</p>
            <h2 id="testimonials-heading" className="font-display font-black leading-[1.05] text-white" style={{ fontSize: 'clamp(2rem, 5.5vw, 3.4rem)' }}>
              Loved from Soweto{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(120deg, #A855F7, #00CFA0)' }}>to Stellenbosch.</span>
            </h2>
          </div>
          {/* Asymmetric masonry-ish grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <blockquote
                key={t.name}
                className={`rounded-2xl p-5 sm:p-6 relative overflow-hidden ${i % 4 === 1 ? 'sm:translate-y-6' : i % 4 === 3 ? 'sm:-translate-y-3' : ''}`}
                style={{
                  background: `linear-gradient(145deg, ${t.accent}14, rgba(6,12,24,0.72))`,
                  border: `1px solid ${t.accent}30`,
                  backdropFilter: 'blur(4px)',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${t.accent}80, transparent)` }} />
                <p className="font-display text-sm leading-relaxed mb-4" style={{ color: '#fff' }}>&ldquo;{t.quote}&rdquo;</p>
                <footer>
                  <p className="font-display font-bold text-xs" style={{ color: t.accent }}>{t.name}</p>
                  <p className="font-mono text-[0.63rem] mt-0.5" style={{ color: '#fff' }}>{t.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
          </div>
        </section>

        {/* ── 10. FAQ ────────────────────────────────────────────────────────── */}
        <section className="relative px-5 py-24 overflow-hidden" aria-labelledby="faq-heading">
          <AmbientImage zone="study" opacity={0.34} blurPx={4} saturation={1.35}
            overlayColor="rgba(5,4,12,0.80)" />
          <div className="relative max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.3em] mb-4" style={{ color: '#93c5fd' }}>· Everything else ·</p>
            <h2 id="faq-heading" className="font-display font-black leading-[1.05] text-white" style={{ fontSize: 'clamp(2rem, 5.5vw, 3.4rem)' }}>
              Common{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(120deg, #3b82f6, #00CFA0)' }}>questions.</span>
            </h2>
          </div>
          <div className="space-y-2">
            {[
              { q: 'Is VarsityOS actually free?', a: 'Yes. The free plan gives you all 30+ tools — Study Planner, Budget & NSFAS tracker, Safety OS, Fitness Tracker, Stokvel OS, Meal Prep, Work tracker, and 20 Nova messages every month — forever. Paid plans unlock more Nova messages.' },
              { q: 'How does VarsityOS help me track my NSFAS?', a: "Log your NSFAS allowances, track spending by category, and see exactly how much you have left. Nova can also answer questions about N+ rules and what happens if you fail modules." },
              { q: 'What makes Nova different from ChatGPT?', a: 'Nova is built specifically for SA students. It knows NSFAS rules, understands load shedding, speaks to imposter syndrome in first-gen students, uses CBT techniques, and detects mental health crises with instant access to SA helplines. It speaks your reality.' },
              { q: 'Which universities does VarsityOS work for?', a: 'All SA universities — UCT, Wits, UP, Stellenbosch, UKZN, UJ, UWC, NMU, Rhodes, UFH, WSU, UNISA, DUT, CPUT, TUT, and more.' },
              { q: 'Does VarsityOS work offline (during load shedding)?', a: "Yes. VarsityOS is a Progressive Web App (PWA). Once loaded, your budget, tasks, timetable, and study data are available offline. Changes sync automatically when you reconnect. Open it in Chrome or Safari and tap 'Add to Home Screen' to install it like a native app." },
              { q: "I'm not on NSFAS — can I still use it?", a: "Absolutely. The Flexible Wallet lets you track any income source — bursaries, family support, part-time work. The budget and savings tools work for every SA student, not just NSFAS recipients." },
              { q: 'What does Nova Scholar include vs Nova Unlimited?', a: 'Nova Scholar (R29/month) gives you 150 Nova messages per month, AI Recipe Generator, AI Budget Coach, and AI Study Plans. Nova Unlimited (R89/month) gives you unlimited Nova messages, CSV export, and first access to new features. Both plans include all 30+ tools — the difference is Nova message volume.' },
              { q: 'Is my data safe? How does VarsityOS comply with POPIA?', a: 'VarsityOS is registered under POPIA (Act 4 of 2013), Registration No. 2026-005658. Your data is encrypted and stored securely with Supabase (EU/Ireland region) under POPIA cross-border safeguards, protected by Row-Level Security. We never sell your data. You can request deletion at any time. See our Privacy Policy for full details.' },
              { q: 'Can I use VarsityOS if I have a bursary instead of NSFAS?', a: 'Yes. The Flexible Wallet lets you track any funding source — Funza Lushaka, ISFAP, Ikusasa, employer bursaries, family support, or part-time income. Create separate spending buckets for each and track them independently alongside your study budget.' },
              { q: 'Does VarsityOS work for UNISA distance learning students?', a: 'Yes. UNISA students can use the Study Planner for self-paced modules, track assignment due dates, set exam reminders, and use Nova for study support — even without a fixed class timetable. The offline PWA is especially useful when data is limited.' },
              { q: 'I live in digs, not res. Can I still use the meal planner?', a: 'Absolutely. The meal planner and AI Recipe Generator are designed for students cooking in digs with a limited weekly food budget. Input what you have in your pantry and your spend limit — Nova generates budget-friendly SA recipes under R50.' },
              { q: 'What is the N+ rule and how does VarsityOS help?', a: 'The N+ rule means NSFAS only funds you for the minimum time to complete your qualification plus a limited number of extra years (typically N+2 or N+1 depending on your institution). VarsityOS helps you track module credits, flag failed or repeated modules, and Nova explains the N+ implications at your specific university so you can act before funding is cut.' },
              { q: 'Can Nova help with imposter syndrome as a first-gen student?', a: "Yes. Nova is trained to recognise first-generation student challenges — the feeling of not belonging at varsity, pressure from family, financial anxiety, and academic overwhelm. Nova uses CBT-based techniques to help reframe these thoughts and gives practical, SA-specific advice that generic AI assistants don't provide." },
              { q: 'Does VarsityOS work for TVET college students?', a: "Yes. VarsityOS supports all 50 TVET colleges in South Africa. NSFAS tracking, bursary finder, study planner, peer tutoring, and notes marketplace all work for N2–N6 and diploma students. You can select your TVET college during sign-up and get matched with peers at your institution." },
              { q: 'How does the Notes Marketplace work?', a: "Students upload links to their notes (Google Drive, OneDrive, Dropbox) — lecture notes, past exam papers, summaries, and study guides. Other students at your institution can browse, save, and download them for free. No file uploads required. Share a Drive link, choose your module code, and help your campus community." },
              { q: 'How does Peer Tutoring work on VarsityOS?', a: "Students who excel in a subject can register as tutors, set their rate per hour, and list their availability. Other students can search for tutors at their university by subject, view ratings, and book a session. You arrange payment directly with the tutor (cash or EFT). Tutors get notified, confirm the booking, and review each other after the session." },
              { q: 'What is the Bursary Finder?', a: "VarsityOS includes a searchable database of 100+ South African bursaries — from Funza Lushaka and ISFAP to Eskom, Sasol, Anglo American, and provincial bursaries. Each listing shows the amount, eligibility criteria, application deadlines, and a direct link to apply. Nova can also help you identify which bursaries match your degree and province." },
              { q: 'What are Study Twins?', a: "Study Twins matches you with another student at your university studying the same degree and year of study. Opt in, share your WhatsApp number, and get connected with your academic match. It's designed to reduce isolation for first-gen students and help you build a study support network." },
              { q: 'What is Safety OS and how does it protect me on campus?', a: "Safety OS is VarsityOS's built-in campus safety module. It includes a one-tap SOS alert that sends your location to emergency contacts and campus security, a Walk Me Home timer that automatically texts a contact if you don't check in by a set time, an incident reporting tool for logging safety incidents with timestamps, a self-defence resource library, and a Legal Rights guide covering NSFAS appeals, tenant rights in student digs, and labour rights for part-timers." },
              { q: 'What is Stokvel OS?', a: "Stokvel OS lets you manage a rotating savings circle (stokvel) entirely within VarsityOS. You can add members, log monthly contributions, track who has paid, assign payout months, generate contribution schedules, and manage disputes. It's designed for the SA stokvel tradition — a community savings circle where each member receives a lump-sum payout in their assigned month." },
              { q: 'Can I track my workouts and fitness on VarsityOS?', a: "Yes. The Fitness Tracker lets you log workouts — runs, walks, gym sessions, yoga, swimming, cycling, and more — with duration, calories, and notes. Your data is stored in Supabase and syncs across devices. You can view your workout history, weekly streaks, and progress over time. The Body domain also includes sleep tracking and a wellness diary." },
            ].map((faq, i) => (
              <details
                key={i}
                className="rounded-2xl group overflow-hidden"
                style={{ background: 'rgba(6,12,24,0.55)', border: '1px solid rgba(59,130,246,0.16)', backdropFilter: 'blur(6px)' }}
              >
                <summary className="font-display font-bold text-sm cursor-pointer flex items-center justify-between gap-3 px-5 py-4 text-white" style={{ listStyle: 'none' }}>
                  {faq.q}
                  <span className="text-xs flex-shrink-0 transition-transform group-open:rotate-180" style={{ color: '#3b82f6' }}>▼</span>
                </summary>
                <p className="text-sm leading-relaxed px-5 pb-4" style={{ color: '#fff' }}>{faq.a}</p>
              </details>
            ))}
          </div>
          </div>
        </section>

        {/* ── 11. FINAL CTA ──────────────────────────────────────────────────── */}
        <section className="px-5 pb-24 max-w-7xl mx-auto">
          <div
            className="rounded-3xl px-8 py-20 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #06112a 0%, #071c1a 60%, #060c18 100%)', border: '1px solid rgba(59,130,246,0.2)', transform: 'translateZ(0)' }}
          >
            <AmbientImage zone="impasto" opacity={0.34} blurPx={5} saturation={1.6}
              overlayColor="rgba(6,17,42,0.76)" />
            <div className="absolute top-0 left-0 w-full sm:w-[500px] h-[400px] pointer-events-none" aria-hidden="true" style={{ background: 'radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 60%)' }} />
            <div className="absolute bottom-0 right-0 w-full sm:w-[500px] h-[400px] pointer-events-none" aria-hidden="true" style={{ background: 'radial-gradient(circle at bottom right, rgba(13,148,136,0.18), transparent 60%)' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full sm:w-[600px] h-[400px] pointer-events-none" aria-hidden="true" style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.06), transparent 65%)' }} />

            <div className="relative">
              <div className="text-5xl mb-5" aria-hidden="true">🧭</div>
              <h2 className="font-display font-black text-white mb-3" style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}>
                Ready to actually get on top of it?
              </h2>
              <p className="text-sm max-w-md mx-auto mb-8" style={{ color: '#fff' }}>
                Your NSFAS, your budget, your safety, your body, your community — all 9 domains of student life, one lekker OS built for SA reality. Free to start. No app store. Works offline.
              </p>
              <Link
                href="/auth/signup"
                className="block w-full sm:inline-block sm:w-auto font-display font-bold text-base px-10 py-4 rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #0d9488)', color: '#fff', boxShadow: '0 4px 32px rgba(59,130,246,0.45)' }}
              >
                Create your free account
              </Link>
              <p className="font-mono text-xs mt-4" style={{ color: '#fff' }}>No credit card · No app store · Works on any device</p>
              <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="font-mono text-[0.6rem] mb-3" style={{ color: '#fff' }}>Already using VarsityOS? A quick review helps the next student find us.</p>
                <a
                  href="https://g.page/r/CdPIXBcTmJE6EAI/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-mono text-xs px-5 py-2.5 rounded-xl transition-all hover:opacity-80"
                  style={{ background: 'rgba(212,168,71,0.12)', color: '#d4a847', border: '1px solid rgba(212,168,71,0.3)' }}
                >
                  ⭐ Leave a Google Review
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── 12. FOOTER ─────────────────────────────────────────────────────── */}
        <footer className="px-5 py-8 max-w-7xl mx-auto" style={{ borderTop: '1px solid rgba(59,130,246,0.1)' }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center" style={{ boxShadow: '0 0 8px rgba(13,148,136,0.3)' }}>
                <Image src="/favicon.jpg" alt="VarsityOS" width={28} height={28} className="object-contain" />
              </div>
              <span className="font-display font-bold text-sm" style={{ color: '#fff' }}>VarsityOS</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="font-mono text-[0.6rem] text-center" style={{ color: '#fff' }}>
                Built by{' '}
                <a
                  href="https://creativelynanda.co.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold transition-colors hover:opacity-80"
                  style={{ color: '#5eead4' }}
                >
                  Nanda Regine
                </a>
                {' '}· Mirembe Muse (Pty) Ltd
              </p>
              <p className="font-mono text-[0.63rem]" style={{ color: '#fff' }}>
                POPIA Reg. 2026-005658 · East London, Eastern Cape, South Africa
              </p>
            </div>
            <nav className="flex items-center gap-4" aria-label="Footer navigation">
              {[
                { href: '/privacy', label: 'Privacy' },
                { href: '/terms', label: 'Terms' },
                { href: '/paia', label: 'PAIA' },
                { href: '/security', label: 'Security' },
                { href: '/auth/signup', label: 'Sign up' },
              ].map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="font-mono text-[0.6rem] transition-colors hover:text-white min-h-[44px] flex items-center"
                  style={{ color: '#fff' }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </footer>

      </div>
    </>
  )
}
