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
        .neq('status', 'done')

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

// ─── Daily Student State Snapshot ────────────────────────────────────────────
// Fires at midnight SAST.
// Captures each active user's academic+financial+wellness state so the
// orchestration layer can detect multi-day trends (e.g. 3 days declining
// wellness + overspending + missed attendance → critical intervention).
export const dailyStateSnapshot = inngest.createFunction(
  { id: 'daily-state-snapshot', name: 'Daily Student State Snapshot', retries: 1 },
  { cron: 'TZ=Africa/Johannesburg 0 0 * * *' },
  async ({ step, logger }: FnCtx) => {
    const supabase  = createAdminSupabaseClient()
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const today     = new Date().toISOString().slice(0, 10)

    // Identify active users: logged wellness or study session yesterday
    const activeUsers = await step.run('find-active-users', async () => {
      const [wellnessRes, sessionsRes] = await Promise.all([
        supabase.from('wellness_checkins').select('user_id').gte('date', yesterday),
        supabase.from('study_sessions').select('user_id').gte('started_at', yesterday + 'T00:00:00Z'),
      ])
      const ids = new Set<string>([
        ...((wellnessRes.data ?? []) as { user_id: string }[]).map(r => r.user_id),
        ...((sessionsRes.data ?? []) as { user_id: string }[]).map(r => r.user_id),
      ])
      return [...ids]
    }) as string[]

    if (!activeUsers.length) return { snapshots: 0 }

    const snapshotCount = await step.run('write-snapshots', async () => {
      const today7DaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
      const [wellnessRes, sessionsRes, tasksRes, attendRes, expensesRes] = await Promise.all([
        supabase.from('wellness_checkins').select('user_id, score, date').in('user_id', activeUsers).eq('date', yesterday),
        supabase.from('study_sessions').select('user_id, duration_minutes').in('user_id', activeUsers).gte('started_at', today7DaysAgo),
        supabase.from('tasks').select('user_id, status, due_date').in('user_id', activeUsers).neq('status', 'done').lt('due_date', today),
        supabase.from('attendance_records').select('user_id, status').in('user_id', activeUsers).gte('date', today7DaysAgo).eq('status', 'absent'),
        supabase.from('expenses').select('user_id, amount').in('user_id', activeUsers).gte('created_at', today7DaysAgo),
      ])

      const wellnessMap: Record<string, number> = {}
      for (const w of (wellnessRes.data ?? []) as { user_id: string; score: number }[]) {
        wellnessMap[w.user_id] = w.score
      }
      const studyHoursMap: Record<string, number> = {}
      for (const s of (sessionsRes.data ?? []) as { user_id: string; duration_minutes: number }[]) {
        studyHoursMap[s.user_id] = (studyHoursMap[s.user_id] ?? 0) + (s.duration_minutes ?? 0) / 60
      }
      const overdueMap: Record<string, number> = {}
      for (const t of (tasksRes.data ?? []) as { user_id: string }[]) {
        overdueMap[t.user_id] = (overdueMap[t.user_id] ?? 0) + 1
      }
      const absentMap: Record<string, number> = {}
      for (const a of (attendRes.data ?? []) as { user_id: string }[]) {
        absentMap[a.user_id] = (absentMap[a.user_id] ?? 0) + 1
      }
      const spendMap: Record<string, number> = {}
      for (const e of (expensesRes.data ?? []) as { user_id: string; amount: number }[]) {
        spendMap[e.user_id] = (spendMap[e.user_id] ?? 0) + (e.amount ?? 0)
      }

      const rows = activeUsers.map(userId => {
        const wellnessScore   = wellnessMap[userId] ?? 50
        const studyHours      = Math.round((studyHoursMap[userId] ?? 0) * 10) / 10
        const overdueTasks    = overdueMap[userId] ?? 0
        const absences7d      = absentMap[userId] ?? 0
        const spend7d         = Math.round(spendMap[userId] ?? 0)
        const burnoutScore    = Math.max(0, Math.min(100, 100 - wellnessScore))
        const academicRisk    = absences7d >= 3 || overdueTasks >= 5 ? 'critical' : absences7d >= 2 || overdueTasks >= 3 ? 'warning' : overdueTasks >= 1 ? 'watch' : 'safe'
        return {
          user_id:           userId,
          snapshot_date:     today,
          burnout_score:     burnoutScore,
          procrastination_idx: overdueTasks,
          academic_risk:     academicRisk,
          completion_rate:   overdueTasks === 0 ? 100 : Math.max(0, 100 - overdueTasks * 10),
          raw: { studyHours7d: studyHours, absences7d, spend7d, wellnessScore },
        }
      })

      const { error } = await supabase.from('student_state_snapshots').upsert(rows, { onConflict: 'user_id,snapshot_date', ignoreDuplicates: false })
      if (error) logger.warn('Snapshot upsert error: ' + error.message)
      return rows.length
    })

    logger.info(`State snapshot: ${snapshotCount} users snapshotted for ${today}`)
    return { snapshots: snapshotCount, date: today }
  },
)

// ─── Critical Rules Push Alert (4× per day) ──────────────────────────────────
// Fires at 09:00, 13:00, 17:00, 21:00 SAST.
// Server-side evaluation of urgency 4–5 rules for all subscribed users.
// Covers the case where the student isn't in the app — the client-side rules
// engine can't fire for users who haven't opened VarsityOS in hours.
// Uses intervention_log (48h cooldown via orchestrationIntervention pattern)
// narrowed to urgency-specific windows: 6h for urgency 5, 8h for urgency 4.
export const criticalRulesCheck = inngest.createFunction(
  { id: 'critical-rules-check', name: 'Critical Rules Push Alert (4×/day)', retries: 1 },
  { cron: 'TZ=Africa/Johannesburg 0 9,13,17,21 * * *' },
  async ({ step, logger }: FnCtx) => {
    if (!canSendPush()) return { triggered: 0 }
    const supabase = createAdminSupabaseClient()
    const now       = new Date()
    const todayStr  = now.toISOString().slice(0, 10)
    const in3dStr   = new Date(now.getTime() +  3 * 86_400_000).toISOString().slice(0, 10)
    const in14dStr  = new Date(now.getTime() + 14 * 86_400_000).toISOString().slice(0, 10)
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const dayOfMonth = now.getDate()
    const jsDay = now.getDay()
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - (jsDay === 0 ? 6 : jsDay - 1))
    const weekStartStr = weekStart.toISOString().slice(0, 10)
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)
    const weekEndStr = weekEnd.toISOString().slice(0, 10)

    type Alert = { userId: string; rule: string; urgency: number; title: string; body: string; url: string }

    const alerts = await step.run('evaluate-critical-rules', async () => {
      const { data: subs } = await supabase.from('push_subscriptions').select('user_id')
      if (!subs?.length) return []
      const userIds = [...new Set((subs as { user_id: string }[]).map(s => s.user_id))]
      const results: Alert[] = []

      // ── financial_runway_critical (urgency 5) ─────────────────
      const [budgetsRes, expensesRes] = await Promise.all([
        supabase.from('budgets').select('user_id, monthly_budget').in('user_id', userIds).gt('monthly_budget', 0),
        supabase.from('expenses').select('user_id, amount, month_year, expense_date').in('user_id', userIds),
      ])
      const budgetMap: Record<string, number> = {}
      for (const b of (budgetsRes.data ?? []) as { user_id: string; monthly_budget: number }[]) {
        budgetMap[b.user_id] = b.monthly_budget
      }
      const spentMap: Record<string, number> = {}
      for (const e of (expensesRes.data ?? []) as { user_id: string; amount: number; month_year?: string; expense_date?: string }[]) {
        const inMonth = (e.month_year && e.month_year === monthYear) || (e.expense_date && e.expense_date.startsWith(monthYear))
        if (!inMonth) continue
        spentMap[e.user_id] = (spentMap[e.user_id] ?? 0) + (e.amount ?? 0)
      }
      for (const userId of Object.keys(budgetMap)) {
        const budget     = budgetMap[userId]
        const spent      = spentMap[userId] ?? 0
        const remaining  = Math.max(0, budget - spent)
        const dailyBurn  = dayOfMonth > 0 ? spent / dayOfMonth : 0
        const runwayDays = dailyBurn > 0 ? Math.floor(remaining / dailyBurn) : 999
        if (runwayDays < 5 || remaining < 100) {
          results.push({
            userId, rule: 'financial_runway_critical', urgency: 5,
            title: '🚨 Money runs out in less than 5 days',
            body:  `R${Math.round(remaining)} left at your current pace. Switch to emergency mode before it's too late.`,
            url:   '/budget?mode=emergency',
          })
        }
      }

      // ── academic_exclusion_risk (urgency 5) ───────────────────
      const { data: nearExams } = await supabase.from('exams')
        .select('user_id, exam_name').in('user_id', userIds)
        .gte('exam_date', todayStr).lte('exam_date', in3dStr)
      const nearExamMap: Record<string, string> = {}
      for (const e of (nearExams ?? []) as { user_id: string; exam_name: string }[]) {
        if (!nearExamMap[e.user_id]) nearExamMap[e.user_id] = e.exam_name
      }
      const nearExamUsers = Object.keys(nearExamMap)
      if (nearExamUsers.length > 0) {
        const { data: overdueRows } = await supabase.from('tasks')
          .select('user_id').in('user_id', nearExamUsers)
          .lt('due_date', todayStr).neq('status', 'done')
        const overdueCount: Record<string, number> = {}
        for (const t of (overdueRows ?? []) as { user_id: string }[]) {
          overdueCount[t.user_id] = (overdueCount[t.user_id] ?? 0) + 1
        }
        for (const userId of nearExamUsers) {
          if ((overdueCount[userId] ?? 0) >= 3) {
            results.push({
              userId, rule: 'academic_exclusion_risk', urgency: 5,
              title: '📚 Exam in ≤3 days — overdue tasks piling up',
              body:  `${nearExamMap[userId]} is very soon and you have ${overdueCount[userId]}+ overdue tasks. Open the catch-up planner now.`,
              url:   '/study?tab=exams&catchup=true',
            })
          }
        }
      }

      // ── exam_crunch_unprepared (urgency 4) ────────────────────
      const { data: crunchExams } = await supabase.from('exams')
        .select('user_id, exam_name').in('user_id', userIds)
        .gte('exam_date', todayStr).lte('exam_date', in14dStr)
      const crunchMap: Record<string, string> = {}
      for (const e of (crunchExams ?? []) as { user_id: string; exam_name: string }[]) {
        if (!crunchMap[e.user_id]) crunchMap[e.user_id] = e.exam_name
      }
      const crunchUsers = Object.keys(crunchMap)
      if (crunchUsers.length > 0) {
        const { data: weekTasks } = await supabase.from('tasks')
          .select('user_id, status').in('user_id', crunchUsers)
          .gte('due_date', weekStartStr).lte('due_date', weekEndStr)
        const weekMap: Record<string, { total: number; done: number }> = {}
        for (const t of (weekTasks ?? []) as { user_id: string; status: string }[]) {
          if (!weekMap[t.user_id]) weekMap[t.user_id] = { total: 0, done: 0 }
          weekMap[t.user_id].total++
          if (t.status === 'done') weekMap[t.user_id].done++
        }
        for (const userId of crunchUsers) {
          if (results.some(r => r.userId === userId && r.urgency >= 5)) continue
          const stats = weekMap[userId]
          if (!stats || stats.total === 0) continue
          const completionRate = Math.round((stats.done / stats.total) * 100)
          if (completionRate < 50) {
            results.push({
              userId, rule: 'exam_crunch_unprepared', urgency: 4,
              title: `📖 Exam coming — ${completionRate}% of tasks done`,
              body:  `${crunchMap[userId]} within 2 weeks and task completion is low. Rebuild your study schedule now.`,
              url:   '/study?tab=exams',
            })
          }
        }
      }

      return results
    }) as Alert[]

    if (!alerts.length) return { triggered: 0 }

    // Cooldown: 6h for urgency 5, 8h for urgency 4
    const maxCooldownH = 8
    const { data: recentLog } = await supabase
      .from('intervention_log')
      .select('user_id, rule_id, urgency, shown_at')
      .in('user_id', alerts.map(a => a.userId))
      .gte('shown_at', new Date(Date.now() - maxCooldownH * 3_600_000).toISOString())

    const onCooldown = new Set<string>()
    for (const r of (recentLog ?? []) as { user_id: string; rule_id: string; urgency: number; shown_at: string }[]) {
      const cooldownMs = (r.urgency >= 5 ? 6 : 8) * 3_600_000
      if (Date.now() - new Date(r.shown_at).getTime() < cooldownMs) {
        onCooldown.add(`${r.user_id}::${r.rule_id}`)
      }
    }

    const toSend = alerts.filter(a => !onCooldown.has(`${a.userId}::${a.rule}`))
    if (!toSend.length) return { triggered: 0 }

    const triggered = await step.run('send-critical-alerts', async () => {
      let count = 0
      for (const a of toSend) {
        const sent = await notifyUser(supabase, a.userId, {
          title: a.title, body: a.body, url: a.url,
          tag: `${a.rule}-${todayStr}`,
        })
        if (sent > 0) {
          await supabase.from('intervention_log').insert({
            user_id: a.userId, rule_id: a.rule, urgency: a.urgency,
            variant: 'push', title: a.title,
          })
          count++
        }
      }
      return count
    })

    logger.info(`Critical rules check: ${triggered} alerts sent from ${alerts.length} potential`)
    return { triggered, assessed: alerts.length }
  },
)

// ─── Orchestration Intervention Trigger ──────────────────────────────────────
// Fires at 00:30 SAST daily (30 min after snapshot completes).
// Reads 3-day snapshots, detects negative trends, sends targeted push alerts.
export const orchestrationIntervention = inngest.createFunction(
  { id: 'orchestration-intervention', name: 'Daily Orchestration Intervention', retries: 1 },
  { cron: 'TZ=Africa/Johannesburg 30 0 * * *' },
  async ({ step, logger }: FnCtx) => {
    if (!canSendPush()) return { triggered: 0 }
    const supabase = createAdminSupabaseClient()
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10)

    const atRiskUsers = await step.run('find-at-risk-trends', async () => {
      const { data: snaps } = await supabase
        .from('student_state_snapshots')
        .select('user_id, snapshot_date, burnout_score, academic_risk, procrastination_idx')
        .gte('snapshot_date', threeDaysAgo)
        .order('snapshot_date', { ascending: false })

      if (!snaps?.length) return []

      type Snap = { user_id: string; snapshot_date: string; burnout_score: number; academic_risk: string; procrastination_idx: number }
      const byUser: Record<string, Snap[]> = {}
      for (const s of snaps as Snap[]) {
        if (!byUser[s.user_id]) byUser[s.user_id] = []
        byUser[s.user_id].push(s)
      }

      const interventions: { userId: string; rule: string; title: string; body: string; url: string; urgency: number }[] = []
      for (const [userId, days] of Object.entries(byUser)) {
        if (days.length < 2) continue

        const avgBurnout = days.reduce((a, d) => a + (d.burnout_score ?? 0), 0) / days.length
        const criticalDays = days.filter(d => d.academic_risk === 'critical').length
        const highBurnout3 = days.length >= 3 && days.slice(0, 3).every(d => (d.burnout_score ?? 0) >= 70)
        const overdueTrend = days[0]?.procrastination_idx >= 5

        if (highBurnout3) {
          interventions.push({ userId, rule: 'burnout-3d', urgency: 4,
            title: '🔴 Burnout pattern detected', url: '/nova',
            body: '3 days of high burnout scores. You need a break and support — Nova is here to help.',
          })
        } else if (avgBurnout >= 75) {
          interventions.push({ userId, rule: 'burnout-high', urgency: 3,
            title: '⚠️ High burnout risk', url: '/nova',
            body: 'Your wellbeing scores are dropping. Take 20 minutes to recharge — log a check-in with Nova.',
          })
        }

        if (criticalDays >= 2) {
          interventions.push({ userId, rule: 'academic-critical-2d', urgency: 4,
            title: '📚 Academic risk: 2 days critical', url: '/study?tab=attendance',
            body: 'Critical academic risk detected two days in a row. Check your attendance and overdue tasks now.',
          })
        }

        if (overdueTrend) {
          interventions.push({ userId, rule: 'overdue-5-tasks', urgency: 3,
            title: '⏰ 5+ tasks overdue', url: '/study',
            body: "You have 5 or more overdue tasks piling up. Let's clear the backlog — open the study planner.",
          })
        }
      }
      return interventions
    }) as { userId: string; rule: string; title: string; body: string; url: string; urgency: number }[]

    if (!atRiskUsers.length) return { triggered: 0 }

    // Check cooldowns: don't repeat same rule within 48h
    const { data: recentInterventions } = await supabase
      .from('intervention_log')
      .select('user_id, rule_id, shown_at')
      .in('user_id', atRiskUsers.map(u => u.userId))
      .gte('shown_at', new Date(Date.now() - 48 * 3600000).toISOString())

    const recentSet = new Set((recentInterventions ?? []).map((r: { user_id: string; rule_id: string }) => `${r.user_id}::${r.rule_id}`))

    const toSend = atRiskUsers.filter(u => !recentSet.has(`${u.userId}::${u.rule}`))

    const triggered = await step.run('send-interventions', async () => {
      let count = 0
      for (const u of toSend) {
        const sent = await notifyUser(supabase, u.userId, { title: u.title, body: u.body, url: u.url, tag: `intervention-${u.rule}` })
        if (sent > 0) {
          await supabase.from('intervention_log').insert({ user_id: u.userId, rule_id: u.rule, urgency: u.urgency, variant: 'push', title: u.title })
          count++
        }
      }
      return count
    })

    logger.info(`Orchestration: ${triggered} interventions sent from ${atRiskUsers.length} at-risk users`)
    return { triggered, atRisk: atRiskUsers.length }
  },
)

// ─── Streak Nudge ─────────────────────────────────────────────────────────────
// Fires daily at 21:00 SAST.
// Sends a push to students with a streak ≥ 3 whose last_activity is before today,
// i.e. they are about to break their streak. Respects a 20-hour push cooldown.
export const streakNudge = inngest.createFunction(
  { id: 'streak-nudge', name: 'Daily Streak Nudge', retries: 2 },
  { cron: 'TZ=Africa/Johannesburg 0 21 * * *' },
  async ({ step, logger }: FnCtx) => {
    if (!canSendPush()) { logger.warn('VAPID not configured'); return { sent: 0 } }
    const supabase = createAdminSupabaseClient()

    const atRisk = await step.run('find-at-risk-streaks', async () => {
      const today = new Date().toISOString().slice(0, 10)

      // Students with streak ≥ 3 whose last activity was before today
      const { data: rows } = await supabase
        .from('streaks')
        .select('user_id, current_streak, last_activity')
        .gte('current_streak', 3)
        .lt('last_activity', today)

      if (!rows?.length) return []

      // Only students who have push subscriptions
      const userIds = rows.map((r: { user_id: string }) => r.user_id)
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('user_id')
        .in('user_id', userIds)
      const subSet = new Set((subs ?? []).map((s: { user_id: string }) => s.user_id))

      // Respect 20-hour cooldown per user for this rule
      const cutoff = new Date(Date.now() - 20 * 3600 * 1000).toISOString()
      const { data: recentCooldowns } = await supabase
        .from('push_cooldowns')
        .select('user_id')
        .eq('rule_id', 'streak_nudge')
        .gte('sent_at', cutoff)
        .in('user_id', userIds)
      const cooledSet = new Set((recentCooldowns ?? []).map((c: { user_id: string }) => c.user_id))

      return (rows as { user_id: string; current_streak: number }[])
        .filter(r => subSet.has(r.user_id) && !cooledSet.has(r.user_id))
    }) as { user_id: string; current_streak: number }[]

    if (!atRisk.length) return { sent: 0 }

    // Cap at 500 per run
    const batch = atRisk.slice(0, 500)

    const sent = await step.run('send-streak-nudges', async () => {
      let count = 0
      for (const r of batch) {
        const n = await notifyUser(supabase, r.user_id, {
          title: `Don't break your ${r.current_streak}-day streak`,
          body:  'Log a study session, check your tasks, or mark attendance — anything counts. Keep the chain alive.',
          url:   '/dashboard',
          tag:   'streak-nudge',
        })
        if (n > 0) {
          await supabase.from('push_cooldowns').upsert(
            { user_id: r.user_id, rule_id: 'streak_nudge', sent_at: new Date().toISOString() },
            { onConflict: 'user_id,rule_id' }
          )
          count++
        }
      }
      return count
    })

    logger.info(`Streak nudge: ${sent} sent`)
    return { sent }
  },
)

// ─── Sunday Planner Reminder ───────────────────────────────────────────────────
// Fires every Sunday at 19:00 SAST.
// Sends a push to students who have NOT created a weekly plan for the upcoming week.
export const sundayPlannerReminder = inngest.createFunction(
  { id: 'sunday-planner-reminder', name: 'Sunday Planning Reminder', retries: 2 },
  { cron: 'TZ=Africa/Johannesburg 0 19 * * 0' },
  async ({ step, logger }: FnCtx) => {
    if (!canSendPush()) { logger.warn('VAPID not configured'); return { sent: 0 } }
    const supabase = createAdminSupabaseClient()

    const toRemind = await step.run('find-unplanned-students', async () => {
      // Next Monday's date (start of the upcoming week)
      const now = new Date()
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7
      const nextMonday = new Date(now)
      nextMonday.setDate(now.getDate() + daysUntilMonday)
      const weekStart = nextMonday.toISOString().slice(0, 10)

      // Students who HAVE a weekly plan for this upcoming week
      const { data: planned } = await supabase
        .from('weekly_plans')
        .select('user_id')
        .eq('week_start', weekStart)
      const plannedSet = new Set((planned ?? []).map((p: { user_id: string }) => p.user_id))

      // All students with push subscriptions
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('user_id')
      const allSubUsers = (subs ?? []).map((s: { user_id: string }) => s.user_id)

      // Respect 6-day cooldown (don't re-remind if already sent this week)
      const cutoff = new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString()
      const { data: recentCooldowns } = await supabase
        .from('push_cooldowns')
        .select('user_id')
        .eq('rule_id', 'sunday_planner')
        .gte('sent_at', cutoff)
        .in('user_id', allSubUsers)
      const cooledSet = new Set((recentCooldowns ?? []).map((c: { user_id: string }) => c.user_id))

      return allSubUsers.filter((uid: string) => !plannedSet.has(uid) && !cooledSet.has(uid))
    }) as string[]

    if (!toRemind.length) return { sent: 0 }

    const batch = toRemind.slice(0, 500)

    const sent = await step.run('send-sunday-reminders', async () => {
      let count = 0
      for (const userId of batch) {
        const n = await notifyUser(supabase, userId, {
          title: 'Plan your week before it plans you',
          body:  '5 minutes of Sunday planning saves 5 hours of chaos. Set your priorities for the week now.',
          url:   '/study?tab=sunday',
          tag:   'sunday-planner',
        })
        if (n > 0) {
          await supabase.from('push_cooldowns').upsert(
            { user_id: userId, rule_id: 'sunday_planner', sent_at: new Date().toISOString() },
            { onConflict: 'user_id,rule_id' }
          )
          count++
        }
      }
      return count
    })

    logger.info(`Sunday planner reminder: ${sent} sent`)
    return { sent }
  },
)
