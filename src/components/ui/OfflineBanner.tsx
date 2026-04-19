'use client'
import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

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
    <div
      className="offline-banner sticky top-0 z-50 flex items-center gap-2.5 px-4 py-2.5"
      style={{
        background: 'rgba(201,168,76,0.12)',
        borderBottom: '0.5px solid rgba(201,168,76,0.3)',
      }}
    >
      <WifiOff size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
      <div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.81rem', color: 'var(--gold)' }}>
          No connection — showing cached data
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.69rem', color: 'var(--text-tertiary)', marginLeft: 8 }}>
          VarsityOS works offline — data will sync when reconnected
        </span>
      </div>
    </div>
  )
}
