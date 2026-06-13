import { inngest } from './client'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { notifyUser } from '@/lib/push-notify'
import { canSendPush } from '@/lib/webpush'

// ─── Attendance Risk Alert ────────────────────────────────────────────────────
// Fires daily at 18:00 SAST.
// Checks all users' attendance records and alerts those below 80% in any module.
export const attendanceAlert = inngest.createFunction(
  { id: 'attendance-alert', name: 'Daily Attendance Risk Alert', retries: 2 },
  { cron: 'TZ=Africa/Johannesburg 0 18 * * *' },
  async ({ step, logger }: FnCtx) => {
    if (!canSendPush()) { logger.warn('VAPID not configured'); return { sent: 0 } }
    const supabase = createAdminSupabaseClient()

    const atRisk = await step.run('find-attendance-risk', async () => {
      // Aggregate per user+module: count present/late/online vs total
      const { data: recs } = await supabase
        .from('attendance_records')
        .select('user_id, module_id, status, modules!inner(module_name)')
        .neq('status', 'cancelled')

      if (!recs?.length) return []

      // Group by user → module
      type Rec = { user_id: string; module_id: string; status: string; modules: unknown }
      const byUserModule: Record<string, { attended: number; total: number; name: string }> = {}
      for (const r of recs as unknown as Rec[]) {
        const moduleName = (Array.isArray(r.modules) ? (r.modules[0] as { module_name: string })?.module_name : (r.modules as { module_name: string })?.module_name) ?? 'Unknown'
        const key = `${r.user_id}::${r.module_id}`
        if (!byUserModule[key]) byUserModule[key] = { attended: 0, total: 0, name: moduleName }
        byUserModule[key].total++
        if (r.status !== 'absent') byUserModule[key].attended++
      }

      const results: { userId: string; moduleName: string; pct: number }[] = []
      for (const [key, stat] of Object.entries(byUserModule)) {
        if (stat.total < 3) continue // not enough data yet
        const pct = Math.round((stat.attended / stat.total) * 100)
        if (pct < 80) {
          const userId = key.split('::')[0]
          results.push({ userId, moduleName: stat.name, pct })
        }
      }

      // Deduplicate: one notification per user (worst module)
      const worst: Record<string, { moduleName: string; pct: number }> = {}
      for (const r of results) {
        if (!worst[r.userId] || r.pct < worst[r.userId].pct) {
          worst[r.userId] = { moduleName: r.moduleName, pct: r.pct }
        }
      }
      return Object.entries(worst).map(([userId, v]) => ({ userId, ...v }))
    }) as { userId: string; moduleName: string; pct: number }[]

    if (!atRisk.length) return { sent: 0 }

    // Only send to users who have push subscriptions
    const { data: subs } = await supabase.from('push_subscriptions').select('user_id')
    const subSet = new Set((subs ?? []).map((s: { user_id: string }) => s.user_id))
    const toNotify = atRisk.filter(r => subSet.has(r.userId))

    const totalSent = await step.run('send-attendance-alerts', async () => {
      let count = 0
      for (const r of toNotify) {
        count += await notifyUser(supabase, r.userId, {
          title: r.pct < 70 ? '🚨 Attendance critical' : '⚠️ Attendance warning',
          body:  `${r.moduleName}: ${r.pct}% attendance. 80% required for exam entry. Mark a catch-up session today.`,
          url:   '/study?tab=attendance',
          tag:   `attendance-risk-${new Date().toISOString().slice(0, 7)}`,
        })
      }
      return count
    })

    logger.info(`Attendance alert: ${totalSent} sent to ${toNotify.length} at-risk users`)
    return { sent: totalSent, atRisk: atRisk.length }
  },
)

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

// ─── Budget Overspend Alert ───────────────────────────────────────────────────
// Fires daily at 20:00 SAST.
// Warns users who have spent ≥ 80% of their monthly budget.
export const budgetAlert = inngest.createFunction(
  { id: 'budget-alert', name: 'Daily Budget Alert', retries: 2 },
  { cron: 'TZ=Africa/Johannesburg 0 20 * * *' },
  async ({ step, logger }: FnCtx) => {
    if (!canSendPush()) { logger.warn('VAPID not configured'); return { sent: 0 } }
    const supabase = createAdminSupabaseClient()
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
    const todayStr   = today.toISOString().slice(0, 10)

    const atRisk = await step.run('find-overspenders', async () => {
      const { data: budgets } = await supabase
        .from('budgets')
        .select('user_id, monthly_budget')
        .gt('monthly_budget', 0)
      if (!budgets?.length) return []

      const userIds = budgets.map((b: { user_id: string }) => b.user_id)
      const { data: expenses } = await supabase
        .from('expenses')
        .select('user_id, amount')
        .in('user_id', userIds)
        .gte('expense_date', monthStart)
        .lte('expense_date', todayStr)

      const totals: Record<string, number> = {}
      for (const e of (expenses ?? [])) {
        totals[e.user_id] = (totals[e.user_id] ?? 0) + e.amount
      }

      return budgets.filter((b: { user_id: string; monthly_budget: number }) => {
        const spent = totals[b.user_id] ?? 0
        return spent >= b.monthly_budget * 0.80
      }).map((b: { user_id: string; monthly_budget: number }) => ({
        userId: b.user_id,
        pct: Math.round((totals[b.user_id] ?? 0) / b.monthly_budget * 100),
      }))
    }) as { userId: string; pct: number }[]

    if (!atRisk.length) return { sent: 0 }

    const totalSent = await step.run('send-budget-alerts', async () => {
      let count = 0
      for (const r of atRisk) {
        const title = r.pct >= 100 ? '🚨 Budget exceeded' : `⚠️ ${r.pct}% of budget spent`
        const body  = r.pct >= 100
          ? 'You\'ve exceeded your monthly budget. Review your expenses in the Budget tab.'
          : 'You\'re close to your monthly limit. Check your Budget OS to adjust.'
        count += await notifyUser(supabase, r.userId, { title, body, url: '/budget', tag: `budget-${new Date().toISOString().slice(0, 7)}` })
      }
      return count
    })

    logger.info(`Budget alert: sent ${totalSent}`)
    return { sent: totalSent }
  },
)

// ─── Study Gap Alert ──────────────────────────────────────────────────────────
// Fires daily at 10:00 SAST.
// Alerts users with an exam ≤ 7 days away who have overdue tasks.
export const studyGapAlert = inngest.createFunction(
  { id: 'study-gap-alert', name: 'Study Gap Reminder', retries: 2 },
  { cron: 'TZ=Africa/Johannesburg 0 10 * * *' },
  async ({ step, logger }: FnCtx) => {
    if (!canSendPush()) { logger.warn('VAPID not configured'); return { sent: 0 } }
    const supabase = createAdminSupabaseClient()
    const today    = new Date()
    const in7Str   = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10)
    const todayStr = today.toISOString().slice(0, 10)

    const urgentUsers = await step.run('find-study-gaps', async () => {
      const { data: exams } = await supabase
        .from('exams')
        .select('user_id, exam_name, exam_date')
        .gte('exam_date', todayStr)
        .lte('exam_date', in7Str)
      if (!exams?.length) return []

      const byUser: Record<string, { exam_name: string; exam_date: string }[]> = {}
      for (const e of exams) {
        if (!byUser[e.user_id]) byUser[e.user_id] = []
        byUser[e.user_id].push(e)
      }

      const { data: overdue } = await supabase
        .from('tasks')
        .select('user_id')
        .in('user_id', Object.keys(byUser))
        .lt('due_date', todayStr)
        .eq('completed', false)

      const overdueSet = new Set((overdue ?? []).map((t: { user_id: string }) => t.user_id))
      return Object.entries(byUser)
        .filter(([uid]) => overdueSet.has(uid))
        .map(([userId, exs]) => ({ userId, exam_name: exs[0].exam_name, exam_date: exs[0].exam_date }))
    }) as { userId: string; exam_name: string; exam_date: string }[]

    if (!urgentUsers.length) return { sent: 0 }

    const totalSent = await step.run('send-study-gap-nudges', async () => {
      let count = 0
      for (const u of urgentUsers) {
        const days = Math.ceil((new Date(u.exam_date).getTime() - today.getTime()) / 86400000)
        count += await notifyUser(supabase, u.userId, {
          title: `📚 ${u.exam_name} in ${days} day${days !== 1 ? 's' : ''}`,
          body: 'You have overdue tasks. Nova suggests a focused session today to close the gap.',
          url: '/study',
          tag: `study-gap-${todayStr}-${u.userId}`,
        })
      }
      return count
    })

    logger.info(`Study gap: sent ${totalSent}`)
    return { sent: totalSent }
  },
)

// ─── Morning Brief ────────────────────────────────────────────────────────────
// Fires daily at 07:30 SAST — after examReminders so exam-day users aren't
// double-notified. Sends a generic "set your 3 tasks" nudge to users who have
// no exam in the next 24 hours. Also warns users whose Nova quota is ≥ 80%.
export const morningBrief = inngest.createFunction(
  { id: 'morning-brief', name: 'Daily Morning Brief', retries: 2 },
  { cron: 'TZ=Africa/Johannesburg 30 7 * * *' },
  async ({ step, logger }: FnCtx) => {
    if (!canSendPush()) { logger.warn('VAPID not configured'); return { sent: 0 } }
    const supabase = createAdminSupabaseClient()
    const today = new Date()
    const todayStr     = today.toISOString().slice(0, 10)
    const tomorrowStr  = new Date(today.getTime() + 86400000).toISOString().slice(0, 10)

    const { nudgeSent, quotaSent } = await step.run('morning-brief-batch', async () => {
      // All subscribed users
      const { data: subs } = await supabase.from('push_subscriptions').select('user_id')
      if (!subs?.length) return { nudgeSent: 0, quotaSent: 0 }
      const userIds = [...new Set(subs.map((s: { user_id: string }) => s.user_id))]

      // Users who already have an exam today or tomorrow (examReminders handled them)
      const { data: nearExams } = await supabase
        .from('exams')
        .select('user_id')
        .in('user_id', userIds)
        .in('exam_date', [todayStr, tomorrowStr])
      const examUserSet = new Set((nearExams ?? []).map((e: { user_id: string }) => e.user_id))

      // Profiles for Nova quota check
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nova_messages_used, nova_messages_month, subscription_tier')
        .in('id', userIds)

      const currentMonth = today.toISOString().slice(0, 7)
      let nudgeSent = 0, quotaSent = 0

      for (const userId of userIds) {
        const profile = (profiles ?? []).find((p: { id: string }) => p.id === userId) as {
          id: string; nova_messages_used: number; nova_messages_month: string; subscription_tier: string
        } | undefined

        // Morning nudge — only for users without an imminent exam
        if (!examUserSet.has(userId)) {
          nudgeSent += await notifyUser(supabase, userId, {
            title: '☀️ Good morning',
            body: 'Set your top 3 tasks for today and make it count.',
            url: '/dashboard',
            tag: `morning-${todayStr}`,
          })
        }

        // Nova quota warning (≥ 80% but not yet at limit)
        if (profile && profile.nova_messages_month === currentMonth) {
          const limit = profile.subscription_tier === 'nova_scholar' ? 150
            : profile.subscription_tier === 'nova_unlimited' ? 9999
            : 50
          const used = profile.nova_messages_used ?? 0
          if (used >= Math.floor(limit * 0.8) && used < limit) {
            quotaSent += await notifyUser(supabase, userId, {
              title: '🤖 Nova quota at 80%',
              body: `${used}/${limit} messages used this month. Upgrade for unlimited.`,
              url: '/nova',
              tag: `nova-quota-${currentMonth}`,
            })
          }
        }
      }

      return { nudgeSent, quotaSent }
    })

    logger.info(`Morning brief: ${nudgeSent} nudges, ${quotaSent} Nova quota warnings`)
    return { nudgeSent, quotaSent }
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

// ─── NSFAS Late Payment Alert ─────────────────────────────────────────────────
// Fires daily at 09:00 SAST.
// Checks nsfas_disbursements for rows where status='expected' and
// expected_date < today, and pushes an alert so students can act quickly.
export const nsfasLateAlert = inngest.createFunction(
  { id: 'nsfas-late-alert', name: 'NSFAS Late Payment Alert', retries: 2 },
  { cron: 'TZ=Africa/Johannesburg 0 9 * * *' },
  async ({ step, logger }: FnCtx) => {
    if (!canSendPush()) { logger.warn('VAPID not configured'); return { sent: 0 } }
    const supabase = createAdminSupabaseClient()
    const today = new Date().toISOString().slice(0, 10)

    const overdueUsers = await step.run('find-overdue-nsfas', async () => {
      const { data: overdue } = await supabase
        .from('nsfas_disbursements')
        .select('user_id, type, expected_date, expected_amount, period_label')
        .eq('status', 'expected')
        .lt('expected_date', today)

      if (!overdue?.length) return []

      // Deduplicate: worst (oldest) overdue row per user
      const worst: Record<string, { type: string; expected_date: string; expected_amount: number; period_label: string; daysLate: number }> = {}
      for (const d of overdue as { user_id: string; type: string; expected_date: string; expected_amount: number; period_label: string }[]) {
        const daysLate = Math.floor((Date.now() - new Date(d.expected_date).getTime()) / 86400000)
        if (!worst[d.user_id] || daysLate > worst[d.user_id].daysLate) {
          worst[d.user_id] = { type: d.type, expected_date: d.expected_date, expected_amount: d.expected_amount, period_label: d.period_label, daysLate }
        }
      }
      return Object.entries(worst).map(([userId, v]) => ({ userId, ...v }))
    }) as { userId: string; type: string; expected_amount: number; period_label: string; daysLate: number }[]

    if (!overdueUsers.length) return { sent: 0 }

    const { data: subs } = await supabase.from('push_subscriptions').select('user_id')
    const subSet = new Set((subs ?? []).map((s: { user_id: string }) => s.user_id))

    const totalSent = await step.run('send-nsfas-alerts', async () => {
      let count = 0
      for (const u of overdueUsers.filter(r => subSet.has(r.userId))) {
        const label = u.type === 'living' ? 'Living allowance' : u.type === 'accommodation' ? 'Accommodation allowance' : u.type === 'books' ? 'Books allowance' : 'NSFAS payment'
        count += await notifyUser(supabase, u.userId, {
          title: `🏛️ NSFAS payment overdue (${u.daysLate}d late)`,
          body: `${label} for ${u.period_label} (R${u.expected_amount.toFixed(0)}) hasn't arrived. Check your myNSFAS portal and bank details.`,
          url: '/budget?tab=nsfas',
          tag: `nsfas-late-${u.period_label.replace(/\s/g, '-')}`,
        })
      }
      return count
    })

    logger.info(`NSFAS late alert: ${totalSent} sent, ${overdueUsers.length} overdue users found`)
    return { sent: totalSent, overdueUsers: overdueUsers.length }
  },
)

// ─── Weekly Study Digest ──────────────────────────────────────────────────────
// Fires every Sunday at 20:00 SAST.
// Summarises the past week: tasks completed, exams upcoming, wellness trend,
// and push-notifies users to do their Sunday planning session.
export const weeklyDigest = inngest.createFunction(
  { id: 'weekly-digest', name: 'Sunday Weekly Digest', retries: 2 },
  { cron: 'TZ=Africa/Johannesburg 0 20 * * 0' },
  async ({ step, logger }: FnCtx) => {
    if (!canSendPush()) { logger.warn('VAPID not configured'); return { sent: 0 } }
    const supabase = createAdminSupabaseClient()
    const today    = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const weekAgo  = new Date(today.getTime() - 7 * 86400000).toISOString().slice(0, 10)
    const in7d     = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10)

    const { data: subs } = await supabase.from('push_subscriptions').select('user_id')
    if (!subs?.length) return { sent: 0 }
    const userIds = [...new Set(subs.map((s: { user_id: string }) => s.user_id))]

    const summaries = await step.run('build-weekly-summaries', async () => {
      const [tasksRes, examsRes, wellnessRes] = await Promise.all([
        supabase.from('tasks').select('user_id, status').in('user_id', userIds)
          .eq('status', 'done').gte('updated_at', weekAgo).lte('updated_at', todayStr),
        supabase.from('exams').select('user_id, exam_name').in('user_id', userIds)
          .gte('exam_date', todayStr).lte('exam_date', in7d),
        supabase.from('wellness_checkins').select('user_id, score').in('user_id', userIds)
          .gte('date', weekAgo).lte('date', todayStr),
      ])

      const tasksDone: Record<string, number> = {}
      for (const t of (tasksRes.data ?? []) as { user_id: string }[]) {
        tasksDone[t.user_id] = (tasksDone[t.user_id] ?? 0) + 1
      }

      const upcomingExams: Record<string, string[]> = {}
      for (const e of (examsRes.data ?? []) as { user_id: string; exam_name: string }[]) {
        if (!upcomingExams[e.user_id]) upcomingExams[e.user_id] = []
        upcomingExams[e.user_id].push(e.exam_name)
      }

      const wellnessScores: Record<string, number[]> = {}
      for (const w of (wellnessRes.data ?? []) as { user_id: string; score: number }[]) {
        if (!wellnessScores[w.user_id]) wellnessScores[w.user_id] = []
        wellnessScores[w.user_id].push(w.score)
      }

      return userIds.map(userId => ({
        userId,
        tasksDone: tasksDone[userId] ?? 0,
        upcomingExams: upcomingExams[userId] ?? [],
        avgWellness: wellnessScores[userId]?.length
          ? Math.round(wellnessScores[userId].reduce((a, b) => a + b, 0) / wellnessScores[userId].length)
          : null,
      }))
    }) as { userId: string; tasksDone: number; upcomingExams: string[]; avgWellness: number | null }[]

    const totalSent = await step.run('send-weekly-digest', async () => {
      let count = 0
      for (const s of summaries) {
        const examLine = s.upcomingExams.length
          ? ` ${s.upcomingExams.length} exam${s.upcomingExams.length > 1 ? 's' : ''} next week.`
          : ' No exams next week.'
        const wellnessLine = s.avgWellness !== null
          ? ` Avg wellness: ${s.avgWellness}/100.`
          : ''
        count += await notifyUser(supabase, s.userId, {
          title: '📋 Sunday Review — plan your week',
          body: `${s.tasksDone} task${s.tasksDone !== 1 ? 's' : ''} done this week.${examLine}${wellnessLine} Open Sunday Planning to set next week's intentions.`,
          url: '/dashboard?modal=sunday',
          tag: `weekly-digest-${todayStr}`,
        })
      }
      return count
    })

    logger.info(`Weekly digest: ${totalSent} sent`)
    return { sent: totalSent, users: userIds.length }
  },
)
