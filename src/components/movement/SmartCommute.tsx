'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, MapPin, Navigation } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface TimetableSlot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string | null
  venue: string | null
  label: string | null
  module: { module_name: string; color: string } | null
}

interface SavedRoute {
  id: string
  label: string
  from_address: string
  to_address: string
  transport_type: string
  estimated_minutes: number | null
  is_default: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TRANSPORT_ICONS: Record<string, string> = {
  taxi: '🚕', bus: '🚌', walk: '🚶', uber: '🚗',
  lift_club: '🤝', campus_shuttle: '🚐', minibus: '🚌',
}

const TRANSPORT_LABELS: Record<string, string> = {
  taxi: 'Minibus Taxi', bus: 'Bus', walk: 'Walking',
  uber: 'Uber / Bolt', lift_club: 'Lift Club', campus_shuttle: 'Campus Shuttle', minibus: 'Long-distance',
}

const DAY_NAMES    = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FULL     = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const BUFFERS      = [0, 15, 30, 45]

// DB day mapping: JS getDay() 0=Sun → DB 7; 1=Mon → DB 1
function jsToDbDay(jsDay: number): number { return jsDay === 0 ? 7 : jsDay }

function toMins(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m ?? 0)
}

function minsToTime(totalMins: number): string {
  const clamped = Math.max(0, Math.min(1439, totalMins))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour   = h % 12 || 12
  return `${hour}:${String(m ?? 0).padStart(2, '0')} ${suffix}`
}

// ─── Plan types ──────────────────────────────────────────────────────────────

interface DayPlan {
  dbDay:       number
  dayName:     string
  dayShort:    string
  firstSlot:   TimetableSlot | null
  leaveByMins: number | null
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SmartCommute({ userId }: { userId: string }) {
  const supabase = createClient()

  const [slots,   setSlots]   = useState<TimetableSlot[]>([])
  const [routes,  setRoutes]  = useState<SavedRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [buffer,  setBuffer]  = useState(15)
  const [now,     setNow]     = useState(new Date())

  // Tick every 30 seconds for live countdown
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const load = async () => {
      const [slotsRes, routesRes] = await Promise.all([
        supabase
          .from('timetable_slots')
          .select('id,day_of_week,start_time,end_time,venue,label,module:modules(module_name,color)')
          .is('deleted_at', null)
          .in('day_of_week', [1, 2, 3, 4, 5])
          .order('day_of_week', { ascending: true })
          .order('start_time',  { ascending: true }),
        supabase
          .from('saved_routes')
          .select('id,label,from_address,to_address,transport_type,estimated_minutes,is_default')
          .is('deleted_at', null)
          .order('is_default', { ascending: false })
          .limit(10),
      ])
      setSlots((slotsRes.data ?? []) as TimetableSlot[])
      setRoutes(routesRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [userId])

  const defaultRoute = routes.find(r => r.is_default) ?? routes[0] ?? null
  const travelMins   = defaultRoute?.estimated_minutes ?? null

  // Build Mon–Fri departure plan
  const weekPlan: DayPlan[] = [1, 2, 3, 4, 5].map(dbDay => {
    const daySlots  = slots.filter(s => s.day_of_week === dbDay)
    const firstSlot = daySlots.length > 0 ? daySlots[0] : null
    const leaveByMins = (firstSlot && travelMins != null)
      ? toMins(firstSlot.start_time) - travelMins - buffer
      : null
    return { dbDay, dayName: DAY_FULL[dbDay], dayShort: DAY_NAMES[dbDay], firstSlot, leaveByMins }
  })

  const todayDbDay = jsToDbDay(now.getDay())
  const nowMins    = now.getHours() * 60 + now.getMinutes()

  // Choose focus: today if first class is still coming, else next school day
  let focusPlan: DayPlan | null = weekPlan.find(d => d.dbDay === todayDbDay) ?? null
  let focusLabel = 'Today'

  if (focusPlan) {
    const firstClassMins = focusPlan.firstSlot ? toMins(focusPlan.firstSlot.start_time) : null
    if (firstClassMins !== null && nowMins > firstClassMins + 30) {
      // Class started >30 min ago — jump to next school day
      const next = weekPlan.find(d => d.dbDay > todayDbDay && d.firstSlot)
      if (next) { focusPlan = next; focusLabel = next.dayName }
    }
  } else {
    // Weekend — show next Monday's plan
    const next = weekPlan.find(d => d.firstSlot)
    if (next) { focusPlan = next; focusLabel = next.dayName }
  }

  // Countdown to leave time (only for today)
  let countdown: string | null = null
  if (focusPlan?.leaveByMins != null && focusLabel === 'Today') {
    const diff = focusPlan.leaveByMins - nowMins
    if (diff > 0) {
      const h = Math.floor(diff / 60)
      const m = diff % 60
      countdown = h > 0 ? `${h}h ${m}m to go` : `${m} min to go`
    } else if (diff > -20) {
      countdown = 'Leave now!'
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Loading commute…</span>
    </div>
  )

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '14px 16px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Default route pill ──────────────────────────────────────────── */}
      <div style={card}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Default route</p>
        {defaultRoute ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{TRANSPORT_ICONS[defaultRoute.transport_type] ?? '🚌'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 2 }}>{defaultRoute.label}</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                {TRANSPORT_LABELS[defaultRoute.transport_type] ?? defaultRoute.transport_type}
                {defaultRoute.estimated_minutes ? ` · ${defaultRoute.estimated_minutes} min travel` : ' · travel time not set'}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={20} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>No route saved yet</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>
                Go to My Routes tab → add a route → star it as default
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Buffer selector ──────────────────────────────────────────────── */}
      <div style={card}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          ⚡ Extra buffer — load shedding / walking to rank
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {BUFFERS.map(b => (
            <button
              key={b}
              onClick={() => setBuffer(b)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8,
                border:      b === buffer ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                background:  b === buffer ? 'rgba(245,158,11,0.14)' : 'transparent',
                color:       b === buffer ? '#f59e0b' : 'rgba(255,255,255,0.45)',
                fontFamily:  'var(--font-mono)', fontSize: 11, cursor: 'pointer',
              }}
            >
              {b === 0 ? 'None' : `+${b}m`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Focus card — today / next school day ──────────────────────────── */}
      {focusPlan ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(14,165,233,0.04) 100%)',
          border: '1px solid rgba(14,165,233,0.25)',
          borderRadius: 16,
          padding: '18px 20px',
        }}>
          {/* Label + countdown badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(14,165,233,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {focusLabel}
            </p>
            {countdown && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color:      countdown === 'Leave now!' ? '#ef4444' : '#22c55e',
                background: countdown === 'Leave now!' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                padding: '3px 9px', borderRadius: 6,
              }}>
                {countdown === 'Leave now!' ? '🚨 Leave now!' : `🕐 ${countdown}`}
              </span>
            )}
          </div>

          {focusPlan.firstSlot ? (
            <>
              {/* Big departure time */}
              {focusPlan.leaveByMins != null ? (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Leave by</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, color: '#e0f2fe', lineHeight: 1, marginBottom: 6, letterSpacing: '-0.02em' }}>
                    {formatTime12(minsToTime(focusPlan.leaveByMins))}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                    {TRANSPORT_ICONS[defaultRoute?.transport_type ?? ''] ?? '🚌'}{' '}
                    {travelMins != null ? `${travelMins} min travel` : 'travel time unknown'}
                    {buffer > 0 ? ` + ${buffer} min buffer` : ''}
                  </p>
                </div>
              ) : (
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>
                  Set your route travel time to see a departure time
                </p>
              )}

              {/* First class info pill */}
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {focusPlan.firstSlot.module?.color && (
                    <div style={{ width: 3, height: 34, borderRadius: 2, background: focusPlan.firstSlot.module.color, flexShrink: 0 }} />
                  )}
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,0.88)', marginBottom: 2 }}>
                      {focusPlan.firstSlot.module?.module_name ?? focusPlan.firstSlot.label ?? 'Class'}
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                      🕐 {formatTime12(focusPlan.firstSlot.start_time)}
                      {focusPlan.firstSlot.venue ? `  ·  📍 ${focusPlan.firstSlot.venue}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
              No classes on {focusPlan.dayName} — enjoy the break!
            </p>
          )}
        </div>
      ) : (
        <div style={{ ...card, textAlign: 'center', padding: '28px 20px' }}>
          <Navigation size={28} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 10px' }} />
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>No timetable found</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
            Add your classes in Study OS → Timetable to see departure times
          </p>
        </div>
      )}

      {/* ── Week overview ─────────────────────────────────────────────────── */}
      <div style={card}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          This week
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {weekPlan.map(day => {
            const isToday  = day.dbDay === todayDbDay
            return (
              <div
                key={day.dbDay}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 10px', borderRadius: 10,
                  background: isToday ? 'rgba(14,165,233,0.07)' : 'transparent',
                  border: isToday ? '1px solid rgba(14,165,233,0.18)' : '1px solid transparent',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: isToday ? '#7dd3fc' : 'rgba(255,255,255,0.35)', width: 28, flexShrink: 0 }}>
                  {day.dayShort}
                </span>
                {day.firstSlot ? (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {day.firstSlot.module?.module_name ?? day.firstSlot.label ?? 'Class'}
                      </p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.32)' }}>
                        First class {formatTime12(day.firstSlot.start_time)}
                      </p>
                    </div>
                    {day.leaveByMins != null ? (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: isToday ? '#7dd3fc' : 'rgba(255,255,255,0.55)', flexShrink: 0 }}>
                        Leave {formatTime12(minsToTime(day.leaveByMins))}
                      </span>
                    ) : (
                      <Clock size={12} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                    )}
                  </>
                ) : (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>No classes</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── SA commute tip ───────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(245,158,11,0.06)',
        border: '1px solid rgba(245,158,11,0.14)',
        borderRadius: 12, padding: '12px 14px',
      }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(245,158,11,0.65)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
          💡 Load shedding tip
        </p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>
          During Stage 2+ load shedding, traffic lights go dark — budget an extra 20–45 min for Joburg and Cape Town commutes. Set the buffer above before heading out.
        </p>
      </div>
    </div>
  )
}
