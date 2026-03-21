'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import TopBar from '@/components/layout/TopBar'
import { cn } from '@/lib/utils'

interface Props {
  referralCode: string
  referralUrl: string
  referralCount: number
  creditsEarned: number
  name: string
}

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: '🔗',
    title: 'Share your link',
    desc: 'Copy your unique referral link or share straight to WhatsApp with one tap.',
  },
  {
    step: '02',
    icon: '👩‍🎓',
    title: 'Friend signs up',
    desc: 'Your friend creates a free VarsityOS account using your link.',
  },
  {
    step: '03',
    icon: '🎁',
    title: 'Both get rewarded',
    desc: 'You get +50 bonus Nova messages. Your friend gets +10 to kick things off.',
  },
]

const MILESTONES = [
  { count: 1,  reward: '+50 Nova msgs',  icon: '⭐' },
  { count: 3,  reward: '+150 Nova msgs', icon: '🌟' },
  { count: 5,  reward: '+250 Nova msgs + shoutout', icon: '🏆' },
  { count: 10, reward: '1 month Premium', icon: '👑' },
]

export default function ReferralPageClient({ referralCode, referralUrl, referralCount, creditsEarned, name }: Props) {
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2500)
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! I use VarsityOS to manage my varsity life — study planner, budget tracker, NSFAS help and an AI companion called Nova 🎓\n\nSign up free with my link and we both get bonus Nova messages:\n${referralUrl}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener')
  }

  const nextMilestone = MILESTONES.find(m => m.count > referralCount) ?? MILESTONES[MILESTONES.length - 1]
  const progressToNext = nextMilestone
    ? Math.min(100, Math.round((referralCount / nextMilestone.count) * 100))
    : 100

  return (
    <div className="min-h-screen bg-[#080f0e] pb-24">
      <TopBar title="Refer & Earn" />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Hero stat block */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.18), rgba(13,148,136,0.06))', border: '1px solid rgba(13,148,136,0.2)' }}
        >
          <p className="font-mono text-[0.58rem] text-teal-400/70 uppercase tracking-widest mb-2">
            Your referrals
          </p>
          <p className="font-display font-black text-6xl text-white mb-1">{referralCount}</p>
          <p className="font-mono text-[0.65rem] text-white/40">
            {referralCount === 1 ? 'friend joined' : 'friends joined'} with your link
          </p>
          {creditsEarned > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-teal-600/15 border border-teal-600/20 rounded-full px-4 py-1.5">
              <span className="text-sm">🎉</span>
              <span className="font-mono text-[0.65rem] text-teal-300 font-bold">{creditsEarned} bonus messages earned</span>
            </div>
          )}
        </div>

        {/* Referral link card */}
        <div className="bg-[#111a18] border border-white/7 rounded-2xl p-5 space-y-4">
          <div>
            <p className="font-mono text-[0.58rem] text-white/35 uppercase tracking-widest mb-2">Your referral code</p>
            <div className="flex items-center gap-3 bg-white/3 border border-white/10 rounded-xl px-4 py-3">
              <span className="font-mono font-black text-white text-xl tracking-widest uppercase flex-1">
                {referralCode || '—'}
              </span>
              <span className="font-mono text-[0.55rem] text-white/25">unique to you</span>
            </div>
          </div>

          <div>
            <p className="font-mono text-[0.58rem] text-white/35 uppercase tracking-widest mb-2">Your referral link</p>
            <div className="flex items-center gap-2 bg-white/3 border border-white/8 rounded-xl px-3 py-2.5">
              <span className="font-mono text-[0.6rem] text-white/50 truncate flex-1">{referralUrl}</span>
              <button
                onClick={copyLink}
                className={cn(
                  'flex-shrink-0 font-mono text-[0.6rem] px-3 py-1.5 rounded-lg border transition-all',
                  copied
                    ? 'bg-teal-600/20 border-teal-500/40 text-teal-400'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                )}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={shareWhatsApp}
              className="flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 border border-green-600/25 text-green-400 font-display font-bold text-xs py-3 rounded-xl transition-all"
            >
              <span>💬</span> Share on WhatsApp
            </button>
            <button
              onClick={copyLink}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white font-display font-bold text-xs py-3 rounded-xl transition-all"
            >
              <span>🔗</span> Copy Link
            </button>
          </div>
        </div>

        {/* Next milestone */}
        {nextMilestone && referralCount < 10 && (
          <div className="bg-[#111a18] border border-white/7 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-mono text-[0.58rem] text-white/35 uppercase tracking-widest">Next milestone</p>
                <p className="font-display font-bold text-white text-sm mt-0.5">
                  {nextMilestone.icon} {nextMilestone.count} referrals → {nextMilestone.reward}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-teal-400 text-lg">{referralCount}/{nextMilestone.count}</p>
                <p className="font-mono text-[0.55rem] text-white/30">friends</p>
              </div>
            </div>
            <div className="h-2 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-600 to-teal-400 rounded-full transition-all duration-700"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </div>
        )}

        {referralCount >= 10 && (
          <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-4 text-center">
            <p className="text-2xl mb-1">👑</p>
            <p className="font-display font-bold text-amber-400 text-sm">{name}, you&apos;re a VarsityOS legend!</p>
            <p className="font-mono text-[0.6rem] text-white/40 mt-1">10+ referrals — Premium reward being processed</p>
          </div>
        )}

        {/* How it works */}
        <div className="bg-[#111a18] border border-white/7 rounded-2xl p-5">
          <p className="font-mono text-[0.58rem] text-white/35 uppercase tracking-widest mb-4">How it works</p>
          <div className="space-y-4">
            {HOW_IT_WORKS.map(step => (
              <div key={step.step} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-teal-600/10 border border-teal-600/15 flex items-center justify-center">
                  <span className="text-base">{step.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[0.52rem] text-white/25">{step.step}</span>
                    <p className="font-display font-bold text-white text-sm">{step.title}</p>
                  </div>
                  <p className="font-mono text-[0.62rem] text-white/45 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones table */}
        <div className="bg-[#111a18] border border-white/7 rounded-2xl p-5">
          <p className="font-mono text-[0.58rem] text-white/35 uppercase tracking-widest mb-4">Reward milestones</p>
          <div className="space-y-2">
            {MILESTONES.map(m => {
              const reached = referralCount >= m.count
              return (
                <div
                  key={m.count}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                    reached
                      ? 'bg-teal-600/10 border border-teal-600/15'
                      : 'bg-white/3 border border-white/6'
                  )}
                >
                  <span className="text-lg w-7 text-center">{m.icon}</span>
                  <div className="flex-1">
                    <p className={cn('font-display font-bold text-sm', reached ? 'text-teal-300' : 'text-white/60')}>
                      {m.reward}
                    </p>
                    <p className="font-mono text-[0.55rem] text-white/25">{m.count} referral{m.count > 1 ? 's' : ''}</p>
                  </div>
                  {reached && (
                    <span className="font-mono text-[0.6rem] text-teal-400 bg-teal-600/15 px-2 py-0.5 rounded-full">✓ earned</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Fine print */}
        <p className="font-mono text-[0.55rem] text-white/20 text-center pb-2">
          Bonus Nova messages are added to your monthly free limit. They do not carry over between months.
          10-referral Premium reward is reviewed manually within 48 hours.
        </p>
      </div>
    </div>
  )
}
