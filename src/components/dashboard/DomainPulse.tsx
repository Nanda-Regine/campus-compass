'use client'

import Link from 'next/link'

type Health = 'critical' | 'warning' | 'watch' | 'safe'

export interface DomainPulseProps {
  overdueTasks:    number
  nextExamDays:    number | null
  streakDays:      number
  streakTodayDone: boolean
  todayStudyMins:  number
  studyVelocity:   number
  lastSleepHours:  number | null
  sleepDebt:       number
  weekWorkouts:    number
  totalBudget:     number
  remaining:       number
  shiftEarnings:   number
  nsfasDelayed:    boolean
  mealPlanExists:  boolean
  shiftsThisWeek:  number
  activeGroups:    number
  hour:            number
}

interface ScoredDomain {
  name:        string
  emoji:       string
  color:       string
  urgency:     number
  health:      Health
  headline:    string
  subline:     string
  actionLabel: string
  actionHref:  string
}

const HEALTH_STYLE: Record<Health, { accent: string; bg: string; border: string; badge: string }> = {
  critical: { accent: '#ff6b6b', bg: 'rgba(255,107,107,0.07)', border: 'rgba(255,107,107,0.22)', badge: 'rgba(255,107,107,0.15)' },
  warning:  { accent: '#c9a84c', bg: 'rgba(201,168,76,0.06)',  border: 'rgba(201,168,76,0.20)',  badge: 'rgba(201,168,76,0.14)'  },
  watch:    { accent: '#7090d0', bg: 'rgba(112,144,208,0.05)', border: 'rgba(112,144,208,0.18)', badge: 'rgba(112,144,208,0.12)' },
  safe:     { accent: '#4ecf9e', bg: 'rgba(78,207,158,0.04)',  border: 'rgba(78,207,158,0.15)',  badge: 'rgba(78,207,158,0.10)'  },
}

const HEALTH_LABEL: Record<Health, string> = {
  critical: 'Needs attention',
  warning:  'Check in',
  watch:    'Monitor',
  safe:     'On track',
}

function healthFrom(u: number): Health {
  if (u >= 70) return 'critical'
  if (u >= 45) return 'warning'
  if (u >= 20) return 'watch'
  return 'safe'
}

function computeDomains(p: DomainPulseProps): ScoredDomain[] {
  const budgetPct = p.totalBudget > 0 ? (p.remaining / p.totalBudget) * 100 : 100

  // ── Mind ─────────────────────────────────────────────────────────
  let mindU = 0
  let mindH = '', mindS = '', mindAL = 'Open study tools', mindAH = '/study'

  if (p.overdueTasks >= 3) {
    mindU += 55; mindH = `${p.overdueTasks} tasks overdue`; mindAL = 'Clear tasks'
  } else if (p.overdueTasks > 0) {
    mindU += 38; mindH = `${p.overdueTasks} task${p.overdueTasks > 1 ? 's' : ''} overdue`; mindAL = 'Start studying'
  }

  if (p.nextExamDays !== null) {
    if (p.nextExamDays <= 2) {
      mindU += 45
      const msg = p.nextExamDays === 0 ? 'Exam is TODAY' : `Exam in ${p.nextExamDays}d — crunch time`
      if (!mindH) mindH = msg; else mindS = msg
      mindAL = 'Study now'; mindAH = '/study?tab=timer'
    } else if (p.nextExamDays <= 7) {
      mindU += 28
      const msg = `Exam in ${p.nextExamDays} days`
      if (!mindH) mindH = msg; else mindS = msg
      mindAL = 'Review flashcards'; mindAH = '/study?tab=flashcards'
    } else if (p.nextExamDays <= 14) {
      mindU += 12
      if (!mindH) mindH = `Exam in ${p.nextExamDays} days`
    }
  }

  if (!mindH && p.streakDays > 0 && !p.streakTodayDone && p.hour >= 17) {
    mindU += 22; mindH = `${p.streakDays}-day streak at risk`
    mindS = 'No study session yet today'; mindAL = 'Log a session'; mindAH = '/study?tab=timer'
  } else if (!mindH && p.todayStudyMins === 0 && p.hour >= 14) {
    mindU += 12; mindH = 'No study logged today'
    mindS = 'Even 25 min builds momentum'; mindAL = 'Start a session'; mindAH = '/study?tab=timer'
  } else if (!mindH) {
    if (p.streakDays > 0) {
      mindH = `${p.streakDays}-day streak 🔥`
      mindS = p.streakTodayDone ? 'Session logged today ✓' : 'Log a session to keep it'
    } else if (p.todayStudyMins > 0) {
      mindH = `${p.todayStudyMins}min studied today`; mindS = 'Keep it up'
    } else {
      mindH = 'All clear'; mindS = 'No urgent study flags'
    }
  }

  // ── Money ────────────────────────────────────────────────────────
  let moneyU = 0
  let moneyH = '', moneyS = '', moneyAL = 'Open budget', moneyAH = '/budget'
  const earnedLabel = p.shiftEarnings > 0 ? ` · ⚡ R${Math.round(p.shiftEarnings)} earned` : ''

  if (p.totalBudget <= 0) {
    moneyU = 12; moneyH = 'No budget set'; moneyS = 'Set a budget to track spending'; moneyAL = 'Set budget'
  } else if (p.remaining < 0) {
    moneyU = 82; moneyH = 'Over budget'; moneyS = `R${Math.abs(Math.round(p.remaining))} overspent${earnedLabel}`; moneyAL = 'Review expenses'
  } else if (p.remaining < 100) {
    moneyU = 68; moneyH = `R${Math.round(p.remaining)} left`; moneyS = `Nearly out — plan carefully${earnedLabel}`; moneyAL = 'View budget'
  } else if (budgetPct < 20) {
    moneyU = 48; moneyH = `${Math.round(budgetPct)}% budget remaining`; moneyS = `Running low${earnedLabel}`
  } else if (budgetPct < 40) {
    moneyU = 25; moneyH = `R${Math.round(p.remaining)} remaining`; moneyS = `${Math.round(budgetPct)}% of budget left${earnedLabel}`
  } else {
    moneyH = `R${Math.round(p.remaining)} remaining`
    moneyS = p.shiftEarnings > 0 ? `Budget on track ✓${earnedLabel}` : 'Budget on track ✓'
  }
  if (p.nsfasDelayed) { moneyU += 32; moneyS = `NSFAS payment delayed${earnedLabel}`; moneyAL = 'Check NSFAS'; moneyAH = '/budget?tab=nsfas' }

  // ── Body ─────────────────────────────────────────────────────────
  let bodyU = 0
  let bodyH = '', bodyS = '', bodyAL = 'Log sleep', bodyAH = '/sleep'

  if (p.lastSleepHours !== null) {
    if (p.lastSleepHours < 5) {
      bodyU += 52; bodyH = `Only ${p.lastSleepHours}h sleep`; bodyS = 'Severely sleep-deprived — rest first'
    } else if (p.lastSleepHours < 7) {
      bodyU += 28; bodyH = `${p.lastSleepHours}h sleep last night`; bodyS = 'Below optimal'
    } else {
      bodyH = `${p.lastSleepHours}h sleep ✓`; bodyS = 'Well rested'
    }
  } else {
    bodyU += 10; bodyH = 'Sleep not logged'; bodyS = 'Track sleep for recovery insights'
  }
  if (p.sleepDebt > 5) bodyU += 22
  if (p.weekWorkouts === 0) {
    bodyU += 14; if (!bodyS || bodyS === 'Well rested' || bodyS === 'Below optimal') bodyS = 'No workouts this week'
    bodyAL = 'Log workout'; bodyAH = '/fitness'
  } else {
    bodyAL = 'View fitness'; bodyAH = '/fitness'
  }

  // ── Static low-urgency domains (no live data yet) ─────────────
  const movementU = p.weekWorkouts === 0 ? 16 : 5
  const communityU = p.activeGroups === 0 ? 13 : 5
  const workU = p.shiftsThisWeek > 0 ? 10 : 4

  const domains: ScoredDomain[] = [
    {
      name: 'Mind', emoji: '🧠', color: '#00CFA0',
      urgency: Math.min(100, mindU), health: healthFrom(Math.min(100, mindU)),
      headline: mindH, subline: mindS, actionLabel: mindAL, actionHref: mindAH,
    },
    {
      name: 'Money', emoji: '💰', color: '#D4A84B',
      urgency: Math.min(100, moneyU), health: healthFrom(Math.min(100, moneyU)),
      headline: moneyH, subline: moneyS, actionLabel: moneyAL, actionHref: moneyAH,
    },
    {
      name: 'Body', emoji: '🌿', color: '#FF6B9E',
      urgency: Math.min(100, bodyU), health: healthFrom(Math.min(100, bodyU)),
      headline: bodyH, subline: bodyS, actionLabel: bodyAL, actionHref: bodyAH,
    },
    {
      name: 'Safety', emoji: '🛡️', color: '#10B981',
      urgency: 5, health: 'safe',
      headline: 'Know your rights', subline: 'Legal + campus safety guides',
      actionLabel: 'View guides', actionHref: '/safety',
    },
    {
      name: 'Movement', emoji: '🚌', color: '#38BDF8',
      urgency: movementU, health: healthFrom(movementU),
      headline: p.weekWorkouts >= 3 ? `${p.weekWorkouts} workouts this week 🏃` : p.weekWorkouts > 0 ? `${p.weekWorkouts} workout this week` : 'No workouts logged',
      subline: p.weekWorkouts >= 3 ? 'Active ✓' : p.weekWorkouts > 0 ? 'Keep it up' : 'Move your body today',
      actionLabel: 'Open fitness', actionHref: '/fitness',
    },
    {
      name: 'Growth', emoji: '📈', color: '#818CF8',
      urgency: 8, health: 'safe',
      headline: 'Skills & goals', subline: 'Track your personal growth',
      actionLabel: 'View growth', actionHref: '/growth',
    },
    {
      name: 'Community', emoji: '🌍', color: '#A855F7',
      urgency: communityU, health: healthFrom(communityU),
      headline: p.activeGroups > 0 ? `${p.activeGroups} active group${p.activeGroups > 1 ? 's' : ''}` : 'No study groups yet',
      subline: p.activeGroups > 0 ? 'Connected to your community' : 'Find your study crew',
      actionLabel: p.activeGroups > 0 ? 'Open groups' : 'Find a group', actionHref: '/study-groups',
    },
    {
      name: 'Work', emoji: '💼', color: '#7090D0',
      urgency: workU, health: 'safe',
      headline: p.shiftsThisWeek > 0 ? `${p.shiftsThisWeek} shift${p.shiftsThisWeek > 1 ? 's' : ''} this week` : 'No shifts scheduled',
      subline: p.shiftsThisWeek > 0 ? 'Scheduled ahead ✓' : 'Browse SA student jobs',
      actionLabel: p.shiftsThisWeek > 0 ? 'View shifts' : 'Browse jobs', actionHref: '/dashboard/work',
    },
    {
      name: 'Future', emoji: '✨', color: '#9b6fd4',
      urgency: 5, health: 'safe',
      headline: 'Career & mentors', subline: 'Build your future today',
      actionLabel: 'Explore career', actionHref: '/career',
    },
  ]

  return domains.sort((a, b) => b.urgency - a.urgency)
}

export default function DomainPulse(props: DomainPulseProps) {
  const sorted      = computeDomains(props)
  const topDomains  = sorted.slice(0, 3)
  const restDomains = sorted.slice(3)

  return (
    <section>
      <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 12 }}>
        ◈ Life OS · Focus Now
      </div>

      {/* Top 3 — pulse cards ranked by urgency */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {topDomains.map(d => {
          const hs = HEALTH_STYLE[d.health]
          return (
            <div
              key={d.name}
              style={{
                borderRadius: 14,
                background: hs.bg,
                border: `0.5px solid ${hs.border}`,
                padding: '13px 15px 13px 18px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Left accent bar */}
              <span style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 2.5, borderRadius: '0 2px 2px 0', background: hs.accent }} />

              {/* Ambient glow */}
              <span style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${d.color}18 0%, transparent 70%)`, pointerEvents: 'none' }} />

              {/* Header: emoji + name + health badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                <span style={{ fontSize: 16 }}>{d.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: d.color, textTransform: 'uppercase', letterSpacing: '0.10em' }}>
                  {d.name}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: hs.badge, color: hs.accent, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  {HEALTH_LABEL[d.health]}
                </span>
              </div>

              {/* Headline */}
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.88)', lineHeight: 1.35, marginBottom: d.subline ? 3 : 10 }}>
                {d.headline}
              </div>

              {/* Subline */}
              {d.subline && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', lineHeight: 1.4, marginBottom: 10 }}>
                  {d.subline}
                </div>
              )}

              {/* Action */}
              <Link href={d.actionHref} style={{ textDecoration: 'none' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: hs.accent, letterSpacing: '0.04em' }}>
                  {d.actionLabel} <span style={{ fontSize: 13, lineHeight: 1 }}>→</span>
                </span>
              </Link>
            </div>
          )
        })}
      </div>

      {/* Remaining 6 — compact 3×2 nav grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 10 }}>
        {restDomains.map(d => (
          <Link key={d.name} href={d.actionHref} style={{ textDecoration: 'none' }}>
            <div style={{
              borderRadius: 10,
              background: `${d.color}09`,
              border: `0.5px solid ${d.color}28`,
              padding: '8px 10px',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 14 }}>{d.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: d.color, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                {d.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
