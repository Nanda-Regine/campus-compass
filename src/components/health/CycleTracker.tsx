'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signals } from '@/store/signals'

type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
type FlowLevel = 'none' | 'light' | 'medium' | 'heavy'

interface CyclePhaseInfo {
  phase: CyclePhase
  energy: 'low' | 'medium' | 'high'
  cognitive: 'low' | 'medium' | 'high'
  mood: string
  studyTip: string
  color: string
}

interface CycleEntry {
  id: string
  user_id: string
  date: string
  phase: CyclePhase
  flow_level: FlowLevel | null
  energy_level: number | null
  symptoms: string[]
  notes: string | null
}

const PHASE_INFO: Record<CyclePhase, CyclePhaseInfo> = {
  menstrual:  { phase: 'menstrual',  energy: 'low',    cognitive: 'low',    mood: 'Introspective',  studyTip: 'Rest focus. Review existing notes rather than learning new material. Easy admin tasks.',                               color: '#f472b6' },
  follicular: { phase: 'follicular', energy: 'medium', cognitive: 'high',   mood: 'Optimistic',     studyTip: 'Rising energy and creativity peak. Ideal for learning new concepts and problem-solving.',                              color: '#a78bfa' },
  ovulation:  { phase: 'ovulation',  energy: 'high',   cognitive: 'high',   mood: 'Social',         studyTip: 'Peak performance window. Tackle hardest topics, group study, presentations, exams.',                                  color: '#fbbf24' },
  luteal:     { phase: 'luteal',     energy: 'medium', cognitive: 'medium', mood: 'Detail-focused',  studyTip: 'Great for detail work and revision. Watch energy levels in the second half of this phase.',                          color: '#fb923c' },
}

const PHASE_ORDER: CyclePhase[] = ['menstrual', 'follicular', 'ovulation', 'luteal']
const PHASE_DAYS: Record<CyclePhase, number> = { menstrual: 5, follicular: 9, ovulation: 3, luteal: 11 }

const SYMPTOMS = ['cramps', 'bloating', 'headache', 'mood changes', 'fatigue', 'acne', 'cravings', 'insomnia']

function levelBar(level: 'low' | 'medium' | 'high') {
  const pct = level === 'low' ? 33 : level === 'medium' ? 66 : 100
  return pct
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function projectPhase(lastEntry: CycleEntry, targetDate: Date): CyclePhase {
  const lastDate = new Date(lastEntry.date)
  const diffDays = Math.round((targetDate.getTime() - lastDate.getTime()) / 86400000)
  if (diffDays <= 0) return lastEntry.phase

  let phaseIdx = PHASE_ORDER.indexOf(lastEntry.phase)
  let remaining = PHASE_DAYS[PHASE_ORDER[phaseIdx]]
  let days = diffDays

  while (days > 0) {
    if (days < remaining) break
    days -= remaining
    phaseIdx = (phaseIdx + 1) % 4
    remaining = PHASE_DAYS[PHASE_ORDER[phaseIdx]]
  }
  return PHASE_ORDER[phaseIdx]
}

export default function CycleTracker({ userId }: { userId: string }) {
  const [entries, setEntries] = useState<CycleEntry[]>([])
  const [activeMonth, setActiveMonth] = useState(new Date())
  const [logModal, setLogModal] = useState<{ date: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const [modalPhase, setModalPhase] = useState<CyclePhase>('menstrual')
  const [modalFlow, setModalFlow] = useState<FlowLevel>('none')
  const [modalEnergy, setModalEnergy] = useState<number>(3)
  const [modalSymptoms, setModalSymptoms] = useState<string[]>([])
  const [modalNotes, setModalNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('cycle_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
      setEntries((data as CycleEntry[]) ?? [])
      setLoading(false)
    }
    load()
  }, [userId])

  const year = activeMonth.getFullYear()
  const month = activeMonth.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = new Date().toISOString().split('T')[0]

  const entryByDate = new Map(entries.map(e => [e.date, e]))

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  function openModal(date: string) {
    const existing = entryByDate.get(date)
    setModalPhase(existing?.phase ?? 'menstrual')
    setModalFlow(existing?.flow_level ?? 'none')
    setModalEnergy(existing?.energy_level ?? 3)
    setModalSymptoms(existing?.symptoms ?? [])
    setModalNotes(existing?.notes ?? '')
    setLogModal({ date })
  }

  function toggleSymptom(s: string) {
    setModalSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function saveEntry() {
    if (!logModal) return
    setSaving(true)
    await supabase.from('cycle_tracking').upsert({
      user_id: userId,
      date: logModal.date,
      phase: modalPhase,
      flow_level: modalPhase === 'menstrual' ? modalFlow : null,
      energy_level: modalEnergy,
      symptoms: modalSymptoms,
      notes: modalNotes || null,
    }, { onConflict: 'user_id,date' })

    // Emit signal so orchestration layer can adapt study/regulation advice
    if (logModal?.date === today) {
      signals.emit({ type: 'cycle_phase_logged', payload: { phase: modalPhase, energyLevel: modalEnergy } })
    }

    const { data } = await supabase
      .from('cycle_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    setEntries((data as CycleEntry[]) ?? [])
    setSaving(false)
    setLogModal(null)
  }

  const latestEntry = entries[0] ?? null

  const currentPhaseInfo = latestEntry ? PHASE_INFO[latestEntry.phase] : null

  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const phase = latestEntry ? projectPhase(latestEntry, d) : null
    return { label: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()], phase }
  })

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#9ca3af' }}>Loading your cycle data...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', padding: '0 0 80px 0' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ padding: '28px 0 20px' }}>
          <h1 style={{ color: '#e5e7eb', fontWeight: 800, fontSize: '1.5rem', marginBottom: '4px' }}>Cycle Tracker</h1>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Tap a day to log your phase and symptoms.</p>
        </div>

        {/* Calendar */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button onClick={() => setActiveMonth(new Date(year, month - 1, 1))} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: '#e5e7eb', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '1rem' }}>{'<'}</button>
            <span style={{ color: '#e5e7eb', fontWeight: 700 }}>{MONTH_NAMES[month]} {year}</span>
            <button onClick={() => setActiveMonth(new Date(year, month + 1, 1))} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: '#e5e7eb', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '1rem' }}>{'>'}</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
            {DAY_LABELS.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.75rem', fontWeight: 600, padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
              const entry = entryByDate.get(dateStr)
              const isToday = dateStr === today
              const phaseColor = entry ? PHASE_INFO[entry.phase].color : null
              return (
                <div
                  key={dayNum}
                  onClick={() => openModal(dateStr)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px', borderRadius: '50%', margin: '0 auto',
                    background: phaseColor ? `${phaseColor}b3` : 'transparent',
                    border: isToday ? '2px solid #fff' : phaseColor ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    color: phaseColor ? '#fff' : '#9ca3af',
                    fontSize: '0.75rem', fontWeight: isToday ? 700 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {dayNum}
                </div>
              )
            })}
          </div>
        </div>

        {/* Phase Intelligence Panel */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ color: '#e5e7eb', fontWeight: 700, fontSize: '1rem', marginBottom: '14px' }}>Phase Intelligence</h2>
          {!currentPhaseInfo ? (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Start tracking to see your phase intelligence.</p>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: currentPhaseInfo.color, flexShrink: 0 }} />
                <span style={{ color: currentPhaseInfo.color, fontWeight: 700, textTransform: 'capitalize', fontSize: '1.1rem' }}>{currentPhaseInfo.phase} Phase</span>
                <span style={{ color: '#9ca3af', fontSize: '0.8rem', marginLeft: 'auto' }}>Mood: {currentPhaseInfo.mood}</span>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Energy</span>
                  <span style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'capitalize' }}>{currentPhaseInfo.energy}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '6px' }}>
                  <div style={{ background: currentPhaseInfo.color, borderRadius: '4px', height: '6px', width: `${levelBar(currentPhaseInfo.energy)}%`, transition: 'width 0.4s' }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Cognitive clarity</span>
                  <span style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'capitalize' }}>{currentPhaseInfo.cognitive}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '6px' }}>
                  <div style={{ background: currentPhaseInfo.color, borderRadius: '4px', height: '6px', width: `${levelBar(currentPhaseInfo.cognitive)}%`, transition: 'width 0.4s' }} />
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px 14px', borderLeft: `3px solid ${currentPhaseInfo.color}` }}>
                <div style={{ color: '#9ca3af', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Study Tip</div>
                <div style={{ color: '#e5e7eb', fontSize: '0.85rem', lineHeight: '1.5' }}>{currentPhaseInfo.studyTip}</div>
              </div>

              {latestEntry && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Next 7 Days Energy Forecast</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {next7Days.map((d, i) => {
                      const info = d.phase ? PHASE_INFO[d.phase] : null
                      return (
                        <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                          <div style={{ color: '#6b7280', fontSize: '0.65rem', marginBottom: '4px' }}>{d.label}</div>
                          <div style={{ width: '8px', height: `${info ? levelBar(info.energy) * 0.3 : 10}px`, background: info ? info.color : '#374151', borderRadius: '4px', margin: '0 auto', minHeight: '10px' }} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Period pain tip */}
        <div style={{ background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.2)', borderRadius: '16px', padding: '18px', marginBottom: '20px' }}>
          <div style={{ color: '#f472b6', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>Period Pain Tip</div>
          <p style={{ color: '#e5e7eb', fontSize: '0.875rem', lineHeight: '1.6', margin: 0 }}>
            Take ibuprofen at the <strong>first sign of pain</strong> — before it peaks. A hot water bottle on the abdomen provides significant relief. Ginger tea has clinical evidence for reducing menstrual pain (dysmenorrhea).
          </p>
        </div>

        <p style={{ color: '#4b5563', fontSize: '0.7rem', textAlign: 'center' }}>Your cycle data is private and encrypted. It is never shared.</p>
      </div>

      {/* Log Modal */}
      {logModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setLogModal(null)}>
          <div
            style={{ background: '#111118', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '640px', padding: '24px 20px 40px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ color: '#e5e7eb', fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Log Day</div>
            <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: '20px' }}>{logModal.date}</div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px' }}>Phase</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PHASE_ORDER.map(p => (
                  <button
                    key={p}
                    onClick={() => setModalPhase(p)}
                    style={{
                      padding: '7px 14px', borderRadius: '20px', border: modalPhase === p ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      background: modalPhase === p ? PHASE_INFO[p].color : 'rgba(255,255,255,0.05)',
                      color: modalPhase === p ? '#0a0a0f' : '#9ca3af', fontWeight: modalPhase === p ? 700 : 400,
                      cursor: 'pointer', textTransform: 'capitalize', fontSize: '0.85rem',
                    }}
                  >{p}</button>
                ))}
              </div>
            </div>

            {modalPhase === 'menstrual' && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px' }}>Flow Level</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['none', 'light', 'medium', 'heavy'] as FlowLevel[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setModalFlow(f)}
                      style={{
                        padding: '7px 14px', borderRadius: '20px', border: modalFlow === f ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        background: modalFlow === f ? '#f472b6' : 'rgba(255,255,255,0.05)',
                        color: modalFlow === f ? '#0a0a0f' : '#9ca3af', fontWeight: modalFlow === f ? 700 : 400,
                        cursor: 'pointer', textTransform: 'capitalize', fontSize: '0.8rem',
                      }}
                    >{f}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '18px' }}>
              <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px' }}>Energy Level</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setModalEnergy(n)}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: modalEnergy >= n ? '#f472b6' : 'rgba(255,255,255,0.06)',
                      border: 'none', color: modalEnergy >= n ? '#0a0a0f' : '#6b7280',
                      fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                    }}
                  >{n}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px' }}>Symptoms</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {SYMPTOMS.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    style={{
                      padding: '6px 12px', borderRadius: '16px',
                      background: modalSymptoms.includes(s) ? 'rgba(244,114,182,0.2)' : 'rgba(255,255,255,0.05)',
                      border: modalSymptoms.includes(s) ? '1px solid #f472b6' : '1px solid rgba(255,255,255,0.1)',
                      color: modalSymptoms.includes(s) ? '#f472b6' : '#9ca3af',
                      cursor: 'pointer', fontSize: '0.8rem',
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px' }}>Notes</div>
              <textarea
                value={modalNotes}
                onChange={e => setModalNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={3}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: '#e5e7eb', fontSize: '0.875rem', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={saveEntry}
              disabled={saving}
              style={{ width: '100%', padding: '14px', background: '#f472b6', border: 'none', borderRadius: '12px', color: '#0a0a0f', fontWeight: 700, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
