import { inngest } from './client'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { notifyUser } from '@/lib/push-notify'
import { canSendPush } from '@/lib/webpush'

interface FnCtx {
  step: { run<T>(id: string, fn: () => Promise<T>): Promise<T> }
  logger: { warn(msg: string): void; info(msg: string): void }
}

// ─── Exam Reminders ───────────────────────────────────────────────────────────
// Fires daily at 07:00 SAST (Africa/Johannesburg).
// Sends push notifications to subscribed users for exams 1, 3, and 7 days away.
export const examReminders = inngest.createFunction(
  {
    id: 'exam-reminders',
    name: 'Daily Exam Reminders',
    retries: 2,
  },
  { cron: 'TZ=Africa/Johannesburg 0 7 * * *' },
  async ({ step, logger }: FnCtx) => {
    if (!canSendPush()) {
      logger.warn('VAPID not configured — skipping exam reminders')
      return { sent: 0 }
    }

    const supabase = createAdminSupabaseClient()
    const now = new Date()
    const DAYS_AHEAD = [1, 3, 7]
    let totalSent = 0

    for (const days of DAYS_AHEAD) {
      const target = new Date(now)
      target.setDate(now.getDate() + days)
      const targetStr = target.toISOString().slice(0, 10)

      const sent = await step.run(`notify-exams-${days}d`, async () => {
        const { data: exams } = await supabase
          .from('exams')
          .select('user_id, exam_name')
          .eq('exam_date', targetStr)

        if (!exams?.length) return 0

        let count = 0
        for (const exam of exams) {
          const body =
            days === 1
              ? `${exam.exam_name} is TOMORROW. Review your notes tonight! 💪`
              : days === 3
              ? `${exam.exam_name} is in 3 days. Build momentum now. 📚`
              : `${exam.exam_name} is one week away. Start your prep today.`

          count += await notifyUser(supabase, exam.user_id, {
            title: days === 1 ? '⚡ Exam Tomorrow!' : `📚 Exam in ${days} days`,
            body,
            url: '/study',
            tag: `exam-${exam.user_id}-${targetStr}`,
          })
        }
        return count
      })

      totalSent += sent as number
    }

    logger.info(`Exam reminders: sent ${totalSent} notifications`)
    return { sent: totalSent, date: now.toISOString().slice(0, 10) }
  },
)

// ─── Wellness Nudge ───────────────────────────────────────────────────────────
// Fires daily at 19:00 SAST.
// Sends an evening check-in prompt to users who haven't logged wellness today.
export const wellnessNudge = inngest.createFunction(
  {
    id: 'wellness-nudge',
    name: 'Daily Wellness Nudge',
    retries: 2,
  },
  { cron: 'TZ=Africa/Johannesburg 0 19 * * *' },
  async ({ step, logger }: FnCtx) => {
    if (!canSendPush()) {
      logger.warn('VAPID not configured — skipping wellness nudge')
      return { sent: 0 }
    }

    const supabase = createAdminSupabaseClient()
    const today = new Date().toISOString().slice(0, 10)

    const needsNudge = await step.run('find-users-without-checkin', async () => {
      const { data: subscribers } = await supabase
        .from('push_subscriptions')
        .select('user_id')

      if (!subscribers?.length) return []

      const userIds = [...new Set(subscribers.map((s: { user_id: string }) => s.user_id))]

      const { data: checkedIn } = await supabase
        .from('wellness_checkins')
        .select('user_id')
        .in('user_id', userIds)
        .eq('date', today)

      const checkedInIds = new Set((checkedIn || []).map((r: { user_id: string }) => r.user_id))
      return userIds.filter(id => !checkedInIds.has(id))
    }) as string[]

    if (!needsNudge.length) {
      logger.info('All subscribed users already checked in today')
      return { sent: 0, nudged: 0 }
    }

    const MESSAGES = [
      { title: '💚 How are you feeling today?', body: 'A 30-second check-in helps Nova support you better.' },
      { title: '🌟 Quick check-in?', body: "How's your energy and focus today? VarsityOS is listening." },
      { title: '💭 Pause for a moment', body: 'Rate your mood — takes 30 seconds. Your wellbeing matters.' },
    ]

    const totalSent = await step.run('send-wellness-nudges', async () => {
      let count = 0
      for (let i = 0; i < needsNudge.length; i++) {
        const msg = MESSAGES[i % MESSAGES.length]
        count += await notifyUser(supabase, needsNudge[i], {
          ...msg,
          url: '/study?tab=wellness',
          tag: `wellness-${today}`,
        })
      }
      return count
    })

    logger.info(`Wellness nudge: sent ${totalSent} to ${needsNudge.length} users`)
    return { sent: totalSent, nudged: needsNudge.length, date: today }
  },
)
