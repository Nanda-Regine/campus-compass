'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, BookOpen, Wallet, Sparkles, Utensils,
  Briefcase, Users, UserCircle, Wifi, WifiOff,
  Heart, Dumbbell, Moon, Shield, MapPin, MessageCircle,
  Award, Building2, ChevronLeft, ChevronRight, Globe2, Link2, Home as HomeIcon, Rocket, Bell,
  ShoppingBag, Megaphone,
} from 'lucide-react'
import { useAppStore } from '@/store'
import { useEffect, useState } from 'react'
import { trackEvent } from '@/lib/analytics'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NavItem = { href: string; icon: React.ComponentType<any>; label: string; accent: string; accentDim: string; isNova?: boolean }
type Section = { id: string; label: string; items: NavItem[] }

const SECTIONS: Section[] = [
  {
    id: 'core', label: 'CORE',
    items: [
      { href: '/dashboard',  icon: Home,     label: 'Dashboard',  accent: '#00CFA0', accentDim: 'rgba(0,207,160,0.14)' },
      { href: '/nova',       icon: Sparkles, label: 'Nova AI',    accent: '#A855F7', accentDim: 'rgba(168,85,247,0.18)', isNova: true },
      { href: '/broadcasts', icon: Bell,     label: 'Broadcasts', accent: '#38bdf8', accentDim: 'rgba(56,189,248,0.14)' },
    ],
  },
  {
    id: 'academic', label: 'ACADEMIC',
    items: [
      { href: '/study',    icon: BookOpen, label: 'Study',     accent: '#A855F7', accentDim: 'rgba(168,85,247,0.14)' },
      { href: '/budget',   icon: Wallet,   label: 'Budget',    accent: '#D4A84B', accentDim: 'rgba(212,168,75,0.14)'  },
      { href: '/bursaries', icon: Award,  label: 'Bursaries', accent: '#5B9CF5', accentDim: 'rgba(91,156,245,0.14)'  },
      { href: '/lms',       icon: Link2,  label: 'LMS Sync',  accent: '#6366f1', accentDim: 'rgba(99,102,241,0.14)'   },
    ],
  },
  {
    id: 'life', label: 'LIFE',
    items: [
      { href: '/meals',    icon: Utensils, label: 'Meals',    accent: '#E87040', accentDim: 'rgba(232,112,64,0.14)'   },
      { href: '/housing',  icon: HomeIcon, label: 'Housing',  accent: '#06B6D4', accentDim: 'rgba(6,182,212,0.14)'    },
      { href: '/health',   icon: Heart,    label: 'Health',   accent: '#FB7185', accentDim: 'rgba(251,113,133,0.14)'  },
      { href: '/fitness',  icon: Dumbbell, label: 'Fitness',  accent: '#34D399', accentDim: 'rgba(52,211,153,0.14)'   },
      { href: '/sleep',    icon: Moon,     label: 'Sleep',    accent: '#818CF8', accentDim: 'rgba(129,140,248,0.14)'  },
      { href: '/safety',   icon: Shield,   label: 'Safety',   accent: '#10B981', accentDim: 'rgba(16,185,129,0.14)'   },
      { href: '/movement',      icon: MapPin,   label: 'Movement',  accent: '#06B6D4', accentDim: 'rgba(6,182,212,0.14)'    },
      { href: '/international', icon: Globe2,   label: 'Intl Hub',  accent: '#38BDF8', accentDim: 'rgba(56,189,248,0.14)'  },
    ],
  },
  {
    id: 'career', label: 'CAREER',
    items: [
      { href: '/career',         icon: Briefcase, label: 'Career', accent: '#5B9CF5', accentDim: 'rgba(91,156,245,0.14)' },
      { href: '/dashboard/work', icon: Building2, label: 'Work',   accent: '#D4A84B', accentDim: 'rgba(212,168,75,0.14)'  },
      { href: '/launchpad',      icon: Rocket,   label: 'Launch Pad', accent: '#6366F1', accentDim: 'rgba(99,102,241,0.14)' },
    ],
  },
  {
    id: 'community', label: 'COMMUNITY',
    items: [
      { href: '/dashboard/groups', icon: Users,         label: 'Groups',      accent: '#00CFA0', accentDim: 'rgba(0,207,160,0.14)'   },
      { href: '/social',           icon: MessageCircle, label: 'Social',      accent: '#7090D0', accentDim: 'rgba(112,144,208,0.14)' },
      { href: '/marketplace',      icon: ShoppingBag,   label: 'Marketplace', accent: '#f59e0b', accentDim: 'rgba(245,158,11,0.14)'  },
      { href: '/src',              icon: Megaphone,     label: 'SRC',         accent: '#8b5cf6', accentDim: 'rgba(139,92,246,0.14)'  },
    ],
  },
]

const APP_PREFIXES = [
  '/dashboard', '/study', '/budget', '/meals', '/nova', '/profile',
  '/campus-life', '/referral', '/streak', '/upgrade', '/career',
  '/bursaries', '/notes', '/social', '/tutoring', '/health', '/sleep',
  '/fitness', '/safety', '/movement', '/civic', '/regulate', '/international', '/lms', '/housing', '/launchpad', '/broadcasts',
  '/marketplace', '/src',
]

export const SIDEBAR_EXPANDED_W = 220
export const SIDEBAR_COLLAPSED_W = 56

export function Sidebar() {
  const pathname   = usePathname()
  const store      = useAppStore()
  const [online,    setOnline]    = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted,   setMounted]   = useState(false)

  const show = APP_PREFIXES.some(p => pathname.startsWith(p))

  useEffect(() => {
    const saved = localStorage.getItem('varsityos_sidebar_collapsed')
    const init  = saved === 'true'
    setCollapsed(init)
    document.documentElement.style.setProperty('--sidebar-w', init ? `${SIDEBAR_COLLAPSED_W}px` : `${SIDEBAR_EXPANDED_W}px`)
    setMounted(true)

    setOnline(navigator.onLine)
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('varsityos_sidebar_collapsed', String(next))
    document.documentElement.style.setProperty('--sidebar-w', next ? `${SIDEBAR_COLLAPSED_W}px` : `${SIDEBAR_EXPANDED_W}px`)
  }

  if (!show || !mounted) return null

  const profile  = store.profile
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const W = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40"
      style={{
        width: W,
        background: 'var(--bg-base)',
        borderRight: '0.5px solid rgba(148,111,255,0.12)',
        transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 60% at 0% 40%, rgba(168,85,247,0.07) 0%, transparent 70%)',
      }} />

      {/* Logo row */}
      <div style={{
        height: 56, flexShrink: 0, position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden',
        padding: collapsed ? '0 13px' : '0 14px',
        borderBottom: '0.5px solid rgba(148,111,255,0.10)',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          background: 'linear-gradient(135deg, #A855F7 0%, #00CFA0 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: '#fff', fontWeight: 700, letterSpacing: '-0.02em',
          boxShadow: '0 0 0 1px rgba(168,85,247,0.3), 0 0 18px rgba(168,85,247,0.4)',
        }}>✦</div>
        {!collapsed && (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 13, color: '#fff', letterSpacing: '-0.02em' }}>
              VarsityOS
            </div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 7.5, color: 'rgba(168,85,247,0.65)', letterSpacing: '0.14em' }}>
              STUDENT OS
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: '6px 0 4px', position: 'relative', zIndex: 1,
        scrollbarWidth: 'none',
      }}>
        {SECTIONS.map(section => (
          <div key={section.id} style={{ marginBottom: 2 }}>
            {!collapsed && (
              <div style={{
                fontFamily: '"JetBrains Mono",monospace', fontSize: 7.5, fontWeight: 700,
                color: 'rgba(255,255,255,0.18)', letterSpacing: '0.2em',
                padding: '8px 14px 3px', whiteSpace: 'nowrap',
              }}>
                {section.label}
              </div>
            )}
            {section.items.map(({ href, icon: Icon, label, accent, accentDim, isNova }) => {
              const active = href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(href)
              return (
                <div key={href} style={{ position: 'relative', padding: '1px 6px' }}>
                  <Link
                    href={href}
                    title={collapsed ? label : undefined}
                    onClick={() => !active && trackEvent('feature_opened', { feature: label.toLowerCase(), path: href })}
                    style={{
                      display: 'flex', alignItems: 'center',
                      gap: collapsed ? 0 : 9,
                      padding: '0 10px', height: 34, borderRadius: 10,
                      color: active ? accent : 'var(--text-tertiary)',
                      background: active ? accentDim : 'transparent',
                      textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden',
                      transition: 'background 140ms ease, color 140ms ease',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      position: 'relative',
                    }}
                  >
                    <Icon size={15} strokeWidth={active ? 2.3 : 1.6} style={{ flexShrink: 0 }} />
                    {!collapsed && (
                      <span style={{
                        fontFamily: 'DM Sans,sans-serif', fontSize: 12.5,
                        fontWeight: active ? 600 : 400,
                        color: active ? accent : 'rgba(255,255,255,0.65)',
                        overflow: 'hidden', whiteSpace: 'nowrap',
                      }}>
                        {label}
                      </span>
                    )}
                    {isNova && active && (
                      <span aria-hidden style={{
                        position: 'absolute', inset: 0, borderRadius: 10,
                        border: `1px solid ${accent}40`,
                        boxShadow: `0 0 10px ${accent}30`, pointerEvents: 'none',
                      }} />
                    )}
                  </Link>
                  {active && (
                    <div style={{
                      position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                      width: 3, height: 18, borderRadius: '3px 0 0 3px',
                      background: `linear-gradient(180deg, ${accent} 0%, ${accent}80 100%)`,
                      boxShadow: `0 0 8px ${accent}80`,
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{
        padding: '8px 0 10px', flexShrink: 0, position: 'relative', zIndex: 1,
        borderTop: '0.5px solid rgba(148,111,255,0.10)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        <button
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: collapsed ? 30 : 'calc(100% - 20px)', height: 28, borderRadius: 8,
            margin: '0 auto', background: 'rgba(255,255,255,0.04)',
            border: '0.5px solid rgba(255,255,255,0.07)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 5, color: 'rgba(255,255,255,0.28)', transition: 'all 0.28s',
          }}
        >
          {collapsed
            ? <ChevronRight size={12} />
            : (<><ChevronLeft size={12} /><span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8.5, letterSpacing: '0.06em' }}>Collapse</span></>)
          }
        </button>

        <Link href="/profile" title="Profile" style={{ textDecoration: 'none' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1A0D38 0%, #A855F7 50%, #00CFA0 100%)',
            border: '1.5px solid rgba(168,85,247,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#EDE8F8',
            boxShadow: '0 0 10px rgba(168,85,247,0.25)',
          }}>
            {initials}
          </div>
        </Link>
        <ThemeToggle compact />
        <div title={online ? 'Online' : 'Offline'} style={{ color: online ? '#00CFA0' : 'var(--text-muted)', transition: 'color 300ms' }}>
          {online ? <Wifi size={12} strokeWidth={1.8} /> : <WifiOff size={12} strokeWidth={1.8} />}
        </div>
      </div>
    </aside>
  )
}
