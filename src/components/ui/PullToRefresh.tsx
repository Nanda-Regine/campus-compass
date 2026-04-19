'use client'

import { usePullToRefresh } from '@/hooks/usePullToRefresh'

interface Props {
  onRefresh: () => Promise<void> | void
}

export default function PullToRefresh({ onRefresh }: Props) {
  const { pulling, refreshing, pullDistance } = usePullToRefresh({ onRefresh })

  if (!pulling && !refreshing) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-transform"
      style={{ transform: `translateY(${refreshing ? 48 : Math.min(pullDistance, 48)}px)` }}
    >
      <div
        className="flex items-center gap-2 bg-[var(--bg-surface)] border border-white/10 rounded-full px-4 py-2 shadow-xl"
        style={{ marginTop: '-40px' }}
      >
        <svg
          className={refreshing ? 'animate-spin' : ''}
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{
            transform: refreshing ? undefined : `rotate(${Math.min(pullDistance * 3, 360)}deg)`,
            color: '#0d9488',
          }}
        >
          <path d="M7 1a6 6 0 100 12A6 6 0 007 1zm0 0v3M7 1l2 2M7 1L5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-mono text-[0.58rem] text-white/50">
          {refreshing ? 'Refreshing…' : 'Release to refresh'}
        </span>
      </div>
    </div>
  )
}
