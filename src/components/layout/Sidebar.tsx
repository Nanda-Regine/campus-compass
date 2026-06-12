'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, BookOpen, Wallet, Sparkles, Utensils,
  Briefcase, Users, UserCircle, Wifi, WifiOff, GraduationCap,
} from 'lucide-react'
import { useAppStore } from '@/store'
import { useEffect, useState } from 'react'
import { trackEvent } from '@/lib/analytics'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

// Per-domain accent colors — each pillar has its own identity
const NAV_ITEMS = [
  { href: '/dashboard',        icon: Home,           label: 'Dashboard', accent: '#00CFA0', accentDim: 'rgba(0,207,160,0.14)'   },
  { href: '/study',            icon: BookOpen,       label: 'Study',     accent: '#A855F7', accentDim: 'rgba(168,85,247,0.14)'  },
  { href: '/budget',           icon: Wallet,         label: 'Budget',    accent: '#D4A84B', accentDim: 'rgba(212,168,75,0.14)'  },
  { href: '/nova',             icon: Sparkles,       label: 'Nova',      accent: '#A855F7', accentDim: 'rgba(168,85,247,0.18)', isNova: true },
  { href: '/meals',            icon: Utensils,       label: 'Meals',     accent: '#E87040', accentDim: 'rgba(232,112,64,0.14)'  },
  { href: '/career',           icon: GraduationCap,  label: 'Career',    accent: '#5B9CF5', accentDim: 'rgba(91,156,245,0.14)'  },
  { href: '/dashboard/work',   icon: Briefcase,      label: 'Work',      accent: '#D4A84B', accentDim: 'rgba(212,168,75,0.14)'  },
  { href: '/dashboard/groups', icon: Users,          label: 'Groups',    accent: '#00CFA0', accentDim: 'rgba(0,207,160,0.14)'   },
  { href: '/profile',          icon: UserCircle,     label: 'Profile',   accent: '#7090D0', accentDim: 'rgba(112,144,208,0.14)' },
]

const APP_PREFIXES = [
  '/dashboard', '/study', '/budget', '/meals', '/nova',
  '/profile', '/work', '/campus-life', '/groups', '/referral', '/streak', '/upgrade',
  '/career', '/bursaries', '/notes', '/social', '/tutoring',
]

export function Sidebar() {
  const pathname = usePathname()
  const store = useAppStore()
  const [online, setOnline] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)

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
      className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 items-center"
      style={{
        width: 52,
        background: 'var(--bg-base)',
        borderRight: '0.5px solid rgba(148,111,255,0.12)',
        /* Subtle amethyst nebula bleeds in from left */
      }}
    >
      {/* Ambient left-edge glow — amethyst seeps through the border */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 60% at 0% 40%, rgba(168,85,247,0.07) 0%, transparent 70%)',
      }} />

      {/* ── Logomark ───────────────────────────────────────────── */}
      <div style={{
        height: 52,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '0.5px solid rgba(148,111,255,0.10)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: 'linear-gradient(135deg, #A855F7 0%, #00CFA0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          color: '#fff',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          boxShadow: '0 0 0 1px rgba(168,85,247,0.3), 0 0 18px rgba(168,85,247,0.4), 0 0 36px rgba(0,207,160,0.15)',
          flexShrink: 0,
        }}>
          ✦
        </div>
      </div>

      {/* ── Nav icons ──────────────────────────────────────────── */}
      <nav style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '8px 6px', gap: 2, overflowY: 'auto', width: '100%',
        position: 'relative', zIndex: 1,
      }}>
        {NAV_ITEMS.map(({ href, icon: Icon, label, accent, accentDim, isNova }) => {
          const active = href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href)
          const isHovered = hovered === href

          return (
            <div key={href} style={{ position: 'relative', width: '100%' }}>
              <Link
                href={href}
                title={label}
                onClick={() => !active && trackEvent('feature_opened', { feature: label.toLowerCase(), path: href })}
                onMouseEnter={() => setHovered(href)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: 40,
                  borderRadius: 10,
                  color: active ? accent : isHovered ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.28)',
                  background: active
                    ? accentDim
                    : isHovered
                      ? 'rgba(148,111,255,0.07)'
                      : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 140ms ease, color 140ms ease, box-shadow 140ms ease',
                  boxShadow: active && isNova
                    ? `0 0 12px ${accentDim}`
                    : 'none',
                  position: 'relative',
                }}
              >
                <Icon size={17} strokeWidth={active ? 2.3 : 1.6} />

                {/* Nova sparkle halo — extra glow ring when active */}
                {isNova && active && (
                  <span aria-hidden="true" style={{
                    position: 'absolute', inset: -1,
                    borderRadius: 11,
                    border: `1px solid ${accent}40`,
                    boxShadow: `0 0 10px ${accent}30`,
                    pointerEvents: 'none',
                  }} />
                )}
              </Link>

              {/* Active indicator — glowing gradient pill on right edge */}
              {active && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: 20,
                  borderRadius: '3px 0 0 3px',
                  background: `linear-gradient(180deg, ${accent} 0%, ${accent}80 100%)`,
                  boxShadow: `0 0 8px ${accent}80, 0 0 16px ${accent}40`,
                }} />
              )}

              {/* Tooltip label on hover */}
              {isHovered && !active && (
                <div style={{
                  position: 'absolute',
                  left: '100%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  marginLeft: 8,
                  whiteSpace: 'nowrap',
                  background: 'var(--bg-elevated)',
                  border: '0.5px solid rgba(148,111,255,0.18)',
                  borderRadius: 7,
                  padding: '4px 9px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  pointerEvents: 'none',
                  zIndex: 50,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  letterSpacing: '0.01em',
                }}>
                  {label}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Bottom — avatar + theme + connectivity ─────────────── */}
      <div style={{
        padding: '10px 0 12px',
        borderTop: '0.5px solid rgba(148,111,255,0.10)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Avatar — Afrofuturist bronze/jade gradient */}
        <Link href="/profile" title="Profile" style={{ textDecoration: 'none' }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1A0D38 0%, #A855F7 50%, #00CFA0 100%)',
            border: '1.5px solid rgba(168,85,247,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700,
            color: '#EDE8F8',
            flexShrink: 0,
            boxShadow: '0 0 10px rgba(168,85,247,0.25)',
          }}>
            {initials}
          </div>
        </Link>

        <ThemeToggle compact />

        {/* Connectivity indicator */}
        <div
          title={online ? 'Online' : 'Offline'}
          style={{
            color: online ? '#00CFA0' : 'rgba(255,255,255,0.2)',
            transition: 'color 300ms ease',
          }}
        >
          {online ? <Wifi size={12} strokeWidth={1.8} /> : <WifiOff size={12} strokeWidth={1.8} />}
        </div>
      </div>
    </aside>
  )
}
