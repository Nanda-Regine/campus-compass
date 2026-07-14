'use client'

// ============================================================
// FinancialLiteracy101 — SA-specific financial education tab.
// Frameworks: Rich Dad Poor Dad, 50/30/20, compound interest,
// JSE basics, debt traps, insurance. Gamified XP per section.
// Domain colour: --gold (Money OS)
// ============================================================

import { useState, useEffect } from 'react'

// ── Currency Converter (Frankfurter — no API key needed) ─────────────────────

const PAIRS = [
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro' },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound' },
  { code: 'ZMW', flag: '🇿🇲', name: 'Zambian Kwacha' },
  { code: 'BWP', flag: '🇧🇼', name: 'Botswana Pula' },
  { code: 'CNY', flag: '🇨🇳', name: 'Chinese Yuan' },
]

interface FxRates { date: string; rates: Record<string, number> }

function useFxRates() {
  const [rates, setRates] = useState<FxRates | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const cacheKey = 'varsityos_fx_zar'
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) ?? 'null') as (FxRates & { ts: number }) | null
      if (cached && Date.now() - cached.ts < 3_600_000) {
        setRates(cached)
        return
      }
    } catch { /* ignore */ }
    setLoading(true)
    const symbols = PAIRS.map(p => p.code).join(',')
    fetch(`https://api.frankfurter.dev/v2/latest?base=ZAR&symbols=${symbols}`)
      .then(r => r.json() as Promise<FxRates>)
      .then(data => {
        setRates(data)
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ ...data, ts: Date.now() })) } catch { /* ignore */ }
      })
      .catch(() => { /* silently degrade */ })
      .finally(() => setLoading(false))
  }, [])

  return { rates, loading }
}

function CurrencyConverter() {
  const [zarAmount, setZarAmount] = useState('100')
  const { rates, loading } = useFxRates()
  const amt = parseFloat(zarAmount) || 0

  return (
    <div style={{
      background: 'rgba(250,204,21,0.04)', border: '0.5px solid rgba(250,204,21,0.2)',
      borderRadius: 14, padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16 }}>💱</span>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
            ZAR Currency Converter
          </div>
          {rates && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 1 }}>
              Live rates · {rates.date}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700 }}>R</span>
        <input
          type="number"
          inputMode="decimal"
          aria-label="Amount in rands"
          value={zarAmount}
          onChange={e => setZarAmount(e.target.value)}
          min="0"
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            border: '0.5px solid rgba(250,204,21,0.25)',
            background: 'rgba(250,204,21,0.06)', color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700,
            outline: 'none',
          }}
        />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>ZAR</span>
      </div>

      {loading && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '8px 0' }}>
          Fetching live rates…
        </div>
      )}

      {rates && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PAIRS.map(({ code, flag, name }) => {
            const rate = rates.rates[code]
            if (!rate) return null
            const converted = (amt * rate).toFixed(code === 'ZMW' || code === 'CNY' ? 0 : 2)
            return (
              <div key={code} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 14 }}>{flag}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{name}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {code === 'USD' ? '$' : code === 'EUR' ? '€' : code === 'GBP' ? '£' : ''}{converted} <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>{code}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

type Chapter = 'foundations' | 'budgeting' | 'emergency' | 'banking' | 'investing' | 'debt_traps' | 'insurance'

const CHAPTERS: { id: Chapter; emoji: string; title: string; xp: number }[] = [
  { id: 'foundations', emoji: '🏛️', title: 'Foundations',      xp: 50 },
  { id: 'budgeting',   emoji: '📊', title: 'Budgeting Methods', xp: 40 },
  { id: 'emergency',   emoji: '🛡️', title: 'Emergency Fund',    xp: 30 },
  { id: 'banking',     emoji: '🏦', title: 'SA Banking',         xp: 35 },
  { id: 'investing',   emoji: '📈', title: 'Investing Basics',   xp: 60 },
  { id: 'debt_traps',  emoji: '⚠️', title: 'Debt Traps',         xp: 45 },
  { id: 'insurance',   emoji: '🔒', title: 'Insurance 101',      xp: 30 },
]

const XP_KEY = 'varsityos-lit101-xp'

function loadXP(): Set<Chapter> {
  if (typeof window === 'undefined') return new Set()
  try { return new Set(JSON.parse(localStorage.getItem(XP_KEY) ?? '[]') as Chapter[]) }
  catch { return new Set() }
}

function saveXP(chapters: Set<Chapter>) {
  if (typeof window !== 'undefined') localStorage.setItem(XP_KEY, JSON.stringify([...chapters]))
}

export default function FinancialLiteracy101() {
  const [active, setActive] = useState<Chapter>('foundations')
  const [read, setRead] = useState<Set<Chapter>>(loadXP)

  const chapter = CHAPTERS.find(c => c.id === active)!
  const totalXP = CHAPTERS.filter(c => read.has(c.id)).reduce((s, c) => s + c.xp, 0)
  const maxXP   = CHAPTERS.reduce((s, c) => s + c.xp, 0)

  function markRead(id: Chapter) {
    setRead(prev => {
      const next = new Set(prev)
      next.add(id)
      saveXP(next)
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Live currency converter */}
      <CurrencyConverter />

      {/* Header + XP bar */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-surface)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 16, padding: '14px 16px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--gold), transparent)' }} />
        <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--gold)', letterSpacing: '0.09em', marginBottom: 3 }}>FINANCIAL LITERACY 101</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Money School for South African Students</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 3 }}>7 chapters · Read each to earn XP · No textbooks required</div>
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>Progress</span>
            <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontWeight: 700 }}>{totalXP} / {maxXP} XP</span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)' }}>
            <div style={{ height: '100%', width: `${(totalXP / maxXP) * 100}%`, borderRadius: 3, background: 'var(--gold)', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </div>

      {/* Chapter list */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {CHAPTERS.map(c => (
          <button key={c.id} onClick={() => setActive(c.id)} style={{
            flexShrink: 0, padding: '6px 10px', borderRadius: 10, cursor: 'pointer', border: 'none',
            background: active === c.id ? 'var(--gold-dim)' : 'var(--bg-surface)',
            outline: active === c.id ? '1px solid var(--gold-border)' : '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ fontSize: '0.85rem' }}>{c.emoji}</span>
            <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: active === c.id ? 'var(--gold)' : 'var(--text-tertiary)', fontWeight: active === c.id ? 700 : 400, whiteSpace: 'nowrap' }}>{c.title}</span>
            {read.has(c.id) && <span style={{ fontSize: '0.63rem', color: 'var(--teal)' }}>✓</span>}
          </button>
        ))}
      </div>

      {/* Chapter content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {active === 'foundations' && (
          <>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Robert Kiyosaki&apos;s <em>Rich Dad Poor Dad</em> teaches one foundational idea: <strong style={{ color: 'var(--text-primary)' }}>assets put money in your pocket; liabilities take money out.</strong> School teaches you to work for money. Financial literacy teaches money to work for you.
            </div>
            {[
              { term: 'Income', def: 'Money that flows in: NSFAS, bursaries, part-time job earnings, family support.' },
              { term: 'Expenses', def: 'Money that flows out: rent, food, data, transport, textbooks, entertainment.' },
              { term: 'Assets', def: 'Things that generate income or increase in value: a skill, a side hustle, shares, a rental property one day.' },
              { term: 'Liabilities', def: 'Things that cost you money to own: store account debt, personal loans, credit card balance.' },
              { term: 'Net worth', def: 'Assets minus Liabilities. A student\'s goal: grow assets, shrink liabilities. Even at R0 net worth, you\'re ahead if you know what it means.' },
              { term: 'Cash flow', def: 'Income minus expenses. Positive cash flow = money left over. Negative = spending more than you earn (danger zone).' },
            ].map(f => (
              <div key={f.term} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold)', marginBottom: 3 }}>{f.term}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{f.def}</div>
              </div>
            ))}
            <div style={{ padding: '10px 14px', background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.12)', borderRadius: 9, fontSize: '0.67rem', color: 'var(--text-tertiary)', fontStyle: 'italic', lineHeight: 1.6 }}>
              &quot;The poor and middle class work for money. The rich have money work for them.&quot; — Robert Kiyosaki, Rich Dad Poor Dad
            </div>
          </>
        )}

        {active === 'budgeting' && (
          <>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              There is no single perfect budget system — there is the one you will actually stick to. Here are 3 methods that work for students.
            </div>
            {[
              {
                name: '50/30/20 Rule (Recommended for NSFAS students)',
                color: 'var(--teal)',
                detail: 'Split your income into: 50% Needs (rent, food, transport, data), 30% Wants (entertainment, eating out, clothing), 20% Savings & debt. On R4,500/month NSFAS: R2,250 needs · R1,350 wants · R900 savings. Adjust the splits if rent is unusually high.',
              },
              {
                name: 'Envelope Method (Best for cash-heavy students)',
                color: 'var(--gold)',
                detail: 'On disbursement day, withdraw cash and put physical amounts in labelled envelopes (Food, Transport, Data, Fun). When the envelope is empty, spending in that category stops. No app required. Brilliant for students who overspend on card.',
              },
              {
                name: 'Zero-Based Budgeting (Best for disciplined planners)',
                color: 'var(--nova)',
                detail: 'Every rand has a job. Income minus all assigned categories = R0. Not zero balance — zero unassigned rands. Forces you to decide where every rand goes before you spend it. Highest control, highest discipline required.',
              },
            ].map(m => (
              <div key={m.name} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: `3px solid ${m.color}`, borderRadius: 11, padding: '12px 14px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: m.color, marginBottom: 5 }}>{m.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{m.detail}</div>
              </div>
            ))}
            <div style={{ padding: '10px 14px', background: 'rgba(78,207,158,0.06)', border: '1px solid rgba(78,207,158,0.12)', borderRadius: 9, fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--teal)' }}>The Compound Effect principle</strong> (Darren Hardy): Small consistent savings compound dramatically. R50/day saved = R18,250/year = R91,250 over 5 years at 8% interest. The habit matters more than the amount.
            </div>
          </>
        )}

        {active === 'emergency' && (
          <>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              An emergency fund is 3–6 months of essential expenses saved in a <strong style={{ color: 'var(--text-primary)' }}>separate account you do not touch</strong> unless it is a genuine emergency. For students, aim for 1 month first.
            </div>
            {[
              { q: 'Why do students need one?', a: 'NSFAS payments are frequently late. Family emergencies happen. A laptop dies before finals. Without an emergency fund, you borrow at high interest rates or miss exam opportunities. The fund is your buffer against life.' },
              { q: 'How much should I save?', a: 'Student emergency fund formula: Monthly rent + monthly food + monthly transport + monthly data = your monthly essentials. Save 1× that amount first (1-month fund). Then work to 3 months.' },
              { q: 'Where to keep it?', a: 'Not your transactional account — you\'ll spend it. Use a Capitec savings pocket (separate from your main account), TymeBank GoalSave, or African Bank notice account. All pay 8–9% interest and are accessible within 24–48 hours in an emergency.' },
              { q: 'What counts as an emergency?', a: 'Medical costs not covered by campus clinic. Essential device failure (laptop for submissions). Sudden travel for family emergency. NOT: sale at Woolworths, a concert, wanting a takeaway.' },
            ].map(r => (
              <div key={r.q} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid var(--teal)', borderRadius: 11, padding: '11px 14px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{r.q}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.a}</div>
              </div>
            ))}
            <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 9, fontSize: '0.68rem', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
              <strong style={{ color: '#a5b4fc' }}>Your savings goal:</strong> Add a savings goal in the Wallet tab → &quot;Emergency Fund&quot; with a target of 1× your monthly expenses. Contribute R100+ on every NSFAS disbursement day. You&apos;ll hit it faster than you expect.
            </div>
          </>
        )}

        {active === 'banking' && (
          <>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              South African students pay too much in banking fees. Here is what you actually need and what each bank charges.
            </div>
            {[
              { bank: 'Capitec', type: 'Global One (recommended)', fees: 'R7/month', features: 'Free transfers, 4 savings pockets at up to 8.5%, no minimum balance, free debit card.', verdict: '✅ Best overall for students', color: 'var(--teal)' },
              { bank: 'TymeBank', type: 'Go Account', fees: 'R0/month', features: 'Free at Pick n Pay and Boxer ATMs, GoalSave at up to 9% interest, all digital.', verdict: '✅ Best if near Pick n Pay', color: 'var(--teal)' },
              { bank: 'African Bank', type: 'MyWorld Account', fees: 'R4.95/month', features: 'Savings pockets at 9.5% interest, good for saving not spending.', verdict: '✅ Best for savings only', color: 'var(--teal)' },
              { bank: 'FNB', type: 'Student Cheque / Easy Account', fees: 'R0–R69/month', features: 'Good for eBucks rewards but fees eat into budget unless you manage the account well.', verdict: '⚠️ Good if already here', color: 'var(--gold)' },
              { bank: 'Standard Bank / Nedbank / ABSA', type: 'Student accounts', fees: 'R0–R55/month', features: 'Traditional banks with physical branches — useful if you need cash deposits or branch services.', verdict: '⚠️ Check fees carefully', color: 'var(--gold)' },
            ].map(b => (
              <div key={b.bank} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: `3px solid ${b.color}`, borderRadius: 11, padding: '11px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{b.bank} — {b.type}</div>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: b.color, flexShrink: 0, marginLeft: 8 }}>{b.fees}</div>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 4 }}>{b.features}</div>
                <div style={{ fontSize: '0.63rem', fontFamily: 'var(--font-mono)', color: b.color }}>{b.verdict}</div>
              </div>
            ))}
            <div style={{ padding: '10px 14px', background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.1)', borderRadius: 9, fontSize: '0.68rem', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--gold)' }}>Rule:</strong> Never pay monthly fees on your main account if you earn under R5,000/month. Switch to Capitec or TymeBank — the fee savings over 3 years of study = R2,500+.
            </div>
          </>
        )}

        {active === 'investing' && (
          <>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              The best investment you can make as a student is completing your degree. But once you have an emergency fund and manageable debt, even R100/month invested compounds significantly over decades.
            </div>
            {[
              { term: 'Compound interest', def: 'Earning interest on your interest. R500/month invested at 10% for 40 years = R2.8 million. Starting at 22 vs 32 makes a R1.2 million difference. Time is your biggest advantage.' },
              { term: 'ETF (Exchange-Traded Fund)', def: 'A basket of shares that tracks an index (e.g., JSE Top 40). Instead of picking one company, you own a tiny slice of 40. Lower risk, lower cost, better for beginners. Available from Satrix, Sygnia, Absa — from R100/month.' },
              { term: 'JSE (Johannesburg Stock Exchange)', def: 'South Africa\'s stock exchange, founded 1887. Top companies: Naspers, MTN, Standard Bank, AngloAmerican. SA students can access it via EasyEquities (from R5) or Satrix.' },
              { term: 'Tax-Free Savings Account (TFSA)', def: 'Government-created account where growth and withdrawals are never taxed. Limit: R36,000/year and R500,000 lifetime. Best investment vehicle for South African students — every rand of growth is yours.' },
              { term: 'Unit Trusts', def: 'Professionally managed pools of investor money. Higher fees than ETFs but hands-off. Good for lump sums. Available from Old Mutual, Allan Gray, Coronation.' },
              { term: 'EasyEquities', def: 'SA\'s most accessible investment platform. Start with R5. Buy fractional shares in JSE companies, US companies (via USD account), and ETFs. Perfect for student investors.' },
            ].map(f => (
              <div key={f.term} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold)', marginBottom: 3 }}>{f.term}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{f.def}</div>
              </div>
            ))}
            <div style={{ padding: '10px 14px', background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.12)', borderRadius: 9, fontSize: '0.68rem', color: 'rgb(255,107,107)', lineHeight: 1.6 }}>
              ⚠️ Never invest money you cannot afford to lose or money you need in the next 12 months. Emergency fund first, debt second, investing third.
            </div>
          </>
        )}

        {active === 'debt_traps' && (
          <>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              South Africa has some of the world&apos;s most predatory short-term lending. Here are the traps targeting students — and how to identify them before you sign.
            </div>
            {[
              { trap: 'Mashonisa (informal loan sharks)', risk: 'EXTREME', detail: 'Illegal lenders charging 30–50% per month (not per year). Common near campuses. They may take your ID or bank card as "collateral". If you default, consequences can be violent. Never use one. If you\'re in a debt spiral from a mashonisa, contact the NCR (0860 627 627) immediately.', color: 'var(--danger)' },
              { trap: 'Payday / micro-lenders (e.g., Wonga, Letsatsi, Bayport)', risk: 'HIGH', detail: 'Technically legal but interest rates can reach 60% per year (APR). A R500 loan can cost R800 to repay one month later. Used once and repaid immediately: manageable. Used repeatedly: debt spiral. Check the APR before signing — not just the "fee".', color: '#e8834a' },
              { trap: 'Retailer "buy now pay later"', risk: 'MEDIUM', detail: 'Accounts at Edgars, Truworths, Ackermans, Jet offer easy approval. Interest rates of 24–28% per year apply if you carry a balance. The trap: minimum payment feels small, but the outstanding balance grows. Always pay the full statement amount.', color: 'var(--gold)' },
              { trap: 'Student loan ads on campus', risk: 'MEDIUM', detail: 'Some campus-adjacent lenders target NSFAS students specifically, knowing the disbursement schedule. Ask for the APR in writing before agreeing. Compare to FUNDI or bank student loans (typically 10–15% vs 30–60% from micro-lenders).', color: 'var(--gold)' },
              { trap: '"Investment" schemes targeting students', risk: 'HIGH', detail: 'Ponzi/pyramid schemes regularly recruit at universities. Red flags: guaranteed high returns, "limited time", requires you to recruit others, no FSCA registration. If someone promises 20%+ monthly returns, it\'s a scam. Check FSCA.co.za for registered providers.', color: '#e8834a' },
            ].map(t => (
              <div key={t.trap} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: `3px solid ${t.color}`, borderRadius: 11, padding: '11px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.trap}</div>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: t.color, fontWeight: 700 }}>RISK: {t.risk}</div>
                </div>
                <div style={{ fontSize: '0.69rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t.detail}</div>
              </div>
            ))}
          </>
        )}

        {active === 'insurance' && (
          <>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Most students are over-insured on gadgets and under-insured on health and income. Here is what you actually need.
            </div>
            {[
              { type: 'Student health cover (Do need)', detail: 'Your institution may have a clinic (free for registered students). If not: Momentum uStudy, Discovery Student, or Medihelp Student cover hospital and emergencies from ±R350/month. Medical aid is only worth it if you have a chronic condition or frequently need specialists. For most students: campus clinic + basic hospital plan is enough.', need: true },
              { type: 'Device / laptop insurance (Worth considering)', detail: 'A laptop theft during finals = academic disaster. Some homeowners insurance includes "away from home" cover for devices. Otherwise: Hippo.co.za or Outsurance offers portable device cover from ±R120/month for a R15,000 laptop. Check if your bank account includes any device cover before buying separately.', need: true },
              { type: 'Funeral cover (Only if you are the breadwinner)', detail: 'Premiums are very low (R50–R150/month) and South African culture places high importance on dignified funerals. However, if you are a student with no dependants and your family has their own cover, skip this until you are earning.', need: false },
              { type: 'Life insurance (Not yet)', detail: 'Life insurance protects your dependants if you die. As a student with no dependants: no need. Add it when you have a spouse, children, or are co-signed on a home loan. Buying life insurance as a student is just a premium payment with no current benefit to you.', need: false },
              { type: 'Credit life insurance (Watch out)', detail: 'Often added automatically to store accounts and personal loans. Covers your debt if you die or are retrenched. The cost is often inflated — shop around or opt out where possible. Read every store account or loan agreement for this add-on.', need: false },
            ].map(i => (
              <div key={i.type} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: `3px solid ${i.need ? 'var(--teal)' : 'var(--text-muted)'}`, borderRadius: 11, padding: '11px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{i.type}</div>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0, marginLeft: 8, color: i.need ? 'var(--teal)' : 'var(--text-muted)' }}>{i.need ? '✓ CONSIDER' : '✕ SKIP FOR NOW'}</div>
                </div>
                <div style={{ fontSize: '0.69rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{i.detail}</div>
              </div>
            ))}
          </>
        )}

        {/* Mark as read + XP reward */}
        {!read.has(active) && (
          <button
            onClick={() => markRead(active)}
            style={{
              marginTop: 6, width: '100%', padding: '12px',
              background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
              borderRadius: 12, cursor: 'pointer',
              fontSize: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gold)',
            }}>
            Mark as read — earn +{chapter.xp} XP ✓
          </button>
        )}
        {read.has(active) && (
          <div style={{ textAlign: 'center', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--teal)', padding: '8px' }}>
            ✓ Chapter completed · +{chapter.xp} XP earned
          </div>
        )}
      </div>
    </div>
  )
}
