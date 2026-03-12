'use client'

import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAppStore } from '@/store'

export default function PWARegister() {
  const setIsOnline = useAppStore(s => s.setIsOnline)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(err => console.warn('SW registration failed:', err))
    }

    // Set initial online state
    setIsOnline(navigator.onLine)

    const handleOffline = () => {
      setIsOnline(false)
      toast('You\'re offline — showing saved data', {
        icon: '📶',
        duration: 5000,
        style: {
          background: '#1a2e2a',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.12)',
        },
      })
    }

    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Back online', { duration: 3000 })
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
