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

const NAV_SECTIONS = [
  {
    section: 'Core',
    items: [
      { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
      { href: '/nova',      icon: '🌟', label: 'Nova — AI Companion' },
      { href: '/streak',    icon: '🔥', label: 'Streaks & Goals' },
    ],
  },
  {
    section: 'Study',
    items: [
      { href: '/study',                    icon: '📚', label: 'Study Planner',      sub: 'All academic tools' },
      { href: '/study?tab=tasks',          icon: '✓',  label: 'Tasks' },
      { href: '/study?tab=calendar',       icon: '📅', label: 'Calendar' },
      { href: '/study?tab=timetable',      icon: '⊞',  label: 'Timetable / Schedule' },
      { href: '/study?tab=exams',          icon: '📝', label: 'Exam Prep & Catch-Up' },
      { href: '/study?tab=grades',         icon: '▲',  label: 'Grades' },
      { href: '/study?tab=attendance',     icon: '📋', label: 'Attendance Tracker' },
      { href: '/study?tab=flashcards',     icon: '🧠', label: 'Flashcards (SM-2)' },
      { href: '/study?tab=pomodoro',       icon: '⏱️', label: 'Pomodoro Timer' },
      { href: '/study?tab=modules',        icon: '▦',  label: 'Modules' },
      { href: '/study?tab=habits',         icon: '🌱', label: 'Habit Builder' },
      { href: '/study?tab=wellness',       icon: '♥',  label: 'Wellness Check-in' },
      { href: '/study?tab=velocity',       icon: '📈', label: 'Study Velocity' },
      { href: '/study?tab=pods',           icon: '👥', label: 'Study Pods' },
      { href: '/study?tab=graduation',     icon: '🎓', label: 'Graduation Audit' },
      { href: '/study-groups',             icon: '👥', label: 'Study Groups' },
      { href: '/tutoring',                 icon: '🎓', label: 'Peer Tutoring' },
      { href: '/notes',                    icon: '📖', label: 'Notes Marketplace' },
      { href: '/textbooks',               icon: '📗', label: 'Textbook Marketplace' },
      { href: '/reader',                   icon: '📄', label: 'Document Reader' },
      { href: '/dashboard/groups',         icon: '📁', label: 'Group Assignments' },
      { href: '/dashboard/campus-life',    icon: '🎪', label: 'Campus Life & Events' },
    ],
  },
  {
    section: 'Money',
    items: [
      { href: '/budget',               icon: '💰', label: 'Budget & NSFAS',      sub: 'Overview · Expenses · Wallet' },
      { href: '/budget?tab=overview',  icon: '📊', label: 'Budget Overview' },
      { href: '/budget?tab=expenses',  icon: '💳', label: 'Expenses' },
      { href: '/budget?tab=wallet',    icon: '💼', label: 'Wallet & Income' },
      { href: '/budget?tab=nsfas',     icon: '🏛️', label: 'NSFAS Oracle' },
      { href: '/budget?tab=ai_coach',  icon: '🤖', label: 'AI Budget Coach' },
      { href: '/budget?tab=appeal',    icon: '📝', label: 'NSFAS Appeal Helper' },
      { href: '/budget?tab=credit',    icon: '💳', label: 'Credit Score Guide' },
      { href: '/bursaries',            icon: '🎓', label: 'Bursaries & Scholarships' },
      { href: '/stokvel',              icon: '🪙', label: 'Stokvel OS' },
      { href: '/tax',                  icon: '🧾', label: 'Tax Return Helper' },
      { href: '/discounts',            icon: '🏷️', label: 'Student Discounts' },
    ],
  },
  {
    section: 'Career & Growth',
    items: [
      { href: '/career',               icon: '💼', label: 'Career OS' },
      { href: '/jobs',                 icon: '🧑‍💻', label: 'SA Job Board' },
      { href: '/mentors',              icon: '🤝', label: 'Alumni Mentors' },
      { href: '/skills',               icon: '🖥️', label: 'Digital Skills Academy' },
      { href: '/entrepreneur',         icon: '🚀', label: 'Entrepreneur OS' },
      { href: '/growth',               icon: '🌿', label: 'Growth & Goals' },
      { href: '/dashboard/work',       icon: '🏢', label: 'Work & Shifts',         sub: 'Jobs · Shifts · Earnings' },
      { href: '/dashboard/work/shifts',   icon: '📅', label: 'Shifts Log' },
      { href: '/dashboard/work/earnings', icon: '💵', label: 'Earnings' },
      { href: '/dashboard/work/add-job',  icon: '➕', label: 'Add Job' },
    ],
  },
  {
    section: 'Health & Body',
    items: [
      { href: '/health',   icon: '🏥', label: 'Health & Wellness' },
      { href: '/sleep',    icon: '🌙', label: 'Sleep Science' },
      { href: '/fitness',  icon: '💪', label: 'Fitness Tracker' },
      { href: '/meals',    icon: '🍲', label: 'Meal Prep & Nutrition' },
    ],
  },
  {
    section: 'Community & Safety',
    items: [
      { href: '/social',    icon: '💬', label: 'Social & Study Twins' },
      { href: '/safety',    icon: '🛡️', label: 'Safety OS' },
      { href: '/weather',   icon: '🌤️', label: 'Weather & Campus' },
      { href: '/movement',  icon: '🚌', label: 'Movement OS' },
      { href: '/civic',     icon: '🗳️', label: 'Civic Education' },
    ],
  },
]

// Flat list for active-state detection
const NAV_ITEMS = NAV_SECTIONS.flatMap(s => s.items)

export default function Drawer({ open, onClose }: DrawerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)
  const { profile, subscription, reset, setProfile } = useAppStore()
  const supabase = createClient()
  const isPremium = profile?.is_premium || ['scholar', 'nova_unlimited'].includes(subscription?.plan ?? '')
  const [savingLang, setSavingLang] = useState(false)

  const handleLanguageChange = async (lang: SALanguage) => {
    if (!profile) return
    setSavingLang(true)
    const { error } = await supabase
      .from('profiles')
      .update({ ai_language: lang })
      .eq('id', profile.id)
    if (!error) {
      setProfile({ ...profile, ai_language: lang })
      toast.success(`Nova will now respond in ${lang}`)
    }
    setSavingLang(false)
  }

  useEffect(() => {
    if (open) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
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

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        style={{ background: 'rgba(8,15,14,0.6)', backdropFilter: 'blur(4px)' }}
        aria-hidden="true"
      />

      {/* Drawer */}
      <nav
        className={cn(
          'fixed top-0 left-0 h-full w-72 z-50 flex flex-col',
          'bg-[var(--bg-base)] border-r border-white/7',
          'transition-transform duration-300 cubic-bezier(0.32,0,0.15,1)',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="px-6 pt-14 pb-5 border-b border-white/7">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
              <Image src="/favicon.jpg" alt="VarsityOS" width={40} height={40} className="object-contain" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-sm leading-tight">VarsityOS</div>
              <div className="font-mono text-[0.55rem] text-teal-400 tracking-widest uppercase">Your varsity OS</div>
            </div>
          </div>

          {/* Student info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-900 to-teal-700 border-2 border-teal-600 flex items-center justify-center text-base flex-shrink-0">
              {profile?.emoji || '🎓'}
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold text-white text-sm truncate">
                {profile?.name || 'Student'}
              </div>
              <div className="font-mono text-[0.58rem] text-white/30 truncate">
                {profile?.university?.split('(')[0]?.trim() || 'University'}
              </div>
            </div>
            {isPremium && (
              <span className="ml-auto flex-shrink-0 bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono text-[0.52rem] uppercase tracking-wide">
                PRO
              </span>
            )}
          </div>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          {NAV_SECTIONS.map(section => (
            <div key={section.section} className="mb-4">
              <div className="font-mono text-[0.56rem] tracking-[0.18em] uppercase text-white/25 px-3 mb-1.5">
                {section.section}
              </div>
              {section.items.map(item => {
                const isDeepLink = item.href.includes('?tab=')
                const baseHref   = item.href.split('?')[0]
                const active     = pathname === baseHref || pathname.startsWith(baseHref + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 mb-0.5',
                      isDeepLink ? 'ml-4' : '',
                      active
                        ? 'bg-teal-600/15 text-teal-400 border border-teal-600/20'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <span className={cn('text-center flex-shrink-0', isDeepLink ? 'text-sm w-4' : 'text-base w-5')}>{item.icon}</span>
                    <div className="min-w-0">
                      <span className={cn('font-display block leading-tight', isDeepLink ? 'text-xs' : 'text-sm font-medium')}>
                        {item.label}
                      </span>
                      {'sub' in item && item.sub && (
                        <span className="font-mono text-[0.5rem] text-white/25 tracking-wide">{item.sub}</span>
                      )}
                    </div>
                    {item.href === '/nova' && !isPremium && (
                      <span className="ml-auto font-mono text-[0.52rem] text-white/30">10/mo free</span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}

          <div className="border-t border-white/7 mt-4 pt-4">
            <div className="font-mono text-[0.56rem] tracking-[0.18em] uppercase text-white/25 px-3 mb-2">
              Account
            </div>

            {/* AI Language Selector */}
            <div className="px-3 py-2.5 mb-0.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base w-5 text-center">🌍</span>
                <span className="font-display text-sm text-white/60">Nova Language</span>
                {savingLang && <span className="ml-auto font-mono text-[0.52rem] text-teal-400">saving…</span>}
              </div>
              <select
                value={profile?.ai_language || 'English'}
                onChange={(e) => handleLanguageChange(e.target.value as SALanguage)}
                disabled={savingLang}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 font-mono text-[0.7rem] text-white/70 focus:outline-none focus:border-teal-600/50 disabled:opacity-40"
              >
                {SA_LANGUAGES.map(l => (
                  <option key={l.value} value={l.value} className="bg-[var(--bg-surface)]">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display text-white/60 hover:text-white hover:bg-white/5 transition-all mb-0.5"
            >
              <span className="text-base w-5 text-center">👤</span>
              My Profile
            </Link>
            <Link
              href="/referral"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display text-white/60 hover:text-white hover:bg-white/5 transition-all mb-0.5"
            >
              <span className="text-base w-5 text-center">🎁</span>
              Refer &amp; Earn
            </Link>
            {!isPremium && (
              <Link
                href="/upgrade"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display text-amber-400 hover:bg-amber-500/10 transition-all mb-0.5"
              >
                <span className="text-base w-5 text-center">⭐</span>
                Upgrade to Premium
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              <span className="text-base w-5 text-center">🚪</span>
              Sign Out
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/7">
          <p className="font-mono text-[0.56rem] text-white/20 leading-relaxed">
            VarsityOS v2.0<br />
            Built by{' '}
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
