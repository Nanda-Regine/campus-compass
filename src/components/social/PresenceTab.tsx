'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, RefreshCw, Map as MapIcon, List } from 'lucide-react'
import type { MapPinInput } from '@/components/movement/CampusMap'

const ACCENT = '#34d399'
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

// Mapbox map is client-only (touches window/document).
const CampusMap = dynamic(() => import('@/components/movement/CampusMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 340, borderRadius: 16, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#fff' }}>Loading map…</span>
    </div>
  ),
})

const STATUSES = [
  { id: 'on_campus',    emoji: '🏫', label: 'On campus' },
  { id: 'library',      emoji: '📚', label: 'In the library' },
  { id: 'studying',     emoji: '✍️', label: 'Studying — open to company' },
  { id: 'free_to_meet', emoji: '☕', label: 'Free to meet' },
  { id: 'in_class',     emoji: '🎓', label: 'In class' },
  { id: 'gym',          emoji: '💪', label: 'At the gym' },
] as const
type StatusId = typeof STATUSES[number]['id']

const DURATIONS = [1, 2, 4] as const

interface AroundPerson { status: StatusId; spot: string | null; note: string | null; expires_at: string; name: string; emoji: string }
interface Mine { status: StatusId; spot: string | null; note: string | null; expires_at: string }

function statusMeta(id: string) {
  return STATUSES.find(s => s.id === id) ?? { emoji: '🧑‍🎓', label: id }
}

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'expired'
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `${mins}m left`
  return `${Math.floor(mins / 60)}h ${mins % 60}m left`
}

export default function PresenceTab({ userInstitution }: { userId: string; userInstitution: string | null }) {
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [around, setAround]     = useState<AroundPerson[]>([])
  const [mine, setMine]         = useState<Mine | null>(null)
  const [error, setError]       = useState<string | null>(null)

  const [mapView, setMapView] = useState(false)

  // form
  const [status, setStatus] = useState<StatusId>('library')
  const [spot, setSpot]     = useState('')
  const [note, setNote]     = useState('')
  const [hours, setHours]   = useState<number>(2)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/presence')
      if (!res.ok) throw new Error('Could not load')
      const d = await res.json()
      setAround(d.around ?? [])
      setMine(d.mine ?? null)
      if (d.mine) { setStatus(d.mine.status); setSpot(d.mine.spot ?? ''); setNote(d.mine.note ?? '') }
      setError(null)
    } catch {
      setError('Could not load who’s around. Pull to refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const setPresence = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, spot: spot.trim() || null, note: note.trim() || null, durationHours: hours }),
      })
      if (!res.ok) throw new Error()
      await load()
    } catch {
      setError('Could not update your status. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const clearPresence = async () => {
    setSaving(true)
    try {
      await fetch('/api/presence', { method: 'DELETE' })
      setMine(null)
      await load()
    } catch { /* ignore */ } finally { setSaving(false) }
  }

  const card: React.CSSProperties = {
    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
    borderRadius: 14, padding: '14px 16px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 20 }}>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
        Let classmates {userInstitution ? `at ${userInstitution}` : 'at your campus'} know you&apos;re around — and
        see who else is, right now. Your status disappears on its own.
      </p>

      {/* ── My status ── */}
      <div style={{ ...card, borderColor: `${ACCENT}33` }}>
        {mine ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 8px ${ACCENT}`, flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {statusMeta(mine.status).emoji} You&apos;re {statusMeta(mine.status).label.toLowerCase()}
                  {mine.spot ? ` · ${mine.spot}` : ''}
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  Visible to your campus · {timeLeft(mine.expires_at)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={setPresence} disabled={saving}
                style={{ flex: 1, padding: '8px 0', borderRadius: 9, background: `${ACCENT}18`, border: `1px solid ${ACCENT}40`, color: ACCENT, fontSize: '0.72rem', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
                Update
              </button>
              <button onClick={clearPresence} disabled={saving}
                style={{ flex: 1, padding: '8px 0', borderRadius: 9, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.72rem', cursor: saving ? 'wait' : 'pointer' }}>
                I&apos;ve left
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Set your status</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STATUSES.map(s => (
                <button key={s.id} onClick={() => setStatus(s.id)}
                  style={{
                    padding: '6px 10px', borderRadius: 999, fontSize: '0.7rem', cursor: 'pointer',
                    background: status === s.id ? `${ACCENT}1c` : 'var(--bg-elevated)',
                    border: `1px solid ${status === s.id ? `${ACCENT}55` : 'var(--border-subtle)'}`,
                    color: status === s.id ? ACCENT : 'var(--text-secondary)',
                    fontWeight: status === s.id ? 700 : 400,
                  }}>
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
            <input value={spot} onChange={e => setSpot(e.target.value)} maxLength={80} placeholder="Spot (optional) — e.g. Main library, 3rd floor"
              style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '0.78rem' }} />
            <input value={note} onChange={e => setNote(e.target.value)} maxLength={140} placeholder="Note (optional) — e.g. doing Stats, say hi!"
              style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '0.78rem' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>For</span>
              {DURATIONS.map(h => (
                <button key={h} onClick={() => setHours(h)}
                  style={{ padding: '4px 10px', borderRadius: 8, fontSize: '0.7rem', cursor: 'pointer',
                    background: hours === h ? `${ACCENT}1c` : 'var(--bg-elevated)',
                    border: `1px solid ${hours === h ? `${ACCENT}55` : 'var(--border-subtle)'}`,
                    color: hours === h ? ACCENT : 'var(--text-secondary)', fontWeight: hours === h ? 700 : 400 }}>
                  {h}h
                </button>
              ))}
            </div>
            <button onClick={setPresence} disabled={saving}
              style={{ padding: '10px 0', borderRadius: 10, background: `linear-gradient(135deg, ${ACCENT}, #0f766e)`, border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
              <MapPin size={14} style={{ verticalAlign: -2, marginRight: 6 }} />{saving ? 'Setting…' : "I'm around"}
            </button>
          </div>
        )}
      </div>

      {/* ── Who's around ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Around now {around.length > 0 ? `· ${around.length}` : ''}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {MAPBOX_TOKEN && (
            <button onClick={() => setMapView(v => !v)} aria-label={mapView ? 'List view' : 'Map view'}
              style={{ background: 'none', border: 'none', color: mapView ? ACCENT : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.66rem' }}>
              {mapView ? <><List size={12} /> List</> : <><MapIcon size={12} /> Map</>}
            </button>
          )}
          <button onClick={() => { setLoading(true); load() }} aria-label="Refresh"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.66rem' }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Map view ── */}
      {mapView && MAPBOX_TOKEN && !loading && !error && (() => {
        const mappable = around.filter(p => p.spot && p.spot.trim())
        if (mappable.length === 0) {
          return (
            <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              🗺️ No one nearby has shared a spot yet. Add a spot to your status (e.g. &ldquo;Main library&rdquo;) so friends can find you on the map.
            </div>
          )
        }
        const pins: MapPinInput[] = mappable.map((p, i) => ({
          id: `${p.name}-${i}`,
          address: `${p.spot}${userInstitution ? ', ' + userInstitution : ''}`,
          emoji: p.emoji,
          title: p.name,
          rows: [
            `${statusMeta(p.status).emoji} ${statusMeta(p.status).label}`,
            p.spot ? `📍 ${p.spot}` : null,
            p.note,
            timeLeft(p.expires_at),
          ],
        }))
        return (
          <>
            <CampusMap token={MAPBOX_TOKEN} height={340} pins={pins} emptyLabel="Placing people…" />
            <div style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)', lineHeight: 1.5, padding: '0 2px' }}>
              Pins are approximate — placed from the spot each person typed, not live GPS.
            </div>
          </>
        )
      })()}

      {!mapView && (loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 28 }}>
          <div style={{ width: 20, height: 20, border: '2px solid var(--border-subtle)', borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : error ? (
        <div style={{ ...card, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{error}</div>
      ) : around.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>🌙</div>
          <div style={{ fontSize: '0.78rem' }}>No one&apos;s shared that they&apos;re around yet. Be the first — set your status above.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {around.map((p, i) => {
            const m = statusMeta(p.status)
            return (
              <div key={i} style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 14px' }}>
                <span style={{ fontSize: '1.3rem', flexShrink: 0, lineHeight: 1 }}>{p.emoji}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                  <div style={{ fontSize: '0.72rem', color: ACCENT, marginTop: 1 }}>
                    {m.emoji} {m.label}{p.spot ? ` · ${p.spot}` : ''}
                  </div>
                  {p.note && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>{p.note}</div>}
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, whiteSpace: 'nowrap' }}>{timeLeft(p.expires_at)}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
