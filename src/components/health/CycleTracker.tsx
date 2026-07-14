'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signals } from '@/store/signals'
import { AmbientImage } from '@/components/ui/AmbientImage'

type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
type FlowLevel  = 'none' | 'light' | 'medium' | 'heavy'
type ContraMethod = 'pill' | 'depo' | 'nur-isterate' | 'implant' | 'iud' | 'condoms' | 'none'

interface CycleEntry {
  id: string
  user_id: string
  entry_date: string
  phase: CyclePhase
  flow_level: FlowLevel | null
  energy_level: number | null
  symptoms: string[]
  notes: string | null
}

// ── Phase data ────────────────────────────────────────────────────────────────

const PHASE_INFO: Record<CyclePhase, {
  color: string; energy: 'low'|'medium'|'high'; cognitive: 'low'|'medium'|'high'
  mood: string; studyTip: string; durationDays: number
}> = {
  menstrual:  { color: '#f472b6', energy: 'low',    cognitive: 'low',    mood: 'Introspective',  durationDays: 5,  studyTip: 'Rest focus. Review existing notes rather than learning new material. Easy admin tasks.' },
  follicular: { color: '#a78bfa', energy: 'medium', cognitive: 'high',   mood: 'Optimistic',     durationDays: 9,  studyTip: 'Rising energy and creativity peak. Ideal for learning new concepts and problem-solving.' },
  ovulation:  { color: '#fbbf24', energy: 'high',   cognitive: 'high',   mood: 'Social & Sharp', durationDays: 3,  studyTip: 'Peak performance window. Tackle hardest topics, group study, presentations, exams.' },
  luteal:     { color: '#fb923c', energy: 'medium', cognitive: 'medium', mood: 'Detail-focused',  durationDays: 11, studyTip: 'Great for detail work and revision. Watch energy in the second half of this phase.' },
}

const PHASE_SCIENCE: Record<CyclePhase, { hormones: string; happening: string; why: string; bodyTip: string }> = {
  menstrual: {
    hormones:  'Estrogen and progesterone hit their lowest levels.',
    happening: 'Your uterine lining sheds. Prostaglandins trigger contractions causing cramps. Blood flow carries iron out of your body.',
    why:       'Low hormones → low serotonin. Feeling foggy, low-energy, or emotional is biology — not weakness. Your body is doing heavy work.',
    bodyTip:   'Iron-rich foods (spinach, lentils, eggs) help replenish loss. Ibuprofen works best taken BEFORE pain peaks. Hot water bottle on the abdomen is clinically proven to help.',
  },
  follicular: {
    hormones:  'FSH (follicle-stimulating hormone) rises. Estrogen begins climbing.',
    happening: 'Your ovaries are developing follicles, each containing a potential egg. Rising estrogen thickens the uterine lining.',
    why:       'Estrogen boosts serotonin and dopamine — the "feel good" chemicals. You feel more optimistic, curious, and energised. This is your creative window.',
    bodyTip:   'This is your best phase for starting new projects, intense workouts, and socialising. Take advantage of the rising energy.',
  },
  ovulation: {
    hormones:  'LH (luteinising hormone) surges. Estrogen peaks.',
    happening: 'One mature follicle releases an egg. The egg is viable for only 12–24 hours. This is the fertility window.',
    why:       'Peak estrogen = peak confidence, communication, and magnetic energy. Verbal fluency and spatial reasoning are sharpest. You may feel warmer than usual.',
    bodyTip:   'You may experience Mittelschmerz — a brief pain on one side. This is normal. Your charisma is at its highest — great for interviews, presentations, or dates.',
  },
  luteal: {
    hormones:  'Progesterone rises. Estrogen dips, then both drop sharply at the end if no pregnancy.',
    happening: 'Your body prepares for potential pregnancy. Progesterone thickens the uterine lining. If no fertilisation: both hormones crash → PMS.',
    why:       'Progesterone is calming but also causes bloating, breast tenderness, and fatigue. The estrogen drop in days 22–28 reduces serotonin → mood shifts, cravings, irritability.',
    bodyTip:   'Magnesium (dark chocolate, nuts, spinach) reduces PMS symptoms by up to 40%. Reduce caffeine and alcohol in days 22–28 — they amplify symptoms.',
  },
}

const PHASE_ORDER: CyclePhase[] = ['menstrual', 'follicular', 'ovulation', 'luteal']
const TOTAL_CYCLE_DAYS = 28

const SYMPTOMS = [
  'cramps', 'bloating', 'headache', 'mood changes', 'fatigue',
  'acne', 'cravings', 'insomnia', 'breast tenderness', 'back pain', 'nausea',
]

const CONTRA_LABELS: Record<ContraMethod, { label: string; emoji: string; desc: string }> = {
  pill:          { label: 'The Pill',        emoji: '💊', desc: 'Daily at the same time each day' },
  depo:          { label: 'Depo-Provera',    emoji: '💉', desc: 'Every 12 weeks' },
  'nur-isterate':{ label: 'Nur-Isterate',    emoji: '💉', desc: 'Every 8 weeks' },
  implant:       { label: 'Implant',         emoji: '🔵', desc: 'Lasts 3 years (Nexplanon)' },
  iud:           { label: 'IUD',             emoji: '🔵', desc: 'Mirena (5 yr) or Copper (10 yr)' },
  condoms:       { label: 'Condoms only',    emoji: '🛡️', desc: 'No hormonal reminders needed' },
  none:          { label: 'No contraception',emoji: '–',  desc: '' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function levelPct(l: 'low'|'medium'|'high') { return l === 'low' ? 33 : l === 'medium' ? 66 : 100 }

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDayOfMonth(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1 }

function projectPhase(lastEntry: CycleEntry, target: Date): CyclePhase {
  const lastDate = new Date(lastEntry.entry_date)
  const diff = Math.round((target.getTime() - lastDate.getTime()) / 86400000)
  if (diff <= 0) return lastEntry.phase
  let idx = PHASE_ORDER.indexOf(lastEntry.phase)
  let rem = PHASE_INFO[PHASE_ORDER[idx]].durationDays
  let days = diff
  while (days > 0) {
    if (days < rem) break
    days -= rem
    idx = (idx + 1) % 4
    rem = PHASE_INFO[PHASE_ORDER[idx]].durationDays
  }
  return PHASE_ORDER[idx]
}

function getLastPeriodStart(entries: CycleEntry[]): Date | null {
  const menstrualDates = new Set(entries.filter(e => e.phase === 'menstrual').map(e => e.entry_date))
  const sorted = entries.filter(e => e.phase === 'menstrual').sort((a, b) => b.entry_date.localeCompare(a.entry_date))
  if (!sorted.length) return null
  let current = new Date(sorted[0].entry_date)
  while (true) {
    const prev = new Date(current)
    prev.setDate(prev.getDate() - 1)
    if (menstrualDates.has(prev.toISOString().split('T')[0])) { current = prev } else break
  }
  return current
}

function daysBetween(from: Date, to: Date) {
  return Math.round((to.getTime() - from.getTime()) / 86400000)
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── ContraceptionTracker sub-component ───────────────────────────────────────

function ContraceptionTracker() {
  const today = new Date().toISOString().split('T')[0]
  const [method,       setMethod]       = useState<ContraMethod>('none')
  const [pillTime,     setPillTime]     = useState('08:00')
  const [pillTaken,    setPillTaken]    = useState(false)
  const [injDate,      setInjDate]      = useState('')
  const [implantDate,  setImplantDate]  = useState('')
  const [iudDate,      setIudDate]      = useState('')
  const [iudYears,     setIudYears]     = useState(5)
  const [open,         setOpen]         = useState(false)
  const [editing,      setEditing]      = useState(false)
  const [mounted,      setMounted]      = useState(false)

  useEffect(() => {
    const storedMethod = (localStorage.getItem('varsityos_contra_method') as ContraMethod) ?? 'none'
    const storedPillTaken = localStorage.getItem(`varsityos_pill_taken_${today}`) === 'true'
    const storedInjDate = localStorage.getItem('varsityos_contra_injection_last') ?? ''

    setMethod(storedMethod)
    setPillTime(localStorage.getItem('varsityos_contra_pill_time') ?? '08:00')
    setPillTaken(storedPillTaken)
    setInjDate(storedInjDate)
    setImplantDate(localStorage.getItem('varsityos_contra_implant_placed') ?? '')
    setIudDate(localStorage.getItem('varsityos_contra_iud_placed') ?? '')
    setIudYears(parseInt(localStorage.getItem('varsityos_contra_iud_years') ?? '5'))
    setMounted(true)

    // Emit dashboard alerts for contraception
    if (storedMethod === 'pill' && !storedPillTaken) {
      signals.emit({ type: 'contra_reminder', payload: { kind: 'pill', message: 'Pill not taken today' } })
    }
    if ((storedMethod === 'depo' || storedMethod === 'nur-isterate') && storedInjDate) {
      const weeks = storedMethod === 'depo' ? 12 : 8
      const next = addWeeks(new Date(storedInjDate), weeks)
      const daysLeft = daysBetween(new Date(), next)
      if (daysLeft <= 14) {
        signals.emit({ type: 'contra_reminder', payload: { kind: 'injection', daysLeft, overdue: daysLeft <= 0 } })
      }
    }
  }, [today])

  const save = () => {
    localStorage.setItem('varsityos_contra_method', method)
    localStorage.setItem('varsityos_contra_pill_time', pillTime)
    localStorage.setItem('varsityos_contra_injection_last', injDate)
    localStorage.setItem('varsityos_contra_implant_placed', implantDate)
    localStorage.setItem('varsityos_contra_iud_placed', iudDate)
    localStorage.setItem('varsityos_contra_iud_years', String(iudYears))
    setEditing(false)
  }

  const markPillTaken = () => {
    localStorage.setItem(`varsityos_pill_taken_${today}`, 'true')
    setPillTaken(true)
  }

  if (!mounted) return null

  const injWeeks = method === 'depo' ? 12 : 8
  const nextInj  = injDate ? addWeeks(new Date(injDate), injWeeks) : null
  const daysToInj = nextInj ? daysBetween(new Date(), nextInj) : null
  const injUrgent = daysToInj !== null && daysToInj <= 7

  const nextImplant = implantDate ? addWeeks(new Date(implantDate), 156) : null // 3 years
  const nextIud     = iudDate ? addWeeks(new Date(iudDate), iudYears * 52) : null

  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, marginBottom: 20, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '16px 18px', background: 'transparent', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>💊</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text-secondary)' }}>
              Contraception Tracker
            </div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#fff', marginTop: 2 }}>
              {method === 'none' ? 'Tap to set up reminders' : CONTRA_LABELS[method].label}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {method === 'pill' && (
            <div style={{
              padding: '4px 10px', borderRadius: 20,
              background: pillTaken ? 'rgba(78,207,158,0.15)' : 'rgba(255,107,107,0.15)',
              fontFamily: '"JetBrains Mono",monospace', fontSize: 9,
              color: pillTaken ? '#4ecf9e' : '#ff6b6b',
            }}>
              {pillTaken ? '✓ Taken' : '⚠️ Take today'}
            </div>
          )}
          {(method === 'depo' || method === 'nur-isterate') && daysToInj !== null && (
            <div style={{
              padding: '4px 10px', borderRadius: 20,
              background: injUrgent ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.07)',
              fontFamily: '"JetBrains Mono",monospace', fontSize: 9,
              color: injUrgent ? '#ff6b6b' : 'rgba(255,255,255,0.58)',
            }}>
              {daysToInj <= 0 ? '⚠️ Overdue' : `${daysToInj}d to next`}
            </div>
          )}
          <span style={{ color: '#fff', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {!editing ? (
            <>
              {/* Method summary + status */}
              {method === 'none' || method === 'condoms' ? (
                <div style={{ paddingTop: 14 }}>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#fff', marginBottom: 14, lineHeight: 1.6 }}>
                    {method === 'condoms'
                      ? '🛡️ Condoms are your primary method. Remember: condoms are the only contraceptive that also protects against STIs.'
                      : 'No contraception method set. Tap Edit to set up reminders.'}
                  </p>
                  <button onClick={() => setEditing(true)} style={editBtn}>Edit method</button>
                </div>
              ) : method === 'pill' ? (
                <div style={{ paddingTop: 14 }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#fff', marginBottom: 10 }}>
                    REMINDER TIME: {pillTime}
                  </div>
                  {!pillTaken ? (
                    <div style={{
                      padding: '14px 16px', borderRadius: 12, marginBottom: 12,
                      background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)',
                    }}>
                      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: '#ff6b6b', marginBottom: 6 }}>
                        ⚠️ Don't forget your pill today
                      </div>
                      <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#fff', marginBottom: 12, lineHeight: 1.6 }}>
                        Take it at <strong style={{ color: 'var(--text-primary)' }}>{pillTime}</strong> daily. Missing a pill reduces effectiveness — take it as soon as you remember, unless it's nearly time for your next dose.
                      </div>
                      <button onClick={markPillTaken} style={{
                        padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: '#4ecf9e', color: '#000',
                        fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13,
                      }}>
                        ✓ Mark as taken today
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      padding: '12px 16px', borderRadius: 12, marginBottom: 12,
                      background: 'rgba(78,207,158,0.08)', border: '1px solid rgba(78,207,158,0.2)',
                    }}>
                      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, color: '#4ecf9e' }}>
                        ✓ Pill taken today — well done!
                      </div>
                    </div>
                  )}
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#fff', marginBottom: 12, lineHeight: 1.7 }}>
                    💡 Take at the same time every day for maximum effectiveness. Set an alarm on your phone if needed.
                    Missing 2+ pills in a row significantly reduces protection — use a condom as backup.
                  </div>
                  <button onClick={() => setEditing(true)} style={editBtn}>Edit</button>
                </div>
              ) : (method === 'depo' || method === 'nur-isterate') ? (
                <div style={{ paddingTop: 14 }}>
                  {injDate ? (
                    <>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                        <div style={infoBox}>
                          <div style={infoLabel}>Last injection</div>
                          <div style={infoValue}>{formatDate(new Date(injDate))}</div>
                        </div>
                        <div style={{ ...infoBox, background: injUrgent ? 'rgba(255,107,107,0.08)' : 'rgba(255,255,255,0.06)', borderColor: injUrgent ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.07)' }}>
                          <div style={infoLabel}>Next injection</div>
                          <div style={{ ...infoValue, color: injUrgent ? '#ff6b6b' : '#4ecf9e' }}>
                            {nextInj ? formatDate(nextInj) : '—'}
                          </div>
                        </div>
                      </div>
                      {daysToInj !== null && (
                        <div style={{
                          padding: '12px 14px', borderRadius: 12, marginBottom: 12,
                          background: injUrgent ? 'rgba(255,107,107,0.08)' : 'rgba(78,207,158,0.06)',
                          border: `1px solid ${injUrgent ? 'rgba(255,107,107,0.2)' : 'rgba(78,207,158,0.15)'}`,
                        }}>
                          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: injUrgent ? '#ff6b6b' : '#4ecf9e' }}>
                            {daysToInj <= 0
                              ? '⚠️ Injection overdue — book a clinic visit'
                              : daysToInj <= 7
                              ? `⚠️ Injection due in ${daysToInj} day${daysToInj !== 1 ? 's' : ''} — book soon`
                              : `${daysToInj} days until your next injection`}
                          </div>
                        </div>
                      )}
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#fff', marginBottom: 12, lineHeight: 1.7 }}>
                        💡 Depo works for 12 weeks, Nur-Isterate for 8 weeks. Being late by more than 2 weeks
                        significantly reduces protection. Book your next appointment NOW, don't wait.
                      </div>
                    </>
                  ) : (
                    <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#fff', marginBottom: 12 }}>
                      Set your last injection date to track your next appointment.
                    </p>
                  )}
                  <button onClick={() => setEditing(true)} style={editBtn}>Edit</button>
                </div>
              ) : (method === 'implant' || method === 'iud') ? (
                <div style={{ paddingTop: 14 }}>
                  {(method === 'implant' ? implantDate : iudDate) ? (
                    <>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                        <div style={infoBox}>
                          <div style={infoLabel}>Placed on</div>
                          <div style={infoValue}>{formatDate(new Date(method === 'implant' ? implantDate : iudDate))}</div>
                        </div>
                        <div style={infoBox}>
                          <div style={infoLabel}>Replace by</div>
                          <div style={{ ...infoValue, color: '#a78bfa' }}>
                            {method === 'implant' && nextImplant ? formatDate(nextImplant) : method === 'iud' && nextIud ? formatDate(nextIud) : '—'}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#fff', marginBottom: 12, lineHeight: 1.7 }}>
                        {method === 'implant'
                          ? '💡 Nexplanon lasts 3 years. It requires no daily action — just remember to replace it on time.'
                          : `💡 Your IUD lasts ${iudYears} years. You should feel a check string inside — if you can't feel it, see a doctor.`}
                      </div>
                    </>
                  ) : (
                    <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#fff', marginBottom: 12 }}>
                      Set the date it was placed to track when to replace it.
                    </p>
                  )}
                  <button onClick={() => setEditing(true)} style={editBtn}>Edit</button>
                </div>
              ) : null}
            </>
          ) : (
            /* Edit form */
            <div style={{ paddingTop: 14 }}>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#fff', marginBottom: 8, letterSpacing: '0.14em' }}>
                CONTRACEPTION METHOD
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                {(Object.keys(CONTRA_LABELS) as ContraMethod[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    style={{
                      padding: '7px 14px', borderRadius: 20,
                      border: method === m ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      background: method === m ? '#f472b6' : 'rgba(255,255,255,0.08)',
                      color: method === m ? '#000' : 'rgba(255,255,255,0.6)',
                      fontFamily: 'DM Sans,sans-serif', fontSize: 12.5, fontWeight: method === m ? 700 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {CONTRA_LABELS[m].emoji} {CONTRA_LABELS[m].label}
                  </button>
                ))}
              </div>

              {method === 'pill' && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#fff', marginBottom: 6 }}>DAILY REMINDER TIME</div>
                  <input
                    type="time" value={pillTime}
                    onChange={e => setPillTime(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              )}

              {(method === 'depo' || method === 'nur-isterate') && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#fff', marginBottom: 6 }}>LAST INJECTION DATE</div>
                  <input type="date" value={injDate} onChange={e => setInjDate(e.target.value)} style={inputStyle} />
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#fff', marginTop: 4 }}>
                    {method === 'depo' ? 'Depo-Provera: every 12 weeks' : 'Nur-Isterate: every 8 weeks'}
                  </div>
                </div>
              )}

              {method === 'implant' && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#fff', marginBottom: 6 }}>DATE IMPLANT WAS PLACED</div>
                  <input type="date" value={implantDate} onChange={e => setImplantDate(e.target.value)} style={inputStyle} />
                </div>
              )}

              {method === 'iud' && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#fff', marginBottom: 6 }}>DATE IUD WAS PLACED</div>
                  <input type="date" value={iudDate} onChange={e => setIudDate(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#fff', marginBottom: 6 }}>LASTS HOW MANY YEARS</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[5, 10].map(y => (
                      <button key={y} onClick={() => setIudYears(y)} style={{
                        flex: 1, padding: '8px', borderRadius: 10,
                        border: iudYears === y ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        background: iudYears === y ? '#a78bfa' : 'rgba(255,255,255,0.08)',
                        color: iudYears === y ? '#000' : 'rgba(255,255,255,0.66)',
                        fontFamily: '"JetBrains Mono",monospace', fontSize: 12, cursor: 'pointer',
                      }}>{y} years</button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={save} style={{
                  flex: 2, padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: '#f472b6', color: '#000', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13,
                }}>Save</button>
                <button onClick={() => setEditing(false)} style={{
                  flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                  color: '#fff', fontFamily: 'DM Sans,sans-serif', fontSize: 13,
                }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const editBtn: React.CSSProperties = {
  padding: '8px 20px', borderRadius: 10, cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.08)',
  color: '#fff', fontFamily: 'DM Sans,sans-serif', fontSize: 12,
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10, boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text-secondary)', fontSize: 13, outline: 'none',
}
const infoBox: React.CSSProperties = {
  flex: 1, padding: '10px 12px', borderRadius: 10,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)',
}
const infoLabel: React.CSSProperties = {
  fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#fff',
  letterSpacing: '0.14em', marginBottom: 4,
}
const infoValue: React.CSSProperties = {
  fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)',
}

function estimatePhaseFromDate(lastPeriodDateStr: string): CyclePhase {
  const start = new Date(lastPeriodDateStr + 'T00:00:00')
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const daysSince = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86400000) + 1)
  const cycleDay = ((daysSince - 1) % 28) + 1
  if (cycleDay <= 5) return 'menstrual'
  if (cycleDay <= 14) return 'follicular'
  if (cycleDay <= 17) return 'ovulation'
  return 'luteal'
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CycleTracker({ userId }: { userId: string }) {
  const [entries,       setEntries]       = useState<CycleEntry[]>([])
  const [activeMonth,   setActiveMonth]   = useState(new Date())
  const [logModal,      setLogModal]      = useState<{ date: string } | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [sciencePhase,  setSciencePhase]  = useState<CyclePhase | null>(null)

  const [modalPhase,    setModalPhase]    = useState<CyclePhase>('menstrual')
  const [modalFlow,     setModalFlow]     = useState<FlowLevel>('none')
  const [modalEnergy,   setModalEnergy]   = useState<number>(3)
  const [modalSymptoms, setModalSymptoms] = useState<string[]>([])
  const [modalNotes,    setModalNotes]    = useState('')
  const [saving,        setSaving]        = useState(false)
  const [showWizard,    setShowWizard]    = useState(false)
  const [wizardDate,    setWizardDate]    = useState('')

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('cycle_tracking').select('*')
        .eq('user_id', userId).order('entry_date', { ascending: false })
      setEntries((data as CycleEntry[]) ?? [])
      setLoading(false)
    }
    load()
  }, [userId, supabase])

  const year  = activeMonth.getFullYear()
  const month = activeMonth.getMonth()
  const today = new Date().toISOString().split('T')[0]
  const entryByDate = new Map(entries.map(e => [e.entry_date, e]))

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DAY_LABELS  = ['M','T','W','T','F','S','S']

  // Cycle day computation
  const periodStart = useMemo(() => getLastPeriodStart(entries), [entries])
  const cycleDay    = periodStart ? (daysBetween(periodStart, new Date()) + 1) : null
  const daysUntilNext = cycleDay ? Math.max(0, TOTAL_CYCLE_DAYS - cycleDay + 1) : null

  const latestEntry      = entries[0] ?? null
  const currentPhaseInfo = latestEntry ? PHASE_INFO[latestEntry.phase] : null

  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return {
      label: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()],
      phase: latestEntry ? projectPhase(latestEntry, d) : null,
    }
  })

  function openModal(date: string) {
    const ex = entryByDate.get(date)
    setModalPhase(ex?.phase ?? 'menstrual')
    setModalFlow(ex?.flow_level ?? 'none')
    setModalEnergy(ex?.energy_level ?? 3)
    setModalSymptoms(ex?.symptoms ?? [])
    setModalNotes(ex?.notes ?? '')
    setLogModal({ date })
  }

  const toggleSymptom = useCallback((s: string) => {
    setModalSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }, [])

  async function saveEntry() {
    if (!logModal) return
    setSaving(true)
    const { error } = await supabase.from('cycle_tracking').upsert({
      user_id: userId, entry_date: logModal.date, phase: modalPhase,
      flow_level: modalPhase === 'menstrual' ? modalFlow : null,
      energy_level: modalEnergy, symptoms: modalSymptoms,
      notes: modalNotes || null,
    }, { onConflict: 'user_id,entry_date' })

    if (!error) {
      if (logModal.date === today)
        signals.emit({ type: 'cycle_phase_logged', payload: { phase: modalPhase, energyLevel: modalEnergy } })
      const { data } = await supabase
        .from('cycle_tracking').select('*')
        .eq('user_id', userId).order('entry_date', { ascending: false })
      setEntries((data as CycleEntry[]) ?? [])
    }
    setSaving(false)
    setLogModal(null)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-tertiary)' }}>Loading your cycle data...</div>
      </div>
    )
  }

  const sc = sciencePhase ? PHASE_SCIENCE[sciencePhase] : null
  const scInfo = sciencePhase ? PHASE_INFO[sciencePhase] : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '0 0 80px', position: 'relative' }}>
      <AmbientImage zone="wellness" opacity={0.28} blurPx={20} saturation={1.3} overlayColor="rgba(10,8,20,0.65)" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>

        {/* Header */}
        <div style={{ padding: '28px 0 20px' }}>
          <h1 style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 4 }}>Cycle Tracker</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Track your phases, symptoms, and understand your body.</p>
        </div>

        {/* Phase wizard — shown when no entries logged yet */}
        {!latestEntry && (
          <div style={{
            background: 'rgba(244,114,182,0.07)', border: '1px solid rgba(244,114,182,0.20)',
            borderRadius: 16, padding: 18, marginBottom: 20,
          }}>
            <div style={{ color: '#f472b6', fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>
              🌸 Not sure what phase you're in?
            </div>
            <p style={{ color: '#fff', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: 14 }}>
              No problem. Tell us when your last period started and we'll estimate your current phase so you can start immediately.
            </p>
            {!showWizard ? (
              <button
                onClick={() => setShowWizard(true)}
                style={{
                  padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: 'rgba(244,114,182,0.18)', color: '#f472b6',
                  fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 600,
                }}
              >
                Estimate my phase →
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#fff', marginBottom: 6, letterSpacing: '0.12em' }}>
                    MY LAST PERIOD STARTED ON
                  </div>
                  <input
                    type="date" value={wizardDate}
                    onChange={e => setWizardDate(e.target.value)}
                    max={today}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10, boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(244,114,182,0.25)',
                      color: 'var(--text-secondary)', fontSize: 13, outline: 'none',
                    }}
                  />
                </div>
                <button
                  disabled={!wizardDate}
                  onClick={() => {
                    if (!wizardDate) return
                    const phase = estimatePhaseFromDate(wizardDate)
                    setModalPhase(phase)
                    setModalFlow(phase === 'menstrual' ? 'medium' : 'none')
                    setModalEnergy(3)
                    setModalSymptoms([])
                    setModalNotes(`Estimated from last period date: ${wizardDate}`)
                    setLogModal({ date: today })
                    setShowWizard(false)
                    setWizardDate('')
                  }}
                  style={{
                    padding: '10px 20px', borderRadius: 10, border: 'none', cursor: wizardDate ? 'pointer' : 'default',
                    background: wizardDate ? '#f472b6' : 'rgba(255,255,255,0.08)',
                    color: wizardDate ? '#000' : 'rgba(255,255,255,0.5)',
                    fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, flexShrink: 0,
                  }}
                >
                  Calculate
                </button>
              </div>
            )}
          </div>
        )}

        {/* Cycle Day Panel */}
        {cycleDay !== null && (
          <div style={{
            background: `linear-gradient(135deg, ${currentPhaseInfo?.color}18 0%, rgba(0,0,0,0) 70%)`,
            border: `1px solid ${currentPhaseInfo?.color}40`,
            borderRadius: 16, padding: '20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            {/* Day arc */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <svg width={80} height={80} viewBox="0 0 80 80">
                <circle cx={40} cy={40} r={32} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
                <circle
                  cx={40} cy={40} r={32} fill="none"
                  stroke={currentPhaseInfo?.color ?? '#f472b6'} strokeWidth={6}
                  strokeDasharray={`${2 * Math.PI * 32 * (cycleDay / TOTAL_CYCLE_DAYS)} ${2 * Math.PI * 32 * (1 - cycleDay / TOTAL_CYCLE_DAYS)}`}
                  strokeLinecap="round" transform="rotate(-90 40 40)"
                  style={{ transition: 'stroke-dasharray 0.6s ease' }}
                />
                <text x={40} y={38} textAnchor="middle" fill="white" fontSize={18} fontWeight="800" style={{ fontFamily: 'Sora,sans-serif' }}>{cycleDay}</text>
                <text x={40} y={52} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize={8} style={{ fontFamily: 'JetBrains Mono,monospace' }}>of {TOTAL_CYCLE_DAYS}</text>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: currentPhaseInfo?.color, letterSpacing: '0.18em', marginBottom: 4 }}>
                CYCLE DAY {cycleDay}
              </div>
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', textTransform: 'capitalize', marginBottom: 4 }}>
                {currentPhaseInfo ? `${latestEntry?.phase} Phase` : 'Log your phase'}
              </div>
              {daysUntilNext !== null && daysUntilNext > 0 && (
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#fff' }}>
                  ~{daysUntilNext} day{daysUntilNext !== 1 ? 's' : ''} until next period
                </div>
              )}
              {daysUntilNext === 0 && (
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#f472b6' }}>
                  Period expected around now
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calendar */}
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button onClick={() => setActiveMonth(new Date(year, month - 1, 1))} style={navBtn}>{'<'}</button>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{MONTH_NAMES[month]} {year}</span>
            <button onClick={() => setActiveMonth(new Date(year, month + 1, 1))} style={navBtn}>{'>'}</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {DAY_LABELS.map((d, i) => <div key={i} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, padding: '4px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: getFirstDayOfMonth(year, month) }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: getDaysInMonth(year, month) }).map((_, i) => {
              const dayNum = i + 1
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
              const entry = entryByDate.get(dateStr)
              const isToday = dateStr === today
              const phaseColor = entry ? PHASE_INFO[entry.phase].color : null
              return (
                <div key={dayNum} onClick={() => openModal(dateStr)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: '50%', margin: '0 auto',
                  background: phaseColor ? `${phaseColor}b3` : 'transparent',
                  border: isToday ? '2px solid #fff' : phaseColor ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  color: phaseColor ? '#fff' : '#9ca3af',
                  fontSize: '0.75rem', fontWeight: isToday ? 700 : 400, cursor: 'pointer',
                }}>{dayNum}</div>
              )
            })}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
            {PHASE_ORDER.map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PHASE_INFO[p].color }} />
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#fff', textTransform: 'capitalize' }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contraception Tracker */}
        <ContraceptionTracker />

        {/* Phase Intelligence */}
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Phase Intelligence</h2>
            {currentPhaseInfo && (
              <button
                onClick={() => setSciencePhase(latestEntry?.phase ?? null)}
                style={{
                  padding: '4px 12px', borderRadius: 20, border: `1px solid ${currentPhaseInfo.color}40`,
                  background: `${currentPhaseInfo.color}10`, color: currentPhaseInfo.color,
                  fontFamily: '"JetBrains Mono",monospace', fontSize: 9, cursor: 'pointer',
                }}>
                🔬 Phase science
              </button>
            )}
          </div>

          {!currentPhaseInfo ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Start tracking to see your phase intelligence.</p>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: currentPhaseInfo.color }} />
                <span style={{ color: currentPhaseInfo.color, fontWeight: 700, textTransform: 'capitalize', fontSize: '1.1rem' }}>
                  {latestEntry?.phase} Phase
                </span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginLeft: 'auto' }}>Mood: {currentPhaseInfo.mood}</span>
              </div>

              {(['energy', 'cognitive'] as const).map(key => (
                <div key={key} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'capitalize' }}>{key === 'cognitive' ? 'Cognitive clarity' : 'Energy'}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'capitalize' }}>{currentPhaseInfo[key]}</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 6 }}>
                    <div style={{ background: currentPhaseInfo.color, borderRadius: 4, height: 6, width: `${levelPct(currentPhaseInfo[key])}%`, transition: 'width 0.4s' }} />
                  </div>
                </div>
              ))}

              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${currentPhaseInfo.color}`, marginBottom: 16 }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Study Tip</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.55 }}>{currentPhaseInfo.studyTip}</div>
              </div>

              {/* 7-day forecast */}
              <div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Next 7 Days Energy Forecast</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {next7Days.map((d, i) => {
                    const info = d.phase ? PHASE_INFO[d.phase] : null
                    return (
                      <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: 4 }}>{d.label}</div>
                        <div style={{ width: 8, height: `${info ? levelPct(info.energy) * 0.28 : 10}px`, background: info ? info.color : '#374151', borderRadius: 4, margin: '0 auto', minHeight: 10 }} />
                        <div style={{ color: '#4b5563', fontSize: '0.63rem', marginTop: 4, textTransform: 'capitalize' }}>{d.phase?.[0]}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* All 4 phases mini grid */}
              <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {PHASE_ORDER.map(p => (
                  <button key={p} onClick={() => setSciencePhase(p)} style={{
                    padding: '10px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    background: latestEntry?.phase === p ? `${PHASE_INFO[p].color}18` : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${latestEntry?.phase === p ? PHASE_INFO[p].color + '40' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: PHASE_INFO[p].color }} />
                      <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 11.5, color: PHASE_INFO[p].color, textTransform: 'capitalize' }}>{p}</span>
                    </div>
                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#fff' }}>
                      Day {PHASE_ORDER.slice(0, PHASE_ORDER.indexOf(p)).reduce((s, ph) => s + PHASE_INFO[ph].durationDays, 1)}–{PHASE_ORDER.slice(0, PHASE_ORDER.indexOf(p) + 1).reduce((s, ph) => s + PHASE_INFO[ph].durationDays, 0)} · Tap for science
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Period pain tip */}
        <div style={{ background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.2)', borderRadius: 16, padding: 18, marginBottom: 12 }}>
          <div style={{ color: '#f472b6', fontWeight: 700, fontSize: '0.9rem', marginBottom: 8 }}>Period Pain Tips</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.65 }}>
            • Take ibuprofen at the <strong>first sign of pain</strong> — before it peaks. Works best prophylactically.<br />
            • A hot water bottle on the abdomen provides significant relief (heat increases blood flow).<br />
            • Ginger tea has clinical evidence for reducing dysmenorrhea (period pain).<br />
            • Magnesium supplements reduce cramp severity by up to 40% when taken throughout your cycle.
          </div>
        </div>

        <p style={{ color: '#4b5563', fontSize: '0.7rem', textAlign: 'center' }}>Your cycle data is private and encrypted. Never shared.</p>
      </div>

      {/* Phase Science Modal */}
      {sciencePhase && sc && scInfo && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setSciencePhase(null)}
        >
          <div
            style={{ background: '#0f1120', borderRadius: 20, padding: '24px 22px', maxWidth: 460, width: '100%', maxHeight: '85vh', overflowY: 'auto', border: `1px solid ${scInfo.color}30` }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: scInfo.color, letterSpacing: '0.18em', marginBottom: 3 }}>PHASE SCIENCE</div>
                <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', textTransform: 'capitalize' }}>{sciencePhase} Phase</div>
              </div>
              <button onClick={() => setSciencePhase(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 18 }}>✕</button>
            </div>

            {/* Phase selector */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
              {PHASE_ORDER.map(p => (
                <button key={p} onClick={() => setSciencePhase(p)} style={{
                  padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: sciencePhase === p ? PHASE_INFO[p].color : 'rgba(255,255,255,0.07)',
                  color: sciencePhase === p ? '#000' : 'rgba(255,255,255,0.62)',
                  fontFamily: '"JetBrains Mono",monospace', fontSize: 9, fontWeight: sciencePhase === p ? 700 : 400,
                  textTransform: 'capitalize',
                }}>{p}</button>
              ))}
            </div>

            {/* Day range */}
            <div style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 20,
              background: `${scInfo.color}15`, border: `1px solid ${scInfo.color}30`,
              fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: scInfo.color, marginBottom: 18,
            }}>
              Days {PHASE_ORDER.slice(0, PHASE_ORDER.indexOf(sciencePhase)).reduce((s, ph) => s + PHASE_INFO[ph].durationDays, 1)}–
              {PHASE_ORDER.slice(0, PHASE_ORDER.indexOf(sciencePhase) + 1).reduce((s, ph) => s + PHASE_INFO[ph].durationDays, 0)} of 28
            </div>

            {[
              { label: '🧬 What\'s happening', text: sc.happening },
              { label: '⚗️ Hormones',          text: sc.hormones },
              { label: '💭 Why you feel this way', text: sc.why },
              { label: '🌿 Body tip',           text: sc.bodyTip },
              { label: '📚 Study strategy',     text: scInfo.studyTip },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: scInfo.color, letterSpacing: '0.12em', marginBottom: 6 }}>
                  {item.label.toUpperCase()}
                </div>
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13.5, color: '#fff', lineHeight: 1.7, background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px' }}>
                  {item.text}
                </div>
              </div>
            ))}

            {/* Mood + energy summary */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              {[{ label: 'Energy', val: scInfo.energy }, { label: 'Cognition', val: scInfo.cognitive }, { label: 'Mood', val: scInfo.mood }].map(item => (
                <div key={item.label} style={{ flex: 1, padding: '10px', borderRadius: 10, background: `${scInfo.color}0d`, border: `1px solid ${scInfo.color}25`, textAlign: 'center' }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#fff', marginBottom: 4 }}>{item.label.toUpperCase()}</div>
                  <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 12, color: scInfo.color, textTransform: 'capitalize' }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Log Modal */}
      {logModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setLogModal(null)}>
          <div
            style={{ background: '#111118', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 640, padding: '24px 20px 40px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ color: '#e5e7eb', fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>Log Day</div>
            <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: 20 }}>{logModal.date}</div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 8 }}>Phase</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PHASE_ORDER.map(p => (
                  <button key={p} onClick={() => setModalPhase(p)} style={{
                    padding: '7px 14px', borderRadius: 20,
                    border: modalPhase === p ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    background: modalPhase === p ? PHASE_INFO[p].color : 'rgba(255,255,255,0.08)',
                    color: modalPhase === p ? '#0a0a0f' : '#9ca3af',
                    fontWeight: modalPhase === p ? 700 : 400, cursor: 'pointer',
                    textTransform: 'capitalize', fontSize: '0.85rem',
                  }}>{p}</button>
                ))}
              </div>
            </div>

            {modalPhase === 'menstrual' && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 8 }}>Flow Level</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['none', 'light', 'medium', 'heavy'] as FlowLevel[]).map(f => (
                    <button key={f} onClick={() => setModalFlow(f)} style={{
                      padding: '7px 14px', borderRadius: 20,
                      border: modalFlow === f ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      background: modalFlow === f ? '#f472b6' : 'rgba(255,255,255,0.08)',
                      color: modalFlow === f ? '#0a0a0f' : '#9ca3af',
                      fontWeight: modalFlow === f ? 700 : 400, cursor: 'pointer',
                      textTransform: 'capitalize', fontSize: '0.8rem',
                    }}>{f}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 8 }}>Energy Level (1–5)</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setModalEnergy(n)} style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: modalEnergy >= n ? '#f472b6' : 'rgba(255,255,255,0.06)',
                    border: 'none', color: modalEnergy >= n ? '#0a0a0f' : '#6b7280',
                    fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                  }}>{n}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 8 }}>Symptoms</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SYMPTOMS.map(s => (
                  <button key={s} onClick={() => toggleSymptom(s)} style={{
                    padding: '6px 12px', borderRadius: 16,
                    background: modalSymptoms.includes(s) ? 'rgba(244,114,182,0.2)' : 'rgba(255,255,255,0.08)',
                    border: modalSymptoms.includes(s) ? '1px solid #f472b6' : '1px solid rgba(255,255,255,0.1)',
                    color: modalSymptoms.includes(s) ? '#f472b6' : '#9ca3af',
                    cursor: 'pointer', fontSize: '0.8rem',
                  }}>{s}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 8 }}>Notes</div>
              <textarea
                value={modalNotes} onChange={e => setModalNotes(e.target.value)}
                placeholder="Optional notes..." rows={3}
                style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, color: '#e5e7eb', fontSize: '0.875rem', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button onClick={saveEntry} disabled={saving} style={{
              width: '100%', padding: 14, background: '#f472b6', border: 'none', borderRadius: 12,
              color: '#0a0a0f', fontWeight: 700, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)', border: 'none', color: 'var(--text-secondary)',
  borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: '1rem',
}
