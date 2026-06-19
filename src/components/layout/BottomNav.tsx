'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

// ── Room definitions ─────────────────────────────────────────────────────────

interface QuickLink { href: string; icon: string; label: string }

interface RoomDef {
  id: string
  icon: string
  label: string
  primaryHref: string
  color: string
  routes: string[]
  quickLinks: QuickLink[]
}

const ROOMS: RoomDef[] = [
  {
    id: 'home',
    icon: '🏠',
    label: 'Home',
    primaryHref: '/dashboard',
    color: '#4ecf9e',
    routes: ['/dashboard', '/nova', '/streak', '/profile', '/referral', '/upgrade'],
    quickLinks: [
      { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
      { href: '/nova',      icon: '✦',  label: 'Nova AI' },
      { href: '/streak',    icon: '🔥', label: 'Streaks' },
      { href: '/profile',   icon: '👤', label: 'Profile' },
      { href: '/referral',  icon: '🎁', label: 'Refer & Earn' },
      { href: '/upgrade',   icon: '⭐', label: 'Upgrade' },
    ],
  },
  {
    id: 'study',
    icon: '📚',
    label: 'Study',
    primaryHref: '/study',
    color: '#818CF8',
    routes: ['/study', '/study-groups', '/tutoring', '/notes', '/textbooks', '/reader', '/dashboard/groups', '/dashboard/campus-life'],
    quickLinks: [
      { href: '/study?tab=tasks',      icon: '✓',  label: 'Tasks' },
      { href: '/study?tab=exams',      icon: '📝', label: 'Exams' },
      { href: '/study?tab=flashcards', icon: '🧠', label: 'Cards' },
      { href: '/study?tab=pomodoro',   icon: '⏱',  label: 'Focus' },
      { href: '/study?tab=grades',     icon: '▲',  label: 'Grades' },
      { href: '/study?tab=velocity',   icon: '📈', label: 'Velocity' },
      { href: '/study?tab=attendance', icon: '📋', label: 'Attendance' },
      { href: '/study?tab=pods',       icon: '👥', label: 'Study Pods' },
      { href: '/study?tab=timetable',  icon: '⊞',  label: 'Schedule' },
      { href: '/study?tab=calendar',   icon: '📅', label: 'Calendar' },
      { href: '/study?tab=graduation', icon: '🎓', label: 'Grad Audit' },
      { href: '/study?tab=habits',     icon: '🌱', label: 'Habits' },
      { href: '/reader',               icon: '📖', label: 'Reader' },
      { href: '/study-groups',         icon: '🤝', label: 'Groups' },
    ],
  },
  {
    id: 'finance',
    icon: '💰',
    label: 'Finance',
    primaryHref: '/budget',
    color: '#f59e0b',
    routes: ['/budget', '/bursaries', '/stokvel', '/tax', '/discounts'],
    quickLinks: [
      { href: '/budget?tab=overview',  icon: '📊', label: 'Overview' },
      { href: '/budget?tab=expenses',  icon: '💳', label: 'Expenses' },
      { href: '/budget?tab=wallet',    icon: '💼', label: 'Wallet' },
      { href: '/budget?tab=nsfas',     icon: '🏛️', label: 'NSFAS' },
      { href: '/budget?tab=ai_coach',  icon: '🤖', label: 'AI Coach' },
      { href: '/budget?tab=credit',    icon: '📈', label: 'Credit' },
      { href: '/budget?tab=literacy',  icon: '🎓', label: 'Money 101' },
      { href: '/bursaries',            icon: '🎓', label: 'Bursaries' },
      { href: '/stokvel',              icon: '🪙', label: 'Stokvel' },
      { href: '/discounts',            icon: '🏷️', label: 'Discounts' },
    ],
  },
  {
    id: 'career',
    icon: '🚀',
    label: 'Career',
    primaryHref: '/career',
    color: '#fb923c',
    routes: ['/career', '/jobs', '/mentors', '/skills', '/entrepreneur', '/growth', '/dashboard/work'],
    quickLinks: [
      { href: '/career',               icon: '💼', label: 'Career OS' },
      { href: '/jobs',                 icon: '🧑‍💻', label: 'Jobs' },
      { href: '/mentors',              icon: '🤝', label: 'Mentors' },
      { href: '/skills',               icon: '🖥️', label: 'Skills' },
      { href: '/entrepreneur',         icon: '🚀', label: 'Hustle' },
      { href: '/growth',               icon: '🌿', label: 'Growth' },
      { href: '/dashboard/work',       icon: '🏢', label: 'Work' },
      { href: '/dashboard/work/shifts',icon: '📅', label: 'Shifts' },
    ],
  },
  {
    id: 'life',
    icon: '❤️',
    label: 'Life',
    primaryHref: '/health',
    color: '#fb7185',
    routes: ['/health', '/sleep', '/fitness', '/meals', '/social', '/safety', '/weather', '/movement', '/civic'],
    quickLinks: [
      { href: '/health',   icon: '🏥', label: 'Health' },
      { href: '/sleep',    icon: '🌙', label: 'Sleep' },
      { href: '/fitness',  icon: '💪', label: 'Fitness' },
      { href: '/meals',    icon: '🍲', label: 'Meals' },
      { href: '/social',   icon: '💬', label: 'Social' },
      { href: '/safety',   icon: '🛡️', label: 'Safety' },
      { href: '/movement', icon: '🚌', label: 'Movement' },
      { href: '/civic',    icon: '🗳️', label: 'Civic' },
    ],
  },
]

const ALL_ROUTES = ROOMS.flatMap(r => r.routes)

function getActiveRoom(pathname: string): string | null {
  for (const room of ROOMS) {
    if (room.routes.some(r => pathname === r || pathname.startsWith(r + '/') || pathname.startsWith(r + '?'))) {
      return room.id
    }
  }
  return null
}

// ── Room activity rings (7-day rolling window) ────────────────────────────────

function loadRoomActivity(): Record<string, number> {
  try {
    const data: Record<string, string[]> = JSON.parse(localStorage.getItem('varsityos_room_visits') ?? '{}')
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i)
      return d.toLocaleDateString('en-CA')
    })
    const result: Record<string, number> = {}
    for (const room of ROOMS) {
      const visits = new Set<string>(data[room.id] ?? [])
      result[room.id] = last7.filter(d => visits.has(d)).length / 7
    }
    return result
  } catch { return {} }
}

function recordRoomVisit(roomId: string): void {
  try {
    const data: Record<string, string[]> = JSON.parse(localStorage.getItem('varsityos_room_visits') ?? '{}')
    const today = new Date().toLocaleDateString('en-CA')
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30)
    const visits = (data[roomId] ?? []).filter((d: string) => new Date(d) > cutoff)
    if (!visits.includes(today)) visits.push(today)
    data[roomId] = visits
    localStorage.setItem('varsityos_room_visits', JSON.stringify(data))
  } catch {}
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname()
  const [openSheet, setOpenSheet] = useState<string | null>(null)
  const [streakCount, setStreakCount] = useState(0)
  const [roomActivity, setRoomActivity] = useState<Record<string, number>>({})

  const show = ALL_ROUTES.some(p => pathname === p || pathname.startsWith(p + '/'))
  const activeRoomId = getActiveRoom(pathname)

  // Load activity ring data on mount
  useEffect(() => { setRoomActivity(loadRoomActivity()) }, [])

  // Close sheet on navigation
  useEffect(() => { setOpenSheet(null) }, [pathname])

  // Fetch streak for badge
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const cached = sessionStorage.getItem(`streak_${today}`)
    if (cached) {
      try { setStreakCount(JSON.parse(cached).streak ?? 0) } catch {}
      return
    }
    fetch('/api/streak')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) setStreakCount(d.streak ?? 0) })
      .catch(() => {})
  }, [])

  if (!show) return null

  const openRoom = ROOMS.find(r => r.id === openSheet) ?? null

  // Always open sheet on first tap — users pick the exact section from there
  const handleRoomTap = (room: RoomDef) => {
    recordRoomVisit(room.id)
    setRoomActivity(prev => {
      const current = prev[room.id] ?? 0
      return { ...prev, [room.id]: Math.max(current, 1 / 7) }
    })
    setOpenSheet(prev => prev === room.id ? null : room.id)
    trackEvent('feature_opened', { feature: room.label.toLowerCase(), path: room.primaryHref, source: 'bottom_nav' })
  }

  return (
    <>
      {/* Sheet backdrop */}
      {openSheet && (
        <div
          onClick={() => setOpenSheet(null)}
          className="md:hidden fixed inset-0 z-48"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Quick tools sheet */}
      <div
        className="md:hidden fixed left-0 right-0 z-49"
        style={{
          bottom: 60,
          background: 'rgba(8,13,11,0.97)',
          borderTop: openRoom ? `1px solid ${openRoom.color}30` : '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px 20px 0 0',
          padding: openSheet ? '14px 14px 20px' : '0',
          maxHeight: openSheet ? 'calc(100vh - 120px)' : '0',
          overflow: openSheet ? 'auto' : 'hidden',
          transform: openSheet ? 'translateY(0)' : 'translateY(8px)',
          opacity: openSheet ? 1 : 0,
          transition: 'max-height 0.3s cubic-bezier(0.32,0,0.15,1), opacity 0.2s, transform 0.3s, padding 0.2s',
          backdropFilter: 'blur(24px)',
        }}
      >
        {openRoom && (
          <>
            {/* Sheet header — tap label to go to primary page */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Link
                href={openRoom.primaryHref}
                onClick={() => {
                  setOpenSheet(null)
                  trackEvent('feature_opened', { feature: openRoom.label.toLowerCase(), path: openRoom.primaryHref, source: 'room_sheet_header' })
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
              >
                <span style={{ fontSize: 16 }}>{openRoom.icon}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: openRoom.color }}>
                  {openRoom.label} Room
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: `${openRoom.color}80`, letterSpacing: '0.04em' }}>↗</span>
              </Link>
              <button
                onClick={() => setOpenSheet(null)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* 4-col quick links grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {openRoom.quickLinks.map(link => {
                const base   = link.href.split('?')[0]
                const active = pathname === base || pathname.startsWith(base + '/')
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      setOpenSheet(null)
                      trackEvent('feature_opened', { feature: link.label.toLowerCase(), path: link.href, source: 'room_sheet' })
                    }}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      padding: '10px 4px 8px',
                      background: active ? `${openRoom.color}18` : 'rgba(255,255,255,0.04)',
                      border: `0.5px solid ${active ? openRoom.color + '45' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 12,
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: active ? `${openRoom.color}25` : 'rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16,
                      }}>
                        {link.icon}
                      </div>
                      <span style={{
                        fontSize: 9.5, fontFamily: 'DM Sans, sans-serif',
                        fontWeight: active ? 600 : 400,
                        color: active ? openRoom.color : 'rgba(255,255,255,0.5)',
                        textAlign: 'center', lineHeight: 1.2,
                      }}>
                        {link.label}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Main bottom nav bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          height: 60,
          background: 'rgba(6,10,8,0.96)',
          borderTop: '0.5px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex items-stretch h-full">
          {ROOMS.map(room => {
            const isActive  = activeRoomId === room.id
            const isOpen    = openSheet === room.id
            const highlight = isActive || isOpen  // lit when on this room OR sheet is open

            return (
              <Link
                key={room.id}
                href="#"
                onClick={e => {
                  e.preventDefault()
                  handleRoomTap(room)
                }}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 relative select-none"
                style={{
                  color: highlight ? room.color : 'rgba(255,255,255,0.32)',
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
              >
                {/* Active indicator bar */}
                {highlight && (
                  <span style={{
                    position: 'absolute', top: 0, left: '20%', right: '20%',
                    height: 2, borderRadius: '0 0 2px 2px',
                    background: room.color,
                    boxShadow: `0 0 8px ${room.color}80`,
                  }} />
                )}

                {/* Active room gets a subtle bg pill */}
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 28, borderRadius: 10,
                  background: highlight ? `${room.color}14` : 'transparent',
                  transition: 'background 0.2s',
                  fontSize: room.id === 'home' ? 17 : 18,
                  position: 'relative',
                }}>
                  {/* Activity ring — fills based on days active in last 7 */}
                  {(roomActivity[room.id] ?? 0) > 0 && (() => {
                    const fill = roomActivity[room.id] ?? 0
                    const r = 20
                    const circ = 2 * Math.PI * r
                    return (
                      <svg
                        width={48} height={48}
                        aria-hidden="true"
                        style={{
                          position: 'absolute', top: '50%', left: '50%',
                          transform: 'translate(-50%, -50%)',
                          pointerEvents: 'none', overflow: 'visible',
                        }}
                      >
                        {/* Track */}
                        <circle cx={24} cy={24} r={r} fill="none"
                          stroke={`${room.color}20`} strokeWidth={2.5} />
                        {/* Fill arc */}
                        <circle cx={24} cy={24} r={r} fill="none"
                          stroke={room.color} strokeWidth={2.5} strokeLinecap="round"
                          strokeDasharray={`${fill * circ} ${circ}`}
                          transform="rotate(-90 24 24)"
                          style={{ transition: 'stroke-dasharray 0.7s ease', filter: fill >= 1 ? `drop-shadow(0 0 3px ${room.color})` : 'none' }}
                        />
                      </svg>
                    )
                  })()}
                  {room.icon}
                  {/* Streak badge on Home */}
                  {room.id === 'home' && streakCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -3, right: -3,
                      fontSize: 8, fontFamily: 'var(--font-mono)', fontWeight: 700,
                      background: '#f59e0b', color: '#000',
                      borderRadius: 9999, padding: '1px 3px',
                      lineHeight: 1.4, minWidth: 14, textAlign: 'center',
                    }}>
                      {streakCount}
                    </span>
                  )}
                  {/* Open indicator chevron */}
                  {isOpen && (
                    <span style={{
                      position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
                      fontSize: 7, color: room.color, lineHeight: 1,
                    }}>▲</span>
                  )}
                </span>

                <span style={{
                  fontSize: 9.5, fontWeight: highlight ? 600 : 400,
                  letterSpacing: '0.02em', fontFamily: 'DM Sans, sans-serif',
                  lineHeight: 1,
                }}>
                  {room.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
