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
  { href: '/dashboard',         icon: Home,       label: 'Dashboard' },
  { href: '/study',             icon: BookOpen,   label: 'Study' },
  { href: '/budget',            icon: Wallet,     label: 'Budget' },
  { href: '/nova',              icon: Sparkles,   label: 'Nova',    isNova: true },
  { href: '/meals',             icon: Utensils,   label: 'Meals' },
  { href: '/dashboard/work',    icon: Briefcase,  label: 'Work' },
  { href: '/dashboard/groups',  icon: Users,      label: 'Groups' },
  { href: '/profile',           icon: UserCircle, label: 'Profile' },
]

const APP_PREFIXES = [
  '/dashboard', '/study', '/budget', '/meals', '/nova',
  '/profile', '/work', '/campus-life', '/groups', '/referral', '/streak', '/upgrade',
]

function TierBadge({ tier }: { tier?: string }) {
  if (!tier || tier === 'free') {
    return (
      <span style={{
        fontSize: 10, padding: '2px 8px', borderRadius: 9999,
        background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)',
        border: '0.5px solid rgba(255,255,255,0.12)',
      }}>
        Free
      </span>
    )
  }
  if (tier === 'scholar') {
    return (
      <span style={{
        fontSize: 10, padding: '2px 8px', borderRadius: 9999,
        background: 'var(--teal-dim)', color: 'var(--teal)',
        border: '0.5px solid var(--teal-border)',
      }}>
        Scholar
      </span>
    )
  }
  if (tier === 'premium') {
    return (
      <span style={{
        fontSize: 10, padding: '2px 8px', borderRadius: 9999,
        background: 'var(--gold-dim)', color: 'var(--gold)',
        border: '0.5px solid var(--gold-border)',
      }}>
        Premium
      </span>
    )
  }
  return (
    <span className="tier-unlimited" style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 9999,
    }}>
      Nova ∞
    </span>
  )
}

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

  const profile = store.profile
  const tier    = profile?.subscription_tier ?? 'free'
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40"
      style={{
        width: 240,
        background: '#060A08',
        borderRight: '0.5px solid var(--border-subtle)',
      }}
    >
      {/* Logo area */}
      <div style={{ height: 64, padding: '0 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderBottom: '0.5px solid var(--border-subtle)' }}>
        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--teal)', letterSpacing: '-0.02em' }}>
          VarsityOS
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
          powered by Nova
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ href, icon: Icon, label, isNova }) => {
          const active = href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href)

          const activeColor = isNova ? 'var(--nova)' : '#C9A84C'
          const activeBg    = isNova ? 'var(--nova-dim)' : 'rgba(201,164,76,0.1)'

          return (
            <Link
              key={href}
              href={href}
              onClick={() => !active && trackEvent('feature_opened', { feature: label.toLowerCase(), path: href })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                margin: '1px 8px',
                borderRadius: 'var(--radius-md)',
                color: active ? activeColor : 'var(--text-secondary)',
                background: active ? activeBg : 'transparent',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                transition: 'background var(--duration-base) var(--ease-out), color var(--duration-base) var(--ease-out)',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
                }
              }}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} color={active ? activeColor : undefined} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom — user info */}
      <div style={{ padding: '12px 16px', borderTop: '0.5px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #2D4A22, #C9A84C)', border: '0.5px solid rgba(201,164,76,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#F5EFD6',
        }}>
          {initials}
        </div>

        {/* Name + tier */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {profile?.full_name?.split(' ')[0] ?? 'Student'}
          </div>
          <div style={{ marginTop: 2 }}>
            <TierBadge tier={tier} />
          </div>
        </div>

        {/* Online dot */}
        <div style={{ flexShrink: 0, color: online ? '#00D1A0' : 'var(--text-tertiary)' }}>
          {online ? <Wifi size={14} /> : <WifiOff size={14} />}
        </div>
      </div>
    </aside>
  )
}
