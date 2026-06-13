'use client'

import { useState, useEffect } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function NotificationPrompt() {
  const { supported, permission, subscribed, loading, subscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(true) // start hidden to avoid flash

  useEffect(() => {
    // Show only if: supported, not already decided, not already subscribed, not dismissed this session
    const wasDismissed = localStorage.getItem('varsityos-notif-dismissed') === '1'
    if (!wasDismissed && supported && permission === 'default' && !subscribed) {
      setDismissed(false)
    }
  }, [supported, permission, subscribed])

  const dismiss = () => {
    localStorage.setItem('varsityos-notif-dismissed', '1')
    setDismissed(true)
  }

  const enable = async () => {
    await subscribe()
    dismiss()
  }

  if (dismissed || !supported || permission !== 'default' || subscribed) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px',
      background: 'rgba(13,148,136,0.08)',
      border: '1px solid rgba(13,148,136,0.2)',
      borderRadius: 14,
      marginBottom: 12,
    }}>
      <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🔔</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 2 }}>
          Stay on top of your studies
        </div>
        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
          Exam reminders · budget alerts · Nova nudges
        </div>
      </div>
      <button
        onClick={enable}
        disabled={loading}
        style={{
          padding: '7px 14px',
          background: 'rgba(13,148,136,0.25)',
          border: '1px solid rgba(13,148,136,0.5)',
          borderRadius: 10,
          color: '#2dd4bf',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.6 : 1,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {loading ? '…' : 'Enable'}
      </button>
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.2)',
          fontSize: '1rem', cursor: 'pointer',
          padding: '0 4px', lineHeight: 1, flexShrink: 0,
        }}
        aria-label="Dismiss"
      >×</button>
    </div>
  )
}
