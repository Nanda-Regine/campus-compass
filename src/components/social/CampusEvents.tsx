'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface CampusEvent {
  id: string
  user_id: string
  institution: string
  title: string
  description: string | null
  event_type: EventType
  venue: string | null
  event_date: string
  duration_minutes: number | null
  max_attendees: number | null
  is_anonymous: boolean
  is_cancelled: boolean
  created_at: string
  rsvp_count: number
  user_rsvped: boolean
}

type EventType = 'study_session' | 'social' | 'career' | 'workshop' | 'sport' | 'protest' | 'notice' | 'other'

const TYPE_META: Record<EventType, { label: string; emoji: string; color: string }> = {
  study_session: { label: 'Study Session', emoji: '📚', color: '#4ecf9e' },
  social:        { label: 'Social',        emoji: '🎉', color: '#f59e0b' },
  career:        { label: 'Career',        emoji: '💼', color: '#60a5fa' },
  workshop:      { label: 'Workshop',      emoji: '🛠',  color: '#a78bfa' },
  sport:         { label: 'Sport',         emoji: '⚽',  color: '#34d399' },
  protest:       { label: 'Protest/March', emoji: '✊',  color: '#f87171' },
  notice:        { label: 'Notice',        emoji: '📢',  color: '#fbbf24' },
  other:         { label: 'Other',         emoji: '📌',  color: '#94a3b8' },
}

const FILTER_TYPES: Array<{ value: EventType | 'all'; label: string }> = [
  { value: 'all',           label: 'All' },
  { value: 'study_session', label: '📚 Study' },
  { value: 'career',        label: '💼 Career' },
  { value: 'workshop',      label: '🛠 Workshop' },
  { value: 'social',        label: '🎉 Social' },
  { value: 'sport',         label: '⚽ Sport' },
  { value: 'protest',       label: '✊ March' },
  { value: 'notice',        label: '📢 Notice' },
]

function formatEventDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((d.getTime() - now.getTime()) / 86400000)
  const timeStr = d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })

  if (diffDays === 0) return `Today at ${timeStr}`
  if (diffDays === 1) return `Tomorrow at ${timeStr}`
  if (diffDays < 7) return `${d.toLocaleDateString('en-ZA', { weekday: 'long' })} at ${timeStr}`
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) + ` at ${timeStr}`
}

function formatDuration(mins: number | null): string {
  if (!mins) return ''
  if (mins < 60) return `${mins}min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

interface Props {
  userId: string
  institution: string | null
}

export default function CampusEvents({ userId, institution }: Props) {
  const [events, setEvents]           = useState<CampusEvent[]>([])
  const [loading, setLoading]         = useState(true)
  const [filterType, setFilterType]   = useState<EventType | 'all'>('all')
  const [showCreate, setShowCreate]   = useState(false)
  const [creating, setCreating]       = useState(false)

  // Create form
  const [fTitle, setFTitle]           = useState('')
  const [fDesc, setFDesc]             = useState('')
  const [fType, setFType]             = useState<EventType>('study_session')
  const [fVenue, setFVenue]           = useState('')
  const [fDate, setFDate]             = useState('')
  const [fDuration, setFDuration]     = useState('')
  const [fMax, setFMax]               = useState('')
  const [fAnon, setFAnon]             = useState(false)

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ upcoming: 'true', limit: '40' })
      if (institution) qs.set('institution', institution)
      if (filterType !== 'all') qs.set('type', filterType)
      const res = await fetch(`/api/events?${qs}`)
      if (res.ok) setEvents((await res.json()).events || [])
    } catch { /* non-critical */ }
    finally { setLoading(false) }
  }, [institution, filterType])

  useEffect(() => { setLoading(true); load() }, [load])

  const createEvent = async () => {
    if (!fTitle.trim() || !fDate) { toast.error('Title and date are required'); return }
    if (!institution) { toast.error('Set your university in profile first'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fTitle, description: fDesc || null, event_type: fType,
          venue: fVenue || null, event_date: fDate,
          duration_minutes: fDuration ? Number(fDuration) : null,
          max_attendees: fMax ? Number(fMax) : null,
          is_anonymous: fAnon,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Event posted!')
      setShowCreate(false)
      setFTitle(''); setFDesc(''); setFVenue(''); setFDate(''); setFDuration(''); setFMax('')
      await load()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to post event') }
    finally { setCreating(false) }
  }

  const toggleRsvp = async (e: CampusEvent) => {
    const wasRsvped = e.user_rsvped
    // Optimistic update
    setEvents(prev => prev.map(ev => ev.id === e.id
      ? { ...ev, user_rsvped: !wasRsvped, rsvp_count: ev.rsvp_count + (wasRsvped ? -1 : 1) }
      : ev
    ))
    try {
      if (wasRsvped) {
        await fetch(`/api/events/rsvp?event_id=${e.id}`, { method: 'DELETE' })
      } else {
        const res = await fetch('/api/events/rsvp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_id: e.id, status: 'going' }),
        })
        if (!res.ok) {
          const { error } = await res.json()
          toast.error(error || 'Failed to RSVP')
          await load()
        }
      }
    } catch { await load() }
  }

  const cancelEvent = async (id: string) => {
    if (!confirm('Cancel this event?')) return
    await fetch(`/api/events?id=${id}`, { method: 'DELETE' })
    setEvents(prev => prev.filter(e => e.id !== id))
    toast.success('Event cancelled')
  }

  // Min datetime for form (now)
  const nowMin = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[0.63rem] text-emerald-400 tracking-widest">CAMPUS EVENTS</div>
          <div className="font-display font-bold text-white text-base leading-tight">
            What&apos;s happening
          </div>
          {institution && (
            <div className="font-mono text-[0.65rem] text-white mt-0.5">{institution}</div>
          )}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="font-mono text-[0.6rem] px-3 py-1.5 rounded-xl bg-emerald-600/15 text-emerald-400 border border-emerald-600/25 hover:bg-emerald-600/25 transition-all"
        >
          + Post event
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white/3 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="font-display font-bold text-white text-sm">Post a new event</div>

          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <input
                value={fTitle} onChange={e => setFTitle(e.target.value)}
                placeholder="Event title *"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white outline-none focus:border-emerald-500 font-body"
              />
            </div>
            <div>
              <label className="font-mono text-[0.65rem] text-white mb-1 block">Type</label>
              <select value={fType} onChange={e => setFType(e.target.value as EventType)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 font-body">
                {Object.entries(TYPE_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-mono text-[0.65rem] text-white mb-1 block">Venue</label>
              <input value={fVenue} onChange={e => setFVenue(e.target.value)} placeholder="e.g. Library Room 2"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white outline-none focus:border-emerald-500 font-body" />
            </div>
            <div>
              <label className="font-mono text-[0.65rem] text-white mb-1 block">Date & time *</label>
              <input type="datetime-local" value={fDate} onChange={e => setFDate(e.target.value)} min={nowMin}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 font-body" />
            </div>
            <div>
              <label className="font-mono text-[0.65rem] text-white mb-1 block">Duration (minutes)</label>
              <input type="number" value={fDuration} onChange={e => setFDuration(e.target.value)} placeholder="e.g. 90" min={15}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white outline-none focus:border-emerald-500 font-body" />
            </div>
            <div>
              <label className="font-mono text-[0.65rem] text-white mb-1 block">Max attendees</label>
              <input type="number" value={fMax} onChange={e => setFMax(e.target.value)} placeholder="Leave blank = unlimited" min={1}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white outline-none focus:border-emerald-500 font-body" />
            </div>
            <div className="col-span-2">
              <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Description (optional)" rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white outline-none focus:border-emerald-500 resize-none font-body" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="anon" checked={fAnon} onChange={e => setFAnon(e.target.checked)}
                className="w-3.5 h-3.5 rounded" />
              <label htmlFor="anon" className="font-mono text-[0.65rem] text-white">Post anonymously</label>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={createEvent} disabled={creating || !fTitle.trim() || !fDate}
              className="flex-1 font-display font-bold text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white py-2.5 rounded-xl transition-all">
              {creating ? 'Posting…' : 'Post Event'}
            </button>
            <button onClick={() => setShowCreate(false)}
              className="px-4 font-mono text-sm text-white border border-white/10 rounded-xl">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_TYPES.map(f => (
          <button
            key={f.value}
            onClick={() => setFilterType(f.value as EventType | 'all')}
            className={cn(
              'font-mono text-[0.65rem] px-2.5 py-1 rounded-full border whitespace-nowrap flex-shrink-0 transition-all',
              filterType === f.value
                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30'
                : 'bg-white/3 text-white border-white/8 hover:border-white/15'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Events list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-white/4 animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-3xl mb-2">📅</div>
          <div className="font-display font-bold text-white text-sm">No upcoming events</div>
          <div className="font-mono text-[0.6rem] text-white mt-1">Be the first to post one above!</div>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(e => {
            const meta   = TYPE_META[e.event_type] || TYPE_META.other
            const isOwner = e.user_id === userId && !e.is_anonymous
            const isFull  = e.max_attendees != null && e.rsvp_count >= e.max_attendees && !e.user_rsvped

            return (
              <div key={e.id} className="bg-white/3 border border-white/7 rounded-2xl p-4 transition-all hover:border-white/12"
                style={{ borderLeft: `3px solid ${meta.color}40` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Type chip */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="font-mono text-[0.65rem] px-1.5 py-0.5 rounded-full border"
                        style={{ color: meta.color, borderColor: `${meta.color}30`, background: `${meta.color}10` }}>
                        {meta.emoji} {meta.label}
                      </span>
                      {e.max_attendees && (
                        <span className="font-mono text-[0.58rem] text-white">
                          {e.rsvp_count}/{e.max_attendees} spots
                        </span>
                      )}
                    </div>

                    <div className="font-display font-bold text-white text-sm leading-tight mb-1">{e.title}</div>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mb-1">
                      <span className="font-mono text-[0.65rem] text-white">
                        🕐 {formatEventDate(e.event_date)}
                        {e.duration_minutes ? ` · ${formatDuration(e.duration_minutes)}` : ''}
                      </span>
                      {e.venue && (
                        <span className="font-mono text-[0.65rem] text-white">📍 {e.venue}</span>
                      )}
                    </div>

                    {e.description && (
                      <div className="font-mono text-[0.6rem] text-white leading-relaxed mt-1 line-clamp-2">
                        {e.description}
                      </div>
                    )}
                  </div>

                  {/* RSVP + owner actions */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => toggleRsvp(e)}
                      disabled={isFull}
                      className={cn(
                        'font-mono text-[0.65rem] px-2.5 py-1.5 rounded-xl border transition-all',
                        e.user_rsvped
                          ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30'
                          : isFull
                          ? 'bg-white/3 text-white border-white/8 cursor-not-allowed'
                          : 'bg-white/4 text-white border-white/10 hover:border-white/20'
                      )}
                    >
                      {e.user_rsvped ? '✓ Going' : isFull ? 'Full' : "I'm going"}
                    </button>
                    {e.rsvp_count > 0 && (
                      <span className="font-mono text-[0.65rem] text-white">{e.rsvp_count} going</span>
                    )}
                    {isOwner && (
                      <button onClick={() => cancelEvent(e.id)}
                        className="font-mono text-[0.58rem] text-white hover:text-red-400 transition-colors">
                        cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
