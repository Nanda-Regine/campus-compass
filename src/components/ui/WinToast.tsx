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
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg animate-fade-up"
      style={{ background: '#2D4A22', border: '1px solid rgba(201,168,76,0.3)', maxWidth: '90vw' }}
    >
      <span className="text-amber-400 text-base flex-shrink-0">✦</span>
      <span className="font-mono text-[0.7rem] text-[#F5EFD6] leading-snug">{message}</span>
    </div>
  )
}
