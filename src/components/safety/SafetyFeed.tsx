'use client'

// ============================================================
// SafetyFeed — Community safety awareness feed + incident reporting
// Tabs: feed | report | tips
// Accent: #f87171 (red/warm — empowering not alarming)
// ============================================================

import { useState, useEffect } from 'react'

type IncidentType = 'theft' | 'assault' | 'suspicious_activity' | 'infrastructure'
type Severity = 'low' | 'medium' | 'high'
type Filter = 'all' | 'verified' | 'near_me'

interface Incident {
  id: string
  type: IncidentType
  location: string
  description: string
  timeAgo: string
  severity: Severity
  verified: boolean
}

const MOCK_INCIDENTS: Incident[] = [
  {
    id: '1',
    type: 'theft',
    location: 'Library parking lot — Level B',
    description: 'Smash-and-grab on a silver hatchback. Laptop bag and backpack taken. Happened between 14:00 and 14:45.',
    timeAgo: '23 minutes ago',
    severity: 'high',
    verified: true,
  },
  {
    id: '2',
    type: 'suspicious_activity',
    location: 'Res Block D walkway',
    description: 'Unknown male loitering near Res D entrance for over an hour. Not responding to questions from students.',
    timeAgo: '1 hour ago',
    severity: 'medium',
    verified: true,
  },
  {
    id: '3',
    type: 'infrastructure',
    location: 'Science quad — east path',
    description: 'Three streetlights out on the east path between Sciences and Engineering. Route is very dark after 18:00.',
    timeAgo: '2 hours ago',
    severity: 'medium',
    verified: true,
  },
  {
    id: '4',
    type: 'assault',
    location: 'Main gate taxi rank',
    description: 'Student was mugged and pushed at the taxi rank while waiting. SAPS called. Avoid area after dark.',
    timeAgo: '4 hours ago',
    severity: 'high',
    verified: true,
  },
  {
    id: '5',
    type: 'theft',
    location: 'Commerce building — ground floor toilets',
    description: 'Phone taken from the charging station inside the ground floor bathroom. Remove your items when not in sight.',
    timeAgo: '6 hours ago',
    severity: 'low',
    verified: false,
  },
  {
    id: '6',
    type: 'suspicious_activity',
    location: 'Gym parking area',
    description: 'Unmarked van parked outside the gym for 3 hours with the engine running. Campus security has been notified.',
    timeAgo: '8 hours ago',
    severity: 'medium',
    verified: false,
  },
  {
    id: '7',
    type: 'infrastructure',
    location: 'Admin building — main stairwell',
    description: 'The CCTV camera on level 2 stairwell appears to have been covered. Facilities have been informed.',
    timeAgo: 'Yesterday',
    severity: 'medium',
    verified: true,
  },
  {
    id: '8',
    type: 'theft',
    location: 'Student Union cafeteria',
    description: 'Laptop stolen from a table while the owner was in the queue. Please do not leave items unattended.',
    timeAgo: 'Yesterday',
    severity: 'low',
    verified: true,
  },
]

const SAFETY_TIPS = [
  'Never leave your bag unattended, even for a moment. Theft happens fast.',
  'Trust your gut. If a route feels unsafe, take the longer but safer path.',
  'Campus security escorts are free — do not hesitate to call them at night.',
  'Save SAPS (10111) and your campus security number in your phone now.',
  'Walk with a friend after 19:00. There is safety in numbers.',
]

const TYPE_ICONS: Record<IncidentType, string> = {
  theft: '&#128188;',
  assault: '&#128680;',
  suspicious_activity: '&#9888;&#65039;',
  infrastructure: '&#128295;',
}

const TYPE_LABELS: Record<IncidentType, string> = {
  theft: 'Theft',
  assault: 'Assault',
  suspicious_activity: 'Suspicious Activity',
  infrastructure: 'Infrastructure',
}

const SEVERITY_COLORS: Record<Severity, string> = {
  low: '#34d399',
  medium: '#fb923c',
  high: '#f87171',
}

const INCIDENT_TYPES_FOR_FORM: IncidentType[] = ['theft', 'assault', 'suspicious_activity', 'infrastructure']

const FILTER_LABELS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'verified', label: 'Verified' },
  { id: 'near_me', label: 'Near me' },
]

const ACCENT = '#f87171'

interface ReportForm {
  type: IncidentType | ''
  location: string
  description: string
  anonymous: boolean
}

function ReportModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<ReportForm>({ type: '', location: '', description: '', anonymous: true })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!form.type || !form.description.trim()) return
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      onClose()
    }, 2500)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '0',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#0f1117',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px 20px 0 0',
        padding: '20px 20px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: ACCENT, letterSpacing: '0.08em', marginBottom: 2 }}>
              REPORT AN INCIDENT
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f3f4f6' }}>What happened?</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '1.2rem', cursor: 'pointer', padding: 4 }}
          >
            &#10005;
          </button>
        </div>

        {submitted ? (
          <div style={{
            padding: '32px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{ fontSize: '2.4rem' }}>&#10003;</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#34d399' }}>Submitted for verification</div>
            <div style={{ fontSize: '0.73rem', color: '#9ca3af', lineHeight: 1.6 }}>
              Thank you for keeping campus safer. Your report will be reviewed by campus security.
            </div>
          </div>
        ) : (
          <>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#6b7280', marginBottom: 8 }}>Incident type *</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {INCIDENT_TYPES_FOR_FORM.map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{
                      padding: '7px 13px',
                      background: form.type === t ? `${ACCENT}18` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${form.type === t ? `${ACCENT}50` : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 100,
                      color: form.type === t ? ACCENT : '#9ca3af',
                      fontSize: '0.73rem',
                      fontWeight: form.type === t ? 700 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', color: '#6b7280', marginBottom: 5 }}>Location on campus (optional)</div>
              <input
                type="text"
                placeholder="e.g. Library parking lot, Res block C"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  color: '#e5e7eb',
                  fontSize: '0.82rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', color: '#6b7280', marginBottom: 5 }}>What happened? *</div>
              <textarea
                placeholder="Describe the incident as clearly as possible — time, description of people involved, what was taken or said..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  color: '#e5e7eb',
                  fontSize: '0.82rem',
                  outline: 'none',
                  resize: 'none',
                  lineHeight: 1.55,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.anonymous}
                onChange={e => setForm(f => ({ ...f, anonymous: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: ACCENT }}
              />
              <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Submit anonymously</span>
            </label>

            <button
              onClick={handleSubmit}
              disabled={!form.type || !form.description.trim()}
              style={{
                padding: '13px 0',
                background: form.type && form.description.trim() ? `${ACCENT}18` : 'transparent',
                border: `1px solid ${form.type && form.description.trim() ? `${ACCENT}40` : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 12,
                color: form.type && form.description.trim() ? ACCENT : '#4b5563',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                cursor: form.type && form.description.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Submit report
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function SafetyFeed() {
  const [filter, setFilter] = useState<Filter>('all')
  const [showModal, setShowModal] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex(i => (i + 1) % SAFETY_TIPS.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const filtered = MOCK_INCIDENTS.filter(inc => {
    if (filter === 'verified') return inc.verified
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '16px 18px',
      }}>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${ACCENT}, transparent)`,
        }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: ACCENT, letterSpacing: '0.09em', marginBottom: 4 }}>
              SAFETY FEED
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e5e7eb' }}>Campus Incidents</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 3 }}>Community-reported · Updated in real time</div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              flexShrink: 0,
              padding: '8px 14px',
              background: `${ACCENT}18`,
              border: `1px solid ${ACCENT}40`,
              borderRadius: 10,
              color: ACCENT,
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + Report
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {FILTER_LABELS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              flexShrink: 0,
              padding: '7px 14px',
              background: filter === f.id ? `${ACCENT}18` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filter === f.id ? `${ACCENT}40` : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 100,
              color: filter === f.id ? ACCENT : '#6b7280',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: filter === f.id ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === 'near_me' ? (
        <div style={{
          padding: '32px 20px',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{ fontSize: '2rem' }}>&#128205;</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e5e7eb' }}>Location needed</div>
          <div style={{ fontSize: '0.73rem', color: '#6b7280', lineHeight: 1.6, maxWidth: 260 }}>
            Enable location access to see incidents near your current position on campus.
          </div>
          <button
            style={{
              marginTop: 4,
              padding: '9px 20px',
              background: `${ACCENT}18`,
              border: `1px solid ${ACCENT}40`,
              borderRadius: 10,
              color: ACCENT,
              fontSize: '0.73rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Enable location
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(inc => (
            <div
              key={inc.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: `${SEVERITY_COLORS[inc.severity]}15`,
                    border: `1px solid ${SEVERITY_COLORS[inc.severity]}30`,
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}
                    dangerouslySetInnerHTML={{ __html: TYPE_ICONS[inc.type] }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: SEVERITY_COLORS[inc.severity],
                        display: 'inline-block',
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f3f4f6' }}>
                        {TYPE_LABELS[inc.type]}
                      </span>
                      {inc.verified && (
                        <span style={{
                          fontSize: '0.58rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          padding: '1px 6px',
                          background: 'rgba(52,211,153,0.12)',
                          border: '1px solid rgba(52,211,153,0.25)',
                          borderRadius: 100,
                          color: '#34d399',
                          letterSpacing: '0.04em',
                        }}>
                          VERIFIED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: 1 }}>{inc.location}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.65rem', color: '#4b5563', flexShrink: 0, marginTop: 2 }}>{inc.timeAgo}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#9ca3af', lineHeight: 1.6 }}>{inc.description}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{
        background: 'rgba(248,113,113,0.05)',
        border: `1px solid ${ACCENT}20`,
        borderRadius: 14,
        padding: '14px 16px',
        minHeight: 68,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>&#128161;</span>
        <div>
          <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: ACCENT, letterSpacing: '0.07em', marginBottom: 4 }}>
            SAFETY TIP
          </div>
          <p style={{ margin: 0, fontSize: '0.76rem', color: '#d1d5db', lineHeight: 1.55 }}>
            {SAFETY_TIPS[tipIndex]}
          </p>
        </div>
      </div>

      {showModal && <ReportModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
