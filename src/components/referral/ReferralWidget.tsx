'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface ReferralData {
  referralCode: string
  referralUrl: string
  referralCount: number
  creditsEarned: number
}

export default function ReferralWidget() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referral')
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {/* silent */})
      .finally(() => setLoading(false))
  }, [])

  const copyLink = () => {
    if (!data?.referralUrl) return
    navigator.clipboard.writeText(data.referralUrl)
    setCopied(true)
    toast.success('Referral link copied! Share via WhatsApp')
    setTimeout(() => setCopied(false), 2500)
  }

  const shareWhatsApp = () => {
    if (!data?.referralUrl) return
    const text = encodeURIComponent(
      `Hey! I've been using VarsityOS to manage my varsity life — study planner, budget tracker, NSFAS help and an AI companion called Nova 🎓\n\nSign up free with my link and we both get bonus Nova messages: ${data.referralUrl}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  if (loading) {
    return <div className="h-28 rounded-2xl bg-white/5 animate-pulse" />
  }

  if (!data) return null

  return (
    <div className="bg-[#111a18] border border-white/7 rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display font-bold text-white text-sm">Refer a friend</h3>
          <p className="font-mono text-[0.6rem] text-white/35 mt-0.5">
            You get <span className="text-teal-400">+50</span> Nova messages · They get <span className="text-teal-400">+10</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-display font-bold text-teal-400 text-lg leading-none">{data.referralCount}</p>
          <p className="font-mono text-[0.55rem] text-white/30">referrals</p>
        </div>
      </div>

      {/* Stats row */}
      {data.creditsEarned > 0 && (
        <div className="flex items-center gap-2 mb-3 bg-teal-600/10 border border-teal-600/15 rounded-xl px-3 py-2">
          <span className="text-base">🎉</span>
          <p className="font-mono text-[0.62rem] text-teal-300">
            You&apos;ve earned <strong>{data.creditsEarned} bonus messages</strong> from referrals
          </p>
        </div>
      )}

      {/* Referral code */}
      <div className="flex items-center gap-2 mb-3 bg-white/3 border border-white/10 rounded-xl px-3 py-2">
        <span className="font-mono text-[0.6rem] text-white/35">Your code:</span>
        <span className="font-mono font-bold text-white tracking-widest text-sm uppercase">
          {data.referralCode}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={shareWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 border border-green-600/25 text-green-400 font-display font-bold text-xs py-2.5 rounded-xl transition-all"
        >
          <span>💬</span> Share on WhatsApp
        </button>
        <button
          onClick={copyLink}
          className={cn(
            'px-4 font-mono text-xs py-2.5 rounded-xl border transition-all',
            copied
              ? 'bg-teal-600/20 border-teal-500/40 text-teal-400'
              : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
          )}
        >
          {copied ? '✓' : 'Copy'}
        </button>
      </div>

      <p className="font-mono text-[0.55rem] text-white/20 text-center mt-2">
        Bonus messages are added to your free monthly limit. Not real premium.
      </p>
    </div>
  )
}
