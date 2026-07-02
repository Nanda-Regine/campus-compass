'use client'

import { useEffect, useState, useCallback } from 'react'
import { getPendingCount } from '@/lib/offline/pendingWrites'
import { useAppStore } from '@/store'

interface SyncState {
  pending: number
  syncing: boolean
  justSynced: boolean
}

export function OfflineIndicator() {
  const isOnline = useAppStore(s => s.isOnline)
  const [sync, setSync] = useState<SyncState>({ pending: 0, syncing: false, justSynced: false })

  const refreshPending = useCallback(async () => {
    try {
      const count = await getPendingCount()
      setSync(s => ({ ...s, pending: count }))
    } catch {}
  }, [])

  // Poll pending count every 5s
  useEffect(() => {
    refreshPending()
    const id = setInterval(refreshPending, 5000)
    return () => clearInterval(id)
  }, [refreshPending])

  // Listen for sync lifecycle events
  useEffect(() => {
    const onStart = () => setSync(s => ({ ...s, syncing: true }))

    const onComplete = (e: Event) => {
      const { flushed = 0 } = (e as CustomEvent<{ flushed: number; failed: number }>).detail ?? {}
      setSync(s => ({ ...s, syncing: false, justSynced: flushed > 0 }))
      refreshPending()
      if (flushed > 0) {
        setTimeout(() => setSync(s => ({ ...s, justSynced: false })), 3000)
      }
    }

    window.addEventListener('sync:start', onStart)
    window.addEventListener('sync:complete', onComplete)
    return () => {
      window.removeEventListener('sync:start', onStart)
      window.removeEventListener('sync:complete', onComplete)
    }
  }, [refreshPending])

  // Determine display state
  const show = !isOnline || sync.syncing || sync.justSynced || sync.pending > 0
  if (!show) return null

  let label: string
  let color: string
  let icon: string

  if (sync.syncing) {
    label = 'Syncing changes…'
    color = '#4ecf9e'
    icon = '⟳'
  } else if (sync.justSynced) {
    label = 'All changes synced'
    color = '#4ecf9e'
    icon = '✓'
  } else if (!isOnline && sync.pending > 0) {
    label = `Offline · ${sync.pending} change${sync.pending !== 1 ? 's' : ''} queued`
    color = '#f59e0b'
    icon = '📶'
  } else if (!isOnline) {
    label = 'Offline — showing saved data'
    color = '#f59e0b'
    icon = '📶'
  } else {
    label = `${sync.pending} change${sync.pending !== 1 ? 's' : ''} pending sync`
    color = '#818CF8'
    icon = '↑'
  }

  return (
    <div
      className="md:hidden"
      style={{
        position: 'fixed',
        bottom: 68,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 55,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(6,10,8,0.93)',
        border: `1px solid ${color}35`,
        borderRadius: 100,
        padding: '5px 13px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: `0 2px 12px rgba(0,0,0,0.4), 0 0 0 1px ${color}15`,
        whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: sync.syncing ? 13 : 11, lineHeight: 1 }}>{icon}</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 600,
          color,
          letterSpacing: '0.02em',
        }}>
          {label}
        </span>
      </div>
    </div>
  )
}
