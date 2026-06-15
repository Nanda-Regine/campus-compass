'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow, format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import {
  BookOpen, Calendar, Shield, Map,
  CheckCircle2, LogOut, Plus, Trash2, Users,
  Phone, AlertTriangle, X, ExternalLink,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LibraryData {
  counts: Record<string, number>
  myCheckin: { id: string; zone: string; checked_in_at: string } | null
  institution: string
}

interface CampusEvent {
  id: string
  title: string
  description: string | null
  venue: string | null
  event_date: string
  event_time: string | null
  category: string
  institution: string | null
  rsvp_count: number
  creator_name: string
  creator_emoji: string
  is_own: boolean
  is_going: boolean
}

type Tab = 'library' | 'events' | 'safety' | 'map'

// ─── Constants ────────────────────────────────────────────────────────────────

const LIBRARY_ZONES = [
  'Main Library — Quiet Zone',
  'Main Library — Group Study',
  'Main Library — Computer Lab',
  'Science Library',
  'Law Library',
  'Postgrad Study Room',
  'Exam Venue (open)',
]

const EVENT_CATS = [
  { value: '',         label: 'All',      color: '#7090d0' },
  { value: 'social',   label: 'Social',   color: '#4ecf9e' },
  { value: 'academic', label: 'Academic', color: '#8b5cf6' },
  { value: 'sport',    label: 'Sport',    color: '#f59e0b' },
  { value: 'career',   label: 'Career',   color: '#0d9488' },
  { value: 'cultural', label: 'Cultural', color: '#f43f5e' },
]

const SAFETY_CONTACTS = [
  { label: 'Campus Security',       number: '10177',        icon: '🏫' },
  { label: 'SAPS Emergency',        number: '10111',        icon: '👮' },
  { label: 'National Ambulance',    number: '10177',        icon: '🚑' },
  { label: 'SADAG (Mental Health)', number: '0800 567 567', icon: '🧠' },
  { label: 'LifeLine',              number: '0861 322 322', icon: '💙' },
  { label: 'Gender Violence Hotline',number: '0800 428 428',icon: '🛡️' },
]

// ─── Library tab ──────────────────────────────────────────────────────────────

function LibraryTab({ institution }: { institution: string }) {
  const [data, setData] = useState<LibraryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showZonePicker, setShowZonePicker] = useState(false)
  const [checking, setChecking] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/campus/library', { signal: AbortSignal.timeout(10000) })
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [load])

  async function checkIn(zone: string) {
    setChecking(true)
    setShowZonePicker(false)
    const res = await fetch('/api/campus/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone }),
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) { toast.success(`Checked in to ${zone}`); load() }
    else toast.error('Check-in failed')
    setChecking(false)
  }

  async function checkOut() {
    setChecking(true)
    await fetch('/api/campus/library', { method: 'DELETE', signal: AbortSignal.timeout(10000) })
    toast.success('Checked out')
    load()
    setChecking(false)
  }

  function crowdColor(count: number) {
    if (count === 0) return '#4ecf9e'
    if (count <= 3)  return '#4ecf9e'
    if (count <= 7)  return '#f59e0b'
    return '#ef4444'
  }

  function crowdLabel(count: number) {
    if (count === 0) return 'Empty'
    if (count <= 3)  return 'Quiet'
    if (count <= 7)  return 'Busy'
    return 'Packed'
  }

  if (loading) return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ height: 64, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }} />
      ))}
    </div>
  )

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Check-in status */}
      <div style={{
        background: data?.myCheckin ? 'rgba(78,207,158,0.06)' : 'rgba(255,255,255,0.03)',
        border: `0.5px solid ${data?.myCheckin ? 'rgba(78,207,158,0.25)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14, padding: '14px 16px', marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 2 }}>
            {data?.myCheckin ? `📍 ${data.myCheckin.zone}` : 'Not checked in'}
          </div>
          {data?.myCheckin && (
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)' }}>
              Checked in {formatDistanceToNow(parseISO(data.myCheckin.checked_in_at), { addSuffix: true })}
            </div>
          )}
        </div>
        {data?.myCheckin ? (
          <button
            onClick={checkOut}
            disabled={checking}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, border: '0.5px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            <LogOut size={12} /> Check out
          </button>
        ) : (
          <button
            onClick={() => setShowZonePicker(true)}
            disabled={checking}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, border: 'none', background: '#4ecf9e', color: '#000', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
          >
            <CheckCircle2 size={12} /> Check in
          </button>
        )}
      </div>

      {/* Zone picker */}
      {showZonePicker && (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Select zone</span>
            <button onClick={() => setShowZonePicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {LIBRARY_ZONES.map(zone => (
              <button
                key={zone}
                onClick={() => checkIn(zone)}
                style={{ padding: '9px 12px', borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left' }}
              >
                {zone}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zone occupancy */}
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Current occupancy at {institution?.split(' ').slice(0, 3).join(' ') ?? 'campus'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {LIBRARY_ZONES.map(zone => {
          const count = data?.counts[zone] ?? 0
          const color = crowdColor(count)
          const label = crowdLabel(count)
          return (
            <div key={zone} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.06)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{zone}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <Users size={11} style={{ color }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color }}>{count}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', background: `${color}15`, border: `0.5px solid ${color}30`, padding: '2px 6px', borderRadius: 9999 }}>{label}</span>
              </div>
            </div>
          )
        })}
      </div>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', marginTop: 12, textAlign: 'center' }}>
        Crowd-sourced by students · updates every 60 sec
      </p>
    </div>
  )
}

// ─── Events tab ───────────────────────────────────────────────────────────────

function EventsTab() {
  const [events, setEvents] = useState<CampusEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    const res = await fetch(`/api/campus/events?${params}`, { signal: AbortSignal.timeout(10000) })
    if (res.ok) setEvents((await res.json()).events ?? [])
    setLoading(false)
  }, [category])

  useEffect(() => { load() }, [load])

  async function toggleRsvp(event: CampusEvent) {
    const res = await fetch('/api/campus/events/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: event.id }),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) { toast.error('RSVP failed'); return }
    const { going } = await res.json()
    setEvents(prev => prev.map(e => e.id === event.id
      ? { ...e, is_going: going, rsvp_count: e.rsvp_count + (going ? 1 : -1) }
      : e
    ))
    toast.success(going ? 'You\'re going! 🎉' : 'RSVP removed')
  }

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event?')) return
    await fetch(`/api/campus/events?id=${id}`, { method: 'DELETE', signal: AbortSignal.timeout(10000) })
    setEvents(prev => prev.filter(e => e.id !== id))
    toast.success('Event deleted')
  }

  const CAT_COLOR: Record<string, string> = {
    social: '#4ecf9e', academic: '#8b5cf6', sport: '#f59e0b',
    career: '#0d9488', cultural: '#f43f5e', general: '#7090d0',
  }

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Category filter */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
        {EVENT_CATS.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            style={{ padding: '5px 12px', borderRadius: 20, border: '0.5px solid', borderColor: category === c.value ? c.color : 'rgba(255,255,255,0.08)', background: category === c.value ? `${c.color}15` : 'rgba(255,255,255,0.03)', color: category === c.value ? c.color : 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', cursor: 'pointer' }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Add event */}
      <button
        onClick={() => setShowCreate(true)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 12, border: '0.5px dashed rgba(78,207,158,0.35)', background: 'rgba(78,207,158,0.04)', color: '#4ecf9e', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', marginBottom: 14 }}
      >
        <Plus size={14} /> Post a campus event
      </button>

      {showCreate && <CreateEventForm onCreated={() => { setShowCreate(false); load() }} onClose={() => setShowCreate(false)} />}

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ height: 100, borderRadius: 12, background: 'rgba(255,255,255,0.04)', marginBottom: 8 }} />)
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 40, color: 'rgba(255,255,255,0.2)', fontFamily: 'DM Sans, sans-serif' }}>
          <Calendar size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
          No upcoming events — be the first to post one!
        </div>
      ) : events.map(event => {
        const color = CAT_COLOR[event.category] ?? '#7090d0'
        return (
          <div key={event.id} style={{ background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${color}20`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 44, borderRadius: 10, background: `${color}15`, border: `0.5px solid ${color}30`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '4px' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '1rem', color, lineHeight: 1 }}>
                  {format(parseISO(event.event_date), 'd')}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', color: `${color}b0`, textTransform: 'uppercase' }}>
                  {format(parseISO(event.event_date), 'MMM')}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{event.title}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color, background: `${color}15`, border: `0.5px solid ${color}30`, padding: '2px 6px', borderRadius: 9999 }}>{event.category}</span>
                </div>
                {event.venue && (
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                    📍 {event.venue}{event.event_time ? ` · ${event.event_time}` : ''}
                  </div>
                )}
                {event.description && (
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: 4, lineHeight: 1.4 }}>
                    {event.description.slice(0, 100)}{event.description.length > 100 ? '...' : ''}
                  </div>
                )}
              </div>
              {event.is_own && (
                <button onClick={() => deleteEvent(event.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 2, flexShrink: 0 }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)' }}>
                {event.creator_emoji} {event.creator_name} · {event.rsvp_count} going
              </div>
              <button
                onClick={() => toggleRsvp(event)}
                style={{ padding: '6px 12px', borderRadius: 20, border: '0.5px solid', borderColor: event.is_going ? color : 'rgba(255,255,255,0.12)', background: event.is_going ? `${color}15` : 'rgba(255,255,255,0.04)', color: event.is_going ? color : 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', fontWeight: event.is_going ? 600 : 400, cursor: 'pointer' }}
              >
                {event.is_going ? '✓ Going' : 'RSVP'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CreateEventForm({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [venue, setVenue] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [category, setCategory] = useState('general')
  const [saving, setSaving] = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.05)',
    border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 9,
    color: 'var(--text-primary)', fontSize: '0.8rem',
    fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box',
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !eventDate) { toast.error('Title and date required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/campus/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, venue, event_date: eventDate, event_time: eventTime, category }),
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) throw new Error()
      toast.success('Event posted!')
      onCreated()
    } catch {
      toast.error('Could not post event')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>New Event</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><X size={15} /></button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title *" maxLength={120} />
        <div style={{ display: 'flex', gap: 6 }}>
          <input style={{ ...inputStyle, flex: 1 }} type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
          <input style={{ ...inputStyle, flex: 1 }} type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} />
        </div>
        <input style={inputStyle} value={venue} onChange={e => setVenue(e.target.value)} placeholder="Venue (optional)" maxLength={120} />
        <textarea style={{ ...inputStyle, resize: 'none', height: 60 }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" maxLength={600} />
        <select
          style={{ ...inputStyle, cursor: 'pointer' }}
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {EVENT_CATS.filter(c => c.value).map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving}
          style={{ padding: '10px', borderRadius: 10, border: 'none', background: saving ? 'rgba(78,207,158,0.3)' : '#4ecf9e', color: '#000', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Posting...' : 'Post Event'}
        </button>
      </form>
    </div>
  )
}

// ─── Safety tab ────────────────────────────────────────────────────────────────

function SafetyTab({ institution }: { institution: string }) {
  const [showSOS, setShowSOS] = useState(false)

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* SOS Button */}
      <div style={{
        background: 'rgba(239,68,68,0.06)', border: '0.5px solid rgba(239,68,68,0.2)',
        borderRadius: 16, padding: '18px 16px', marginBottom: 20, textAlign: 'center',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginBottom: 6 }}>
          Emergency SOS
        </div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
          Opens your phone dialer · you choose who to call
        </div>
        {!showSOS ? (
          <button
            onClick={() => setShowSOS(true)}
            style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: '#ef4444', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', letterSpacing: '0.05em' }}
          >
            🆘 SOS
          </button>
        ) : (
          <div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>
              Who do you need?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SAFETY_CONTACTS.slice(0, 3).map(c => (
                <a
                  key={c.number}
                  href={`tel:${c.number.replace(/\s/g, '')}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, border: '0.5px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#fff', textDecoration: 'none' }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{c.icon}</span>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.8rem' }}>{c.label}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#ef4444' }}>{c.number}</div>
                  </div>
                  <Phone size={14} style={{ color: '#ef4444' }} />
                </a>
              ))}
            </div>
            <button onClick={() => setShowSOS(false)} style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem' }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* All emergency contacts */}
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Emergency contacts — free to call 24/7
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SAFETY_CONTACTS.map(c => (
          <a
            key={c.number}
            href={`tel:${c.number.replace(/\s/g, '')}`}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: '0.5px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', textDecoration: 'none' }}
          >
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{c.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{c.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#4ecf9e', marginTop: 1 }}>{c.number}</div>
            </div>
            <Phone size={13} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
          </a>
        ))}
      </div>

      {/* Share location tip */}
      <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <AlertTriangle size={13} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>
            <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Stay safe tip:</strong> Share your live location with a trusted friend when going somewhere unfamiliar. WhatsApp &rsquo;Share Live Location&rsquo; works well for this.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Map tab ───────────────────────────────────────────────────────────────────

function MapTab({ institution }: { institution: string }) {
  const searchQuery = encodeURIComponent(institution || 'University')
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`
  const wazeUrl = `https://waze.com/ul?q=${searchQuery}`

  const quickLinks = [
    { label: 'Open Google Maps', href: mapsUrl, icon: '🗺️', color: '#4ecf9e' },
    { label: 'Navigate with Waze', href: wazeUrl, icon: '🧭', color: '#7090d0' },
  ]

  const campusAreas = [
    { label: 'Main Library',       hint: institution },
    { label: 'Student Centre',     hint: institution },
    { label: 'Residences',         hint: institution },
    { label: 'Campus Clinic',      hint: institution },
    { label: 'Student Wellness',   hint: institution },
    { label: 'NSFAS/Financial Aid',hint: institution },
    { label: 'SRC Office',         hint: institution },
  ]

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Quick navigation */}
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Navigate to campus
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {quickLinks.map(link => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 8px', borderRadius: 14, border: `0.5px solid ${link.color}30`, background: `${link.color}08`, textDecoration: 'none' }}
          >
            <span style={{ fontSize: '1.4rem' }}>{link.icon}</span>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: link.color, fontWeight: 600, textAlign: 'center' }}>{link.label}</span>
            <ExternalLink size={10} style={{ color: `${link.color}60` }} />
          </a>
        ))}
      </div>

      {/* Campus area quick links */}
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Find on campus
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {campusAreas.map(area => {
          const q = encodeURIComponent(`${area.label} ${area.hint ?? ''}`.trim())
          return (
            <a
              key={area.label}
              href={`https://www.google.com/maps/search/?api=1&query=${q}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', textDecoration: 'none' }}
            >
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>{area.label}</span>
              <ExternalLink size={11} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </a>
          )
        })}
      </div>

      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', marginTop: 14, textAlign: 'center' }}>
        Links open Google Maps · data charges may apply
      </p>
    </div>
  )
}

// ─── Main hub ─────────────────────────────────────────────────────────────────

const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: 'library', icon: <BookOpen size={15} />,  label: 'Library'  },
  { id: 'events',  icon: <Calendar size={15} />,  label: 'Events'   },
  { id: 'safety',  icon: <Shield size={15} />,    label: 'Safety'   },
  { id: 'map',     icon: <Map size={15} />,        label: 'Map'      },
]

export default function CampusLifeHub({ institution }: { institution: string }) {
  const [tab, setTab] = useState<Tab>('library')

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '0.5px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 10 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '10px 4px 8px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t.id ? '#4ecf9e' : 'rgba(255,255,255,0.3)',
              borderBottom: `2px solid ${tab === t.id ? '#4ecf9e' : 'transparent'}`,
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {t.icon}
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'library' && <LibraryTab institution={institution} />}
      {tab === 'events'  && <EventsTab />}
      {tab === 'safety'  && <SafetyTab institution={institution} />}
      {tab === 'map'     && <MapTab institution={institution} />}
    </div>
  )
}
