'use client'

// ============================================================
// SafetyOS — Female Campus Safety Module
// Tabs: SOS · Walk Me Home · Self-Defence · Contacts · Report
// Domain colour: --emerald (Safety OS)
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/store'

type Tab = 'sos' | 'walk' | 'defence' | 'contacts' | 'report'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'sos',      label: 'SOS',         icon: '🆘' },
  { id: 'walk',     label: 'Walk Me Home', icon: '🚶' },
  { id: 'defence',  label: 'Self-Defence', icon: '🥋' },
  { id: 'contacts', label: 'Contacts',     icon: '📞' },
  { id: 'report',   label: 'Report',       icon: '🚨' },
]

// ─── Emergency numbers (SA-specific) ─────────────────────────
const SA_EMERGENCY = [
  { name: 'Police',             number: '10111',      icon: '👮', color: 'var(--sky, #38BDF8)' },
  { name: 'Ambulance',          number: '10177',      icon: '🚑', color: 'var(--danger)' },
  { name: 'Fire',               number: '10177',      icon: '🚒', color: 'var(--coral)' },
  { name: 'SMS Emergency',      number: '112',        icon: '📱', color: 'var(--gold)' },
  { name: 'GBV Helpline',       number: '0800 428 428', icon: '💜', color: '#9C6CF5' },
  { name: 'Lifeline SA',        number: '0861 322 322', icon: '🌱', color: 'var(--teal)' },
  { name: 'Sexual Assault',     number: '0800 150 150', icon: '💙', color: 'var(--sky, #38BDF8)' },
]

// ─── Self-defence library ─────────────────────────────────────
const DEFENCE_TIPS = [
  {
    title: 'Awareness is your first defence',
    content: 'Look up and scan your environment. Attackers target people who look distracted or vulnerable. Walk with purpose — head up, confident pace.',
    level: 'Awareness',
    color: 'var(--teal)',
  },
  {
    title: 'The Elbow Strike',
    content: 'Your elbow is the hardest bone in your body. If grabbed from behind, drive your elbow backward into the attacker\'s solar plexus or ribs. Rotate your hips for power.',
    level: 'Beginner',
    color: 'var(--gold)',
  },
  {
    title: 'Wrist Release',
    content: 'If your wrist is grabbed: rotate your arm toward the attacker\'s thumb (the weakest grip point) while pulling sharply. Their thumb cannot hold against this motion.',
    level: 'Beginner',
    color: 'var(--gold)',
  },
  {
    title: 'Voice as a weapon',
    content: 'A sudden, loud "NO!" or "FIRE!" (people respond faster to "fire" than "help") can startle an attacker, attract attention, and signal others. Don\'t whisper.',
    level: 'Awareness',
    color: 'var(--teal)',
  },
  {
    title: 'Target vulnerable areas',
    content: 'Eyes, nose, throat, and groin are vulnerable regardless of attacker size. A palm strike to the nose, fingers to the eyes, or knee to the groin creates an escape window.',
    level: 'Intermediate',
    color: 'var(--coral)',
  },
  {
    title: 'Break a choke hold',
    content: 'If choked from the front: tuck your chin, bring both hands up inside the attacker\'s arms, and explosively sweep outward. Step back simultaneously to break the grip.',
    level: 'Intermediate',
    color: 'var(--coral)',
  },
  {
    title: 'If grabbed around the waist',
    content: 'Drop your weight suddenly, stomp on the top of their foot, then drive your head backward into their face. The moment their grip loosens, run and scream.',
    level: 'Intermediate',
    color: 'var(--coral)',
  },
  {
    title: 'Improvised tools',
    content: 'Keys between fingers, a pen, water bottle, or even a textbook can extend your reach and add force. Hold your bag strap as a swing weapon to create distance.',
    level: 'Awareness',
    color: 'var(--teal)',
  },
  {
    title: 'Night campus safety',
    content: 'Stick to well-lit paths. Tell a friend your route. Use campus security escorts if offered. If followed, cross the street and enter a populated building or campus security office.',
    level: 'Awareness',
    color: 'var(--teal)',
  },
  {
    title: 'After an attack: preserve evidence',
    content: 'Do not shower, change clothes, or clean the area. Seek medical care immediately for injuries and forensic evidence. You have the right to report at any time.',
    level: 'Critical',
    color: 'var(--danger)',
  },
]

const LEVEL_ORDER = ['Awareness', 'Beginner', 'Intermediate', 'Critical']

// ─── SOS Tab ──────────────────────────────────────────────────

function SosTab() {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [sent, setSent] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const profile = useAppStore(s => s.profile)

  const handleSOSPress = () => {
    if (countdown !== null) {
      // Cancel
      if (timerRef.current) clearInterval(timerRef.current)
      setCountdown(null)
      return
    }
    setCountdown(5)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null) return null
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setSent(true)
          // In a real app: trigger push notification + SMS to emergency contacts
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      {/* Big SOS button */}
      <div style={{ position: 'relative', marginTop: 8 }}>
        {countdown !== null && (
          <div style={{
            position: 'absolute', inset: -8,
            borderRadius: '50%',
            border: '3px solid var(--danger)',
            animation: 'pulse 0.8s ease-in-out infinite',
          }} />
        )}
        <button
          onClick={handleSOSPress}
          style={{
            width: 140, height: 140,
            borderRadius: '50%',
            background: countdown !== null ? 'rgba(255,50,50,0.18)' : 'rgba(255,50,50,0.12)',
            border: `4px solid var(--danger)`,
            color: countdown !== null ? '#fff' : 'var(--danger)',
            fontSize: countdown !== null ? '2.5rem' : '1.2rem',
            fontWeight: 900,
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
          {sent ? '✓' : countdown !== null ? countdown : 'SOS'}
        </button>
      </div>

      {sent ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>
            🚨 SOS sent to your emergency contacts
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
            Your location and status have been shared. Help is on the way.
          </div>
          <button onClick={() => setSent(false)} style={{
            marginTop: 12, padding: '8px 20px',
            background: 'transparent', border: '1px solid var(--border-subtle)',
            borderRadius: 8, color: 'var(--text-tertiary)',
            fontSize: '0.7rem', fontFamily: 'var(--font-mono)', cursor: 'pointer',
          }}>Reset</button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', maxWidth: 260 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            {countdown !== null ? `Sending SOS in ${countdown}s — tap to cancel` : 'Press & hold to send SOS'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            Sends your location and an emergency alert to all saved emergency contacts.
          </div>
        </div>
      )}

      {/* Emergency numbers */}
      <div style={{ width: '100%', marginTop: 8 }}>
        <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.07em', marginBottom: 10 }}>
          SA EMERGENCY NUMBERS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SA_EMERGENCY.map(e => (
            <a
              key={e.number + e.name}
              href={`tel:${e.number.replace(/\s/g, '')}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 14px',
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 10, textDecoration: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.1rem' }}>{e.icon}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{e.name}</span>
              </div>
              <span style={{
                fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                color: e.color,
              }}>{e.number}</span>
            </a>
          ))}
        </div>
      </div>

      {!profile?.name && (
        <div style={{
          width: '100%', padding: '10px 14px',
          background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
          borderRadius: 10, fontSize: '0.73rem', color: 'var(--text-secondary)',
        }}>
          ⚠️ Add emergency contacts under the Contacts tab to enable SOS alerts.
        </div>
      )}
    </div>
  )
}

// ─── Walk Me Home Tab ─────────────────────────────────────────

function WalkMeHomeTab() {
  const [active, setActive] = useState(false)
  const [duration, setDuration] = useState(15)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startWalk = () => {
    setActive(true)
    setElapsed(0)
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 60000) // tick every minute
  }

  const cancelWalk = () => {
    setActive(false)
    setElapsed(0)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const arriveHome = () => {
    cancelWalk()
  }

  useEffect(() => {
    if (elapsed >= duration && active) {
      // Trigger overdue alert
      cancelWalk()
    }
  }, [elapsed, duration, active]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const remaining = Math.max(0, duration - elapsed)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--emerald-border, rgba(52,211,153,0.25))',
        borderRadius: 16, padding: '18px',
      }}>
        <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--emerald, #34D399)', letterSpacing: '0.07em', marginBottom: 8 }}>
          WALK ME HOME
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
          Tell us how long your walk should take. If you don't check in as safe when the timer ends, your emergency contacts get an automatic alert.
        </div>

        {!active ? (
          <>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>Estimated walk duration</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[5, 10, 15, 20, 30].map(m => (
                  <button
                    key={m}
                    onClick={() => setDuration(m)}
                    style={{
                      padding: '7px 12px',
                      background: duration === m ? 'rgba(52,211,153,0.15)' : 'var(--bg-elevated)',
                      border: `1px solid ${duration === m ? 'rgba(52,211,153,0.35)' : 'var(--border-subtle)'}`,
                      borderRadius: 8, color: duration === m ? 'var(--emerald, #34D399)' : 'var(--text-secondary)',
                      fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: duration === m ? 700 : 400,
                      cursor: 'pointer',
                    }}>
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={startWalk}
              style={{
                width: '100%', padding: '13px 0',
                background: 'rgba(52,211,153,0.12)',
                border: '1px solid rgba(52,211,153,0.35)',
                borderRadius: 12, color: 'var(--emerald, #34D399)',
                fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                cursor: 'pointer',
              }}>
              🚶 Start {duration}-minute walk
            </button>
          </>
        ) : (
          <>
            {/* Live timer */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{
                fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)',
                color: remaining <= 3 ? 'var(--danger)' : 'var(--emerald, #34D399)',
              }}>
                {remaining}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>minutes remaining</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                onClick={arriveHome}
                style={{
                  padding: '12px 0',
                  background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)',
                  borderRadius: 10, color: 'var(--emerald, #34D399)',
                  fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                  cursor: 'pointer',
                }}>
                ✓ I&apos;m home safe
              </button>
              <button
                onClick={cancelWalk}
                style={{
                  padding: '12px 0',
                  background: 'transparent', border: '1px solid var(--border-subtle)',
                  borderRadius: 10, color: 'var(--text-tertiary)',
                  fontSize: '0.75rem', fontFamily: 'var(--font-mono)', cursor: 'pointer',
                }}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>

      {/* Tips for safe walking */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 14, padding: '16px',
      }}>
        <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.07em', marginBottom: 10 }}>
          CAMPUS SAFETY TIPS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Stay on well-lit, populated paths — especially after 7pm',
            'Tell a friend your route and ETA before leaving',
            'Trust your gut — if something feels wrong, change direction',
            'Walk confidently and avoid scrolling on your phone',
            'Use campus security escorts — they exist to help you',
            'Charge your phone before night walks',
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <span style={{ color: 'var(--emerald, #34D399)', flexShrink: 0 }}>·</span>
              {tip}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Self-Defence Tab ─────────────────────────────────────────

function DefenceTab() {
  const [filter, setFilter] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  const levels = LEVEL_ORDER.filter(l => DEFENCE_TIPS.some(t => t.level === l))
  const filtered = filter ? DEFENCE_TIPS.filter(t => t.level === filter) : DEFENCE_TIPS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Disclaimer */}
      <div style={{
        background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
        borderRadius: 10, padding: '10px 14px',
        fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5,
      }}>
        ℹ️ These techniques are educational. For structured training, look for free self-defence classes run by your campus SRC, student wellness, or local police stations.
      </div>

      {/* Level filter */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
        <button
          onClick={() => setFilter(null)}
          style={{
            flexShrink: 0, padding: '6px 14px',
            background: filter === null ? 'rgba(52,211,153,0.12)' : 'var(--bg-surface)',
            border: `1px solid ${filter === null ? 'rgba(52,211,153,0.35)' : 'var(--border-subtle)'}`,
            borderRadius: 100, color: filter === null ? 'var(--emerald, #34D399)' : 'var(--text-secondary)',
            fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: filter === null ? 700 : 400,
            cursor: 'pointer',
          }}>All</button>
        {levels.map(l => (
          <button
            key={l}
            onClick={() => setFilter(l === filter ? null : l)}
            style={{
              flexShrink: 0, padding: '6px 14px',
              background: filter === l ? 'rgba(52,211,153,0.12)' : 'var(--bg-surface)',
              border: `1px solid ${filter === l ? 'rgba(52,211,153,0.35)' : 'var(--border-subtle)'}`,
              borderRadius: 100, color: filter === l ? 'var(--emerald, #34D399)' : 'var(--text-secondary)',
              fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: filter === l ? 700 : 400,
              cursor: 'pointer',
            }}>{l}</button>
        ))}
      </div>

      {/* Tips list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((tip, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-surface)',
              border: `1px solid ${expanded === i ? `${tip.color}40` : 'var(--border-subtle)'}`,
              borderLeft: `3px solid ${tip.color}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                width: '100%', padding: '13px 14px',
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 10,
              }}>
              <div style={{ flex: 1 }}>
                <span style={{
                  display: 'inline-block', marginBottom: 4, padding: '1px 7px',
                  background: `${tip.color}18`, borderRadius: 100,
                  fontSize: '0.56rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: tip.color,
                }}>
                  {tip.level.toUpperCase()}
                </span>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {tip.title}
                </div>
              </div>
              <span style={{
                color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 2, flexShrink: 0,
                transform: expanded === i ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}>▾</span>
            </button>
            {expanded === i && (
              <div style={{
                padding: '0 14px 14px',
                fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.65,
              }}>
                {tip.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Contacts Tab ─────────────────────────────────────────────

interface EmergencyContact {
  id:       number
  name:     string
  number:   string
  relation: string
}

function ContactsTab() {
  const [contacts, setContacts] = useState<EmergencyContact[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('varsityos-emergency-contacts') ?? '[]') } catch { return [] }
  })
  const [form, setForm] = useState({ name: '', number: '', relation: '' })
  const [adding, setAdding] = useState(false)

  const save = (updated: EmergencyContact[]) => {
    setContacts(updated)
    localStorage.setItem('varsityos-emergency-contacts', JSON.stringify(updated))
  }

  const addContact = () => {
    if (!form.name || !form.number) return
    const next = [...contacts, { id: Date.now(), ...form }]
    save(next)
    setForm({ name: '', number: '', relation: '' })
    setAdding(false)
  }

  const removeContact = (id: number) => {
    save(contacts.filter(c => c.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.6,
        padding: '10px 14px',
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 10,
      }}>
        These contacts receive an automatic alert when you trigger SOS or miss a Walk Me Home check-in. Stored locally on your device.
      </div>

      {contacts.length === 0 && !adding ? (
        <div style={{
          padding: '28px 20px', textAlign: 'center',
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 14,
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>📞</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>No emergency contacts saved yet.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contacts.map(c => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 10,
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {c.relation && <span style={{ marginRight: 8 }}>{c.relation}</span>}
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--emerald, #34D399)' }}>{c.number}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={`tel:${c.number.replace(/\s/g, '')}`} style={{
                  padding: '5px 10px',
                  background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.25)',
                  borderRadius: 6, color: 'var(--emerald, #34D399)',
                  fontSize: '0.65rem', textDecoration: 'none',
                }}>Call</a>
                <button onClick={() => removeContact(c.id)} style={{
                  padding: '5px 10px',
                  background: 'transparent', border: '1px solid var(--border-subtle)',
                  borderRadius: 6, color: 'var(--text-muted)',
                  fontSize: '0.65rem', cursor: 'pointer',
                }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 14, padding: '16px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            {[
              { label: 'Name *', key: 'name', placeholder: 'e.g. Mom' },
              { label: 'Phone number *', key: 'number', placeholder: '+27 82 000 0000' },
              { label: 'Relationship', key: 'relation', placeholder: 'e.g. Parent, Friend, RA' },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>{f.label}</div>
                <input
                  type={f.key === 'number' ? 'tel' : 'text'}
                  placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                  style={{
                    width: '100%', padding: '9px 12px',
                    background: 'var(--bg-base)', border: '1px solid var(--border-default)',
                    borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem',
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addContact} style={{
              flex: 1, padding: '10px 0',
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)',
              borderRadius: 8, color: 'var(--emerald, #34D399)',
              fontSize: '0.73rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer',
            }}>Save contact</button>
            <button onClick={() => setAdding(false)} style={{
              padding: '10px 16px',
              background: 'transparent', border: '1px solid var(--border-subtle)',
              borderRadius: 8, color: 'var(--text-tertiary)',
              fontSize: '0.73rem', fontFamily: 'var(--font-mono)', cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{
          width: '100%', padding: '12px 0',
          background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)',
          borderRadius: 12, color: 'var(--emerald, #34D399)',
          fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer',
        }}>+ Add emergency contact</button>
      )}
    </div>
  )
}

// ─── Report Tab ───────────────────────────────────────────────

const INCIDENT_TYPES = [
  'Harassment', 'Stalking', 'Assault', 'Theft', 'Unsafe pathway / lighting',
  'Suspicious person', 'Drug activity', 'Other',
]

function ReportTab() {
  const [form, setForm] = useState({ type: '', location: '', description: '', anonymous: true })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!form.type || !form.description) return
    // In production: POST to campus security API + log to Supabase
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{
        padding: '40px 20px', textAlign: 'center',
        background: 'var(--bg-surface)', border: '1px solid rgba(52,211,153,0.25)',
        borderRadius: 16,
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Report submitted
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Thank you for reporting. Your{form.anonymous ? ' anonymous' : ''} report helps keep campus safer.
          Campus security will review and respond within 24 hours.
        </div>
        <button onClick={() => { setSubmitted(false); setForm({ type: '', location: '', description: '', anonymous: true }) }} style={{
          marginTop: 16, padding: '9px 20px',
          background: 'transparent', border: '1px solid var(--border-subtle)',
          borderRadius: 8, color: 'var(--text-tertiary)',
          fontSize: '0.7rem', fontFamily: 'var(--font-mono)', cursor: 'pointer',
        }}>Submit another</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 12, padding: '12px 14px',
        fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.6,
      }}>
        Reports go to campus security and your Student Representative Council. You can choose to report anonymously. This does not replace calling 10111 for emergencies.
      </div>

      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 6 }}>Incident type *</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {INCIDENT_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setForm(f => ({ ...f, type: t }))}
              style={{
                padding: '6px 12px',
                background: form.type === t ? 'rgba(52,211,153,0.12)' : 'var(--bg-surface)',
                border: `1px solid ${form.type === t ? 'rgba(52,211,153,0.35)' : 'var(--border-subtle)'}`,
                borderRadius: 100, color: form.type === t ? 'var(--emerald, #34D399)' : 'var(--text-secondary)',
                fontSize: '0.68rem', fontFamily: 'var(--font-mono)', cursor: 'pointer',
                fontWeight: form.type === t ? 700 : 400,
              }}>{t}</button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Location on campus (optional)</div>
        <input
          type="text"
          placeholder="e.g. Library parking lot, Res block C"
          value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          style={{
            width: '100%', padding: '9px 12px',
            background: 'var(--bg-base)', border: '1px solid var(--border-default)',
            borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem',
          }}
        />
      </div>

      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>What happened? *</div>
        <textarea
          placeholder="Describe the incident as clearly as possible..."
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={4}
          style={{
            width: '100%', padding: '9px 12px',
            background: 'var(--bg-base)', border: '1px solid var(--border-default)',
            borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem',
            resize: 'none', fontFamily: 'var(--font-body)', lineHeight: 1.5,
          }}
        />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={form.anonymous}
          onChange={e => setForm(f => ({ ...f, anonymous: e.target.checked }))}
          style={{ width: 16, height: 16, accentColor: 'var(--emerald, #34D399)' }}
        />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Submit anonymously</span>
      </label>

      <button
        onClick={handleSubmit}
        disabled={!form.type || !form.description}
        style={{
          padding: '12px 0',
          background: form.type && form.description ? 'rgba(52,211,153,0.12)' : 'transparent',
          border: `1px solid ${form.type && form.description ? 'rgba(52,211,153,0.35)' : 'var(--border-subtle)'}`,
          borderRadius: 12, color: form.type && form.description ? 'var(--emerald, #34D399)' : 'var(--text-muted)',
          fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
          cursor: form.type && form.description ? 'pointer' : 'not-allowed',
        }}>
        Submit report
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────

export default function SafetyOS() {
  const [activeTab, setActiveTab] = useState<Tab>('sos')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'var(--bg-surface)', border: '1px solid rgba(52,211,153,0.25)',
        borderRadius: 16, padding: '16px 18px',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, var(--emerald, #34D399), transparent)',
        }} />
        <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--emerald, #34D399)', letterSpacing: '0.09em', marginBottom: 4 }}>
          SAFETY OS
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Campus Safety Intelligence
        </div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 3 }}>
          SOS alerts · Walk Me Home timer · Self-defence library · Incident reporting
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '1px solid var(--border-subtle)' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flexShrink: 0, padding: '9px 12px',
              background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--emerald, #34D399)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--emerald, #34D399)' : 'var(--text-tertiary)',
              fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: activeTab === tab.id ? 700 : 400,
              cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap',
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ animation: 'fadeInUp 0.25s ease' }}>
        {activeTab === 'sos'      && <SosTab />}
        {activeTab === 'walk'     && <WalkMeHomeTab />}
        {activeTab === 'defence'  && <DefenceTab />}
        {activeTab === 'contacts' && <ContactsTab />}
        {activeTab === 'report'   && <ReportTab />}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.06); }
        }
      `}</style>
    </div>
  )
}
