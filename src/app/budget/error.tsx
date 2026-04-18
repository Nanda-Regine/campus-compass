'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="min-h-screen bg-[#0c0f0e] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="font-display font-bold text-white text-base mb-1">Something went wrong</p>
        <p className="font-mono text-[0.6rem] text-white/40 mb-6">Budget tracker failed to load.</p>
        <button
          onClick={reset}
          className="font-mono text-[0.65rem] bg-amber-600/20 border border-amber-600/40 text-amber-400 px-4 py-2 rounded-xl transition-all hover:bg-amber-600/30"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
