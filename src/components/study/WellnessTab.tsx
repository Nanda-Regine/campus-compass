'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { dispatchXP } from '@/lib/xp-engine'
import { signals } from '@/store/signals'
import {
  loadWellnessCheckins,
  saveWellnessCheckin,
  type CheckIn as DBCheckIn,
} from '@/lib/db/wellness'

/* ── Types ─────────────────────────────────────────────────── */
// Local view type — subset of the DB record we actually render
interface CheckIn {
  date: string        // YYYY-MM-DD
  sleep: number       // 1-5
  stress: number      // 1-5 (5 = very stressed)
  social: number      // 1-5
  energy: number      // 1-5
  motivation: number  // 1-5
  score: number       // 0-100 burnout score
}

/* ── Constants ─────────────────────────────────────────────── */
const MAX_HISTORY = 30

type DimKey = 'sleep' | 'stress' | 'social' | 'energy' | 'motivation'

const DIMENSIONS: { key: DimKey; label: string; icon: string; lo: string; hi: string; invert?: boolean }[] = [
  { key: 'sleep',      label: 'Sleep quality',      icon: '🌙', lo: 'Restless',    hi: 'Rested'      },
  { key: 'stress',     label: 'Stress level',        icon: '🧠', lo: 'Relaxed',    hi: 'Overwhelmed', invert: true },
  { key: 'social',     label: 'Social connection',   icon: '🤝', lo: 'Isolated',   hi: 'Connected'   },
  { key: 'energy',     label: 'Physical energy',     icon: '⚡', lo: 'Drained',    hi: 'Energised'   },
  { key: 'motivation', label: 'Study motivation',    icon: '🎯', lo: 'Checked out', hi: 'Fired up'   },
]

const RISK_LEVELS = [
  { max: 25,  label: 'Thriving',   color: '#4ecf9e', bg: 'rgba(78,207,158,0.08)',  border: 'rgba(78,207,158,0.2)',  tip: "You're in great shape — keep your routines going." },
  { max: 50,  label: 'Balanced',   color: '#7090d0', bg: 'rgba(112,144,208,0.08)', border: 'rgba(112,144,208,0.2)', tip: 'Doing okay. Watch your sleep and take breaks between study sessions.' },
  { max: 70,  label: 'Strained',   color: '#c9a84c', bg: 'rgba(201,168,76,0.08)',  border: 'rgba(201,168,76,0.2)',  tip: "Signs of strain. Don't skip meals or sleep. Talk to Nova if you need to offload." },
  { max: 85,  label: 'At risk',    color: '#e8834a', bg: 'rgba(232,131,74,0.08)',  border: 'rgba(232,131,74,0.2)',  tip: 'High burnout risk. Book a counselling appointment. This is not weakness.' },
  { max: 100, label: 'Burnt out',  color: '#ff6b6b', bg: 'rgba(255,107,107,0.08)', border: 'rgba(255,107,107,0.2)', tip: 'Burnout detected. Please talk to someone today — your campus counsellor, a friend, or Nova. You matter more than your marks.' },
]

/* ── Helpers ───────────────────────────────────────────────── */
function calcScore(dims: Record<DimKey, number>): number {
  // Burnout score: 0 = no burnout, 100 = fully burnt out
  // Positive dims (sleep, social, energy, motivation): lower value → higher burnout
  // Stress: higher value → higher burnout
  const positive = (['sleep', 'social', 'energy', 'motivation'] as const)
    .map(k => dims[k])
  const avgPositive = positive.reduce((a, b) => a + b, 0) / positive.length
  // Positive dims: 1=worst(100 burnout), 5=best(0 burnout) → linear
  const posScore = ((5 - avgPositive) / 4) * 100
  // Stress: 1=relaxed(0 burnout), 5=overwhelmed(100 burnout)
  const stressScore = ((dims.stress - 1) / 4) * 100
  // Weighted: 60% positive dims, 40% stress
  return Math.round(posScore * 0.6 + stressScore * 0.4)
}

function getRisk(score: number) {
  return RISK_LEVELS.find(r => score <= r.max) ?? RISK_LEVELS[RISK_LEVELS.length - 1]
}

/** Map a DB row to the local CheckIn shape */
function fromDB(row: DBCheckIn): CheckIn {
  return {
    date: row.date,
    sleep: row.sleep,
    stress: row.stress,
    social: row.social,
    energy: row.energy,
    motivation: row.motivation,
    score: row.score,
  }
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

/* ── SVG Ring ──────────────────────────────────────────────── */
function BurnoutRing({ score, color }: { score: number; color: string }) {
  const r = 44; const size = 104; const sw = 9
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', marginTop: 2 }}>burnout</div>
      </div>
    </div>
  )
}

/* ── Sparkline ─────────────────────────────────────────────── */
function Sparkline({ checkins }: { checkins: CheckIn[] }) {
  const last7 = checkins.slice(-7)
  if (last7.length < 2) return null
  const W = 200; const H = 40; const pad = 6
  const scores = last7.map(c => c.score)
  const minS = Math.min(...scores); const maxS = Math.max(...scores)
  const range = maxS - minS || 1
  const pts = scores.map((s, i) => {
    const x = pad + (i / (last7.length - 1)) * (W - pad * 2)
    const y = H - pad - ((s - minS) / range) * (H - pad * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', marginBottom: 6 }}>7-day trend</div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <polyline points={pts} fill="none" stroke="rgba(112,144,208,0.5)" strokeWidth={1.5} strokeLinejoin="round" />
        {scores.map((s, i) => {
          const x = pad + (i / (last7.length - 1)) * (W - pad * 2)
          const y = H - pad - ((s - minS) / range) * (H - pad * 2)
          const c = getRisk(s).color
          return <circle key={i} cx={x} cy={y} r={3} fill={c} />
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        {last7.map((c, i) => (
          <div key={i} style={{ fontSize: 8, color: '#fff', textAlign: 'center' }}>
            {new Date(c.date + 'T00:00:00').toLocaleDateString('en-ZA', { weekday: 'short' }).slice(0, 1)}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Slider ────────────────────────────────────────────────── */
function DimSlider({ dim, value, onChange }: {
  dim: typeof DIMENSIONS[number]; value: number; onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{dim.icon}</span>
          <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{dim.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              onClick={() => onChange(n)}
              style={{
                width: 28, height: 28, borderRadius: 7,
                background: value === n
                  ? (dim.invert
                      ? (n <= 2 ? '#4ecf9e' : n === 3 ? '#c9a84c' : '#ff6b6b')
                      : (n >= 4 ? '#4ecf9e' : n === 3 ? '#c9a84c' : '#ff6b6b'))
                  : 'rgba(255,255,255,0.08)',
                border: value === n ? 'none' : '1px solid rgba(255,255,255,0.07)',
                color: value === n ? '#fff' : 'rgba(255,255,255,0.55)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >{n}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 24 }}>
        <span style={{ fontSize: 9, color: '#fff' }}>{dim.lo}</span>
        <span style={{ fontSize: 9, color: '#fff' }}>{dim.hi}</span>
      </div>
    </div>
  )
}

/* ── Calendar Heatmap ──────────────────────────────────────── */
function CalendarHeatmap({ checkins }: { checkins: CheckIn[] }) {
  const today     = new Date()
  const todayStr  = today.toISOString().split('T')[0]
  // Build last 35 days (5 rows × 7 cols = Mon→Sun)
  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (34 - i))
    return d.toISOString().split('T')[0]
  })
  const checkMap = new Map(checkins.map(c => [c.date, c]))
  const weeks = Array.from({ length: 5 }, (_, w) => days.slice(w * 7, (w + 1) * 7))

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
        35-day burnout heatmap
      </div>
      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#fff', textAlign: 'center' }}>{d}</div>
        ))}
      </div>
      {/* Week rows */}
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
          {week.map((dateStr, di) => {
            const ci      = checkMap.get(dateStr)
            const isToday = dateStr === todayStr
            const color   = ci ? getRisk(ci.score).color : 'rgba(255,255,255,0.07)'
            return (
              <div
                key={di}
                title={ci ? `${dateStr}: ${ci.score} — ${getRisk(ci.score).label}` : dateStr}
                style={{
                  aspectRatio: '1',
                  borderRadius: 3,
                  background: ci ? `${color}35` : 'rgba(255,255,255,0.07)',
                  border: isToday
                    ? `1px solid ${ci ? color : 'rgba(255,255,255,0.5)'}`
                    : `1px solid ${ci ? color + '20' : 'transparent'}`,
                  boxShadow: isToday ? `0 0 5px ${ci ? color + '40' : 'rgba(255,255,255,0.1)'}` : 'none',
                  cursor: ci ? 'default' : 'default',
                  transition: 'all 0.15s',
                }}
              />
            )
          })}
        </div>
      ))}
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: '#fff' }}>Thriving</span>
        {['#4ecf9e','#7090d0','#c9a84c','#e8834a','#ff6b6b'].map(c => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: 2, background: `${c}45`, border: `1px solid ${c}35` }} />
        ))}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: '#fff' }}>Burnt out</span>
      </div>
    </div>
  )
}

/* ── Sleep Science ─────────────────────────────────────────── */
interface SleepLog { date: string; hours: number; quality: number; bedtime: string; wakeup: string }

const SLEEP_KEY = 'varsityos-sleep'
function loadSleep(): SleepLog[] { if (typeof window === 'undefined') return []; try { return JSON.parse(localStorage.getItem(SLEEP_KEY) || '[]') } catch { return [] } }
function saveSleep(l: SleepLog[]) { try { localStorage.setItem(SLEEP_KEY, JSON.stringify(l)) } catch { /* quota */ } }

const CHRONOTYPE_Qs = [
  { q: 'When left to your own schedule, what time do you naturally wake up?', opts: [{ l: 'Before 6:30', v: 0 }, { l: '6:30–8:00', v: 1 }, { l: '8:00–10:00', v: 2 }, { l: 'After 10:00', v: 3 }] },
  { q: 'When do you feel most mentally alert during the day?', opts: [{ l: '6–10am', v: 0 }, { l: '10am–1pm', v: 1 }, { l: '1–5pm', v: 2 }, { l: '5pm–late', v: 3 }] },
  { q: 'After a full week of freedom, when do you feel sleepy at night?', opts: [{ l: 'Before 10pm', v: 0 }, { l: '10pm–midnight', v: 1 }, { l: 'Midnight–2am', v: 2 }, { l: 'After 2am', v: 3 }] },
  { q: 'If you had to take a 2-hour exam, when would you perform best?', opts: [{ l: '7–9am', v: 0 }, { l: '10am–12pm', v: 1 }, { l: '1–4pm', v: 2 }, { l: '4–8pm', v: 3 }] },
]

function SleepScience() {
  const [logs, setLogs] = useState<SleepLog[]>(loadSleep)
  const [addMode, setAddMode] = useState(false)
  const [form, setForm] = useState({ hours: '7', quality: '3', bedtime: '22:30', wakeup: '06:00' })
  const [chronoAnswers, setChronoAnswers] = useState<(number | null)[]>([null, null, null, null])
  const [chronoResult, setChronoResult] = useState<string | null>(null)
  const [sleepView, setSleepView] = useState<'log' | 'science' | 'quiz'>('log')

  const addLog = () => {
    const today = new Date().toISOString().split('T')[0]
    const l: SleepLog = { date: today, hours: parseFloat(form.hours) || 7, quality: parseInt(form.quality) || 3, bedtime: form.bedtime, wakeup: form.wakeup }
    const updated = [l, ...logs.filter(x => x.date !== today)].slice(0, 30)
    setLogs(updated); saveSleep(updated); setAddMode(false)
  }

  const avgHours = logs.length ? Math.round((logs.slice(0, 7).reduce((a, b) => a + b.hours, 0) / Math.min(7, logs.length)) * 10) / 10 : null
  const sleepDebt = avgHours !== null ? Math.round((8 - avgHours) * Math.min(7, logs.length) * 10) / 10 : null

  const runChronoQuiz = () => {
    const score = chronoAnswers.reduce((a: number, b) => a + (b ?? 0), 0)
    if (score <= 3) setChronoResult('🌅 Early Bird (Lion)\nYou peak mentally in the morning. Schedule hard study, exams, and important tasks before noon. Your biggest risk is going to bed too late and disrupting your natural rhythm.')
    else if (score <= 7) setChronoResult('🐻 Bear (Intermediate)\nYou follow the solar cycle most naturally. Your peak focus is mid-morning to early afternoon. Most university schedules suit you. Protect your 10am–1pm window for hard work.')
    else if (score <= 10) setChronoResult('🐺 Night Wolf\nYou are most creative and focused in the evening and night. If possible, schedule study from late afternoon to midnight. Be careful: consistent sleep deprivation from early morning classes creates serious long-term health and cognitive risk.')
    else setChronoResult('🦉 Deep Night Owl\nExtreme evening chronotype. You may struggle with standard university schedules. Strategies: block-schedule all early morning commitments; use bright light therapy in the morning to shift your clock 30–60 minutes earlier over 2–3 weeks.')
  }

  const SLEEP_TIPS = [
    { title: 'The 90-minute rule', body: 'Sleep cycles are ~90 minutes. Sleep for 6h, 7.5h, or 9h to wake mid-cycle vs 7h or 8.5h. You\'ll feel more rested despite less sleep.' },
    { title: 'Phone and blue light', body: 'Blue light from your phone tricks your brain into thinking it\'s daytime, suppressing melatonin by up to 2 hours. Use Night Mode / Eye Comfort from 9pm, or stop scrolling 1 hour before bed.' },
    { title: 'Consistent wake time', body: 'The single most powerful sleep intervention: same wake time 7 days/week. Not bedtime — WAKE time. Within 3 weeks your brain will build a strong sleep drive at the right hour.' },
    { title: 'Sleep and memory', body: 'During deep NREM sleep, your brain replays and consolidates everything you studied that day. Pulling an all-nighter before an exam destroys consolidation. 6.5h of sleep outperforms 0h for exam performance every time.' },
    { title: 'Load shedding sleep tip', body: 'Load shedding interrupts your sleep environment. Use battery-powered fairy lights (warm light) instead of phone light. A sleeping mask is a R30 investment that consistently improves sleep quality during outages.' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {([['log', '📊 Sleep Log'], ['science', '🧬 Science'], ['quiz', '🦁 Chronotype']] as [typeof sleepView, string][]).map(([v, l]) => (
          <button key={v} onClick={() => setSleepView(v)} style={{ flex: 1, padding: '8px 4px', background: 'none', border: 'none', borderBottom: sleepView === v ? '2px solid #7090d0' : '2px solid transparent', color: sleepView === v ? '#7090d0' : 'rgba(255,255,255,0.55)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: sleepView === v ? 700 : 400, cursor: 'pointer', marginBottom: -1 }}>{l}</button>
        ))}
      </div>

      {sleepView === 'log' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {avgHours !== null && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { l: '7-day avg', v: `${avgHours}h`, c: avgHours >= 7 ? '#4ecf9e' : avgHours >= 6 ? '#c9a84c' : '#ff6b6b' },
                { l: 'Sleep debt', v: sleepDebt !== null && sleepDebt > 0 ? `${sleepDebt}h` : 'None', c: sleepDebt !== null && sleepDebt > 5 ? '#ff6b6b' : '#4ecf9e' },
                { l: 'Days logged', v: String(logs.length), c: '#7090d0' },
              ].map(s => (
                <div key={s.l} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: s.c, fontFamily: 'var(--font-mono)' }}>{s.v}</div>
                  <div style={{ fontSize: '0.6rem', color: '#fff', marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}
          {addMode ? (
            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[{ l: 'Hours slept', k: 'hours', t: 'number', p: '7.5' }, { l: 'Quality (1–5)', k: 'quality', t: 'number', p: '3' }, { l: 'Bedtime', k: 'bedtime', t: 'time', p: '' }, { l: 'Wake up', k: 'wakeup', t: 'time', p: '' }].map(f => (
                  <div key={f.k}>
                    <div style={{ fontSize: '0.65rem', color: '#fff', marginBottom: 3 }}>{f.l}</div>
                    <input type={f.t} placeholder={f.p} value={form[f.k as keyof typeof form]} onChange={e => setForm(v => ({ ...v, [f.k]: e.target.value }))} style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addLog} style={{ flex: 1, padding: '9px 0', background: 'rgba(112,144,208,0.15)', border: '1px solid rgba(112,144,208,0.3)', borderRadius: 8, color: '#7090d0', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>Log sleep</button>
                <button onClick={() => setAddMode(false)} style={{ padding: '9px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.72rem', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddMode(true)} style={{ padding: '11px 0', background: 'rgba(112,144,208,0.07)', border: '1px solid rgba(112,144,208,0.2)', borderRadius: 10, color: '#7090d0', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>+ Log tonight&apos;s sleep</button>
          )}
          {logs.slice(0, 7).map(l => (
            <div key={l.date} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 500 }}>{l.date}</div>
                <div style={{ fontSize: '0.65rem', color: '#fff', marginTop: 1 }}>{l.bedtime} → {l.wakeup}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: l.hours >= 7 ? '#4ecf9e' : l.hours >= 6 ? '#c9a84c' : '#ff6b6b' }}>{l.hours}h</div>
                <div style={{ fontSize: '0.62rem', color: '#fff' }}>{'★'.repeat(l.quality)}{'☆'.repeat(5 - l.quality)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sleepView === 'science' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SLEEP_TIPS.map((t, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 11, padding: '13px 14px', borderLeft: '3px solid #7090d0' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', marginBottom: 5 }}>{t.title}</div>
              <div style={{ fontSize: '0.73rem', color: '#fff', lineHeight: 1.65 }}>{t.body}</div>
            </div>
          ))}
        </div>
      )}

      {sleepView === 'quiz' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!chronoResult ? (
            <>
              {CHRONOTYPE_Qs.map((q, qi) => (
                <div key={qi} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 11, padding: '13px 14px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff', marginBottom: 10 }}>{qi + 1}. {q.q}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {q.opts.map((o, oi) => (
                      <button key={oi} onClick={() => { const a = [...chronoAnswers]; a[qi] = o.v; setChronoAnswers(a) }} style={{ padding: '8px 12px', textAlign: 'left', background: chronoAnswers[qi] === o.v ? 'rgba(112,144,208,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${chronoAnswers[qi] === o.v ? 'rgba(112,144,208,0.35)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 8, color: chronoAnswers[qi] === o.v ? '#7090d0' : 'rgba(255,255,255,0.55)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: chronoAnswers[qi] === o.v ? 600 : 400 }}>{o.l}</button>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={runChronoQuiz} disabled={chronoAnswers.includes(null)} style={{ padding: '11px 0', background: 'rgba(112,144,208,0.1)', border: '1px solid rgba(112,144,208,0.25)', borderRadius: 10, color: '#7090d0', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer', opacity: chronoAnswers.includes(null) ? 0.5 : 1 }}>Find my chronotype →</button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: 'rgba(112,144,208,0.08)', border: '1px solid rgba(112,144,208,0.25)', borderRadius: 14, padding: '18px', whiteSpace: 'pre-line', fontSize: '0.8rem', color: '#fff', lineHeight: 1.7 }}>{chronoResult}</div>
              <button onClick={() => { setChronoResult(null); setChronoAnswers([null, null, null, null]) }} style={{ padding: '9px 0', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>Retake quiz</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Main Component ────────────────────────────────────────── */
export default function WellnessTab() {
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [dims, setDims] = useState<Record<DimKey, number>>({ sleep: 3, stress: 3, social: 3, energy: 3, motivation: 3 })
  const [saved, setSaved] = useState(false)
  const [todayCheckin, setTodayCheckin] = useState<CheckIn | null>(null)
  const [view, setView] = useState<'checkin' | 'history' | 'sleep'>('checkin')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoading(true)
      const { data, error } = await loadWellnessCheckins()
      if (cancelled) return
      if (error) {
        console.error('[WellnessTab] Failed to load check-ins:', error)
      }
      // Supabase returns newest-first; reverse to oldest-first so all
      // existing slice(-7) and slice().reverse() logic stays correct.
      const list: CheckIn[] = data.map(fromDB).reverse()
      // Trim to MAX_HISTORY just as the old localStorage path did
      const trimmed = list.slice(-MAX_HISTORY)
      setCheckins(trimmed)
      const today = trimmed.find(c => c.date === todayStr())
      if (today) {
        setTodayCheckin(today)
        setDims({ sleep: today.sleep, stress: today.stress, social: today.social, energy: today.energy, motivation: today.motivation })
        setSaved(true)
      }
      setLoading(false)
    }
    init()
    return () => { cancelled = true }
  }, [])

  const liveScore = calcScore(dims)
  const risk = getRisk(todayCheckin ? todayCheckin.score : liveScore)

  const handleSave = async () => {
    const score = calcScore(dims)
    const entry: CheckIn = { date: todayStr(), score, ...dims }
    const { error } = await saveWellnessCheckin(entry)
    if (error) {
      console.error('[WellnessTab] Failed to save check-in:', error)
      return
    }
    // Update local state: replace any existing entry for today then keep oldest-first order
    const updated = checkins.filter(c => c.date !== todayStr())
    updated.push(entry)
    setCheckins(updated)
    setTodayCheckin(entry)
    setSaved(true)
    // Cache latest burnout score for the synchronous VarsityScore wellness pillar,
    // which can't read the async Supabase check-ins.
    try { localStorage.setItem('varsityos_last_burnout', String(score)) } catch { /* quota */ }
    dispatchXP('wellness_checkin')

    // Emit burnout signal so rules engine and dashboard react
    const prev = checkins[checkins.length - 2]
    const trend = prev
      ? score < prev.score ? 'worsening' : score > prev.score ? 'improving' : 'stable'
      : 'stable'
    signals.emit({ type: 'burnout_computed', payload: { score, trend } })
  }

  const handleEdit = () => {
    setSaved(false)
    setTodayCheckin(null)
  }

  const novaPrompt = encodeURIComponent(
    `My burnout score today is ${todayCheckin?.score ?? liveScore}/100 — ${risk.label}. ` +
    `Sleep: ${dims.sleep}/5, Stress: ${dims.stress}/5, Social: ${dims.social}/5, Energy: ${dims.energy}/5, Motivation: ${dims.motivation}/5. ` +
    `Can you help me understand what's happening and what I can do today to feel better?`
  )

  const avgScore = checkins.length
    ? Math.round(checkins.slice(-7).reduce((a, c) => a + c.score, 0) / Math.min(7, checkins.slice(-7).length))
    : null

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: '#fff', fontSize: 13 }}>
        Loading wellness data…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 6, padding: '3px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
        {([['checkin', 'Check-in'], ['history', 'History'], ['sleep', '😴 Sleep']] as [typeof view, string][]).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: view === v ? 'rgba(112,144,208,0.2)' : 'transparent',
              color: view === v ? '#7090d0' : 'rgba(255,255,255,0.55)',
              transition: 'all 0.15s',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {view === 'checkin' && (
        <>
          {/* Score card */}
          <div style={{ background: risk.bg, border: `1px solid ${risk.border}`, borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <BurnoutRing score={todayCheckin ? todayCheckin.score : liveScore} color={risk.color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: risk.color, marginBottom: 4, fontWeight: 700 }}>
                {saved ? 'Today\'s Status' : 'Live Preview'}
              </div>
              <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 18, fontWeight: 700, color: risk.color, marginBottom: 4 }}>{risk.label}</div>
              <div style={{ fontSize: 12, color: '#fff', lineHeight: 1.5 }}>{risk.tip}</div>
              {avgScore !== null && checkins.length >= 3 && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#fff' }}>
                  7-day avg: <span style={{ color: getRisk(avgScore).color, fontWeight: 600 }}>{avgScore}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sliders */}
          {!saved ? (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', fontWeight: 600 }}>How are you feeling today?</div>
              {DIMENSIONS.map(dim => (
                <DimSlider
                  key={dim.key}
                  dim={dim}
                  value={dims[dim.key]}
                  onChange={v => setDims(prev => ({ ...prev, [dim.key]: v }))}
                />
              ))}
              <button
                onClick={handleSave}
                style={{
                  marginTop: 4, padding: '12px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #7090d0, #9b6fd4)',
                  color: '#fff', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14,
                  boxShadow: '0 4px 16px rgba(112,144,208,0.3)',
                }}
              >
                Save check-in
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', marginBottom: 14, fontWeight: 600 }}>Today&apos;s check-in</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {DIMENSIONS.map(dim => {
                  const v = dims[dim.key]
                  const good = dim.invert ? v <= 2 : v >= 4
                  const bad  = dim.invert ? v >= 4 : v <= 2
                  const col  = good ? '#4ecf9e' : bad ? '#ff6b6b' : '#c9a84c'
                  return (
                    <div key={dim.key} style={{ textAlign: 'center', padding: '10px 8px', background: `${col}0d`, border: `1px solid ${col}28`, borderRadius: 10 }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{dim.icon}</div>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 16, fontWeight: 700, color: col }}>{v}</div>
                      <div style={{ fontSize: 8, color: '#fff', marginTop: 2, lineHeight: 1.3 }}>{dim.label.split(' ')[0]}</div>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={handleEdit}
                style={{ marginTop: 14, width: '100%', padding: '9px 0', borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 12, cursor: 'pointer' }}
              >
                Edit today&apos;s check-in
              </button>
            </div>
          )}

          {/* Nova CTA */}
          {saved && (
            <Link href={`/nova?prompt=${novaPrompt}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'linear-gradient(135deg,#12102a 0%,#1a1530 100%)', border: '1px solid rgba(155,111,212,0.25)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#9b6fd4,#6b3fa0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#c5a8f0', fontFamily: 'Sora,sans-serif' }}>Talk to Nova about how you&apos;re feeling</div>
                  <div style={{ fontSize: 11, color: '#fff', marginTop: 2 }}>Your check-in score will be shared automatically</div>
                </div>
                <span style={{ color: '#9b6fd4', fontSize: 18 }}>→</span>
              </div>
            </Link>
          )}

          {/* Counselling reminder for high burnout */}
          {saved && todayCheckin && todayCheckin.score >= 70 && (
            <div style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🆘</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#ff6b6b', marginBottom: 2 }}>Campus counselling is free</div>
                <div style={{ fontSize: 11, color: '#fff', lineHeight: 1.5 }}>Every SA university offers free mental health support. Your student card gets you in. You don't need to be in crisis to go.</div>
              </div>
            </div>
          )}
        </>
      )}

      {view === 'sleep' && <SleepScience />}

      {view === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {checkins.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#fff', fontSize: 13 }}>
              No check-ins yet. Start tracking today.
            </div>
          ) : (
            <>
              {/* Calendar heatmap */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' }}>
                <CalendarHeatmap checkins={checkins} />
              </div>

              {/* Sparkline */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' }}>
                <Sparkline checkins={checkins} />
              </div>

              {/* Stats row */}
              {checkins.length >= 3 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { label: 'Check-ins', value: String(checkins.length), color: '#7090d0' },
                    { label: '7-day avg', value: avgScore !== null ? String(avgScore) : '—', color: avgScore !== null ? getRisk(avgScore).color : '#7090d0' },
                    {
                      label: 'Best day',
                      value: checkins.length ? String(Math.min(...checkins.map(c => c.score))) : '—',
                      color: '#4ecf9e',
                    },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 20, fontWeight: 700, color }}>{value}</div>
                      <div style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Log */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                {checkins.slice().reverse().map((c, i) => {
                  const r = getRisk(c.score)
                  const dateLabel = new Date(c.date + 'T00:00:00').toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })
                  return (
                    <div key={c.date}>
                      {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{dateLabel}</div>
                          <div style={{ fontSize: 11, color: '#fff', marginTop: 1 }}>
                            {DIMENSIONS.map(d => `${d.icon}${c[d.key]}`).join('  ')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 16, fontWeight: 700, color: r.color }}>{c.score}</div>
                          <div style={{ fontSize: 9, color: r.color, opacity: 0.7 }}>{r.label}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
