'use client'

import { useState } from 'react'
import Drawer from './Drawer'
import { cn } from '@/lib/utils'

interface TopBarProps {
  title: string
  action?: React.ReactNode
  variant?: 'dark' | 'transparent' | 'light'
  className?: string
}

export default function TopBar({ title, action, variant = 'dark', className }: TopBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isLight = variant === 'light'

  return (
    <>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <header
        className={cn(
          'sticky top-0 z-30 flex items-center justify-between px-4 py-3.5',
          variant === 'dark'
            ? 'bg-[var(--bg-base)] border-b border-white/7'
            : variant === 'light'
            ? 'bg-[#f0fdfa] border-b border-teal-600/10'
            : 'bg-transparent',
          !isLight && 'glass-dark',
          className
        )}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          className={cn(
            'w-9 h-9 flex items-center justify-center rounded-xl transition-all',
            isLight
              ? 'bg-teal-600/10 hover:bg-teal-600/20 text-teal-700'
              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
          )}
          aria-label="Open navigation menu"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <rect width="18" height="2" rx="1" fill="currentColor"/>
            <rect y="6" width="12" height="2" rx="1" fill="currentColor"/>
            <rect y="12" width="15" height="2" rx="1" fill="currentColor"/>
          </svg>
        </button>

        <h1 className={cn(
          'font-display font-bold text-base',
          isLight ? 'text-[#0f2420]' : 'text-white'
        )}>
          {title}
        </h1>

        <div className="w-9 flex justify-end">
          {action || <div />}
        </div>
      </header>
    </>
  )
}
