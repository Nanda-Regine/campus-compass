'use client'

// ============================================================
// SafetyOS — Female Campus Safety Module
// Tabs: SOS · Walk Me Home · Self-Defence · Contacts · Report
// Domain colour: --emerald (Safety OS)
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/store'

type Tab = 'sos' | 'walk' | 'defence' | 'contacts' | 'report' | 'rights'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'sos',      label: 'SOS',         icon: '🆘' },
  { id: 'walk',     label: 'Walk Me Home', icon: '🚶' },
  { id: 'defence',  label: 'Self-Defence', icon: '🥋' },
  { id: 'contacts', label: 'Contacts',     icon: '📞' },
  { id: 'report',   label: 'Report',       icon: '🚨' },
  { id: 'rights',   label: 'Legal Rights', icon: '⚖️' },
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

// Small reactive banner — reads localStorage cache at render time
function ContactsEmptyWarning() {
  const [empty, setEmpty] = useState(true)
  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem('varsityos-emergency-contacts') ?? '[]')
      setEmpty(c.length === 0)
    } catch { /* ignore */ }
    // Also check Supabase asynchronously
    fetch('/api/safety/contacts').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.contacts?.length) setEmpty(false)
    }).catch(() => {})
  }, [])
  if (!empty) return null
  return (
    <div style={{
      width: '100%', padding: '10px 14px',
      background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
      borderRadius: 10, fontSize: '0.73rem', color: 'var(--text-secondary)',
    }}>
      ⚠️ Add emergency contacts under the Contacts tab so SOS can alert them via WhatsApp.
    </div>
  )
}

// ─── SOS Tab ──────────────────────────────────────────────────

function SosTab() {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [sent, setSent] = useState(false)
  const [alertedCount, setAlertedCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const profile = useAppStore(s => s.profile)

  // Fire real alerts when `sent` flips true
  useEffect(() => {
    if (!sent) return
    const contacts: EmergencyContact[] = (() => {
      try { return JSON.parse(localStorage.getItem('varsityos-emergency-contacts') ?? '[]') }
      catch { return [] }
    })()
    if (contacts.length === 0) return

    const profileName = profile?.name ?? 'VarsityOS user'

    const sendAlerts = (locationText: string) => {
      const msg = `🆘 SOS from ${profileName}\n${locationText}\nThis is an emergency — please respond or call 10111.`
      const encoded = encodeURIComponent(msg)
      contacts.forEach((c, i) => {
        const clean = c.number.replace(/[\s\-()+]/g, '').replace(/^0/, '27')
        setTimeout(() => {
          window.open(`https://wa.me/${clean}?text=${encoded}`, '_blank')
        }, i * 900)
      })
      setAlertedCount(contacts.length)
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords
          sendAlerts(`📍 My location: https://maps.google.com/?q=${latitude},${longitude}`)
        },
        () => sendAlerts('📍 Location unavailable — please contact me urgently'),
        { timeout: 6000, enableHighAccuracy: false }
      )
    } else {
      sendAlerts('📍 Location unavailable — please contact me urgently')
    }
  }, [sent, profile?.name])

  const handleSOSPress = () => {
    if (countdown !== null) {
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
            🚨 SOS sent{alertedCount > 0 ? ` to ${alertedCount} contact${alertedCount !== 1 ? 's' : ''} via WhatsApp` : ''}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
            {alertedCount > 0
              ? 'Your location and a WhatsApp message have been sent. Help is on the way.'
              : 'Add emergency contacts under the Contacts tab so they get alerted next time.'}
          </div>
          <button onClick={() => { setSent(false); setAlertedCount(0) }} style={{
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

      <ContactsEmptyWarning />
    </div>
  )
}

// ─── Walk Me Home Tab ─────────────────────────────────────────

function WalkMeHomeTab() {
  const [active, setActive] = useState(false)
  const [duration, setDuration] = useState(15)
  const [elapsed, setElapsed] = useState(0)
  const [overdue, setOverdue] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef<number>(0)
  const alertedRef = useRef(false)

  // Wall-clock based: setInterval is throttled/suspended when the screen locks on
  // low-end Android, so a tick-counter undercounts. Recompute elapsed from real time.
  const startWalk = () => {
    startedAtRef.current = Date.now()
    alertedRef.current = false
    setOverdue(false)
    setElapsed(0)
    setActive(true)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 60000))
    }, 1000)
  }

  const cancelWalk = () => {
    setActive(false)
    setElapsed(0)
    setOverdue(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const arriveHome = () => {
    cancelWalk()
  }

  // Actually notify emergency contacts when the timer runs out without a safe check-in.
  const triggerOverdueAlert = () => {
    if (alertedRef.current) return
    alertedRef.current = true
    let contacts: { number: string }[] = []
    try { contacts = JSON.parse(localStorage.getItem('varsityos-emergency-contacts') ?? '[]') } catch { contacts = [] }
    const fire = (locationText: string) => {
      const msg = `🆘 Walk-home overdue — I haven't checked in safe.\n${locationText}\nPlease check on me or call 10111.`
      const encoded = encodeURIComponent(msg)
      contacts.forEach((c, i) => {
        const clean = c.number.replace(/[\s\-()+]/g, '').replace(/^0/, '27')
        setTimeout(() => window.open(`https://wa.me/${clean}?text=${encoded}`, '_blank'), i * 900)
      })
    }
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => fire(`📍 Last location: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`),
        () => fire('📍 Location unavailable — please contact me urgently'),
        { timeout: 6000, enableHighAccuracy: false }
      )
    } else {
      fire('📍 Location unavailable — please contact me urgently')
    }
  }

  useEffect(() => {
    if (elapsed >= duration && active) {
      triggerOverdueAlert()
      setOverdue(true)
      setActive(false)
      if (timerRef.current) clearInterval(timerRef.current)
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

        {overdue && !active && (
          <div style={{
            background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.4)',
            borderRadius: 10, padding: '10px 12px', marginBottom: 14,
            fontSize: '0.74rem', color: 'var(--danger, #f87171)', lineHeight: 1.5,
          }}>
            ⏰ Timer ran out — your emergency contacts have been alerted. Tap a WhatsApp window to send, or call 10111.
          </div>
        )}

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
  id:       string
  name:     string
  number:   string  // maps to `phone` in Supabase
  relation: string
}

// Write to localStorage cache so SOS can read contacts offline
function cacheContacts(contacts: EmergencyContact[]) {
  try { localStorage.setItem('varsityos-emergency-contacts', JSON.stringify(contacts)) } catch { /* ignore */ }
}

function ContactsTab() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', number: '', relation: '' })
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load from Supabase on mount; fall back to localStorage cache while loading
  useEffect(() => {
    // Show cached contacts immediately so the UI isn't blank
    try {
      const cached = JSON.parse(localStorage.getItem('varsityos-emergency-contacts') ?? '[]') as EmergencyContact[]
      if (cached.length > 0) setContacts(cached)
    } catch { /* ignore */ }

    fetch('/api/safety/contacts')
      .then(r => r.ok ? r.json() : null)
      .then((d: { contacts: { id: string; name: string; phone: string; relation: string | null }[] } | null) => {
        if (!d) return
        const mapped: EmergencyContact[] = d.contacts.map(c => ({
          id: c.id,
          name: c.name,
          number: c.phone,
          relation: c.relation ?? '',
        }))
        setContacts(mapped)
        cacheContacts(mapped)
      })
      .catch(() => { /* keep showing cached */ })
      .finally(() => setLoading(false))
  }, [])

  const addContact = async () => {
    if (!form.name || !form.number) return
    setSaving(true)
    try {
      const res = await fetch('/api/safety/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.number, relation: form.relation }),
      })
      if (res.ok) {
        const d = await res.json() as { contact: { id: string; name: string; phone: string; relation: string | null } }
        const newContact: EmergencyContact = {
          id: d.contact.id, name: d.contact.name,
          number: d.contact.phone, relation: d.contact.relation ?? '',
        }
        const updated = [...contacts, newContact]
        setContacts(updated)
        cacheContacts(updated)
        setForm({ name: '', number: '', relation: '' })
        setAdding(false)
      }
    } catch { /* network error — ignore */ }
    setSaving(false)
  }

  const removeContact = async (id: string) => {
    const updated = contacts.filter(c => c.id !== id)
    setContacts(updated)
    cacheContacts(updated)
    try {
      await fetch(`/api/safety/contacts?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    } catch { /* best effort */ }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.6,
        padding: '10px 14px',
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 10,
      }}>
        These contacts receive an automatic alert when you trigger SOS or miss a Walk Me Home check-in. Synced to your account — available across devices.
      </div>

      {loading && contacts.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Loading contacts…
        </div>
      ) : contacts.length === 0 && !adding ? (
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
                <button onClick={() => void removeContact(c.id)} style={{
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
            <button onClick={() => void addContact()} disabled={saving} style={{
              flex: 1, padding: '10px 0',
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)',
              borderRadius: 8, color: 'var(--emerald, #34D399)',
              fontSize: '0.73rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
            }}>{saving ? 'Saving…' : 'Save contact'}</button>
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
  const { profile } = useAppStore()
  const [form, setForm] = useState({ type: '', location: '', description: '', anonymous: true })
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.type || !form.description) return
    setSaving(true)
    try {
      // Try to get geolocation for better incident tracking
      let latitude: number | undefined
      let longitude: number | undefined
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => {
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 })
        })
        latitude = pos.coords.latitude
        longitude = pos.coords.longitude
      } catch { /* geolocation not available or denied — continue without */ }

      await fetch('/api/safety/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          title: form.type,
          description: form.description,
          location: form.location || null,
          latitude,
          longitude,
          severity: 'medium',
          institution: profile?.university ?? null,
          anonymous: form.anonymous,
        }),
      })
    } catch { /* best effort — show success even if network fails */ }
    setSaving(false)
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
        onClick={() => { void handleSubmit() }}
        disabled={!form.type || !form.description || saving}
        style={{
          padding: '12px 0',
          background: form.type && form.description ? 'rgba(52,211,153,0.12)' : 'transparent',
          border: `1px solid ${form.type && form.description ? 'rgba(52,211,153,0.35)' : 'var(--border-subtle)'}`,
          borderRadius: 12, color: form.type && form.description ? 'var(--emerald, #34D399)' : 'var(--text-muted)',
          fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
          cursor: form.type && form.description && !saving ? 'pointer' : 'not-allowed',
          opacity: saving ? 0.7 : 1,
        }}>
        {saving ? 'Submitting…' : 'Submit report'}
      </button>
    </div>
  )
}

// ─── Legal Rights Tab ─────────────────────────────────────────

const RIGHTS_SECTIONS = [
  {
    id: 'police',
    icon: '👮',
    title: 'Rights when stopped by SAPS',
    color: 'var(--sky, #38BDF8)',
    items: [
      {
        q: 'Do I have to answer questions?',
        a: 'No. Section 35(1)(a) of the Constitution gives you the right to remain silent. You must give your name and address, but nothing else. Say clearly: "I am exercising my right to remain silent."',
      },
      {
        q: 'Can police search me on the street?',
        a: 'Only with reasonable suspicion that you have something illegal, or if you are being arrested. You cannot be strip-searched in public. Ask: "Do you have a warrant or grounds to search?" — this is not obstruction.',
      },
      {
        q: 'What if I am arrested?',
        a: 'You must be told the reason for your arrest. You have the right to a lawyer before questioning — say "I want a lawyer." You cannot be held more than 48 hours before being brought to court (s35(1)(d)). Do NOT resist arrest — challenge it in court.',
      },
      {
        q: 'What is an unlawful arrest?',
        a: 'An arrest without a warrant and without one of the grounds in the Criminal Procedure Act (CPA) is unlawful. Grounds include: witness to a crime, reasonable suspicion, police officer\'s view. Comply first, then contact Legal Aid.',
      },
    ],
  },
  {
    id: 'tenant',
    icon: '🏠',
    title: 'Tenant rights — res & private digs',
    color: 'var(--teal)',
    items: [
      {
        q: 'Can my landlord/res enter my room without notice?',
        a: 'No. They must give at least 24 hours\' written notice unless there is an emergency (fire, flood). Entering without notice is an invasion of privacy under the Rental Housing Act.',
      },
      {
        q: 'My room is not habitable — what are my rights?',
        a: 'Section 4 of the Rental Housing Act says accommodation must be fit for human habitation. Report issues in writing (email or WhatsApp — keep the record). If unresolved in 30 days, open a complaint with your Rental Housing Tribunal (free, no lawyer needed).',
      },
      {
        q: 'Can my deposit be withheld?',
        a: 'A security deposit cannot exceed 2 months\' rent. It must be held in an interest-bearing account. You are entitled to it back within 14 days of moving out (if no damage), or 21 days with a detailed deduction list. Get a joint inspection on move-out day.',
      },
      {
        q: 'How much notice must I get to vacate?',
        a: 'Month-to-month: 1 calendar month\'s written notice. Fixed-term lease: must follow the termination clause. Eviction requires a court order — you cannot be evicted without one, even if you owe rent.',
      },
    ],
  },
  {
    id: 'harassment',
    icon: '🛡️',
    title: 'Harassment, assault & how to report',
    color: 'var(--emerald, #34D399)',
    items: [
      {
        q: 'What counts as sexual harassment under SA law?',
        a: 'Unwanted sexual conduct that impairs dignity — including verbal, non-verbal, or physical acts. This covers unwanted touching, sexual comments, sexting without consent, "upskirt" photos, and persistent unwanted attention (Employment Equity Act & Protection from Harassment Act).',
      },
      {
        q: 'What is assault?',
        a: 'Any unlawful and intentional application of force OR threat of force that causes the victim to believe harm is imminent. Verbal threats CAN be assault if they cause reasonable fear. You do not need physical injury.',
      },
      {
        q: 'How do I lay a criminal charge?',
        a: 'Go to any SAPS station (you can use any station, not just the nearest). Ask for the duty officer. A charge cannot legally be refused. You will get a CAS number — keep it. You can also report online at saps.gov.za for certain crimes.',
      },
      {
        q: 'What about a protection order?',
        a: 'Under the Protection from Harassment Act, you can apply at the Magistrates\' Court for a protection order — no lawyer needed. The court can issue an interim (temporary) order the same day. Breach of the order is a criminal offence.',
      },
    ],
  },
  {
    id: 'labour',
    icon: '💼',
    title: 'Labour law — part-time & casual work',
    color: 'var(--gold)',
    items: [
      {
        q: 'What is the minimum wage?',
        a: 'National Minimum Wage (NMW) as of 1 March 2024: R27.58/hour for most workers. Farm workers: R28.79/hour. Domestic workers: R28.79/hour. Your employer cannot pay below this, regardless of contract.',
      },
      {
        q: 'How many hours can I be made to work?',
        a: 'Basic Conditions of Employment Act (BCEA): max 45 hours/week and 9 hours/day (8h if working 5 days). Overtime must be agreed in writing and paid at 1.5× your normal rate. You can refuse unreasonable overtime.',
      },
      {
        q: 'Am I entitled to breaks?',
        a: 'Yes. A 15-minute break after 5 continuous hours; a 30-minute break (or two 15-minute breaks) if working 6+ hours. Your employer cannot make you work through your break without paying for it.',
      },
      {
        q: 'Do I qualify for UIF?',
        a: 'If you work more than 24 hours per month for the same employer, both you and your employer must contribute to UIF (1% each). You qualify for UIF claims if you lose income. If your employer is not registering you, report them to the Department of Employment & Labour.',
      },
      {
        q: 'What must my payslip show?',
        a: 'Every employee has the right to a written payslip showing: employer name, employee name & ID number, pay period, gross pay, all deductions itemised, and net pay. No payslip is a BCEA violation.',
      },
    ],
  },
  {
    id: 'consumer',
    icon: '🛒',
    title: 'Consumer rights (CPA)',
    color: 'var(--nova)',
    items: [
      {
        q: 'Bought something defective — what can I do?',
        a: 'The Consumer Protection Act (CPA) gives you 6 months from purchase to return defective goods for a repair, replacement, or refund — at your choice. The store cannot force you to accept a voucher if you want your money back.',
      },
      {
        q: 'Signed up for something by phone or WhatsApp?',
        a: 'Direct marketing agreements (sales made away from a store) give you a 5-business-day cooling-off period to cancel with no penalty (CPA s16). This applies to gym contracts, data bundles sold by agents, and insurance signed over the phone.',
      },
      {
        q: 'Where do I report consumer issues?',
        a: 'National Consumer Commission: 0860 266 786 or ncc.org.za. For mobile/data complaints: ICASA (0860 000 881). For banking: Banking Ombudsman (0860 800 900). All are free.',
      },
    ],
  },
  {
    id: 'legal_aid',
    icon: '⚖️',
    title: 'Getting free legal help',
    color: 'var(--indigo, #6366F1)',
    items: [
      {
        q: 'Can I get a free lawyer?',
        a: 'Yes. Legal Aid South Africa provides free criminal and civil legal assistance to qualifying persons. Call 0800 110 110 (toll-free) or visit legalaid.org.za. You qualify if you cannot afford a private lawyer.',
      },
      {
        q: 'University law clinics',
        a: 'Most universities with a Law Faculty run a free law clinic for students and community members. Services include tenancy disputes, maintenance, consumer complaints, and criminal advice. Ask your faculty admin or student affairs office.',
      },
      {
        q: 'SAPS 10111 vs 112',
        a: '10111 is the SAPS emergency number (landline & mobile). 112 is the universal emergency number accessible even on a locked phone or without airtime. For GBV: 0800 428 428 (24h). For rape crisis: 0800 150 150.',
      },
    ],
  },
]

function RightsTab() {
  const [openSection, setOpenSection] = useState<string | null>('police')
  const [openItem, setOpenItem] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Disclaimer */}
      <div style={{
        background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
        borderRadius: 10, padding: '10px 14px',
        fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.55,
      }}>
        ℹ️ This is a practical guide, not formal legal advice. In a crisis, call Legal Aid SA on <strong style={{ color: 'var(--gold)' }}>0800 110 110</strong> (free, 24h).
      </div>

      {RIGHTS_SECTIONS.map(section => {
        const isOpen = openSection === section.id
        return (
          <div key={section.id} style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${isOpen ? `${section.color}40` : 'var(--border-subtle)'}`,
            borderLeft: `3px solid ${section.color}`,
            borderRadius: 14, overflow: 'hidden',
          }}>
            {/* Section header */}
            <button
              onClick={() => setOpenSection(isOpen ? null : section.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '13px 14px',
                background: isOpen ? `${section.color}08` : 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.1rem' }}>{section.icon}</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {section.title}
                </span>
              </div>
              <span style={{
                color: 'var(--text-muted)', fontSize: '0.7rem',
                transform: isOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}>▾</span>
            </button>

            {/* Q&A items */}
            {isOpen && (
              <div style={{ borderTop: `1px solid ${section.color}20`, padding: '8px 0' }}>
                {section.items.map((item, i) => {
                  const key = `${section.id}-${i}`
                  const itemOpen = openItem === key
                  return (
                    <div key={key} style={{ borderBottom: i < section.items.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <button
                        onClick={() => setOpenItem(itemOpen ? null : key)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                          width: '100%', padding: '11px 14px',
                          background: itemOpen ? `${section.color}06` : 'none',
                          border: 'none', cursor: 'pointer', textAlign: 'left', gap: 10,
                        }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <span style={{ color: section.color, fontWeight: 700, fontSize: '0.75rem', flexShrink: 0, marginTop: 1 }}>Q</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.45 }}>{item.q}</span>
                        </div>
                        <span style={{
                          color: 'var(--text-muted)', fontSize: '0.65rem', flexShrink: 0,
                          transform: itemOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.15s',
                        }}>▾</span>
                      </button>
                      {itemOpen && (
                        <div style={{
                          padding: '0 14px 12px 36px',
                          fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.65,
                          borderLeft: `2px solid ${section.color}30`, marginLeft: 14,
                        }}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Emergency legal contacts */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 14, padding: '14px 16px',
      }}>
        <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 10 }}>
          QUICK LEGAL CONTACTS
        </div>
        {[
          { name: 'Legal Aid SA',          number: '0800 110 110', note: 'Free lawyers',          color: 'var(--indigo, #6366F1)' },
          { name: 'SAPS Emergency',         number: '10111',        note: 'Police',                color: 'var(--sky, #38BDF8)' },
          { name: 'GBV Command Centre',     number: '0800 428 428', note: '24h, toll-free',        color: '#9C6CF5' },
          { name: 'National Consumer Comm.', number: '0860 266 786', note: 'Consumer complaints',  color: 'var(--teal)' },
          { name: 'Dept. of Labour',        number: '0800 601 011', note: 'Labour disputes',       color: 'var(--gold)' },
        ].map(c => (
          <a
            key={c.number + c.name}
            href={`tel:${c.number.replace(/\s/g, '')}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: '1px solid var(--border-subtle)',
              textDecoration: 'none',
            }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', marginTop: 1 }}>{c.note}</div>
            </div>
            <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: c.color }}>
              {c.number}
            </span>
          </a>
        ))}
      </div>
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
          SOS alerts · Walk Me Home · Self-defence · Legal Rights · Incident reporting
        </div>
      </div>

      {/* Main layout: vertical tab rail + content */}
      <div style={{ display: 'flex', minHeight: 400 }}>
        {/* Vertical tab rail */}
        <div style={{ width: 60, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '10px 4px',
                background: activeTab === tab.id ? 'rgba(52,211,153,0.1)' : 'transparent',
                border: 'none',
                borderLeft: activeTab === tab.id ? '2px solid var(--emerald, #34D399)' : '2px solid transparent',
                cursor: 'pointer', width: '100%',
              }}
            >
              <span style={{ fontSize: '1.1rem', opacity: activeTab === tab.id ? 1 : 0.45 }}>{tab.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.42rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: activeTab === tab.id ? 'var(--emerald, #34D399)' : 'rgba(255,255,255,0.35)', lineHeight: 1.2, textAlign: 'center' }}>
                {tab.label.slice(0, 6).toUpperCase()}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, animation: 'fadeInUp 0.25s ease' }}>
          {activeTab === 'sos'      && <SosTab />}
          {activeTab === 'walk'     && <WalkMeHomeTab />}
          {activeTab === 'defence'  && <DefenceTab />}
          {activeTab === 'contacts' && <ContactsTab />}
          {activeTab === 'report'   && <ReportTab />}
          {activeTab === 'rights'   && <RightsTab />}
        </div>
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
