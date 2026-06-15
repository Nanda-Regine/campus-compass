// ============================================================
// VarsityOS — Rules Engine (Orchestration Layer)
// Evaluates StudentState against the rule set and queues
// interventions. Runs on every StudentState recompute.
//
// Urgency → UI variant mapping:
//   5 → modal   (full-screen, must acknowledge — crisis only)
//   4 → banner  (sticky top-of-page, high priority)
//   3 → banner  (inline dashboard card)
//   2 → nudge   (subtle inline hint)
//   1 → chip    (small positive reinforcement tag)
// ============================================================

import {
  useStudentState,
  type Intervention,
  type InterventionUrgency,
  type InterventionVariant,
} from '@/store/studentState'
import type {
  AcademicSlice,
  FinancialSlice,
  WellnessSlice,
  ScheduleSlice,
} from '@/store/studentState'

// ─── Rule definition ──────────────────────────────────────────

interface RuleSnapshot {
  academic:  AcademicSlice
  financial: FinancialSlice
  wellness:  WellnessSlice
  schedule:  ScheduleSlice
}

interface Rule {
  id:           string
  urgency:      InterventionUrgency
  variant:      InterventionVariant
  cooldownMins: number
  test:         (s: RuleSnapshot) => boolean
  build:        (s: RuleSnapshot) => Omit<Intervention, 'id' | 'ruleId' | 'urgency' | 'variant' | 'createdAt'>
}

// ─── Cooldown helpers (localStorage, survives page reloads) ───

const COOLDOWN_KEY = 'varsityos-rule-cooldowns'

function getCooldowns(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(COOLDOWN_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function markCooldown(ruleId: string, cooldownMins: number): void {
  if (typeof window === 'undefined') return
  const all   = getCooldowns()
  const until = new Date(Date.now() + cooldownMins * 60_000).toISOString()
  all[ruleId] = until
  try { localStorage.setItem(COOLDOWN_KEY, JSON.stringify(all)) } catch { /* quota full */ }
}

function isOnCooldown(ruleId: string): boolean {
  const until = getCooldowns()[ruleId]
  if (!until) return false
  return new Date(until).getTime() > Date.now()
}

// ─── The rule set ─────────────────────────────────────────────
// Ordered by urgency descending — higher-priority rules are
// evaluated first so the queue is always sorted correctly.

const RULES: Rule[] = [
  // ── URGENCY 5 — CRISIS: full-screen modal ─────────────────

  // ⚡ CROSS-DOMAIN: mind + money + body all failing simultaneously
  {
    id:           'compound_crisis',
    urgency:      5,
    variant:      'modal',
    cooldownMins: 6 * 60,
    test: ({ academic, financial, wellness }) =>
      wellness.burnoutScore > 60 &&
      academic.examPressure >= 65 &&
      (financial.runwayDays < 14 || financial.emergencyMode),
    build: ({ academic, financial, wellness }) => ({
      title:       'Mind, money, and body under pressure at once',
      message:     `Burnout ${wellness.burnoutScore}/100. Exam pressure ${academic.examPressure}/100. ${financial.runwayDays < 14 ? `${financial.runwayDays} days of money left.` : 'Budget tight.'} This compound stress is the #1 reason students drop out. Let Nova help you triage right now.`,
      actionLabel: 'Open triage with Nova',
      actionRoute: '/nova?prompt=i-need-help-with-everything',
    }),
  },

  {
    id:           'academic_exclusion_risk',
    urgency:      5,
    variant:      'modal',
    cooldownMins: 24 * 60,  // once per day max
    test: ({ academic }) =>
      academic.riskLevel === 'critical' && academic.examPressure >= 80,
    build: ({ academic }) => ({
      title:       'Academic exclusion risk detected',
      message:     `You have ${academic.catchUpDebtHrs}h of catch-up work and an exam is approaching. Let Nova build you a recovery plan right now.`,
      actionLabel: 'Open catch-up planner',
      actionRoute: '/study?tab=exams&catchup=true',
    }),
  },

  {
    id:           'financial_runway_critical',
    urgency:      5,
    variant:      'modal',
    cooldownMins: 12 * 60,
    test: ({ financial }) =>
      financial.emergencyMode || financial.runwayDays < 5,
    build: ({ financial }) => ({
      title:       'Money runs out in less than 5 days',
      message:     `At your current pace you have ${financial.runwayDays} days of budget left. Switch to emergency mode and stretch what you have.`,
      actionLabel: 'Open budget emergency mode',
      actionRoute: '/budget?mode=emergency',
    }),
  },

  // ── URGENCY 4 — HIGH: sticky banner ──────────────────────

  // Grade below pass mark — failing a module delays graduation + threatens NSFAS funding
  {
    id:           'grade_below_pass',
    urgency:      4,
    variant:      'banner',
    cooldownMins: 24 * 60,
    test: ({ academic }) => academic.lowestGrade > 0 && academic.lowestGrade < 50,
    build: ({ academic }) => ({
      title:       `Module grade ${academic.lowestGrade}% — below pass mark`,
      message:     `One of your modules is sitting at ${academic.lowestGrade}%. Failing delays graduation and can affect NSFAS funding. Build a targeted study plan now.`,
      actionLabel: 'Open catch-up planner',
      actionRoute: '/study?tab=exams&catchup=true',
    }),
  },

  // ⚡ CROSS-DOMAIN: work hours colliding with exam window
  {
    id:           'work_exam_collision',
    urgency:      4,
    variant:      'banner',
    cooldownMins: 8 * 60,
    test: ({ academic, wellness }) =>
      wellness.workHoursThisWeek >= 20 && academic.examPressure >= 65,
    build: ({ academic, wellness }) => ({
      title:       `${wellness.workHoursThisWeek}h of work this week — exam is approaching`,
      message:     `Exam pressure at ${academic.examPressure}/100. Working ${wellness.workHoursThisWeek}h leaves too little recovery time. Protect the 48h before your exam — no new shifts.`,
      actionLabel: 'Review your week',
      actionRoute: '/dashboard/work',
    }),
  },

  // ⚡ CROSS-DOMAIN: burnout + sleep debt + exam = dangerous zone
  {
    id:           'burnout_exam_trap',
    urgency:      4,
    variant:      'banner',
    cooldownMins: 10 * 60,
    test: ({ academic, wellness }) =>
      wellness.burnoutScore > 55 && academic.examPressure >= 65 && wellness.sleepDebt >= 5,
    build: ({ academic, wellness }) => ({
      title:       'Burnout + sleep debt + exam = high-risk zone',
      message:     `Burnout ${wellness.burnoutScore}/100, ${wellness.sleepDebt.toFixed(0)}h sleep deficit, exam pressure ${academic.examPressure}/100. Sleep is now your most important revision tool.`,
      actionLabel: 'Build recovery plan',
      actionRoute: '/study?tab=wellness',
    }),
  },

  // ⚡ CROSS-DOMAIN: mood declining while under academic + work pressure
  {
    id:           'mood_cascade_risk',
    urgency:      4,
    variant:      'banner',
    cooldownMins: 12 * 60,
    test: ({ academic, wellness }) =>
      wellness.moodTrend === 'declining' &&
      wellness.moodAvg > 0 && wellness.moodAvg < 2.8 &&
      (wellness.burnoutScore > 40 || academic.riskLevel === 'warning' || academic.riskLevel === 'critical'),
    build: ({ wellness }) => ({
      title:       'Your mood is dropping under pressure',
      message:     `Mood average ${wellness.moodAvg.toFixed(1)}/5 and falling. When burnout and academic pressure combine with low mood, it compounds fast. Reach out — SADAG 0800 456 789.`,
      actionLabel: 'Talk to Nova',
      actionRoute: '/nova?prompt=i-am-struggling-emotionally',
    }),
  },

  {
    id:           'exam_crunch_unprepared',
    urgency:      4,
    variant:      'banner',
    cooldownMins: 8 * 60,
    test: ({ academic }) =>
      academic.examPressure >= 65 && academic.completionRate < 50,
    build: ({ academic }) => {
      const daysWord = academic.examPressure >= 85 ? 'within a week' : 'within 2 weeks'
      return {
        title:       `Exam ${daysWord} — task completion at ${academic.completionRate}%`,
        message:     `You have incomplete work for modules with upcoming exams. Rebuild your study schedule now.`,
        actionLabel: 'Adjust schedule',
        actionRoute: '/study?tab=exams',
      }
    },
  },

  {
    id:           'burnout_overload',
    urgency:      4,
    variant:      'banner',
    cooldownMins: 12 * 60,
    test: ({ wellness, schedule }) =>
      wellness.burnoutScore > 75 && schedule.planCoverage > 80,
    build: ({ wellness }) => ({
      title:       'You are heading for burnout',
      message:     `Your burnout score is ${wellness.burnoutScore}/100. Your plan is full but you're falling behind. Time to rest and rebalance.`,
      actionLabel: 'Rest and rebalance',
      actionRoute: '/study?tab=wellness',
    }),
  },

  {
    id:           'mood_very_low',
    urgency:      4,
    variant:      'banner',
    cooldownMins: 12 * 60,
    test: ({ wellness }) =>
      wellness.moodAvg > 0 && wellness.moodAvg < 1.8,
    build: () => ({
      title:       'You are not okay — and that is valid',
      message:     "Your mood scores show you're really struggling. VarsityOS cares. Reach out to SADAG (0800 456 789) or chat to Nova right now.",
      actionLabel: 'Talk to Nova',
      actionRoute: '/nova?prompt=i-am-struggling',
    }),
  },

  // ── URGENCY 3 — MEDIUM: inline dashboard banner ──────────

  // ⚡ CROSS-DOMAIN: financial crisis draining academic focus
  {
    id:           'money_stress_academic_drain',
    urgency:      3,
    variant:      'banner',
    cooldownMins: 8 * 60,
    test: ({ academic, financial }) =>
      (financial.emergencyMode || financial.runwayDays < 7) &&
      academic.riskLevel !== 'safe',
    build: ({ academic, financial }) => ({
      title:       'Money stress is affecting your studies',
      message:     `${financial.runwayDays < 7 ? `${financial.runwayDays} days of budget left` : 'Budget in emergency'}. Your academic risk is ${academic.riskLevel}. Financial anxiety drains the cognitive bandwidth you need to study.`,
      actionLabel: 'Emergency budget mode',
      actionRoute: '/budget?mode=emergency',
    }),
  },

  {
    id:           'academic_warning',
    urgency:      3,
    variant:      'banner',
    cooldownMins: 6 * 60,
    test: ({ academic }) => academic.riskLevel === 'warning',
    build: ({ academic }) => {
      const warningModules = Object.values(academic.moduleRisks).filter(r => r === 'warning' || r === 'critical').length
      return {
        title:       `${warningModules} module${warningModules > 1 ? 's' : ''} at risk`,
        message:     'You have overdue work building up. Address it now before it becomes unmanageable.',
        actionLabel: 'Review modules',
        actionRoute: '/study?tab=modules',
      }
    },
  },

  {
    id:           'overdue_tasks_piling',
    urgency:      3,
    variant:      'banner',
    cooldownMins: 4 * 60,
    test: ({ academic }) => academic.catchUpDebtHrs >= 6,
    build: ({ academic }) => ({
      title:       `${academic.catchUpDebtHrs}h of catch-up work overdue`,
      message:     'Your overdue tasks are piling up. Clear the backlog before new work arrives.',
      actionLabel: 'See overdue tasks',
      actionRoute: '/study?tab=tasks&filter=overdue',
    }),
  },

  {
    id:           'procrastination_pattern',
    urgency:      3,
    variant:      'banner',
    cooldownMins: 6 * 60,
    test: ({ schedule }) => schedule.procrastIndex > 70,
    build: ({ schedule }) => ({
      title:       `${schedule.procrastIndex}% of your due tasks are overdue`,
      message:     "You've been pushing tasks back. Let's rebuild your plan with what's actually achievable.",
      actionLabel: 'Rebuild plan',
      actionRoute: '/study?tab=tasks',
    }),
  },

  {
    id:           'nsfas_delayed',
    urgency:      3,
    variant:      'banner',
    cooldownMins: 24 * 60,
    test: ({ financial }) =>
      financial.nsfasStatus === 'delayed' && financial.runwayDays < 14,
    build: ({ financial }) => ({
      title:       'NSFAS payment delayed — runway under 2 weeks',
      message:     `You have ${financial.runwayDays} days of money left. Activate emergency budget mode and follow the NSFAS appeal steps.`,
      actionLabel: 'Emergency budget + NSFAS steps',
      actionRoute: '/budget?tab=nsfas',
    }),
  },

  {
    id:           'recovery_needed',
    urgency:      3,
    variant:      'nudge',
    cooldownMins: 8 * 60,
    test: ({ wellness }) =>
      wellness.recoveryNeeded && wellness.burnoutScore > 60 && wellness.burnoutScore <= 75,
    build: ({ wellness }) => ({
      title:       'Recovery time recommended',
      message:     `Burnout score: ${wellness.burnoutScore}/100. Build one rest block into today's plan.`,
      actionLabel: 'Schedule rest',
      actionRoute: '/study?tab=wellness',
    }),
  },

  {
    id:           'sleep_debt_critical',
    urgency:      3,
    variant:      'banner',
    cooldownMins: 24 * 60,
    test: ({ wellness }) => wellness.sleepDebt >= 10,
    build: ({ wellness }) => ({
      title:       `${wellness.sleepDebt.toFixed(0)}h sleep debt this week`,
      message:     'You are carrying serious sleep debt. Cognitive performance drops 40% after 10h deficit. Build in one proper sleep before exams.',
      actionLabel: 'Sleep science guide',
      actionRoute: '/sleep',
    }),
  },

  {
    id:           'mood_sustained_low',
    urgency:      3,
    variant:      'banner',
    cooldownMins: 24 * 60,
    test: ({ wellness }) =>
      wellness.moodTrend === 'declining' && wellness.moodAvg > 0 && wellness.moodAvg < 2.5,
    build: ({ wellness }) => ({
      title:       'Your mood has been low for several days',
      message:     `Average mood: ${wellness.moodAvg.toFixed(1)}/5 and declining. Talk to Nova, rest, or reach out to someone you trust.`,
      actionLabel: 'Open Wellness',
      actionRoute: '/health',
    }),
  },

  {
    id:           'streak_at_risk',
    urgency:      3,
    variant:      'banner',
    cooldownMins: 4 * 60,
    test: ({ schedule }) => {
      const hour = new Date().getHours()
      return hour >= 18 && schedule.streakDays > 0 && !schedule.streakTodayDone
    },
    build: ({ schedule }) => ({
      title:       `${schedule.streakDays}-day streak at risk`,
      message:     `You haven't studied today and it's after 6pm. Log a quick session now to keep your streak alive.`,
      actionLabel: 'Start a study session',
      actionRoute: '/study?tab=timer',
    }),
  },

  // ── URGENCY 2 — LOW: subtle nudge ────────────────────────

  // ⚡ CROSS-DOMAIN: movement as nervous system reset
  {
    id:           'movement_recovery_nudge',
    urgency:      2,
    variant:      'nudge',
    cooldownMins: 24 * 60,
    test: ({ wellness }) =>
      wellness.moodAvg > 0 && wellness.moodAvg < 2.8 && wellness.burnoutScore > 35,
    build: () => ({
      title:       'Movement resets your nervous system',
      message:     'When burnout and low mood combine, movement is the fastest reset — even 20 minutes changes your neurochemistry. No gym required.',
      actionLabel: 'Log a workout',
      actionRoute: '/fitness',
    }),
  },

  {
    id:           'no_plan_for_today',
    urgency:      2,
    variant:      'nudge',
    cooldownMins: 4 * 60,
    test: ({ schedule }) => {
      const hour = new Date().getHours()
      return hour < 13 && schedule.todayPlan.length === 0 && schedule.procrastIndex < 30
    },
    build: () => ({
      title:       'No plan for today yet',
      message:     "It's still morning. Ask Nova to build your day in 30 seconds.",
      actionLabel: "Build today's plan",
      actionRoute: '/nova?prompt=build-day-plan',
    }),
  },

  {
    id:           'budget_pace_warning',
    urgency:      2,
    variant:      'nudge',
    cooldownMins: 6 * 60,
    test: ({ financial }) =>
      !financial.emergencyMode &&
      financial.spendingTrend === 'over' &&
      financial.healthScore < 50,
    build: ({ financial }) => ({
      title:       'Spending faster than expected',
      message:     `Budget health: ${financial.healthScore}/100. You're ${100 - financial.healthScore}pts ahead of your expected spend pace.`,
      actionLabel: 'Review spending',
      actionRoute: '/budget',
    }),
  },

  {
    id:           'sleep_debt_watch',
    urgency:      2,
    variant:      'nudge',
    cooldownMins: 12 * 60,
    test: ({ wellness }) => wellness.sleepDebt >= 5 && wellness.sleepDebt < 10,
    build: ({ wellness }) => ({
      title:       `${wellness.sleepDebt.toFixed(0)}h sleep deficit — keep an eye on it`,
      message:     'You are a bit behind on sleep. Try to be in bed 30 minutes earlier tonight.',
      actionLabel: 'Sleep tracker',
      actionRoute: '/sleep',
    }),
  },

  {
    id:           'low_study_velocity',
    urgency:      2,
    variant:      'nudge',
    cooldownMins: 12 * 60,
    test: ({ academic }) =>
      academic.studyVelocity < 0.5 && academic.examPressure >= 35,
    build: ({ academic }) => ({
      title:       'Low study pace — exam pressure is building',
      message:     `You are averaging less than 30 min/day of focused study. With exam pressure at ${academic.examPressure}/100, consistency now prevents a crunch later.`,
      actionLabel: 'Start a study session',
      actionRoute: '/study?tab=timer',
    }),
  },

  {
    id:           'no_study_today',
    urgency:      2,
    variant:      'nudge',
    cooldownMins: 7 * 60,
    test: ({ academic, schedule }) => {
      const hour = new Date().getHours()
      return hour >= 10 && academic.studyVelocity < 0.2 && !schedule.streakTodayDone
    },
    build: () => ({
      title:       'No study logged today',
      message:     'Even 25 minutes of focused work compounds over time. Open a study session now — you can do this.',
      actionLabel: 'Start studying',
      actionRoute: '/study?tab=timer',
    }),
  },

  // ── URGENCY 1 — POSITIVE: reinforcement chip ─────────────

  {
    id:           'good_momentum',
    urgency:      1,
    variant:      'chip',
    cooldownMins: 2 * 60,
    test: ({ academic, schedule }) =>
      academic.completionRate > 80 &&
      academic.riskLevel === 'safe' &&
      schedule.procrastIndex < 20,
    build: ({ academic }) => ({
      title:       'Great week so far',
      message:     `${academic.completionRate}% completion rate — you're on track. Keep the momentum going.`,
      actionLabel: 'Keep going',
      actionRoute: '/study',
    }),
  },

  // ── PHASE 12: Regulation + Cycle Intelligence ─────────────────

  // NS score critically low — override everything
  {
    id:           'ns_score_critical',
    urgency:      4,
    variant:      'banner',
    cooldownMins: 4 * 60,
    test: ({ wellness }) => wellness.nsScore !== null && wellness.nsScore < 30,
    build: ({ wellness }) => ({
      title:       'Your nervous system is depleted',
      message:     `NS score ${wellness.nsScore}/100. At this level your brain physically cannot consolidate new information. One regulation session before you open a textbook will double your study effectiveness.`,
      actionLabel: 'Regulate now',
      actionRoute: '/regulate',
    }),
  },

  // Burnout + exam pressure — regulation is the lever
  {
    id:           'exam_week_regulate',
    urgency:      4,
    variant:      'banner',
    cooldownMins: 6 * 60,
    test: ({ academic, wellness }) =>
      wellness.burnoutScore > 65 &&
      academic.examPressure >= 65 &&
      wellness.regulationSessionsToday === 0,
    build: ({ academic, wellness }) => ({
      title:       'Exam pressure + high burnout = study amnesia risk',
      message:     `Burnout ${wellness.burnoutScore}/100 with exams ${academic.examPressure >= 100 ? 'this week' : 'coming up'}. Science shows 4 minutes of box breathing before study increases retention by up to 23%. It takes less time than scrolling.`,
      actionLabel: 'Box breathing now',
      actionRoute: '/regulate',
    }),
  },

  // Suggest regulation when burnout is high but no session yet today.
  // Guard excludes the exam_week_regulate scenario (urgency 4) to prevent both rules
  // queuing a "go regulate" banner simultaneously.
  {
    id:           'suggest_regulation',
    urgency:      3,
    variant:      'banner',
    cooldownMins: 4 * 60,
    test: ({ wellness, academic }) =>
      wellness.burnoutScore > 55 &&
      wellness.regulationSessionsToday === 0 &&
      !(wellness.burnoutScore > 65 && academic.examPressure >= 65),
    build: ({ wellness }) => ({
      title:       'High stress detected — 4 minutes can shift this',
      message:     `Your stress indicators are elevated (burnout ${wellness.burnoutScore}/100). A single physiological sigh — double inhale, long exhale — is the fastest anxiety reducer known to science. No app needed, but we'll guide you.`,
      actionLabel: 'Start regulation',
      actionRoute: '/regulate',
    }),
  },

  // Cycle phase: menstrual/luteal + low energy → study strategy tip
  {
    id:           'cycle_low_energy_adapt',
    urgency:      2,
    variant:      'nudge',
    cooldownMins: 12 * 60,
    test: ({ wellness }) =>
      (wellness.cyclePhase === 'menstrual' || wellness.cyclePhase === 'luteal') &&
      wellness.cycleEnergyLevel !== null &&
      wellness.cycleEnergyLevel <= 2,
    build: ({ wellness }) => ({
      title:       `${wellness.cyclePhase === 'menstrual' ? 'Menstrual' : 'Luteal'} phase — work WITH your body`,
      message:     'Your energy is low right now — that\'s biology, not weakness. Review existing notes rather than tackling new material. Short sessions with breaks outperform long pushes in this phase.',
      actionLabel: 'See phase tips',
      actionRoute: '/health/cycle',
    }),
  },

  // Regulation reward — positive reinforcement
  {
    id:           'regulation_reward',
    urgency:      1,
    variant:      'chip',
    cooldownMins: 24 * 60,
    test: ({ wellness }) => wellness.regulationSessionsToday >= 2,
    build: ({ wellness }) => ({
      title:       `${wellness.regulationSessionsToday} regulation sessions today`,
      message:     'Your nervous system is in recovery mode. Studies show regulated students retain 40% more from their next study session.',
      actionLabel: 'Study now',
      actionRoute: '/study',
    }),
  },

  // Ovulation peak window — positive reinforcement
  {
    id:           'cycle_peak_window',
    urgency:      1,
    variant:      'chip',
    cooldownMins: 12 * 60,
    test: ({ wellness }) => wellness.cyclePhase === 'ovulation',
    build: () => ({
      title:       'Peak cognitive window',
      message:     'Ovulation phase: energy, focus, and social cognition are at their highest. Ideal for tackling your hardest material, group study, or any work requiring deep concentration.',
      actionLabel: 'Study hardest topic',
      actionRoute: '/study',
    }),
  },
]

// ─── Evaluation engine ─────────────────────────────────────────

function buildIntervention(rule: Rule, snapshot: RuleSnapshot): Intervention {
  const data = rule.build(snapshot)
  return {
    ...data,
    id:        `${rule.id}-${Date.now()}`,
    ruleId:    rule.id,
    urgency:   rule.urgency,
    variant:   rule.variant,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Evaluate all rules against a snapshot.
 * Returns the list of interventions that should be queued (respects cooldowns).
 * Pure function — does NOT mutate the store or localStorage.
 */
export function evaluateRules(snapshot: RuleSnapshot): Intervention[] {
  return RULES
    .filter(rule => !isOnCooldown(rule.id) && rule.test(snapshot))
    .map(rule => buildIntervention(rule, snapshot))
}

/**
 * Run all rules against the current StudentState and queue passing interventions.
 * Also stamps cooldowns for every rule that fires.
 * Call this after every StudentState recompute.
 */
export function runRules(): void {
  if (typeof window === 'undefined') return

  const store = useStudentState.getState()

  // Respect global suppression
  if (store.interventions.suppressedUntil) {
    if (new Date(store.interventions.suppressedUntil).getTime() > Date.now()) return
  }

  const snapshot: RuleSnapshot = {
    academic:  store.academic,
    financial: store.financial,
    wellness:  store.wellness,
    schedule:  store.schedule,
  }

  for (const rule of RULES) {
    if (isOnCooldown(rule.id)) continue
    if (!rule.test(snapshot)) continue

    const intervention = buildIntervention(rule, snapshot)
    store.queueIntervention(intervention)
    markCooldown(rule.id, rule.cooldownMins)

    // Push to all the student's devices when a high-urgency rule fires.
    // The intervention cooldown above already ensures this fires at most
    // once per cooldown window per rule — no extra rate-limiting needed.
    if (rule.urgency >= 4) {
      fetch('/api/push/state-alert', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ruleId:        rule.id,
          urgency:       rule.urgency,
          title:         intervention.title,
          body:          intervention.message,
          url:           intervention.actionRoute,
          cooldownHours: rule.cooldownMins / 60,
        }),
      }).catch(() => {})
    }
  }
}

// ─── Auto-run on StudentState changes ─────────────────────────

let _rulesUnsubscribe: (() => void) | null = null

/**
 * Subscribe to StudentState recomputes and run rules automatically.
 * Call alongside initOrchestration() in the root layout.
 */
export function initRulesEngine(): () => void {
  if (typeof window === 'undefined') return () => {}
  _rulesUnsubscribe?.()

  _rulesUnsubscribe = useStudentState.subscribe(
    (state, prev) => {
      // Only re-run when computed data changes, not when the queue itself changes
      // (comparing lastComputedAt is a cheap proxy for "recompute happened")
      if (state.meta.lastComputedAt !== prev.meta.lastComputedAt) {
        runRules()
      }
    }
  )

  // Run immediately on init
  runRules()

  return () => { _rulesUnsubscribe?.() }
}

// ─── Debug utility ─────────────────────────────────────────────

/** Returns which rules would fire right now (ignoring cooldowns). */
export function previewRules(): { id: string; urgency: number; would_fire: boolean; on_cooldown: boolean }[] {
  const store = useStudentState.getState()
  const snapshot: RuleSnapshot = {
    academic:  store.academic,
    financial: store.financial,
    wellness:  store.wellness,
    schedule:  store.schedule,
  }
  return RULES.map(rule => ({
    id:         rule.id,
    urgency:    rule.urgency,
    would_fire: rule.test(snapshot),
    on_cooldown: isOnCooldown(rule.id),
  }))
}
