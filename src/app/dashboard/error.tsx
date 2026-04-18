'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="min-h-screen bg-[#0c0f0e] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="font-display font-bold text-white text-base mb-1">Something went wrong</p>
        <p className="font-mono text-[0.6rem] text-white/40 mb-6">Dashboard failed to load. Try again or go home.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="font-mono text-[0.65rem] bg-teal-600/20 border border-teal-600/40 text-teal-400 px-4 py-2 rounded-xl transition-all hover:bg-teal-600/30"
          >
            Try again
          </button>
          <Link href="/" className="font-mono text-[0.65rem] bg-white/5 border border-white/10 text-white/50 px-4 py-2 rounded-xl transition-all hover:text-white/70">
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
