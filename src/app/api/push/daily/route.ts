export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/push/daily — called by Vercel Cron at 07:00 SAST daily.
// Evaluates key rules for every user with push subscriptions and sends
// personalised nudges (exam countdown, budget warning, streak protection).
// Secured by CRON_SECRET env var.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyUser } from '@/lib/push-notify'
import { canSendPush } from '@/lib/webpush'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

interface ProfileRow {
  id: string
  nova_messages_used?: number
  nova_messages_month?: string
}

interface ExamRow {
  user_id: string
  title: string
  exam_date: string
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!canSendPush()) {
    return NextResponse.json({ error: 'Push not configured' }, { status: 503 })
  }

  const supabase = adminClient()

  // Get all users who have push subscriptions
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id')

  if (!subs?.length) return NextResponse.json({ sent: 0, users: 0 })

  const userIds = [...new Set(subs.map(s => (s as { user_id: string }).user_id))]

  // Fetch profiles for all subscribed users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nova_messages_used, nova_messages_month')
    .in('id', userIds)

  // Fetch exams in next 3 days for these users
  const todayStr = new Date().toISOString().split('T')[0]
  const inThreeDays = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  const { data: exams } = await supabase
    .from('exams')
    .select('user_id, title, exam_date')
    .in('user_id', userIds)
    .gte('exam_date', todayStr)
    .lte('exam_date', inThreeDays)

  const examsByUser: Record<string, ExamRow[]> = {}
  for (const exam of (exams ?? []) as ExamRow[]) {
    if (!examsByUser[exam.user_id]) examsByUser[exam.user_id] = []
    examsByUser[exam.user_id].push(exam)
  }

  let totalSent = 0
  const profileMap = new Map<string, ProfileRow>(
    ((profiles ?? []) as ProfileRow[]).map(p => [p.id, p])
  )

  for (const userId of userIds) {
    const profile = profileMap.get(userId)
    const userExams = examsByUser[userId] ?? []
    const notifications: Array<{ title: string; body: string; url: string; tag: string }> = []

    // Rule 1: Exam tomorrow or today
    for (const exam of userExams) {
      const daysUntil = Math.round(
        (new Date(exam.exam_date).getTime() - Date.now()) / 86400000
      )
      if (daysUntil === 0) {
        notifications.push({
          title: '📝 Exam today!',
          body: `${exam.title} is today. You've got this — breathe and trust your prep.`,
          url: '/study',
          tag: `exam-today-${exam.exam_date}`,
        })
      } else if (daysUntil === 1) {
        notifications.push({
          title: '⏰ Exam tomorrow',
          body: `${exam.title} is tomorrow. Do a final review tonight and sleep early.`,
          url: '/study',
          tag: `exam-tomorrow-${exam.exam_date}`,
        })
      } else {
        notifications.push({
          title: `📚 ${daysUntil} days until ${exam.title}`,
          body: 'Open your study plan and knock out one revision session today.',
          url: '/study',
          tag: `exam-${exam.exam_date}`,
        })
      }
    }

    // Rule 2: Good morning motivational nudge (if no exam alerts)
    if (notifications.length === 0) {
      const hour = new Date().getUTCHours() // 07:00 SAST = 05:00 UTC
      if (hour < 10) {
        notifications.push({
          title: '☀️ Good morning',
          body: 'Set your top 3 tasks for today and make it count.',
          url: '/dashboard',
          tag: 'morning-nudge',
        })
      }
    }

    // Rule 3: Nova quota warning (>= 80% used)
    if (profile) {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const inCurrentMonth = profile.nova_messages_month === currentMonth
      const used = inCurrentMonth ? (profile.nova_messages_used ?? 0) : 0
      const limit = 50 // free tier
      if (used >= Math.floor(limit * 0.8) && used < limit) {
        notifications.push({
          title: '🤖 Nova quota at 80%',
          body: `You've used ${used}/${limit} Nova messages this month. Use them wisely!`,
          url: '/nova',
          tag: 'nova-quota',
        })
      }
    }

    for (const note of notifications) {
      const sent = await notifyUser(supabase, userId, note)
      totalSent += sent
    }
  }

  return NextResponse.json({ sent: totalSent, users: userIds.length })
}
