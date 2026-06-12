'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

interface ShareButtonProps {
  title: string
  text: string
  url?: string
  label?: string
  variant?: 'icon' | 'pill' | 'full'
  context?: string
}

export function ShareButton({ title, text, url = 'https://varsityos.co.za', label = 'Share', variant = 'pill', context = 'unknown' }: ShareButtonProps) {
  const [shared, setShared] = useState(false)

  const handleShare = async () => {
    const shareText = `${text}\n\nVarsityOS 🎓 ${url}`

    trackEvent('share_triggered', { context, method: 'native_or_whatsapp' })

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url })
        setShared(true)
        setTimeout(() => setShared(false), 2000)
        return
      } catch {
        // User cancelled or browser blocked — fall through to WhatsApp
      }
    }

    // WhatsApp fallback — primary channel for SA students
    const encoded = encodeURIComponent(shareText)
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener')
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleShare}
        title="Share via WhatsApp"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8,
          background: shared ? 'rgba(78,207,158,0.15)' : 'rgba(255,255,255,0.06)',
          border: `0.5px solid ${shared ? 'rgba(78,207,158,0.3)' : 'rgba(255,255,255,0.1)'}`,
          cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0,
          color: shared ? '#4ecf9e' : 'rgba(255,255,255,0.45)',
        }}
      >
        {shared ? <Check size={14} /> : <Share2 size={14} />}
      </button>
    )
  }

  if (variant === 'full') {
    return (
      <button
        onClick={handleShare}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '11px 0', borderRadius: 12,
          background: shared ? 'rgba(78,207,158,0.12)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${shared ? 'rgba(78,207,158,0.3)' : 'rgba(255,255,255,0.08)'}`,
          cursor: 'pointer', transition: 'all 0.2s ease',
          color: shared ? '#4ecf9e' : 'rgba(255,255,255,0.55)',
          fontSize: 13, fontFamily: 'Sora, sans-serif', fontWeight: 600,
        }}
      >
        {shared ? <Check size={15} /> : <Share2 size={15} />}
        {shared ? 'Shared!' : label}
      </button>
    )
  }

  // Default: pill
  return (
    <button
      onClick={handleShare}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 9999,
        background: shared ? 'rgba(78,207,158,0.12)' : 'rgba(255,255,255,0.05)',
        border: `0.5px solid ${shared ? 'rgba(78,207,158,0.3)' : 'rgba(255,255,255,0.1)'}`,
        cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0,
        color: shared ? '#4ecf9e' : 'rgba(255,255,255,0.4)',
        fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {shared ? <Check size={11} /> : <Share2 size={11} />}
      {shared ? 'Shared!' : label}
    </button>
  )
}
