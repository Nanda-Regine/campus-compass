'use client'
import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { getPendingCount } from '@/lib/offline/pendingWrites'

export function OfflineBanner() {
  const [isOffline, setIsOffline]     = useState(false)
  const [pending, setPending]         = useState(0)
  const [isSyncing, setIsSyncing]     = useState(false)
  const [justSynced, setJustSynced]   = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const online  = () => {
      setIsOffline(false)
      setIsSyncing(true)
      // Give the flush a moment to run (useOfflineSync handles it)
      setTimeout(async () => {
        setIsSyncing(false)
        const n = await getPendingCount().catch(() => 0)
        setPending(n)
        if (n === 0) { setJustSynced(true); setTimeout(() => setJustSynced(false), 3000) }
      }, 2500)
    }
    const offline = () => setIsOffline(true)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)

    // Poll pending count every 10s
    const poll = setInterval(async () => {
      const n = await getPendingCount().catch(() => 0)
      setPending(n)
    }, 10000)
    getPendingCount().then(setPending).catch(() => {})

    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
      clearInterval(poll)
    }
  }, [])

  if (isSyncing) return (
    <div
      className="sticky top-0 z-50 flex items-center gap-2.5 px-4 py-2"
      style={{ background: 'rgba(78,207,158,0.1)', borderBottom: '0.5px solid rgba(78,207,158,0.25)' }}
    >
      <RefreshCw size={14} style={{ color: 'var(--teal)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--teal)' }}>
        Syncing offline changes…
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (justSynced) return (
    <div
      className="sticky top-0 z-50 flex items-center gap-2.5 px-4 py-2"
      style={{ background: 'rgba(78,207,158,0.08)', borderBottom: '0.5px solid rgba(78,207,158,0.2)' }}
    >
      <span style={{ color: 'var(--teal)', fontSize: '0.85rem' }}>✓</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--teal)' }}>
        All changes synced
      </span>
    </div>
  )

  if (!isOffline && pending === 0) return null

  if (!isOffline && pending > 0) return (
    <div
      className="sticky top-0 z-50 flex items-center gap-2.5 px-4 py-2"
      style={{ background: 'rgba(201,168,76,0.08)', borderBottom: '0.5px solid rgba(201,168,76,0.2)' }}
    >
      <RefreshCw size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--gold)' }}>
        {pending} change{pending !== 1 ? 's' : ''} pending sync
      </span>
    </div>
  )

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
          No connection
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.69rem', color: 'var(--text-tertiary)', marginLeft: 8 }}>
          Working offline — changes will sync when reconnected
          {pending > 0 && ` · ${pending} pending`}
        </span>
      </div>
    </div>
  )
}
