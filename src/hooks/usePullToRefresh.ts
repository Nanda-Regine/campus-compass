'use client'

import { useEffect, useRef, useState } from 'react'

interface Options {
  onRefresh: () => Promise<void> | void
  threshold?: number // px of pull needed to trigger
}

export function usePullToRefresh({ onRefresh, threshold = 72 }: Options) {
  const [pulling, setPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  const startY   = useRef(0)
  const active   = useRef(false)

  useEffect(() => {
    const el = document.documentElement

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop > 0) return
      startY.current = e.touches[0].clientY
      active.current  = true
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!active.current) return
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0) { setPullDistance(0); return }
      // Dampen pull feel
      const clamped = Math.min(dy * 0.4, threshold * 1.2)
      setPullDistance(clamped)
      if (clamped > 8) setPulling(true)
    }

    const onTouchEnd = async () => {
      if (!active.current) return
      active.current = false
      if (pullDistance >= threshold * 0.8) {
        setRefreshing(true)
        setPulling(false)
        setPullDistance(0)
        try { await onRefresh() } finally { setRefreshing(false) }
      } else {
        setPulling(false)
        setPullDistance(0)
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove',  onTouchMove,  { passive: true })
    window.addEventListener('touchend',   onTouchEnd)

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
      window.removeEventListener('touchend',   onTouchEnd)
    }
  }, [onRefresh, pullDistance, threshold])

  return { pulling, refreshing, pullDistance }
}
