import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { webpush, canSendPush } from '@/lib/webpush'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!canSendPush()) return NextResponse.json({ sent: 0 })

    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get upcoming exams within 3 days
    const today = new Date()
    const in3   = new Date(today); in3.setDate(today.getDate() + 3)
    const todayStr = today.toISOString().slice(0, 10)
    const in3Str   = in3.toISOString().slice(0, 10)

    const [{ data: exams }, { data: subs }] = await Promise.all([
      supabase.from('exams')
        .select('exam_name, exam_date')
        .eq('user_id', user.id)
        .gte('exam_date', todayStr)
        .lte('exam_date', in3Str),
      supabase.from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', user.id),
    ])

    if (!exams?.length || !subs?.length) return NextResponse.json({ sent: 0 })

    const exam = exams[0] // notify for the soonest
    const daysUntil = Math.ceil((new Date(exam.exam_date).getTime() - today.getTime()) / 86400000)
    const body = daysUntil === 0
      ? `Your ${exam.exam_name} exam is TODAY. Good luck! 💪`
      : `${exam.exam_name} is in ${daysUntil} day${daysUntil > 1 ? 's' : ''}. Time to prep! 📚`

    const payload = JSON.stringify({
      title: 'Exam Reminder',
      body,
      url: '/study',
      icon: '/favicon.jpg',
    })

    let sent = 0
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch { /* expired sub — cleanup handled separately */ }
    }

    return NextResponse.json({ sent })
  } catch (error) {
    console.error('Check exams push error:', error)
    return NextResponse.json({ sent: 0 })
  }
}
