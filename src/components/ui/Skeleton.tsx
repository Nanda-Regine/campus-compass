import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        'skeleton rounded-lg',
        className
      )}
      style={style}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard({ lines = 3 }: SkeletonProps) {
  return (
    <div className="bg-[var(--bg-surface)] border border-white/7 rounded-2xl p-4 space-y-3">
      <Skeleton className="h-4 w-2/3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className="h-3" style={{ width: `${70 + Math.random() * 30}%` } as React.CSSProperties} />
      ))}
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-4 p-4 animate-fade-in">
      {/* Hero skeleton */}
      <div className="rounded-2xl p-6 bg-teal-900/30 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[1,2,3].map(i => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      {/* Feed skeleton */}
      <div className="space-y-3">
        {[1,2,3].map(i => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
