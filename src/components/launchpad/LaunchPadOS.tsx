'use client'

import { useState } from 'react'
import Link from 'next/link'

const ACCENT = '#6366F1'

type Tab = 'leap' | 'exit' | 'salary' | 'plan'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'leap', label: 'The Leap', icon: '🚀' },
  { id: 'exit', label: 'Exit Checklist', icon: '✅' },
  { id: 'salary', label: 'First Salary', icon: '💼' },
  { id: 'plan', label: '90-Day Plan', icon: '🧭' },
]

const card: React.CSSProperties = {
  background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '14px 16px',
}
const input: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)',
  borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.9rem',
}

function fmtR(n: number): string {
  return 'R' + Math.round(n).toLocaleString('en-ZA')
}

/* Reusable local checklist (localStorage-backed) */
function LocalChecklist({ storeKey, items, links }: {
  storeKey: string
  items: string[]
  links?: Record<number, { href: string; label: string }>
}) {
  const [checked, setChecked] = useState<Record<number, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(storeKey) || '{}') } catch { return {} }
  })
  const toggle = (i: number) => {
    const next = { ...checked, [i]: !checked[i] }
    setChecked(next)
    try { localStorage.setItem(storeKey, JSON.stringify(next)) } catch { /* ignore */ }
  }
  const done = items.filter((_, i) => checked[i]).length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: ACCENT }}>{done}/{items.length} done</div>
      {items.map((item, i) => {
        const lnk = links?.[i]
        return (
          <div key={i} style={{ ...card, padding: '10px 13px', borderColor: checked[i] ? `${ACCENT}40` : 'var(--border-subtle)' }}>
            <button onClick={() => toggle(i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${checked[i] ? ACCENT : 'var(--border-default)'}`, background: checked[i] ? ACCENT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, color: '#fff', fontSize: '0.7rem', fontWeight: 900 }}>{checked[i] ? '✓' : ''}</div>
              <span style={{ fontSize: '0.78rem', color: checked[i] ? 'var(--text-muted)' : 'var(--text-secondary)', lineHeight: 1.45, textDecoration: checked[i] ? 'line-through' : 'none' }}>{item}</span>
            </button>
            {lnk && (
              <Link href={lnk.href} style={{ display: 'inline-block', marginTop: 6, marginLeft: 28, fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: ACCENT, textDecoration: 'none' }}>{lnk.label} →</Link>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ───────────── The Leap ───────────── */
function LeapTab() {
  const blocks = [
    { icon: '🌫️', t: 'Post-graduation blues is real', d: 'The structure, the friends, the daily sense of purpose can vanish almost overnight. Feeling flat, lost or anxious once the celebration fades is normal — not a sign you chose wrong. Give yourself a soft landing and a little routine while you find the next one.' },
    { icon: '🪞', t: "You're more than 'a student'", d: "Your identity shifts when the title does. You're allowed to not have it all figured out yet — almost nobody does at 21 or 22. The plan can take shape as you go." },
    { icon: '🫶', t: 'Family hopes & black tax', d: "If you're the first in your family to graduate, the pride — and the financial expectation — of everyone can land on you at once. It comes from love, but it's heavy. You can help without sinking: decide what you can give, pay yourself first, and talk to family honestly and kindly about what's realistic." },
    { icon: '📊', t: 'The comparison trap', d: "Classmates will post job offers, grad schemes and overseas moves. Your timeline is your own — plenty of people take months to find their footing, and the loudest starts aren't always the best ones." },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...card, background: `${ACCENT}0d`, borderColor: `${ACCENT}40` }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Leaving is as big a change as arriving</div>
        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Everyone prepares you for starting varsity. Far fewer warn you about leaving it. This is your space to get ready for the change — the practical admin, the money shift, and the parts that hit your heart, not just your to-do list.
        </div>
      </div>
      {blocks.map((b, i) => (
        <div key={i} style={{ ...card }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{b.icon} {b.t}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{b.d}</div>
        </div>
      ))}
      <div style={{ ...card, borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>🚩 When it&apos;s more than the blues</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          If for two weeks or more you feel hopeless, can&apos;t function, or think about hurting yourself, please reach out — the transition is hard and support helps.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          <a href="tel:0800456789" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 9, textDecoration: 'none' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>SADAG — free, 24/7</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>0800 456 789</span>
          </a>
          <Link href="/regulate" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 9, textDecoration: 'none' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Write it out in your private journal</span>
            <span style={{ fontSize: '0.74rem', color: ACCENT }}>Open →</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ───────────── Exit Checklist ───────────── */
const EXIT_ITEMS = [
  'Confirm you meet every graduation requirement (credits & modules)',
  'Clear any outstanding fees or fee block — you can be withheld over debt',
  'Apply to graduate / register for the graduation ceremony',
  'Request your official academic transcript',
  'Know when and how you collect your qualification certificate',
  'Register with your professional body if your field needs it (SAICA, ECSA, HPCSA, SACE, etc.)',
  'Give notice on your res or digs and plan your move out',
  'Get 2–3 references from lecturers, supervisors or internship managers before you leave',
  'Set up a professional email address and tidy up your LinkedIn',
  'Save copies of your best projects / build a small portfolio',
  'Get a tax number from SARS if you don’t already have one',
  'Update your CV with your final qualification',
  'Save classmates’ and lecturers’ contacts — your network starts here',
]
const EXIT_LINKS: Record<number, { href: string; label: string }> = {
  0: { href: '/study?tab=graduation', label: 'Open Graduation Audit' },
  1: { href: '/budget?tab=fees', label: 'Open Fees tracker' },
  6: { href: '/housing', label: 'Open Housing OS' },
  11: { href: '/career', label: 'Open Career OS' },
}
function ExitTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...card, background: `${ACCENT}0d`, borderColor: `${ACCENT}40`, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        ✅ The admin that turns &quot;I finished my degree&quot; into &quot;I have my qualification in hand and I&apos;m ready for what&apos;s next.&quot; Tick these off in your final semester — saved on this device.
      </div>
      <LocalChecklist storeKey="varsityos-launch-exit" items={EXIT_ITEMS} links={EXIT_LINKS} />
    </div>
  )
}

/* ───────────── First Salary ───────────── */
// SA PAYE 2025/2026 annual brackets: [lowerBound, cumulativeBaseTax, marginalRate]
const BRACKETS: [number, number, number][] = [
  [0, 0, 0.18],
  [237100, 42678, 0.26],
  [370500, 77362, 0.31],
  [512800, 121475, 0.36],
  [673000, 179147, 0.39],
  [857900, 251258, 0.41],
  [1817000, 644489, 0.45],
]
const PRIMARY_REBATE = 17235      // under 65, 2025/26
const UIF_RATE = 0.01
const UIF_CEILING = 17712         // monthly earnings ceiling for UIF

function annualPAYE(annual: number): number {
  let b = BRACKETS[0]
  for (const br of BRACKETS) if (annual > br[0]) b = br
  const beforeRebate = b[1] + (annual - b[0]) * b[2]
  return Math.max(0, beforeRebate - PRIMARY_REBATE)
}

function SalaryTab() {
  const [gross, setGross] = useState('')
  const g = parseFloat(gross) || 0
  const annual = g * 12
  const payeMonthly = annualPAYE(annual) / 12
  const uif = Math.min(g, UIF_CEILING) * UIF_RATE
  const net = Math.max(0, g - payeMonthly - uif)
  const effRate = g > 0 ? ((g - net) / g) * 100 : 0

  const cards = [
    { icon: '🧾', t: 'Gross vs net', d: 'Your offer letter shows gross (before deductions). What actually reaches your account is net — after PAYE tax, UIF, and any medical aid or pension. Budget off net, never gross.' },
    { icon: '💰', t: 'Where your first salary should go', d: 'A simple start: roughly half to essentials (rent, transport, food, data), 20–30% to savings and any debt, the rest to living. Before anything fun, build a 3-month emergency fund — it is what stops one bad month becoming a crisis.' },
    { icon: '🎓', t: 'NSFAS & student loan repayment', d: 'Newer NSFAS funding converts to a bursary if you pass — but older NSFAS loans and bank/family study loans become repayable once you earn above a threshold. Find out exactly what you owe and the repayment terms; never ignore the statements.' },
    { icon: '🏥', t: 'Medical aid & retirement', d: 'Join at least a hospital plan early, and start a retirement annuity in your first working year if you can. Starting small in your 20s beats starting big in your 30s — time does the heavy lifting.' },
    { icon: '🫶', t: 'Black tax, sustainably', d: 'If family will rely on your salary, decide a set monthly amount after you have paid yourself and your essentials. Giving from a plan — not from guilt — is what lets you keep giving for years instead of burning out in one.' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...card, background: `${ACCENT}0d`, borderColor: `${ACCENT}40`, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        💼 Your first payslip will be smaller than the number in the offer. Here&apos;s why — and how to make a real salary work.
      </div>

      {/* Estimator */}
      <div style={{ ...card }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Take-home pay estimator</div>
        <label style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Expected monthly salary (gross, R)</label>
        <input type="number" inputMode="decimal" placeholder="e.g. 25000" value={gross} onChange={e => setGross(e.target.value)} style={input} />

        {g > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>ESTIMATED TAKE-HOME</div>
              <div style={{ fontSize: '2.3rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: ACCENT, lineHeight: 1.1 }}>{fmtR(net)}</div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>per month · {effRate.toFixed(1)}% goes to tax + UIF</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Gross salary', g, 'var(--text-secondary)'],
                ['– PAYE (income tax)', -payeMonthly, '#ef4444'],
                ['– UIF', -uif, '#ef4444'],
                ['= Net take-home', net, ACCENT],
              ].map(([label, val, color]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', paddingTop: (label as string).startsWith('=') ? 8 : 0, borderTop: (label as string).startsWith('=') ? '1px solid var(--border-subtle)' : 'none' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label as string}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: color as string }}>{fmtR(Math.abs(val as number))}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 10 }}>
              Estimate using 2025/26 SA tax tables (under-65 rebate). Excludes medical aid credits, pension/RA, and employer specifics. Your real payslip may differ.
            </div>
          </div>
        )}
      </div>

      {cards.map((c, i) => (
        <div key={i} style={{ ...card }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{c.icon} {c.t}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{c.d}</div>
        </div>
      ))}

      <Link href="/budget" style={{ padding: '11px 0', textAlign: 'center', background: `${ACCENT}1a`, border: `1px solid ${ACCENT}40`, borderRadius: 12, color: ACCENT, fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', textDecoration: 'none' }}>
        Plan it in Budget OS →
      </Link>
    </div>
  )
}

/* ───────────── 90-Day Plan ───────────── */
const PLAN_TIPS = [
  { icon: '👂', t: 'Listen more than you speak', d: 'Your first weeks are for learning how things actually work here, not proving yourself. Watch, ask, take notes.' },
  { icon: '🙋🏾', t: 'Ask questions early', d: 'New people are expected to ask. A question on day 3 is normal; the same mistake in month 3 because you were afraid to ask is not.' },
  { icon: '🤝', t: 'Find one work-friend and one mentor', d: 'Someone to ask the "silly" questions, and someone more senior to learn the ropes from. It makes everything easier.' },
  { icon: '📝', t: 'Keep a wins doc', d: 'Jot down what you ship and what you learn each week. It powers your reviews, your CV, and your confidence on the hard days.' },
  { icon: '✅', t: 'Reliable beats brilliant', d: 'Do what you said, when you said. Showing up steadily earns more trust early on than occasional flashes of genius.' },
  { icon: '🧠', t: 'Imposter syndrome is normal', d: 'Almost everyone feels like a fraud starting out. You were hired because they believe you can do it — competence comes with reps, not before them.' },
]
function PlanTab() {
  const [goals, setGoals] = useState<{ d30: string; d60: string; d90: string }>(() => {
    try { return JSON.parse(localStorage.getItem('varsityos-launch-90day') || '{}') } catch { return { d30: '', d60: '', d90: '' } }
  })
  const update = (k: 'd30' | 'd60' | 'd90', v: string) => {
    const next = { ...goals, [k]: v }
    setGoals(next)
    try { localStorage.setItem('varsityos-launch-90day', JSON.stringify(next)) } catch { /* ignore */ }
  }
  const prompts: { k: 'd30' | 'd60' | 'd90'; label: string; ph: string }[] = [
    { k: 'd30', label: 'First 30 days', ph: 'e.g. Learn the tools, meet the team, understand how I’m measured' },
    { k: 'd60', label: 'By 60 days', ph: 'e.g. Own one small project end-to-end without hand-holding' },
    { k: 'd90', label: 'By 90 days', ph: 'e.g. Be trusted with real responsibility; pass probation comfortably' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...card, background: `${ACCENT}0d`, borderColor: `${ACCENT}40`, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        🧭 The first 90 days in any job set the tone. You don&apos;t need to be the smartest in the room — you need to be reliable, curious and easy to work with.
      </div>

      <div style={{ ...card }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>My first 90 days</div>
        {prompts.map(p => (
          <div key={p.k} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: '0.7rem', color: ACCENT, fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 4 }}>{p.label}</label>
            <textarea value={goals[p.k] || ''} placeholder={p.ph} rows={2} onChange={e => update(p.k, e.target.value)}
              style={{ ...input, fontSize: '0.8rem', resize: 'none', fontFamily: 'var(--font-body)', lineHeight: 1.5 }} />
          </div>
        ))}
        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Saved on this device. Revisit it once you start.</div>
      </div>

      {PLAN_TIPS.map((t, i) => (
        <div key={i} style={{ ...card }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{t.icon} {t.t}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t.d}</div>
        </div>
      ))}
    </div>
  )
}

/* ───────────── Shell ───────────── */
const VALID: Tab[] = ['leap', 'exit', 'salary', 'plan']
export default function LaunchPadOS({ initialTab }: { initialTab?: string } = {}) {
  const [tab, setTab] = useState<Tab>(initialTab && VALID.includes(initialTab as Tab) ? initialTab as Tab : 'leap')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-surface)', border: `1px solid ${ACCENT}40`, borderRadius: 16, padding: '16px 18px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ACCENT},transparent)` }} />
        <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: ACCENT, letterSpacing: '0.09em', marginBottom: 4 }}>LAUNCH PAD</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Ready for life after varsity</div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 3 }}>The leap · exit admin · your first salary · the first 90 days</div>
      </div>

      <div style={{ display: 'flex', gap: 0, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ width: 58, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '12px 4px', background: 'none', border: 'none',
              borderLeft: tab === t.id ? `2px solid ${ACCENT}` : '2px solid transparent',
              color: tab === t.id ? ACCENT : 'var(--text-muted)', fontSize: '0.5rem', fontFamily: 'var(--font-mono)', cursor: 'pointer', width: '100%',
            }}>
              <span style={{ fontSize: '1.05rem' }}>{t.icon}</span>
              <span style={{ lineHeight: 1.2, textAlign: 'center' }}>{t.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0, padding: '14px 16px' }}>
          {tab === 'leap' && <LeapTab />}
          {tab === 'exit' && <ExitTab />}
          {tab === 'salary' && <SalaryTab />}
          {tab === 'plan' && <PlanTab />}
        </div>
      </div>
    </div>
  )
}
