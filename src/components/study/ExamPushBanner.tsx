'use client'

import { usePushNotifications } from '@/hooks/usePushNotifications'
import { cn } from '@/lib/utils'

export default function ExamPushBanner() {
  const { supported, permission, subscribed, loading, subscribe, unsubscribe } = usePushNotifications()

  if (!supported || permission === 'denied') return null

  if (subscribed) {
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-teal-600/8 border border-teal-600/15">
        <div className="flex items-center gap-2">
          <span className="text-sm">🔔</span>
          <span className="font-mono text-[0.6rem] text-teal-400">Exam reminders enabled</span>
        </div>
        <button
          onClick={unsubscribe}
          disabled={loading}
          className="font-mono text-[0.55rem] text-white/25 hover:text-white/50 transition-colors disabled:opacity-40"
        >
          Turn off
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={subscribe}
      disabled={loading}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left',
        'bg-white/3 border-white/10 hover:bg-teal-600/8 hover:border-teal-600/20 disabled:opacity-50'
      )}
    >
      <span className="text-lg">🔔</span>
      <div>
        <p className="font-display font-bold text-sm text-white/80">Get exam reminders</p>
        <p className="font-mono text-[0.58rem] text-white/35">
          {loading ? 'Requesting permission…' : 'We\'ll notify you 3 days before each exam'}
        </p>
      </div>
      <span className="ml-auto font-mono text-[0.6rem] text-teal-400">Enable →</span>
    </button>
  )
}
