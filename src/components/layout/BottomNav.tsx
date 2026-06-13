'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Home, BookOpen, Sparkles, Wallet,
  Utensils, Briefcase, Users, UserCircle,
  Flame, Gift, MoreHorizontal, X, TrendingUp, GraduationCap,
  BookMarked, School, Shield, Heart, Rocket, Tag, Vote,
  Leaf, Coins, Receipt, Briefcase as BriefcaseIcon, MonitorSmartphone, Activity, Moon, Cloud, Navigation,
} from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

const PRIMARY_TABS = [
  { href: '/dashboard', icon: Home,      label: 'Home'   },
  { href: '/study',     icon: BookOpen,  label: 'Study'  },
  { href: '/nova',      icon: Sparkles,  label: 'Nova',  isNova: true },
  { href: '/budget',    icon: Wallet,    label: 'Budget' },
]

// Sectioned MORE drawer — mirrors the Drawer nav sections
const MORE_SECTIONS = [
  {
    label: 'Academic', color: '#4ecf9e',
    items: [
      { href: '/notes',        icon: BookMarked,      label: 'Notes',    accent: '#4ecf9e' },
      { href: '/study-groups', icon: Users,           label: 'Groups',   accent: '#6366F1' },
      { href: '/tutoring',     icon: School,          label: 'Tutoring', accent: '#c9a84c' },
      { href: '/textbooks',    icon: BookMarked,      label: 'Books',    accent: '#4ecf9e' },
    ],
  },
  {
    label: 'Money', color: '#D4AF37',
    items: [
      { href: '/bursaries',    icon: Gift,            label: 'Bursaries',accent: '#4ecf9e' },
      { href: '/stokvel',      icon: Coins,           label: 'Stokvel',  accent: '#34D399' },
      { href: '/tax',          icon: Receipt,         label: 'Tax',      accent: '#D4AF37' },
      { href: '/discounts',    icon: Tag,             label: 'Discounts',accent: '#4ecf9e' },
    ],
  },
  {
    label: 'Career', color: '#6366F1',
    items: [
      { href: '/career',       icon: GraduationCap,   label: 'Career',   accent: '#7090d0' },
      { href: '/jobs',         icon: BriefcaseIcon,   label: 'Jobs',     accent: '#6366F1' },
      { href: '/mentors',      icon: GraduationCap,   label: 'Mentors',  accent: '#6366F1' },
      { href: '/skills',       icon: MonitorSmartphone, label: 'Skills', accent: '#38BDF8' },
    ],
  },
  {
    label: 'Growth', color: '#F59E0B',
    items: [
      { href: '/growth',         icon: Leaf,          label: 'Growth',   accent: '#6366F1' },
      { href: '/entrepreneur',   icon: Rocket,        label: 'Hustle',   accent: '#F59E0B' },
      { href: '/dashboard/work', icon: Briefcase,     label: 'Work',     accent: '#7090d0' },
      { href: '/civic',          icon: Vote,          label: 'Civic',    accent: '#38BDF8' },
    ],
  },
  {
    label: 'Health & Body', color: '#FB7185',
    items: [
      { href: '/meals',    icon: Utensils,   label: 'Nutrition', accent: '#e8834a' },
      { href: '/sleep',    icon: Moon,       label: 'Sleep',     accent: '#818CF8' },
      { href: '/weather',  icon: Cloud,      label: 'Weather',   accent: '#38BDF8' },
      { href: '/health',   icon: Heart,      label: 'Health',    accent: '#FB7185' },
      { href: '/fitness',  icon: Activity,   label: 'Fitness',   accent: '#FB7185' },
      { href: '/safety',   icon: Shield,     label: 'Safety',    accent: '#34D399' },
      { href: '/movement', icon: Navigation, label: 'Movement',  accent: '#38BDF8' },
    ],
  },
  {
    label: 'Account', color: '#9b6fd4',
    items: [
      { href: '/social',   icon: Users,       label: 'Social',   accent: '#9b6fd4' },
      { href: '/streak',   icon: Flame,       label: 'Streak',   accent: '#f59e0b' },
      { href: '/referral', icon: Gift,        label: 'Referral', accent: '#9b6fd4' },
      { href: '/upgrade',  icon: TrendingUp,  label: 'Upgrade',  accent: '#c9a84c' },
      { href: '/profile',  icon: UserCircle,  label: 'Profile',  accent: '#7a99b8' },
    ],
  },
]

// Flat list derived from sections — for active-state detection
const MORE_ITEMS = MORE_SECTIONS.flatMap(s => s.items)

const APP_PREFIXES = [
  '/dashboard', '/study', '/budget', '/meals', '/nova',
  '/profile', '/work', '/campus-life', '/groups', '/referral', '/streak', '/upgrade',
  '/career', '/bursaries', '/notes', '/social', '/tutoring', '/safety',
  '/health', '/growth', '/entrepreneur', '/discounts', '/civic',
  '/stokvel', '/tax', '/jobs', '/skills',
  '/textbooks', '/mentors', '/fitness', '/study-groups', '/sleep', '/weather', '/movement',
]

export function BottomNav() {
  const pathname    = usePathname()
  const { theme }   = useTheme()
  const isOutdoor   = theme === 'outdoor'
  const [moreOpen, setMoreOpen]     = useState(false)
  const [streakCount, setStreakCount] = useState(0)

  const show = APP_PREFIXES.some(p => pathname.startsWith(p))

  useEffect(() => { setMoreOpen(false) }, [pathname])

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
          className="md:hidden"
          style={{
            position: 'fixed', inset: 0, zIndex: 48,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Sectioned MORE slide-up sheet */}
      <div
        className="md:hidden"
        style={{
          position: 'fixed', left: 0, right: 0, zIndex: 49,
          bottom: 60,
          maxHeight: 'calc(100vh - 72px)',
          overflowY: 'auto',
          transform: moreOpen ? 'translateY(0)' : 'translateY(110%)',
          background: isOutdoor ? 'var(--bg-base)' : 'rgba(10,12,17,0.98)',
          borderTop: isOutdoor ? '1px solid var(--border-default)' : '0.5px solid rgba(255,255,255,0.1)',
          borderRadius: '20px 20px 0 0',
          padding: '14px 16px 32px',
          transition: 'transform 0.32s cubic-bezier(0.32,0,0.15,1)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Handle bar + close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: isOutdoor ? 'var(--text-muted)' : 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            All features
          </div>
          <button
            onClick={() => setMoreOpen(false)}
            style={{ background: isOutdoor ? 'var(--bg-elevated)' : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isOutdoor ? 'var(--text-secondary)' : 'rgba(255,255,255,0.4)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Sections */}
        {MORE_SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom: 18 }}>
            {/* Section label with colored line */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
            }}>
              <div style={{ height: '0.5px', width: 8, background: section.color + '60' }} />
              <span style={{
                fontSize: '0.52rem', letterSpacing: '0.16em', textTransform: 'uppercase',
                color: section.color + 'cc', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                flexShrink: 0,
              }}>
                {section.label}
              </span>
              <div style={{ flex: 1, height: '0.5px', background: section.color + '25' }} />
            </div>

            {/* 4-col grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {section.items.map(({ href, icon: Icon, label, accent }) => {
                const active    = pathname.startsWith(href)
                const isStreak  = label === 'Streak'
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => {
                      trackEvent('feature_opened', { feature: label.toLowerCase(), path: href, source: 'more_drawer' })
                      setMoreOpen(false)
                    }}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      padding: '10px 4px 8px',
                      background: active ? `${accent}18` : isOutdoor ? 'var(--bg-surface)' : 'rgba(255,255,255,0.04)',
                      border: `0.5px solid ${active ? accent + '40' : isOutdoor ? 'var(--border-subtle)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 12, position: 'relative',
                      transition: 'all 0.15s',
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: active ? `${accent}25` : isOutdoor ? 'var(--bg-elevated)' : 'rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: active ? accent : isOutdoor ? 'var(--text-secondary)' : 'rgba(255,255,255,0.5)',
                        position: 'relative',
                      }}>
                        <Icon size={16} strokeWidth={active ? 2.2 : 1.7} />
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
                      <span style={{
                        fontSize: 9.5, fontFamily: 'DM Sans, sans-serif',
                        fontWeight: active ? 600 : 400,
                        color: active ? accent : isOutdoor ? 'var(--text-secondary)' : 'rgba(255,255,255,0.45)',
                        letterSpacing: '0.01em', textAlign: 'center', lineHeight: 1.2,
                      }}>
                        {label}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Main bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          height: 60,
          background: isOutdoor ? 'var(--bg-base)' : 'rgba(6,10,8,0.95)',
          borderTop: isOutdoor ? '1px solid var(--border-default)' : '0.5px solid rgba(255,255,255,0.07)',
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
                style={{ color: active ? activeColor : isOutdoor ? 'var(--text-tertiary)' : 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.15s ease' }}
              >
                {active && (
                  <span style={{ position: 'absolute', top: 0, left: '22%', right: '22%', height: 2, borderRadius: '0 0 2px 2px', background: activeColor }} />
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
              color: moreOpen || isMoreActive ? '#c9a84c' : isOutdoor ? 'var(--text-tertiary)' : 'rgba(255,255,255,0.35)',
              background: 'none', border: 'none', cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
          >
            {(moreOpen || isMoreActive) && (
              <span style={{ position: 'absolute', top: 0, left: '22%', right: '22%', height: 2, borderRadius: '0 0 2px 2px', background: '#c9a84c' }} />
            )}
            {streakCount > 0 && !moreOpen && !isMoreActive && (
              <span style={{ position: 'absolute', top: 8, right: '18%', fontSize: 8, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, background: '#f59e0b', color: '#000', borderRadius: 9999, padding: '1px 3px', lineHeight: 1.4, minWidth: 14, textAlign: 'center' }}>
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
