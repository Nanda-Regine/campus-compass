'use client'

import { useEffect, useState } from 'react'

export function PWAUpdateNotifier() {
  const [updateReady, setUpdateReady] = useState(false)
  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Fired when a new SW takes control — a new version is live
    const handleControllerChange = () => {
      // Prevent double-trigger on initial install
      if (document.visibilityState !== 'hidden') {
        setUpdateReady(true)
      }
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  // Countdown auto-reload
  useEffect(() => {
    if (!updateReady) return
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(id)
          window.location.reload()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [updateReady])

  if (!updateReady) return null

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'linear-gradient(90deg, #0d9488, #4ecf9e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        gap: 12,
        boxShadow: '0 2px 16px rgba(78,207,158,0.4)',
      }}
    >
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: '#000',
        fontWeight: 600,
      }}>
        VarsityOS update ready · auto-refresh in {countdown}s
      </span>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: 'rgba(0,0,0,0.85)',
          color: '#4ecf9e',
          border: 'none',
          borderRadius: 8,
          padding: '5px 14px',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        Update now
      </button>
    </div>
  )
}
