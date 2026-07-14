'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const APP_PREFIXES = ['/dashboard', '/study', '/budget', '/meals', '/nova', '/profile', '/work', '/campus-life', '/groups']

// ─── Context-aware actions per route ─────────────────────────────────────────
type Action = { label: string; icon: string; color: string; href: string }

function getActionsForPath(pathname: string): Action[] {
  if (pathname.startsWith('/study')) {
    return [
      { label: 'Add Task',    icon: '📋', color: '#0d9488', href: '/study?tab=tasks&add=1' },
      { label: 'Add Exam',    icon: '📝', color: '#a855f7', href: '/study?tab=exams&add=1' },
      { label: 'Pomodoro',    icon: '⏱️', color: '#f59e0b', href: '/study?tab=pomodoro' },
      { label: 'Chat Nova',   icon: '🌟', color: '#f472b6', href: '/nova' },
    ]
  }
  if (pathname.startsWith('/budget')) {
    return [
      { label: 'Log Expense', icon: '💳', color: '#f59e0b', href: '/budget?add=1' },
      { label: 'Add Income',  icon: '💰', color: '#22c55e', href: '/budget?add_income=1' },
      { label: 'Add Task',    icon: '📋', color: '#0d9488', href: '/study?tab=tasks&add=1' },
      { label: 'Chat Nova',   icon: '🌟', color: '#f472b6', href: '/nova' },
    ]
  }
  if (pathname.startsWith('/meals')) {
    return [
      { label: 'Add Meal',    icon: '🍽️', color: '#f97316', href: '/meals?add=1' },
      { label: 'AI Recipe',   icon: '✨', color: '#f472b6', href: '/meals?ai=1' },
      { label: 'Log Expense', icon: '💳', color: '#f59e0b', href: '/budget?add=1' },
    ]
  }
  if (pathname.startsWith('/campus-life') || pathname.startsWith('/groups')) {
    return [
      { label: 'Add Post',    icon: '📣', color: '#6366f1', href: pathname + '?post=1' },
      { label: 'Add Task',    icon: '📋', color: '#0d9488', href: '/study?tab=tasks&add=1' },
      { label: 'Chat Nova',   icon: '🌟', color: '#f472b6', href: '/nova' },
    ]
  }
  // Default — dashboard, profile, work, etc.
  return [
    { label: 'Add Task',     icon: '📋', color: '#0d9488', href: '/study?tab=tasks&add=1' },
    { label: 'Log Expense',  icon: '💳', color: '#f59e0b', href: '/budget?add=1' },
    { label: 'Add Exam',     icon: '📝', color: '#a855f7', href: '/study?tab=exams&add=1' },
    { label: 'Chat with Nova', icon: '🌟', color: '#f472b6', href: '/nova' },
  ]
}

export function GlobalFAB() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const show = APP_PREFIXES.some(p => pathname.startsWith(p))
  // Don't show on Nova page (already on chat) or study page at pomodoro tab (has own controls)
  const suppress = pathname.startsWith('/nova')

  const actions = getActionsForPath(pathname)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  if (!show || suppress) return null

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Action items */}
      <div className="fixed bottom-[4.5rem] right-4 z-50 flex flex-col items-end gap-2.5 md:hidden">
        {open && actions.map((action, i) => (
          <button
            key={action.label}
            onClick={() => { setOpen(false); router.push(action.href) }}
            className="flex items-center gap-2.5 animate-fade-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span
              className="font-mono text-[0.62rem] text-white bg-[var(--bg-surface)] border border-white/10 rounded-xl px-3 py-1.5 shadow-xl whitespace-nowrap"
            >
              {action.label}
            </span>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 text-base"
              style={{ background: action.color + '20', border: `1px solid ${action.color}50` }}
            >
              {action.icon}
            </div>
          </button>
        ))}

        {/* Main FAB */}
        <button
          onClick={() => setOpen(v => !v)}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200',
            open ? 'rotate-45 scale-95' : 'scale-100'
          )}
          style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
            boxShadow: '0 8px 32px rgba(13,148,136,0.4)',
          }}
          aria-label="Quick actions"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </>
  )
}
