'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, BookOpen, Wallet, Sparkles, Utensils, Briefcase,
  Users, UserCircle, Heart, Dumbbell, Moon, Shield,
  MapPin, MessageCircle, Award, Building2, X,
  GraduationCap, Globe, Flame,
} from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NavItem = { href: string; icon: React.ComponentType<any>; label: string; accent: string; emoji: string }
type Section = { id: string; label: string; items: NavItem[] }

const SECTIONS: Section[] = [
  {
    id: 'core', label: 'Core',
    items: [
      { href: '/dashboard', icon: Home,     label: 'Dashboard', accent: '#00CFA0', emoji: '🏠' },
      { href: '/nova',      icon: Sparkles, label: 'Nova AI',   accent: '#A855F7', emoji: '✨' },
    ],
  },
  {
    id: 'academic', label: 'Academic',
    items: [
      { href: '/study',    icon: BookOpen,      label: 'Study Room',  accent: '#A855F7', emoji: '📚' },
      { href: '/budget',   icon: Wallet,        label: 'Budget',      accent: '#D4A84B', emoji: '💸' },
      { href: '/bursaries',icon: Award,         label: 'Bursaries',   accent: '#5B9CF5', emoji: '🎓' },
    ],
  },
  {
    id: 'life', label: 'Life',
    items: [
      { href: '/meals',    icon: Utensils, label: 'Meals',    accent: '#E87040', emoji: '🍲' },
      { href: '/housing',  icon: Home,     label: 'Housing',  accent: '#06B6D4', emoji: '🏠' },
      { href: '/health',   icon: Heart,    label: 'Health',   accent: '#FB7185', emoji: '🏥' },
      { href: '/fitness',  icon: Dumbbell, label: 'Fitness',  accent: '#34D399', emoji: '💪' },
      { href: '/sleep',    icon: Moon,     label: 'Sleep',    accent: '#818CF8', emoji: '🌙' },
      { href: '/safety',   icon: Shield,   label: 'Safety',   accent: '#10B981', emoji: '🛡️' },
      { href: '/movement', icon: MapPin,   label: 'Movement', accent: '#06B6D4', emoji: '🚌' },
    ],
  },
  {
    id: 'career', label: 'Career',
    items: [
      { href: '/career',         icon: Briefcase, label: 'Career OS', accent: '#5B9CF5', emoji: '💼' },
      { href: '/dashboard/work', icon: Building2, label: 'Work',      accent: '#D4A84B', emoji: '🏢' },
    ],
  },
  {
    id: 'community', label: 'Community',
    items: [
      { href: '/dashboard/groups', icon: Users,         label: 'Groups', accent: '#00CFA0', emoji: '👥' },
      { href: '/social',           icon: MessageCircle, label: 'Social', accent: '#7090D0', emoji: '💬' },
    ],
  },
]

const APP_PREFIXES = [
  '/dashboard', '/study', '/budget', '/meals', '/nova', '/profile',
  '/campus-life', '/referral', '/streak', '/career', '/bursaries',
  '/notes', '/social', '/tutoring', '/health', '/sleep', '/fitness',
  '/safety', '/movement', '/civic', '/regulate', '/housing',
]

const STYLE_ID = 'varsityos-mobile-sidebar'
function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes ms-in  { from{transform:translateX(-100%)} to{transform:translateX(0)} }
    @keyframes ms-out { from{transform:translateX(0)} to{transform:translateX(-100%)} }
    @keyframes ms-fade{ from{opacity:0} to{opacity:1} }
  `
  document.head.appendChild(el)
}

export function MobileSidebar() {
  const pathname = usePathname()
  const [open,    setOpen]    = useState(false)
  const [mounted, setMounted] = useState(false)

  const show = APP_PREFIXES.some(p => pathname.startsWith(p))

  useEffect(() => { injectStyles(); setMounted(true) }, [])
  useEffect(() => { setOpen(false) }, [pathname])

  if (!show || !mounted) return null

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 z-[60]"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', animation: 'ms-fade 0.2s ease' }}
        />
      )}

      {/* Drawer */}
      {open && (
        <div
          className="md:hidden fixed left-0 top-0 bottom-0 z-[70] flex flex-col"
          style={{
            width: 280,
            background: 'rgba(8,13,11,0.98)',
            borderRight: '0.5px solid rgba(168,85,247,0.18)',
            backdropFilter: 'blur(24px)',
            animation: 'ms-in 0.28s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Header */}
          <div style={{
            height: 60, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, #A855F7 0%, #00CFA0 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: '#fff', fontWeight: 700,
                boxShadow: '0 0 14px rgba(168,85,247,0.4)',
              }}>✦</div>
              <div>
                <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 13, color: '#fff' }}>VarsityOS</div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 7, color: 'rgba(168,85,247,0.65)', letterSpacing: '0.14em' }}>STUDENT OS</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0', scrollbarWidth: 'none' }}>
            {SECTIONS.map(section => (
              <div key={section.id} style={{ marginBottom: 4 }}>
                <div style={{
                  fontFamily: '"JetBrains Mono",monospace', fontSize: 8, fontWeight: 700,
                  color: 'rgba(255,255,255,0.2)', letterSpacing: '0.18em',
                  padding: '8px 16px 3px',
                }}>
                  {section.label.toUpperCase()}
                </div>
                {section.items.map(({ href, icon: Icon, label, accent, emoji }) => {
                  const active = href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => { setOpen(false); trackEvent('feature_opened', { feature: label.toLowerCase(), path: href, source: 'mobile_sidebar' }) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '0 16px', height: 42, textDecoration: 'none',
                        background: active ? `${accent}14` : 'transparent',
                        borderLeft: active ? `2px solid ${accent}` : '2px solid transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 17, flexShrink: 0 }}>{emoji}</span>
                      <span style={{
                        fontFamily: 'DM Sans,sans-serif', fontSize: 14,
                        fontWeight: active ? 600 : 400,
                        color: active ? accent : 'rgba(255,255,255,0.75)',
                      }}>
                        {label}
                      </span>
                      {active && (
                        <div style={{
                          marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
                          background: accent, boxShadow: `0 0 6px ${accent}`,
                        }} />
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div style={{
            padding: '12px 16px 20px', borderTop: '0.5px solid rgba(255,255,255,0.06)',
            display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <Link href="/profile" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '0.5px solid rgba(255,255,255,0.08)',
              }}>
                <UserCircle size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                  My Profile
                </span>
              </div>
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
