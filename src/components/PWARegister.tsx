'use client'

import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAppStore } from '@/store'
import { initOfflineSync, flushPendingWrites } from '@/lib/offline/pendingWrites'

export default function PWARegister() {
  const setIsOnline = useAppStore(s => s.setIsOnline)

  useEffect(() => {
    // Explicitly register the service worker. next-pwa's `register: true` auto-inject
    // does NOT reliably fire on the App Router, so without this the SW never activates
    // and NONE of the offline caching works (verified: serviceWorker.ready never
    // resolves, no controller, offline = ERR_INTERNET_DISCONNECTED). Registering here
    // guarantees it. Idempotent for the same URL/scope, so it's safe alongside next-pwa.
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const register = () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .catch(err => console.warn('[pwa] service worker registration failed:', err))
      }
      if (document.readyState === 'complete') register()
      else window.addEventListener('load', register, { once: true })
    }

    // Initialise offline → online sync listener
    initOfflineSync()

    // Set initial online state
    setIsOnline(navigator.onLine)

    const handleOffline = () => {
      setIsOnline(false)
      toast('Offline — showing saved data', {
        icon: '📶',
        duration: 5000,
        style: {
          background: '#1a2e2a',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.12)',
        },
      })
    }

    const handleOnline = async () => {
      setIsOnline(true)
      toast.success('Back online', { duration: 3000 })
      // Flush any writes that were queued while offline
      try {
        const result = await flushPendingWrites()
        if (result.flushed > 0) {
          toast.success(`Synced ${result.flushed} change${result.flushed !== 1 ? 's' : ''}`, {
            icon: '✓',
            duration: 3000,
          })
        }
      } catch {
        // Sync failure is non-fatal — changes remain queued
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [setIsOnline])

  return null
}
