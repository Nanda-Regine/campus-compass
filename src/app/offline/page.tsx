'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { AmbientImage } from '@/components/ui/AmbientImage'

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    const handleOnline = () => { window.location.reload() }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  const handleRetry = () => {
    setRetrying(true)
    setTimeout(() => window.location.reload(), 500)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#080f0e', position: 'relative' }}
    >
      <AmbientImage zone="alerts" opacity={0.18} blurPx={30} saturation={0.8} />
      <div className="w-full max-w-sm space-y-6" style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white/5 border border-white/10">
            <WifiOff className="w-9 h-9 text-white/30" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">You&apos;re offline</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Load shedding or no data? VarsityOS saves your cached pages so you can keep studying.
            Connect to the internet to sync your latest data.
          </p>
        </div>
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            background: retrying
              ? 'rgba(255,255,255,0.05)'
              : 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
            opacity: retrying ? 0.7 : 1,
          }}
        >
          <RefreshCw className={retrying ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
          {retrying ? 'Retrying…' : 'Try again'}
        </button>
        <p className="text-white/20 text-xs">
          VarsityOS reloads automatically when your connection returns.
        </p>
      </div>
    </div>
  )
}
