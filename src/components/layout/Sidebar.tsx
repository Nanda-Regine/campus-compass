'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, BookOpen, Wallet, Sparkles, Utensils,
  Briefcase, Users, UserCircle, Wifi, WifiOff,
} from 'lucide-react'
import { useAppStore } from '@/store'
import { useEffect, useState } from 'react'
import { trackEvent } from '@/lib/analytics'

const NAV_ITEMS = [
  { href: '/dashboard',        icon: Home,       label: 'Dashboard' },
  { href: '/study',            icon: BookOpen,   label: 'Study' },
  { href: '/budget',           icon: Wallet,     label: 'Budget' },
  { href: '/nova',             icon: Sparkles,   label: 'Nova',   isNova: true },
  { href: '/meals',            icon: Utensils,   label: 'Meals' },
  { href: '/dashboard/work',   icon: Briefcase,  label: 'Work' },
  { href: '/dashboard/groups', icon: Users,      label: 'Groups' },
  { href: '/profile',          icon: UserCircle, label: 'Profile' },
]

const APP_PREFIXES = [
  '/dashboard', '/study', '/budget', '/meals', '/nova',
  '/profile', '/work', '/campus-life', '/groups', '/referral', '/streak', '/upgrade',
]

export function Sidebar() {
  const pathname = usePathname()
  const store = useAppStore()
  const [online, setOnline] = useState(true)

  const show = APP_PREFIXES.some(p => pathname.startsWith(p))

  useEffect(() => {
    setOnline(navigator.onLine)
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  if (!show) return null

  const profile  = store.profile
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 items-center"
      style={{
        width: 48,
        background: '#0a0b10',
        borderRight: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Nova logomark */}
      <div style={{
        height: 48,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #9b6fd4 0%, #6b3fa0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          color: '#fff',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          boxShadow: '0 0 12px rgba(155,111,212,0.35)',
        }}>
          ✦
        </div>
      </div>

      {/* Nav icons */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0', gap: 2, overflowY: 'auto', width: '100%' }}>
        {NAV_ITEMS.map(({ href, icon: Icon, label, isNova }) => {
          const active = href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href)

          const activeColor = isNova ? '#9b6fd4' : '#9b6fd4'
          const activeBg    = 'rgba(155,111,212,0.15)'

          return (
            <div key={href} style={{ position: 'relative', width: '100%' }}>
              <Link
                href={href}
                title={label}
                onClick={() => !active && trackEvent('feature_opened', { feature: label.toLowerCase(), path: href })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: 40,
                  borderRadius: 10,
                  color: active ? activeColor : 'rgba(255,255,255,0.35)',
                  background: active ? activeBg : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 150ms ease, color 150ms ease',
                  margin: '1px 0',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
                    ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'
                  }
                }}
              >
                <Icon size={17} strokeWidth={active ? 2.2 : 1.7} />
              </Link>

              {/* Active indicator dot */}
              {active && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: 18,
                  borderRadius: '3px 0 0 3px',
                  background: '#9b6fd4',
                }} />
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom — avatar + online dot */}
      <div style={{
        padding: '10px 0',
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        flexShrink: 0,
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2D4A22, #C9A84C)',
          border: '0.5px solid rgba(201,164,76,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 700,
          color: '#F5EFD6',
          flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ color: online ? '#00D1A0' : 'rgba(255,255,255,0.25)' }}>
          {online ? <Wifi size={12} /> : <WifiOff size={12} />}
        </div>
      </div>
    </aside>
  )
}
