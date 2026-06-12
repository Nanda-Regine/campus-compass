// Vercel Cron: daily at 07:00 UTC (09:00 SAST)
// Sends exam reminders to subscribed users for exams in 1, 3, and 7 days.
// Protected by CRON_SECRET injected by Vercel automatically.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { notifyUser } from '@/lib/push-notify'
import { canSendPush } from '@/lib/webpush'

const DAYS_AHEAD = [1, 3, 7]

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!canSendPush()) {
    return NextResponse.json({ sent: 0, reason: 'VAPID not configured' })
  }

  const supabase = createAdminSupabaseClient()
  const now = new Date()
  let totalSent = 0

  for (const days of DAYS_AHEAD) {
    const target = new Date(now)
    target.setDate(now.getDate() + days)
    const targetStr = target.toISOString().slice(0, 10)

    const { data: exams } = await supabase
      .from('exams')
      .select('user_id, exam_name')
      .eq('exam_date', targetStr)

    if (!exams?.length) continue

    for (const exam of exams) {
      const body =
        days === 1
          ? `${exam.exam_name} is TOMORROW. Review your notes tonight! 💪`
          : days === 3
          ? `${exam.exam_name} is in 3 days. Build momentum now. 📚`
          : `${exam.exam_name} is one week away. Start your prep today.`

      const sent = await notifyUser(supabase, exam.user_id, {
        title: days === 1 ? '⚡ Exam Tomorrow!' : `📚 Exam in ${days} days`,
        body,
        url: '/study',
        tag: `exam-${exam.user_id}-${targetStr}`,
      })
      totalSent += sent
    }
  }

  return NextResponse.json({ sent: totalSent, date: now.toISOString().slice(0, 10) })
}
