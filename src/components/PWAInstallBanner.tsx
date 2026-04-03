'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface Props {
  variant?: 'banner' | 'card' | 'inline'
  onInstalled?: () => void
}

export default function PWAInstallBanner({ variant = 'banner', onInstalled }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Detect iOS (Safari) — no beforeinstallprompt event
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream
    setIsIOS(ios)

    // Check if user previously dismissed
    const prev = sessionStorage.getItem('pwa_install_dismissed')
    if (prev) { setDismissed(true); return }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
      onInstalled?.()
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    sessionStorage.setItem('pwa_install_dismissed', '1')
    setDismissed(true)
  }

  // Don't show if already installed, dismissed, or no prompt available (non-iOS)
  if (isInstalled || dismissed || (!deferredPrompt && !isIOS)) return null

  if (showIOSInstructions) {
    return (
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}
      >
        <div className="flex items-start justify-between mb-2">
          <p className="font-display font-bold text-teal-400 text-sm">Install VarsityOS on iPhone</p>
          <button onClick={handleDismiss}><X size={14} className="text-white/30" /></button>
        </div>
        <ol className="font-mono text-[0.62rem] text-white/60 space-y-1 list-decimal list-inside">
          <li>Tap the <strong className="text-white/80">Share</strong> button in Safari (the box with an arrow)</li>
          <li>Scroll down and tap <strong className="text-white/80">Add to Home Screen</strong></li>
          <li>Tap <strong className="text-white/80">Add</strong> — VarsityOS is now on your home screen!</li>
        </ol>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(13,148,136,0.07)', border: '1px solid rgba(13,148,136,0.18)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600/15 flex items-center justify-center flex-shrink-0">
            <Download size={18} className="text-teal-400" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm">Install VarsityOS</p>
            <p className="font-mono text-[0.6rem] text-white/45">Works offline · No app store needed</p>
          </div>
        </div>
        <p className="font-mono text-[0.65rem] text-white/55 mb-4">
          Add VarsityOS to your home screen for instant access, offline study tracking, and exam reminders — even without internet.
        </p>
        <button
          onClick={handleInstall}
          className="w-full font-display font-bold text-sm py-2.5 rounded-xl transition-all"
          style={{ background: '#0d9488', color: '#fff' }}
        >
          {isIOS ? 'How to install on iPhone' : 'Add to home screen'}
        </button>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={handleInstall}
        className="flex items-center gap-2 font-display font-bold text-sm px-4 py-2.5 rounded-xl transition-all"
        style={{ background: 'rgba(13,148,136,0.12)', color: '#2dd4bf', border: '1px solid rgba(13,148,136,0.25)' }}
      >
        <Download size={15} />
        {isIOS ? 'Install on iPhone' : 'Install app'}
      </button>
    )
  }

  // Default: banner
  return (
    <div
      className="mx-4 mb-3 rounded-2xl px-4 py-3 flex items-center gap-3 md:hidden"
      style={{ background: 'rgba(13,148,136,0.09)', border: '1px solid rgba(13,148,136,0.2)' }}
    >
      <div className="w-9 h-9 rounded-xl bg-teal-600/15 flex items-center justify-center flex-shrink-0">
        <Download size={16} className="text-teal-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-white text-xs">Install VarsityOS</p>
        <p className="font-mono text-[0.58rem] text-white/40 truncate">Works offline · Home screen shortcut</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="font-display font-bold text-[0.65rem] px-3 py-1.5 rounded-lg transition-all"
          style={{ background: '#0d9488', color: '#fff' }}
        >
          {isIOS ? 'How?' : 'Install'}
        </button>
        <button onClick={handleDismiss} className="text-white/25 hover:text-white/50 transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
