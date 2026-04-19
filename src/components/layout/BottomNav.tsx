'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Sparkles, Wallet, UserCircle } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

const TABS = [
  { href: '/dashboard', icon: Home,       label: 'Home'   },
  { href: '/study',     icon: BookOpen,   label: 'Study'  },
  { href: '/nova',      icon: Sparkles,   label: 'Nova',  isNova: true },
  { href: '/budget',    icon: Wallet,     label: 'Budget' },
  { href: '/profile',   icon: UserCircle, label: 'Profile' },
]

const APP_PREFIXES = [
  '/dashboard', '/study', '/budget', '/meals', '/nova',
  '/profile', '/work', '/campus-life', '/groups', '/referral', '/streak', '/upgrade',
]

export function BottomNav() {
  const pathname = usePathname()
  const show = APP_PREFIXES.some(p => pathname.startsWith(p))
  if (!show) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{
        height: 60,
        background: 'rgba(6, 10, 8, 0.92)',
        borderTop: '0.5px solid var(--border-subtle)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-stretch justify-around h-full">
        {TABS.map(({ href, icon: Icon, label, isNova }) => {
          const active = href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href)

          const activeColor = isNova ? 'var(--nova)' : 'var(--teal)'

          return (
            <Link
              key={href}
              href={href}
              onClick={() => !active && trackEvent('feature_opened', { feature: label.toLowerCase(), path: href })}
              className="flex flex-col items-center justify-center gap-1 flex-1 relative"
              style={{
                color: active ? activeColor : 'var(--text-tertiary)',
                textDecoration: 'none',
                transition: 'transform var(--duration-fast) var(--ease-spring), color var(--duration-base) var(--ease-out)',
              }}
            >
              {/* Active top indicator line */}
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '20%',
                    right: '20%',
                    height: 2,
                    borderRadius: '0 0 2px 2px',
                    background: activeColor,
                  }}
                />
              )}

              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: '0.03em' }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
