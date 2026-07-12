'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AmbientImage } from '@/components/ui/AmbientImage'

// ─── Demo screens data ────────────────────────────────────────────────────────

const DEMOS = [
  {
    id: 'budget',
    label: 'Budget & NSFAS',
    icon: '💰',
    accent: '#3b82f6',
    tagline: 'Know exactly where every rand goes',
    description: 'Log your NSFAS allowances, track spending across categories, and get a real-time view of what\'s left — before it runs out.',
    bullets: [
      'NSFAS food, transport, books, accommodation — separate buckets',
      'AI budget coaching: "You\'re overspending on transport by 34%"',
      'Month-end projection so you never run short',
      'N+ rule tracking — know your academic funding status',
    ],
    preview: <BudgetPreview />,
  },
  {
    id: 'nova',
    label: 'Nova AI',
    icon: '🌟',
    accent: '#0d9488',
    tagline: 'An AI that actually gets SA student life',
    description: 'Nova isn\'t ChatGPT. It knows NSFAS rules, understands load shedding, speaks to imposter syndrome, uses CBT techniques, and detects mental health crises with SA helpline numbers built in.',
    bullets: [
      'CBT-based mental health support — free, private, always on',
      'Crisis detection with SADAG & LifeLine numbers ready',
      'NSFAS rules, N+ guidance, financial coaching in plain language',
      '15 free messages/month — no card needed to start',
    ],
    preview: <NovaPreview />,
  },
  {
    id: 'study',
    label: 'Study Planner',
    icon: '📚',
    accent: '#8b5cf6',
    tagline: 'Your whole semester in one place',
    description: 'Timetable, exam countdowns, task deadlines, flashcards with spaced repetition, and an exam readiness score — built around the reality of SA campus life.',
    bullets: [
      'Exam countdown with days remaining + readiness score',
      'Flashcards using SM-2 spaced repetition algorithm',
      'Conflict alerts when your shift clashes with an exam',
      'Load-shedding aware — reschedule around outages',
    ],
    preview: <StudyPreview />,
  },
  {
    id: 'tutoring',
    label: 'Peer Tutoring',
    icon: '🎓',
    accent: '#c9a84c',
    tagline: 'Book a tutor. Become one. Earn.',
    description: 'Find peer tutors at your university for any subject. Set your own rate. Rate your session. Build your academic reputation.',
    bullets: [
      'Browse tutors at your institution by subject and rating',
      'Book 30min → 2hr sessions, pay cash/EFT/online',
      'Push notifications at every stage of your booking',
      'Earn side income tutoring what you already know',
    ],
    preview: <TutoringPreview />,
  },
  {
    id: 'notes',
    label: 'Notes Marketplace',
    icon: '📖',
    accent: '#4ecf9e',
    tagline: 'Share notes. Download notes. Pay it forward.',
    description: 'Upload a Google Drive link to your lecture notes or past papers. Other students at your institution can save and access them instantly. Community-powered, completely free.',
    bullets: [
      'Filter by module code, year of study, file type',
      'Save notes to your personal library',
      'Upload: summaries, slides, past papers, study guides',
      'Institution-filtered by default — see what your campus is sharing',
    ],
    preview: <NotesPreview />,
  },
  {
    id: 'bursaries',
    label: 'Bursary Finder',
    icon: '🏆',
    accent: '#f59e0b',
    tagline: '100+ bursaries. One place. Never miss funding.',
    description: 'Browse South Africa\'s most comprehensive student bursary database. Filter by field, province, and amount. Get deadline alerts. Apply directly.',
    bullets: [
      'Funza Lushaka, ISFAP, Eskom, Sasol, Nedbank, FNB, and more',
      'Filter by degree field, province, and amount',
      'Application deadlines with days-remaining countdown',
      'Nova explains eligibility criteria in plain language',
    ],
    preview: <BursaryPreview />,
  },
]

// ─── Sub-previews ──────────────────────────────────────────────────────────────

function BudgetPreview() {
  return (
    <div style={{ background: 'rgba(6,12,24,0.9)', borderRadius: 16, padding: 20, border: '1px solid rgba(59,130,246,0.2)' }}>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#93c5fd', marginBottom: 14 }}>March Budget</p>
      <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 12, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>NSFAS food allowance</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>R1,500</span>
        </div>
        <div style={{ height: 4, borderRadius: 9999, background: 'rgba(255,255,255,0.08)' }}>
          <div style={{ height: 4, borderRadius: 9999, width: '62%', background: '#3b82f6' }} />
        </div>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>R930 spent · R570 left</p>
      </div>
      {[
        { label: 'Transport', spent: 'R340', left: 'R260', pct: 57, color: '#e07858' },
        { label: 'Books & printing', spent: 'R210', left: 'R90', pct: 70, color: '#d4a847' },
        { label: 'Toiletries', spent: 'R85', left: 'R165', pct: 34, color: '#06b6d4' },
      ].map(item => (
        <div key={item.label} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: item.color }}>{item.spent}</span>
          </div>
          <div style={{ height: 3, borderRadius: 9999, background: 'rgba(255,255,255,0.06)' }}>
            <div style={{ height: 3, borderRadius: 9999, width: `${item.pct}%`, background: item.color }} />
          </div>
        </div>
      ))}
      <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)' }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#5eead4' }}>✦ Nova: At this rate you have <strong>R1,840</strong> to last 18 days. Tight but doable.</p>
      </div>
    </div>
  )
}

function NovaPreview() {
  const msgs = [
    { role: 'user', text: "I feel like I don't belong here. Everyone seems smarter than me." },
    { role: 'nova', text: "That's imposter syndrome — and it's incredibly common at SA universities, especially for first-gen students. What you're feeling is real, but it's not evidence of your ability. What happened today that triggered this?" },
    { role: 'user', text: "I bombed a tutorial question in front of the whole class 😔" },
    { role: 'nova', text: "One bad moment in a tutorial doesn't define your intelligence or your belonging here. Can you name three things you *did* understand this week? Let's rebalance this." },
  ]
  return (
    <div style={{ background: 'rgba(6,12,24,0.9)', borderRadius: 16, padding: 16, border: '1px solid rgba(13,148,136,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #0d9488, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 0 16px rgba(13,148,136,0.4)' }}>✦</div>
        <div>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: '#fff', margin: 0 }}>Nova</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#5eead4', margin: 0 }}>Online · SA Student AI</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '8px 12px', borderRadius: 14,
              background: m.role === 'user' ? 'rgba(59,130,246,0.12)' : 'rgba(13,148,136,0.15)',
              border: m.role === 'nova' ? '1px solid rgba(13,148,136,0.25)' : '1px solid rgba(59,130,246,0.2)',
            }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, lineHeight: 1.6, color: m.role === 'nova' ? '#5eead4' : 'rgba(255,255,255,0.8)', margin: 0 }}>{m.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, padding: '8px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Reply to Nova...</div>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #0d9488, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, cursor: 'pointer' }}>↑</div>
      </div>
    </div>
  )
}

function StudyPreview() {
  return (
    <div style={{ background: 'rgba(6,12,24,0.9)', borderRadius: 16, padding: 20, border: '1px solid rgba(139,92,246,0.2)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div style={{ padding: 12, borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Next exam</p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: '#fff', margin: '0 0 2px 0' }}>CHEM3</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: '#f87171', margin: 0 }}>6 days</p>
        </div>
        <div style={{ padding: 12, borderRadius: 12, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Readiness</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: '#a78bfa', margin: '0 0 2px 0' }}>67%</p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Keep reviewing</p>
        </div>
      </div>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px 0' }}>Flashcards due today</p>
      {[
        { q: 'Le Chatelier\'s Principle', status: 'due', color: '#f59e0b' },
        { q: 'Hess\'s Law applications', status: 'due', color: '#f59e0b' },
        { q: 'Electrochemical series', status: 'done', color: '#0d9488' },
      ].map(card => (
        <div key={card.q} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 6 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{card.q}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: card.color, fontWeight: 700 }}>{card.status}</span>
        </div>
      ))}
      <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(224,120,88,0.1)', border: '1px solid rgba(224,120,88,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>🔥</span>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, color: '#fff', margin: 0 }}>14 day study streak</p>
      </div>
    </div>
  )
}

function TutoringPreview() {
  const tutors = [
    { name: 'Sipho M.', emoji: '🦁', subject: 'Accounting 2A', rate: 'R80/hr', rating: '4.9', sessions: 23, badge: 'Top rated' },
    { name: 'Aisha P.', emoji: '🌸', subject: 'Engineering Maths', rate: 'R120/hr', rating: '5.0', sessions: 41, badge: 'Most booked' },
    { name: 'Tebogo K.', emoji: '⚡', subject: 'Organic Chemistry', rate: 'R90/hr', rating: '4.8', sessions: 17 },
  ]
  return (
    <div style={{ background: 'rgba(6,12,24,0.9)', borderRadius: 16, padding: 16, border: '1px solid rgba(201,168,76,0.2)' }}>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px 0' }}>Tutors at your university</p>
      {tutors.map(t => (
        <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 8, position: 'relative' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(201,168,76,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{t.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, color: '#fff', margin: 0 }}>{t.name}</p>
              {t.badge && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#c9a84c', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 9999, padding: '1px 5px' }}>{t.badge}</span>}
            </div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0 0' }}>{t.subject}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: '#c9a84c', margin: '0 0 2px 0' }}>{t.rate}</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)', margin: 0 }}>⭐ {t.rating} · {t.sessions} sessions</p>
          </div>
        </div>
      ))}
      <button style={{ width: '100%', padding: '10px', borderRadius: 12, background: 'linear-gradient(135deg, #c9a84c, #d4a847)', border: 'none', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, color: '#000', cursor: 'pointer', marginTop: 4 }}>
        Book a session
      </button>
    </div>
  )
}

function NotesPreview() {
  const notes = [
    { title: 'Organic Chem — Full Summary', module: 'CHEM3', type: 'PDF', saves: 84, uploader: '🦊 Lethabo', isNew: true },
    { title: 'Accounting 2A Past Papers 2023', module: 'ACC201', type: 'PDF', saves: 127, uploader: '🌻 Ayasha' },
    { title: 'Engineering Maths Cheat Sheet', module: 'MAT301', type: 'Slides', saves: 63, uploader: '⚡ Tebogo' },
  ]
  return (
    <div style={{ background: 'rgba(6,12,24,0.9)', borderRadius: 16, padding: 16, border: '1px solid rgba(78,207,158,0.2)' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Search module code...</div>
        <div style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(78,207,158,0.15)', border: '1px solid rgba(78,207,158,0.3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4ecf9e', cursor: 'pointer' }}>+ Upload</div>
      </div>
      {notes.map(n => (
        <div key={n.title} style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4ecf9e', background: 'rgba(78,207,158,0.1)', border: '1px solid rgba(78,207,158,0.25)', borderRadius: 9999, padding: '1px 6px' }}>{n.module}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', borderRadius: 9999, padding: '1px 6px' }}>{n.type}</span>
                {n.isNew && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', borderRadius: 9999, padding: '1px 5px' }}>New</span>}
              </div>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 12, color: '#fff', margin: '0 0 2px 0' }}>{n.title}</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0 }}>by {n.uploader}</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '0 0 4px 0' }}>🔖 {n.saves}</p>
              <div style={{ padding: '4px 8px', borderRadius: 8, background: 'rgba(78,207,158,0.1)', border: '1px solid rgba(78,207,158,0.25)', cursor: 'pointer' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4ecf9e' }}>Save</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function BursaryPreview() {
  const bursaries = [
    { name: 'Funza Lushaka', amount: 'Full cost', deadline: '31 Oct 2025', field: 'Teaching', color: '#f59e0b', urgent: false },
    { name: 'ISFAP (Ikusasa)', amount: 'Up to R80k/yr', deadline: '15 Aug 2025', field: 'Any field', color: '#3b82f6', urgent: true },
    { name: 'Eskom Bursary', amount: 'Up to R120k', deadline: '30 Sep 2025', field: 'Engineering', color: '#ef4444', urgent: false },
    { name: 'Standard Bank', amount: 'R60k / yr', deadline: '1 Jul 2025', field: 'Finance/Law/IT', color: '#0d9488', urgent: false },
  ]
  return (
    <div style={{ background: 'rgba(6,12,24,0.9)', borderRadius: 16, padding: 16, border: '1px solid rgba(245,158,11,0.2)' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {['All fields', 'Engineering', 'Teaching', 'Finance'].map((tag, i) => (
          <span key={tag} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, padding: '3px 8px', borderRadius: 9999, background: i === 0 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${i === 0 ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`, color: i === 0 ? '#f59e0b' : 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>{tag}</span>
        ))}
      </div>
      {bursaries.map(b => (
        <div key={b.name} style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)`, marginBottom: 8, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: b.color, borderRadius: '12px 0 0 12px' }} />
          <div style={{ paddingLeft: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, color: '#fff', margin: 0 }}>{b.name}</p>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, color: b.color }}>{b.amount}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{b.field}</span>
              <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: b.urgent ? '#ef4444' : 'rgba(255,255,255,0.35)' }}>Closes {b.deadline}</span>
              {b.urgent && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 9999, padding: '1px 5px' }}>Urgent</span>}
            </div>
          </div>
        </div>
      ))}
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 4 }}>100+ bursaries · updated monthly</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [active, setActive] = useState(0)
  const demo = DEMOS[active]

  return (
    <div style={{ minHeight: '100dvh', background: '#05040C', color: '#fff', overflowX: 'hidden', position: 'relative' }}>
      <style>{`
        .demo-grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 24px; align-items: start; }
        @media (max-width: 640px) {
          .demo-grid { grid-template-columns: 1fr; }
          .demo-preview { order: -1; }
          .demo-nav-label { display: none; }
        }
      `}</style>
      <AmbientImage zone="dashboard" opacity={0.26} blurPx={8} saturation={1.4} overlayColor="rgba(5,4,12,0.55)" />

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(5,4,12,0.92)', borderBottom: '1px solid rgba(148,111,255,0.12)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', background: 'rgba(13,148,136,0.15)' }}>
            <Image src="/favicon.jpg" alt="VarsityOS" width={30} height={30} style={{ objectFit: 'contain' }} />
          </div>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14 }}>VarsityOS</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#0d9488', background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 9999, padding: '2px 8px' }}>Interactive Demo</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', padding: '6px 12px' }}>
            Back
          </Link>
          <Link href="/auth/signup" style={{ fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 700, color: '#fff', textDecoration: 'none', padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg, #0d9488, #3b82f6)' }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '52px 20px 32px', maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '6px 16px', borderRadius: 9999, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#93c5fd' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', animation: 'pulse 2s ease-in-out infinite' }} />
          See exactly what you&apos;re signing up for
        </div>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', lineHeight: 1.1, marginBottom: 16 }}>
          Everything you need.<br />
          <span style={{ background: 'linear-gradient(120deg, #3b82f6, #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            One lekker app.
          </span>
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 500, margin: '0 auto' }}>
          Tap any feature below to see a live preview of what VarsityOS looks like — before you sign up.
        </p>
      </div>

      {/* Feature tabs */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px 24px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
          {DEMOS.map((d, i) => (
            <button
              key={d.id}
              onClick={() => setActive(i)}
              style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 12,
                background: active === i ? `${d.accent}20` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active === i ? d.accent + '60' : 'rgba(255,255,255,0.08)'}`,
                color: active === i ? d.accent : 'rgba(255,255,255,0.45)',
                cursor: 'pointer', transition: 'all 0.2s ease',
                fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: active === i ? 700 : 400,
              }}
            >
              <span style={{ fontSize: 16 }}>{d.icon}</span>
              <span className="demo-nav-label">{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main demo content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px 60px' }}>
        <div className="demo-grid">

          {/* Left: copy */}
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '4px 12px', borderRadius: 9999, background: `${demo.accent}15`, border: `1px solid ${demo.accent}35`, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: demo.accent }}>
              <span style={{ fontSize: 16 }}>{demo.icon}</span>
              {demo.label}
            </div>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 900, fontSize: 'clamp(1.4rem, 3vw, 2rem)', lineHeight: 1.2, marginBottom: 12 }}>
              {demo.tagline}
            </h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 20 }}>
              {demo.description}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {demo.bullets.map((b, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: `${demo.accent}20`, border: `1px solid ${demo.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: demo.accent, flexShrink: 0, marginTop: 1 }}>✓</span>
                  {b}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                href="/auth/signup"
                style={{
                  display: 'block', textAlign: 'center', padding: '13px 24px', borderRadius: 14,
                  background: `linear-gradient(135deg, ${demo.accent}, ${demo.accent}bb)`,
                  fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: '#fff',
                  textDecoration: 'none', boxShadow: `0 4px 20px ${demo.accent}40`,
                  transition: 'all 0.2s ease',
                }}
              >
                Try {demo.label} free →
              </Link>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
                No credit card · No app store · Works offline
              </p>
            </div>
          </div>

          {/* Right: live preview */}
          <div className="demo-preview">
            <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d9488', animation: 'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live preview</span>
            </div>
            {demo.id === 'budget' && <BudgetPreview />}
            {demo.id === 'nova' && <NovaPreview />}
            {demo.id === 'study' && <StudyPreview />}
            {demo.id === 'tutoring' && <TutoringPreview />}
            {demo.id === 'notes' && <NotesPreview />}
            {demo.id === 'bursaries' && <BursaryPreview />}
          </div>

        </div>
      </div>

      {/* Social proof strip */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 20px 50px', maxWidth: 900, margin: '0 auto' }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 24 }}>What students say</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {[
            { quote: "Nova talked me through a full breakdown before my CHEM3 exam. It didn't feel like a chatbot.", name: 'Lethabo M.', role: '3rd year BSc, Wits', accent: '#0d9488' },
            { quote: "I finally know exactly where my NSFAS money goes. The budget tracker is the first thing I open every month.", name: 'Ayasha P.', role: '2nd year Law, UCT', accent: '#3b82f6' },
            { quote: "Eish, I didn't know I could earn money tutoring on the same app I use for my timetable. Sharp.", name: 'Sipho D.', role: '3rd year Engineering, TUT', accent: '#c9a84c' },
            { quote: "I'm from a TVET in Limpopo. This app works offline and the bursary finder helped me apply for 4 bursaries I didn't know existed.", name: 'Tshepiso K.', role: 'N6, Capricorn TVET', accent: '#f59e0b' },
          ].map(t => (
            <div key={t.name} style={{ padding: '16px 18px', borderRadius: 16, background: `${t.accent}0a`, border: `1px solid ${t.accent}25`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${t.accent}80, transparent)` }} />
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}>&ldquo;{t.quote}&rdquo;</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 11, color: t.accent, margin: '0 0 2px 0' }}>{t.name}</p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{t.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div style={{ padding: '16px 20px 80px', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ padding: '40px 32px', borderRadius: 24, background: 'linear-gradient(135deg, #060f1a, #071c1a)', border: '1px solid rgba(59,130,246,0.2)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at center, rgba(13,148,136,0.08), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>🧭</p>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 900, fontSize: 'clamp(1.4rem, 4vw, 2rem)', marginBottom: 10 }}>
              Ready to get on top of it?
            </h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 24 }}>
              Budget, notes, tutoring, bursaries, and Nova — free forever. No app store. Works offline. Built for South African students.
            </p>
            <Link
              href="/auth/signup"
              style={{
                display: 'inline-block', padding: '14px 36px', borderRadius: 14,
                background: 'linear-gradient(135deg, #3b82f6, #0d9488)',
                fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff',
                textDecoration: 'none', boxShadow: '0 4px 32px rgba(59,130,246,0.4)',
              }}
            >
              Create your free account
            </Link>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 12 }}>
              No credit card · No app store · Works on any phone
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
