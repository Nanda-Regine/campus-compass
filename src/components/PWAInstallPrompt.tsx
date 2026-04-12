'use client'

import { useEffect, useState, useRef } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'pwa_install_dismissed'
const SHOW_DELAY_MS = 10_000

function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iP(ad|hone|od)/.test(navigator.userAgent) && !('MSStream' in window)
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Already dismissed or already installed
    if (localStorage.getItem(STORAGE_KEY) === 'true') return
    if (isInStandaloneMode()) return

    const isIOSDevice = isIOS()

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
    }

    if (!isIOSDevice) {
      window.addEventListener('beforeinstallprompt', handler)
    }

    const timer = setTimeout(() => {
      if (isIOSDevice) {
        setShow(true)
      } else if (deferredPrompt.current) {
        setShow(true)
      }
    }, SHOW_DELAY_MS)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShow(false)
    setShowIOSModal(false)
  }

  async function handleInstall() {
    if (isIOS()) {
      setShowIOSModal(true)
      return
    }
    if (!deferredPrompt.current) return
    await deferredPrompt.current.prompt()
    const { outcome } = await deferredPrompt.current.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
    deferredPrompt.current = null
    setShow(false)
  }

  if (!show) return null

  return (
    <>
      {/* Main banner */}
      <div
        role="dialog"
        aria-label="Install VarsityOS app"
        className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm"
      >
        <div
          className="rounded-2xl p-5 shadow-2xl"
          style={{ backgroundColor: '#1B4332' }}
        >
          <div className="flex items-start gap-3 mb-3">
            <span className="text-3xl select-none" aria-hidden>📱</span>
            <div>
              <p className="font-bold text-white text-base leading-tight">
                Get the full VarsityOS experience
              </p>
              <p className="text-green-200 text-sm mt-1 leading-snug">
                Add to your home screen — works offline, no app store needed.
                Nova is always there, even during load shedding.
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleInstall}
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-75"
              style={{ backgroundColor: '#D4A017', color: '#1B1B1B' }}
            >
              Add to Home Screen
            </button>
            <button
              onClick={dismiss}
              className="py-2.5 px-4 rounded-xl text-sm font-medium text-green-200 border border-green-700 hover:bg-green-800 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>

      {/* iOS manual instructions modal */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={dismiss}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 mb-4 shadow-2xl"
            style={{ backgroundColor: '#1B4332' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="font-bold text-white text-base mb-4">
              Add VarsityOS to your Home Screen
            </p>
            <ol className="space-y-3 text-green-200 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold text-white min-w-[1.2rem]">1.</span>
                Tap the <span className="inline-block px-1.5 py-0.5 bg-green-800 rounded text-white text-xs font-mono">Share</span> button at the bottom of Safari (the square with an arrow)
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-white min-w-[1.2rem]">2.</span>
                Scroll down and tap <span className="font-semibold text-white">"Add to Home Screen"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-white min-w-[1.2rem]">3.</span>
                Tap <span className="font-semibold text-white">"Add"</span> — VarsityOS will appear on your home screen like a native app
              </li>
            </ol>
            <button
              onClick={dismiss}
              className="mt-5 w-full py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#D4A017', color: '#1B1B1B' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}
