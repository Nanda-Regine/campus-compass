'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, BookOpen, Sparkles, Wallet,
  Utensils, Briefcase, Users, UserCircle,
  Flame, Gift, MoreHorizontal, X, TrendingUp, GraduationCap,
  BookMarked,
} from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

const PRIMARY_TABS = [
  { href: '/dashboard', icon: Home,      label: 'Home'   },
  { href: '/study',     icon: BookOpen,  label: 'Study'  },
  { href: '/nova',      icon: Sparkles,  label: 'Nova',  isNova: true },
  { href: '/budget',    icon: Wallet,    label: 'Budget' },
]

const MORE_ITEMS = [
  { href: '/meals',            icon: Utensils,      label: 'Meals',    accent: '#e8834a' },
  { href: '/career',           icon: GraduationCap, label: 'Career',   accent: '#7090d0' },
  { href: '/bursaries',        icon: Gift,          label: 'Bursaries',accent: '#4ecf9e' },
  { href: '/dashboard/work',   icon: Briefcase,     label: 'Work',     accent: '#7090d0' },
  { href: '/notes',            icon: BookMarked,    label: 'Notes',    accent: '#4ecf9e' },
  { href: '/social',           icon: Users,         label: 'Social',   accent: '#9b6fd4' },
  { href: '/dashboard/groups', icon: Users,         label: 'Groups',   accent: '#4ecf9e' },
  { href: '/streak',           icon: Flame,         label: 'Streak',   accent: '#f59e0b' },
  { href: '/referral',         icon: Gift,          label: 'Referral', accent: '#9b6fd4' },
  { href: '/upgrade',          icon: TrendingUp,    label: 'Upgrade',  accent: '#c9a84c' },
  { href: '/profile',          icon: UserCircle,    label: 'Profile',  accent: '#7a99b8' },
]

const APP_PREFIXES = [
  '/dashboard', '/study', '/budget', '/meals', '/nova',
  '/profile', '/work', '/campus-life', '/groups', '/referral', '/streak', '/upgrade',
  '/career', '/bursaries', '/notes', '/social',
]

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const [streakCount, setStreakCount] = useState(0)

  const show = APP_PREFIXES.some(p => pathname.startsWith(p))

  // Close drawer on route change
  useEffect(() => { setMoreOpen(false) }, [pathname])

  // Fetch streak badge count once
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const cached = sessionStorage.getItem(`streak_${today}`)
    if (cached) {
      try { setStreakCount(JSON.parse(cached).streak ?? 0) } catch { /* ignore */ }
      return
    }
    fetch('/api/streak')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) setStreakCount(d.streak ?? 0) })
      .catch(() => {})
  }, [])

  if (!show) return null

  const isMoreActive = MORE_ITEMS.some(i => pathname.startsWith(i.href))

  return (
    <>
      {/* Backdrop */}
      {moreOpen && (
        <div
          onClick={() => setMoreOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 48,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* "More" slide-up drawer */}
      <div
        style={{
          position: 'fixed', left: 0, right: 0, zIndex: 49,
          bottom: moreOpen ? 60 : -280,
          background: 'rgba(13,14,20,0.98)',
          borderTop: '0.5px solid rgba(255,255,255,0.1)',
          borderRadius: '20px 20px 0 0',
          padding: '16px 20px 12px',
          transition: 'bottom 0.32s cubic-bezier(0.32,0,0.15,1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Handle + close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            More
          </div>
          <button
            onClick={() => setMoreOpen(false)}
            style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Grid of more items */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {MORE_ITEMS.map(({ href, icon: Icon, label, accent }) => {
            const active = pathname.startsWith(href)
            const isStreak = label === 'Streak'
            return (
              <Link
                key={href}
                href={href}
                onClick={() => { trackEvent('feature_opened', { feature: label.toLowerCase(), path: href, source: 'more_drawer' }); setMoreOpen(false) }}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '12px 4px 10px',
                  background: active ? `${accent}18` : 'rgba(255,255,255,0.04)',
                  border: `0.5px solid ${active ? accent + '40' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 14,
                  position: 'relative',
                  transition: 'all 0.15s ease',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: active ? `${accent}25` : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: active ? accent : 'rgba(255,255,255,0.5)',
                    position: 'relative',
                  }}>
                    <Icon size={18} strokeWidth={active ? 2.2 : 1.7} />
                    {isStreak && streakCount > 0 && (
                      <span style={{
                        position: 'absolute', top: -4, right: -4,
                        fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                        background: '#f59e0b', color: '#000',
                        borderRadius: 9999, padding: '1px 4px', lineHeight: 1.4,
                        minWidth: 16, textAlign: 'center',
                      }}>
                        {streakCount}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 10, fontFamily: 'DM Sans, sans-serif', fontWeight: active ? 600 : 400, color: active ? accent : 'rgba(255,255,255,0.45)', letterSpacing: '0.01em' }}>
                    {label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          height: 60,
          background: 'rgba(6,10,8,0.95)',
          borderTop: '0.5px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex items-stretch justify-around h-full">

          {PRIMARY_TABS.map(({ href, icon: Icon, label, isNova }) => {
            const active = href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href)
            const activeColor = isNova ? 'var(--nova, #9b6fd4)' : '#0d9488'

            return (
              <Link
                key={href}
                href={href}
                onClick={() => !active && trackEvent('feature_opened', { feature: label.toLowerCase(), path: href })}
                className="flex flex-col items-center justify-center gap-1 flex-1 relative"
                style={{
                  color: active ? activeColor : 'rgba(255,255,255,0.35)',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
              >
                {active && (
                  <span style={{
                    position: 'absolute', top: 0, left: '22%', right: '22%',
                    height: 2, borderRadius: '0 0 2px 2px',
                    background: activeColor,
                  }} />
                )}
                <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: '0.03em', fontFamily: 'DM Sans, sans-serif' }}>
                  {label}
                </span>
              </Link>
            )
          })}

          {/* More tab */}
          <button
            onClick={() => setMoreOpen(v => !v)}
            className="flex flex-col items-center justify-center gap-1 flex-1 relative"
            style={{
              color: moreOpen || isMoreActive ? '#c9a84c' : 'rgba(255,255,255,0.35)',
              background: 'none', border: 'none', cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
          >
            {(moreOpen || isMoreActive) && (
              <span style={{
                position: 'absolute', top: 0, left: '22%', right: '22%',
                height: 2, borderRadius: '0 0 2px 2px',
                background: '#c9a84c',
              }} />
            )}
            {streakCount > 0 && !moreOpen && !isMoreActive && (
              <span style={{
                position: 'absolute', top: 8, right: '18%',
                fontSize: 8, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                background: '#f59e0b', color: '#000',
                borderRadius: 9999, padding: '1px 3px', lineHeight: 1.4, minWidth: 14, textAlign: 'center',
              }}>
                {streakCount}
              </span>
            )}
            {moreOpen ? <X size={20} strokeWidth={2} /> : <MoreHorizontal size={20} strokeWidth={1.8} />}
            <span style={{ fontSize: 10, fontWeight: moreOpen || isMoreActive ? 600 : 400, letterSpacing: '0.03em', fontFamily: 'DM Sans, sans-serif' }}>
              More
            </span>
          </button>

        </div>
      </nav>
    </>
  )
}
