'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

/* ── Types ─────────────────────────────────────────────────── */
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
const STORAGE_KEY = 'varsityos_wellness_checkins'
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
  // Positive dims: 1=worst(80 burnout), 5=best(0 burnout) → linear
  const posScore = ((5 - avgPositive) / 4) * 80
  // Stress: 1=relaxed(0 burnout), 5=overwhelmed(100 burnout)
  const stressScore = ((dims.stress - 1) / 4) * 100
  // Weighted: 60% positive dims, 40% stress
  return Math.round(posScore * 0.6 + stressScore * 0.4)
}

function getRisk(score: number) {
  return RISK_LEVELS.find(r => score <= r.max) ?? RISK_LEVELS[RISK_LEVELS.length - 1]
}

function loadCheckins(): CheckIn[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch { return [] }
}

function saveCheckins(list: CheckIn[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-MAX_HISTORY)))
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
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>burnout</div>
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
      <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>7-day trend</div>
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
          <div key={i} style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
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
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{dim.label}</span>
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
                  : 'rgba(255,255,255,0.05)',
                border: value === n ? 'none' : '1px solid rgba(255,255,255,0.07)',
                color: value === n ? '#fff' : 'rgba(255,255,255,0.35)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >{n}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 24 }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{dim.lo}</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{dim.hi}</span>
      </div>
    </div>
  )
}

/* ── Main Component ────────────────────────────────────────── */
export default function WellnessTab() {
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [dims, setDims] = useState<Record<DimKey, number>>({ sleep: 3, stress: 3, social: 3, energy: 3, motivation: 3 })
  const [saved, setSaved] = useState(false)
  const [todayCheckin, setTodayCheckin] = useState<CheckIn | null>(null)
  const [view, setView] = useState<'checkin' | 'history'>('checkin')

  useEffect(() => {
    const list = loadCheckins()
    setCheckins(list)
    const today = list.find(c => c.date === todayStr())
    if (today) {
      setTodayCheckin(today)
      setDims({ sleep: today.sleep, stress: today.stress, social: today.social, energy: today.energy, motivation: today.motivation })
      setSaved(true)
    }
  }, [])

  const liveScore = calcScore(dims)
  const risk = getRisk(todayCheckin ? todayCheckin.score : liveScore)

  const handleSave = () => {
    const score = calcScore(dims)
    const entry: CheckIn = { date: todayStr(), score, ...dims }
    const updated = checkins.filter(c => c.date !== todayStr())
    updated.push(entry)
    saveCheckins(updated)
    setCheckins(updated)
    setTodayCheckin(entry)
    setSaved(true)
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 6, padding: '3px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
        {(['checkin', 'history'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: view === v ? 'rgba(112,144,208,0.2)' : 'transparent',
              color: view === v ? '#7090d0' : 'rgba(255,255,255,0.35)',
              transition: 'all 0.15s',
            }}
          >
            {v === 'checkin' ? 'Daily Check-in' : 'History'}
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
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{risk.tip}</div>
              {avgScore !== null && checkins.length >= 3 && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  7-day avg: <span style={{ color: getRisk(avgScore).color, fontWeight: 600 }}>{avgScore}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sliders */}
          {!saved ? (
            <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>How are you feeling today?</div>
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
            <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '16px' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14, fontWeight: 600 }}>Today&apos;s check-in</div>
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
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2, lineHeight: 1.3 }}>{dim.label.split(' ')[0]}</div>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={handleEdit}
                style={{ marginTop: 14, width: '100%', padding: '9px 0', borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.45)', fontSize: 12, cursor: 'pointer' }}
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
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Your check-in score will be shared automatically</div>
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
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>Every SA university offers free mental health support. Your student card gets you in. You don't need to be in crisis to go.</div>
              </div>
            </div>
          )}
        </>
      )}

      {view === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {checkins.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
              No check-ins yet. Start tracking today.
            </div>
          ) : (
            <>
              {/* Sparkline */}
              <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, padding: '16px' }}>
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
                    <div key={label} style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 20, fontWeight: 700, color }}>{value}</div>
                      <div style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Log */}
              <div style={{ background: '#0d0e14', border: '1px solid #1e1f2e', borderRadius: 14, overflow: 'hidden' }}>
                {checkins.slice().reverse().map((c, i) => {
                  const r = getRisk(c.score)
                  const dateLabel = new Date(c.date + 'T00:00:00').toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })
                  return (
                    <div key={c.date}>
                      {i > 0 && <div style={{ height: 1, background: '#1e1f2e' }} />}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{dateLabel}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
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
