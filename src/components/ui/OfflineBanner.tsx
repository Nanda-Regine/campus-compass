'use client'
import { useEffect, useState } from 'react'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const online  = () => setIsOffline(false)
    const offline = () => setIsOffline(true)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600/90 backdrop-blur-sm border-b border-amber-500/40 text-amber-100 text-xs font-mono">
      <span className="text-sm">🌑</span>
      <span>You&apos;re offline — showing saved data. Nova unavailable until reconnected.</span>
    </div>
  )
}
