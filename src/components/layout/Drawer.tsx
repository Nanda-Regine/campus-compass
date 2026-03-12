'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface DrawerProps {
  open: boolean
  onClose: () => void
}

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/study',     icon: '📚', label: 'Study Planner' },
  { href: '/budget',    icon: '💰', label: 'Budget & NSFAS' },
  { href: '/meals',     icon: '🍲', label: 'Meal Prep' },
  { href: '/nova',      icon: '🌟', label: 'Nova — AI Companion' },
]

export default function Drawer({ open, onClose }: DrawerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)
  const { profile, subscription, reset } = useAppStore()
  const supabase = createClient()
  const isPremium = profile?.is_premium || subscription?.plan === 'premium'

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
          'bg-[#080f0e] border-r border-white/7',
          'transition-transform duration-300 cubic-bezier(0.32,0,0.15,1)',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="px-6 pt-14 pb-5 border-b border-white/7">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-400 flex items-center justify-center text-xl shadow-teal flex-shrink-0">
              🧭
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
          <div className="font-mono text-[0.56rem] tracking-[0.18em] uppercase text-white/25 px-3 mb-2">
            Modules
          </div>
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 mb-0.5',
                  active
                    ? 'bg-teal-600/15 text-teal-400 border border-teal-600/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span className="font-display">{item.label}</span>
                {item.href === '/nova' && !isPremium && (
                  <span className="ml-auto font-mono text-[0.52rem] text-white/30">10/mo free</span>
                )}
              </Link>
            )
          })}

          <div className="border-t border-white/7 mt-4 pt-4">
            <div className="font-mono text-[0.56rem] tracking-[0.18em] uppercase text-white/25 px-3 mb-2">
              Account
            </div>
            <Link
              href="/setup"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display text-white/60 hover:text-white hover:bg-white/5 transition-all mb-0.5"
            >
              <span className="text-base w-5 text-center">⚙️</span>
              Profile Settings
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
