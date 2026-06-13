'use client'

import { useState, useEffect } from 'react'
import { Zap, ZapOff, Search, X, MapPin } from 'lucide-react'

interface LsStatus {
  stage: number
  stage_updated: string
  source: string
}

interface LsEvent {
  start: string
  end: string
  note: string
  stage: string
}

interface AreaResult {
  id: string
  name: string
  region: string
}

const STAGE_COLOUR: Record<number, string> = {
  0: '#4ecf9e',
  1: '#f59e0b',
  2: '#f59e0b',
  3: '#e8834a',
  4: '#e8834a',
  5: '#ff6b6b',
  6: '#ff6b6b',
  7: '#ff6b6b',
  8: '#ff4444',
}

const STAGE_LABEL: Record<number, string> = {
  0: 'No load shedding',
  1: 'Stage 1',
  2: 'Stage 2',
  3: 'Stage 3',
  4: 'Stage 4',
  5: 'Stage 5',
  6: 'Stage 6',
  7: 'Stage 7',
  8: 'Stage 8',
}

const STAGE_ADVICE: Record<number, string> = {
  0: 'Power stable — good time to charge devices and submit assignments.',
  1: 'Stage 1 — check your area schedule, brief outages expected.',
  2: 'Stage 2 — 2h outages twice a day. Charge phone when you can.',
  3: 'Stage 3 — expect 2–3h outages. Download notes while you have power.',
  4: 'Stage 4 — up to 4h outages. Print important docs or save offline now.',
  5: 'Stage 5 — severe. Plan study sessions around your schedule.',
  6: 'Stage 6 — 4–6h outages. Use campus buildings with generators.',
  7: 'Stage 7 — nearly constant cuts. Campus library is your best bet.',
  8: 'Stage 8 — maximum load reduction. Emergency only — save battery.',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function getTodayEvents(events: LsEvent[]): LsEvent[] {
  const today = new Date().toDateString()
  return events.filter(e => new Date(e.start).toDateString() === today)
}

export default function LoadSheddingWidget() {
  const [status, setStatus] = useState<LsStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [areaId, setAreaId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('ls_area_id') : null
  )
  const [areaName, setAreaName] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('ls_area_name') : null
  )
  const [todayEvents, setTodayEvents] = useState<LsEvent[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AreaResult[]>([])
  const [searching, setSearching] = useState(false)
  const [apiAvailable, setApiAvailable] = useState(false)

  // Fetch national status on mount
  useEffect(() => {
    fetch('/api/load-shedding')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.status) setStatus(d.status)
        setApiAvailable(d?.apiAvailable ?? false)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Fetch area schedule when area is set
  useEffect(() => {
    if (!areaId) return
    fetch(`/api/load-shedding?action=schedule&area_id=${encodeURIComponent(areaId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.schedule?.events) {
          setTodayEvents(getTodayEvents(d.schedule.events))
        }
      })
      .catch(() => {})
  }, [areaId])

  // Search debounce
  useEffect(() => {
    if (!showSearch || searchQuery.length < 3) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      setSearching(true)
      fetch(`/api/load-shedding?action=search&q=${encodeURIComponent(searchQuery)}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.areas) setSearchResults(d.areas) })
        .catch(() => {})
        .finally(() => setSearching(false))
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, showSearch])

  function selectArea(area: AreaResult) {
    setAreaId(area.id)
    setAreaName(area.name)
    localStorage.setItem('ls_area_id', area.id)
    localStorage.setItem('ls_area_name', area.name)
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const stage = status?.stage ?? 0
  const colour = STAGE_COLOUR[Math.min(stage, 8)]

  const currentEvent = todayEvents.find(e => {
    const now = new Date()
    return new Date(e.start) <= now && new Date(e.end) >= now
  })

  const nextEvent = todayEvents.find(e => new Date(e.start) > new Date())

  return (
    <div style={{ background: 'var(--bg-surface)', border: `1px solid ${colour}30`, borderRadius: 14, overflow: 'hidden' }}>
      {/* Stage bar */}
      <div style={{ height: 3, background: stage === 0 ? `${colour}40` : colour, transition: 'background 0.3s' }} />

      <div style={{ padding: '12px 14px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {stage === 0
              ? <Zap size={14} color={colour} />
              : <ZapOff size={14} color={colour} />
            }
            <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: colour, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
              Load Shedding
            </span>
          </div>
          <button
            onClick={() => setShowSearch(v => !v)}
            title="Set your area"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2 }}
          >
            {showSearch ? <X size={13} /> : <Search size={13} />}
          </button>
        </div>

        {loading ? (
          <div className="skeleton-row" style={{ height: 28, width: '60%', borderRadius: 6 }} />
        ) : (
          <>
            {/* Stage display */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, fontWeight: 700, color: colour, lineHeight: 1 }}>
                {STAGE_LABEL[Math.min(stage, 8)]}
              </span>
            </div>

            {/* Advice */}
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, margin: 0, marginBottom: areaId ? 8 : 0 }}>
              {STAGE_ADVICE[Math.min(stage, 8)]}
            </p>

            {/* Area events */}
            {areaId && (areaName || todayEvents.length > 0) && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <MapPin size={10} color="rgba(255,255,255,0.25)" />
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
                    {areaName ?? 'Your area'}
                  </span>
                </div>

                {currentEvent && (
                  <div style={{ padding: '6px 8px', background: '#ff6b6b18', border: '0.5px solid #ff6b6b30', borderRadius: 8 }}>
                    <span style={{ fontSize: 11, color: '#ff6b6b', fontWeight: 600 }}>
                      Power OFF now · ends {formatTime(currentEvent.end)}
                    </span>
                  </div>
                )}

                {!currentEvent && nextEvent && (
                  <div style={{ padding: '6px 8px', background: `${colour}12`, border: `0.5px solid ${colour}30`, borderRadius: 8 }}>
                    <span style={{ fontSize: 11, color: colour }}>
                      Next outage: {formatTime(nextEvent.start)} – {formatTime(nextEvent.end)}
                    </span>
                  </div>
                )}

                {!currentEvent && !nextEvent && todayEvents.length === 0 && stage > 0 && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                    No outages for your area today
                  </div>
                )}
              </div>
            )}

            {!areaId && !showSearch && (
              <button
                onClick={() => setShowSearch(true)}
                style={{
                  marginTop: 8, display: 'flex', alignItems: 'center', gap: 4,
                  background: 'none', border: '0.5px dashed rgba(255,255,255,0.12)',
                  borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
                  fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <MapPin size={11} /> Set your area for outage times
              </button>
            )}
          </>
        )}

        {/* API unavailable notice */}
        {!loading && !apiAvailable && (
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 6, fontFamily: 'JetBrains Mono, monospace' }}>
            EskomSePush API not configured — contact admins
          </p>
        )}

        {/* Search panel */}
        {showSearch && (
          <div style={{ marginTop: 10 }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search your suburb or area..."
              autoFocus
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 8,
                padding: '7px 10px', color: '#fff', fontSize: 12,
                fontFamily: 'DM Sans, sans-serif', outline: 'none',
              }}
            />
            {searching && (
              <div style={{ padding: '6px 0', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Searching...</div>
            )}
            {searchResults.length > 0 && (
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 160, overflowY: 'auto' }}>
                {searchResults.map(area => (
                  <button
                    key={area.id}
                    onClick={() => selectArea(area)}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left',
                      background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)',
                      borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                      color: '#fff',
                    }}
                  >
                    <span style={{ fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>{area.name}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>{area.region}</span>
                  </button>
                ))}
              </div>
            )}
            {searchQuery.length >= 3 && !searching && searchResults.length === 0 && (
              <div style={{ padding: '6px 0', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                No areas found — try a different name
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
