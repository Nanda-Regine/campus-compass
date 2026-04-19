'use client'
import { useEffect } from 'react'

interface WinToastProps {
  message: string
  onDismiss: () => void
  duration?: number
}

export function WinToast({ message, onDismiss, duration = 3000 }: WinToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [onDismiss, duration])

  return (
    <div
      className="fixed bottom-24 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl md:bottom-8"
      style={{
        background: 'linear-gradient(135deg, #0F2E22, #0A2018)',
        border: '0.5px solid var(--teal-border)',
        maxWidth: 320,
        animation: 'slideInFromRight 350ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
      }}
    >
      <span style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: 'var(--teal-dim)',
        border: '1.5px solid var(--teal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: 'var(--teal)',
        fontSize: '0.7rem',
        fontWeight: 700,
      }}>✓</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
        {message}
      </span>
    </div>
  )
}
