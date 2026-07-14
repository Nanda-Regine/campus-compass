'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { SA_LANGUAGES, type SALanguage } from '@/types'

interface DrawerProps {
  open: boolean
  onClose: () => void
}

interface NavItem {
  href: string
  icon: string
  label: string
}

interface Cluster {
  label: string
  items: NavItem[]
}

interface Room {
  id: string
  icon: string
  label: string
  tagline: string
  color: string        // accent colour
  colorBg: string      // tinted bg for active state
  routes: string[]     // path prefixes that belong to this room
  clusters: Cluster[]
}

const ROOMS: Room[] = [
  {
    id: 'study',
    icon: '📚',
    label: 'Study Room',
    tagline: 'Plan · Perform · Learn',
    color: '#818CF8',
    colorBg: 'rgba(129,140,248,0.08)',
    routes: ['/study', '/study-groups', '/tutoring', '/notes', '/textbooks', '/reader', '/dashboard/groups', '/dashboard/campus-life'],
    clusters: [
      {
        label: 'Orient',
        items: [
          { href: '/study?tab=modules',    icon: '▦',  label: 'Modules' },
          { href: '/study?tab=timetable',  icon: '⊞',  label: 'Timetable' },
          { href: '/study?tab=calendar',   icon: '📅', label: 'Calendar' },
        ],
      },
      {
        label: 'Plan',
        items: [
          { href: '/study?tab=tasks',      icon: '✓',  label: 'Tasks' },
          { href: '/study?tab=exams',      icon: '📝', label: 'Exam Prep' },
          { href: '/study?tab=attendance', icon: '📋', label: 'Attendance' },
        ],
      },
      {
        label: 'Act',
        items: [
          { href: '/study?tab=pomodoro',   icon: '⏱️', label: 'Pomodoro Timer' },
          { href: '/study?tab=flashcards', icon: '🧠', label: 'Flashcards (SM-2)' },
          { href: '/reader',               icon: '📖', label: 'Document Reader' },
        ],
      },
      {
        label: 'Track',
        items: [
          { href: '/study?tab=grades',     icon: '▲',  label: 'Grades' },
          { href: '/study?tab=velocity',   icon: '📈', label: 'Study Velocity' },
          { href: '/study?tab=wellness',   icon: '♥',  label: 'Wellness Check-in' },
          { href: '/study?tab=habits',     icon: '🌱', label: 'Habit Builder' },
          { href: '/study?tab=graduation', icon: '🎓', label: 'Graduation Audit' },
        ],
      },
      {
        label: 'Connect',
        items: [
          { href: '/study?tab=pods',        icon: '👥', label: 'Study Pods' },
          { href: '/study-groups',           icon: '🤝', label: 'Study Groups' },
          { href: '/tutoring',               icon: '🎓', label: 'Peer Tutoring' },
          { href: '/dashboard/groups',       icon: '📁', label: 'Group Assignments' },
          { href: '/dashboard/campus-life',  icon: '🎪', label: 'Campus Life' },
        ],
      },
      {
        label: 'Resources',
        items: [
          { href: '/notes',      icon: '📄', label: 'Notes Marketplace' },
          { href: '/textbooks',  icon: '📗', label: 'Textbook Marketplace' },
        ],
      },
    ],
  },
  {
    id: 'finance',
    icon: '💰',
    label: 'Finance Room',
    tagline: 'Budget · NSFAS · Build wealth',
    color: '#f59e0b',
    colorBg: 'rgba(245,158,11,0.08)',
    routes: ['/budget', '/bursaries', '/stokvel', '/tax', '/discounts'],
    clusters: [
      {
        label: 'Overview',
        items: [
          { href: '/budget?tab=overview',  icon: '📊', label: 'Budget Overview' },
          { href: '/budget?tab=expenses',  icon: '💳', label: 'Expenses' },
          { href: '/budget?tab=wallet',    icon: '💼', label: 'Wallet & Income' },
        ],
      },
      {
        label: 'NSFAS & Aid',
        items: [
          { href: '/budget?tab=nsfas',    icon: '🏛️', label: 'NSFAS Oracle' },
          { href: '/budget?tab=appeal',   icon: '📝', label: 'Appeal Helper' },
          { href: '/bursaries',           icon: '🎓', label: 'Bursaries & Scholarships' },
        ],
      },
      {
        label: 'Grow',
        items: [
          { href: '/budget?tab=ai_coach', icon: '🤖', label: 'AI Budget Coach' },
          { href: '/budget?tab=credit',   icon: '📈', label: 'Credit Score Guide' },
          { href: '/budget?tab=literacy', icon: '🎓', label: 'Financial Literacy 101' },
          { href: '/stokvel',             icon: '🪙', label: 'Stokvel OS' },
          { href: '/tax',                 icon: '🧾', label: 'Tax Return Helper' },
          { href: '/discounts',           icon: '🏷️', label: 'Student Discounts' },
        ],
      },
    ],
  },
  {
    id: 'career',
    icon: '🚀',
    label: 'Career Room',
    tagline: 'Find work · Build skills · Earn',
    color: '#fb923c',
    colorBg: 'rgba(251,146,60,0.08)',
    routes: ['/career', '/jobs', '/mentors', '/skills', '/entrepreneur', '/growth', '/dashboard/work'],
    clusters: [
      {
        label: 'Explore',
        items: [
          { href: '/career',   icon: '💼', label: 'Career OS' },
          { href: '/jobs',     icon: '🧑‍💻', label: 'SA Job Board' },
          { href: '/mentors',  icon: '🤝', label: 'Alumni Mentors' },
        ],
      },
      {
        label: 'Build',
        items: [
          { href: '/skills',       icon: '🖥️', label: 'Digital Skills Academy' },
          { href: '/entrepreneur', icon: '🚀', label: 'Entrepreneur OS' },
          { href: '/growth',       icon: '🌿', label: 'Growth & Goals' },
        ],
      },
      {
        label: 'Work & Earn',
        items: [
          { href: '/dashboard/work',          icon: '🏢', label: 'Work Overview' },
          { href: '/dashboard/work/shifts',   icon: '📅', label: 'Shifts Log' },
          { href: '/dashboard/work/earnings', icon: '💵', label: 'Earnings' },
          { href: '/dashboard/work/add-job',  icon: '➕', label: 'Add a Job' },
        ],
      },
    ],
  },
  {
    id: 'life',
    icon: '❤️',
    label: 'Life Room',
    tagline: 'Body · Mind · Community',
    color: '#fb7185',
    colorBg: 'rgba(251,113,133,0.08)',
    routes: ['/health', '/sleep', '/fitness', '/meals', '/social', '/safety', '/weather', '/movement', '/civic'],
    clusters: [
      {
        label: 'Body',
        items: [
          { href: '/health',  icon: '🏥', label: 'Health & Wellness' },
          { href: '/sleep',   icon: '🌙', label: 'Sleep Science' },
          { href: '/fitness', icon: '💪', label: 'Fitness Tracker' },
          { href: '/meals',   icon: '🍲', label: 'Meal Prep & Nutrition' },
        ],
      },
      {
        label: 'Community',
        items: [
          { href: '/social',   icon: '💬', label: 'Social & Study Twins' },
          { href: '/safety',   icon: '🛡️', label: 'Safety OS' },
          { href: '/movement', icon: '🚌', label: 'Movement OS' },
          { href: '/weather',  icon: '🌤️', label: 'Weather & Campus' },
          { href: '/civic',    icon: '🗳️', label: 'Civic Education' },
        ],
      },
    ],
  },
]

function getActiveRoomId(pathname: string): string | null {
  for (const room of ROOMS) {
    if (room.routes.some(r => pathname === r || pathname.startsWith(r + '/') || pathname.startsWith(r + '?'))) {
      return room.id
    }
  }
  return null
}

export default function Drawer({ open, onClose }: DrawerProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)
  const { profile, subscription, reset, setProfile } = useAppStore()
  const supabase  = createClient()
  const isPremium = profile?.is_premium || ['scholar', 'nova_unlimited'].includes(subscription?.plan ?? '')
  const [savingLang, setSavingLang] = useState(false)
  const [openRoom, setOpenRoom]     = useState<string | null>(() => getActiveRoomId(pathname))

  // Auto-open the room that matches the current route when drawer opens
  useEffect(() => {
    if (open) {
      const active = getActiveRoomId(pathname)
      setOpenRoom(active)
    }
  }, [open, pathname])

  const handleLanguageChange = async (lang: SALanguage) => {
    if (!profile) return
    setSavingLang(true)
    const { error } = await supabase.from('profiles').update({ ai_language: lang }).eq('id', profile.id)
    if (!error) {
      setProfile({ ...profile, ai_language: lang })
      toast.success(`Nova will now respond in ${lang}`)
    }
    setSavingLang(false)
  }

  useEffect(() => {
    document.body.classList.toggle('modal-open', open)
    return () => document.body.classList.remove('modal-open')
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    reset()
    router.push('/auth/login')
    toast.success('Signed out')
    onClose()
  }

  const isCorePath = ['/', '/dashboard', '/nova', '/streak'].some(p => pathname === p || pathname.startsWith(p + '/'))

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={onClose}
        className={cn('fixed inset-0 z-40 transition-opacity duration-300', open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')}
        style={{ background: 'rgba(8,15,14,0.65)', backdropFilter: 'blur(4px)' }}
        aria-hidden="true"
      />

      {/* Drawer */}
      <nav
        className={cn('fixed top-0 left-0 h-full w-72 z-50 flex flex-col bg-[var(--bg-base)] border-r border-white/7 transition-transform duration-300', open ? 'translate-x-0' : '-translate-x-full')}
        aria-label="Main navigation"
      >
        {/* ── Header ── */}
        <div className="px-5 pt-14 pb-4 border-b border-white/7">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
              <Image src="/favicon.jpg" alt="VarsityOS" width={36} height={36} className="object-contain" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-sm leading-tight">VarsityOS</div>
              <div className="font-mono text-[0.65rem] text-teal-400 tracking-widest uppercase">Your varsity OS</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-900 to-teal-700 border-2 border-teal-600 flex items-center justify-center text-sm flex-shrink-0">
              {profile?.emoji || '🎓'}
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold text-white text-xs truncate">{profile?.name || 'Student'}</div>
              <div className="font-mono text-[0.65rem] text-white/78 truncate">{profile?.university?.split('(')[0]?.trim() || 'University'}</div>
            </div>
            {isPremium && (
              <span className="ml-auto flex-shrink-0 bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono text-[0.65rem] uppercase tracking-wide">PRO</span>
            )}
          </div>
        </div>

        {/* ── Scroll area ── */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">

          {/* ── Home links (always visible) ── */}
          <div className="mb-2">
            <div className="font-mono text-[0.65rem] tracking-[0.18em] uppercase text-white/72 px-2 mb-1">Home</div>
            {[
              { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
              { href: '/nova',      icon: '✦',  label: 'Nova — AI Companion' },
              { href: '/streak',    icon: '🔥', label: 'Streaks & Goals' },
            ].map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 mb-0.5 text-sm font-display font-medium',
                    active ? 'bg-teal-600/15 text-teal-400 border border-teal-600/20' : 'text-white/80 hover:text-white hover:bg-white/5'
                  )}
                >
                  <span className="w-5 text-center text-base">{item.icon}</span>
                  {item.label}
                  {item.href === '/nova' && !isPremium && (
                    <span className="ml-auto font-mono text-[0.65rem] text-white/75">10/mo free</span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* ── Room accordions ── */}
          {ROOMS.map(room => {
            const isOpen   = openRoom === room.id
            const isActive = room.routes.some(r => pathname === r || pathname.startsWith(r + '/'))

            return (
              <div key={room.id} className="rounded-xl overflow-hidden" style={{ border: isOpen ? `1px solid ${room.color}22` : '1px solid transparent' }}>
                {/* Room header button */}
                <button
                  onClick={() => setOpenRoom(isOpen ? null : room.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-150 text-left"
                  style={{
                    background: isOpen ? room.colorBg : (isActive ? `${room.color}08` : 'transparent'),
                    borderLeft: `3px solid ${isActive || isOpen ? room.color : 'transparent'}`,
                  }}
                >
                  <span className="text-base w-5 text-center flex-shrink-0">{room.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-sm" style={{ color: isOpen || isActive ? room.color : 'rgba(255,255,255,0.7)' }}>
                      {room.label}
                    </div>
                    <div className="font-mono text-[0.65rem] text-white/75 truncate">{room.tagline}</div>
                  </div>
                  <span
                    className="font-mono text-[0.65rem] flex-shrink-0 transition-transform duration-200"
                    style={{ color: 'rgba(255,255,255,0.2)', transform: isOpen ? 'rotate(180deg)' : 'none' }}
                  >
                    ▾
                  </span>
                </button>

                {/* Room content */}
                {isOpen && (
                  <div className="pb-2 px-2 space-y-3">
                    {room.clusters.map(cluster => (
                      <div key={cluster.label}>
                        <div
                          className="font-mono text-[0.58rem] uppercase tracking-[0.16em] px-2 py-1"
                          style={{ color: room.color, opacity: 0.6 }}
                        >
                          {cluster.label}
                        </div>
                        <div className="space-y-0.5">
                          {cluster.items.map(item => {
                            const base   = item.href.split('?')[0]
                            const active = pathname === base || pathname.startsWith(base + '/')
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all duration-100 text-xs font-display',
                                  active
                                    ? 'font-bold'
                                    : 'text-white/78 hover:text-white hover:bg-white/5'
                                )}
                                style={active ? { color: room.color, background: `${room.color}12` } : {}}
                              >
                                <span className="w-4 text-center text-xs flex-shrink-0">{item.icon}</span>
                                {item.label}
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* ── Account ── */}
          <div className="border-t border-white/7 mt-3 pt-3">
            <div className="font-mono text-[0.65rem] tracking-[0.18em] uppercase text-white/72 px-2 mb-1.5">Account</div>

            <div className="px-2 py-2 mb-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base w-5 text-center">🌍</span>
                <span className="font-display text-xs text-white/78">Nova Language</span>
                {savingLang && <span className="ml-auto font-mono text-[0.65rem] text-teal-400">saving…</span>}
              </div>
              <select
                value={profile?.ai_language || 'English'}
                onChange={e => handleLanguageChange(e.target.value as SALanguage)}
                disabled={savingLang}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 font-mono text-[0.65rem] text-white/82 focus:outline-none focus:border-teal-600/50 disabled:opacity-40"
              >
                {SA_LANGUAGES.map(l => (
                  <option key={l.value} value={l.value} className="bg-[var(--bg-surface)]">{l.label}</option>
                ))}
              </select>
            </div>

            {[
              { href: '/profile',  icon: '👤', label: 'My Profile' },
              { href: '/referral', icon: '🎁', label: 'Refer & Earn' },
              { href: '/feedback', icon: '⭐', label: 'Rate & Feedback' },
            ].map(item => (
              <Link key={item.href} href={item.href} onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-display text-white/78 hover:text-white hover:bg-white/5 transition-all mb-0.5">
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {!isPremium && (
              <Link href="/upgrade" onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-display text-amber-400 hover:bg-amber-500/10 transition-all mb-0.5">
                <span className="text-base w-5 text-center">⭐</span>
                Upgrade to Premium
              </Link>
            )}

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-display text-white/80 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              <span className="text-base w-5 text-center">🚪</span>
              Sign Out
            </button>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-white/7">
          <p className="font-mono text-[0.65rem] text-white/72 leading-relaxed">
            VarsityOS v2.0 · Built by{' '}
            <a href="https://creativelynanda.co.za" target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:text-teal-400">
              Nanda Regine
            </a>
            {' '}· Mirembe Muse (Pty) Ltd
          </p>
        </div>
      </nav>
    </>
  )
}
