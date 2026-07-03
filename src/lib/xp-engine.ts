'use client'

import { saveXPStateToDB, saveDailyChallengesDB, loadXPStateFromDB, loadDailyChallengesFromDB } from '@/lib/db/xp'

// ── XP Engine — VarsityOS Gamification Core ──────────────────────────────────
// localStorage is primary (instant reads); Supabase syncs in background.
// Dispatch XP from any component: dispatchXP('task_complete')
// Listen in the useXP hook which re-renders on each event.

/* ── Constants ───────────────────────────────────────────────────────────────*/

export type XPEventName =
  | 'task_complete'
  | 'all_tasks_done'
  | 'pomodoro_session'
  | 'flashcard_review'
  | 'wellness_checkin'
  | 'mock_interview_complete'
  | 'skills_gap_viewed'
  | 'cv_skill_added'
  | 'daily_challenge_complete'
  | 'bursary_viewed'
  | 'first_login'
  // Finance & Budget
  | 'budget_entry'
  | 'income_logged'
  | 'savings_goal_hit'
  | 'financial_health_check'
  // Habits
  | 'habit_checkin'
  | 'habit_streak_7'
  | 'habit_streak_30'
  | 'habit_streak_100'
  // Notes & Community
  | 'note_shared'
  | 'note_saved'
  // Meals
  | 'meal_planned'
  | 'weekly_meal_plan'
  // Work & Hustle
  | 'shift_logged'
  | 'side_hustle_logged'
  // Learning
  | 'past_paper_attempted'
  // Commitment Contracts
  | 'contract_completed'
  // Tier 2 Anti-Procrastination
  | 'intention_set'
  | 'body_double_joined'
  | 'journal_entry'
  // Tier 3 Anti-Procrastination
  | 'profiler_completed'
  | 'accountability_shared'
  | 'recovery_initiated'
  // Community Challenges
  | 'battle_won'
  | 'battle_participated'
  | 'compound_day'
  | 'mystery_box_opened'
  | 'domain_streak_7'
  | 'domain_streak_30'

export const XP_VALUES: Record<XPEventName, number> = {
  task_complete:            15,
  all_tasks_done:           50,
  pomodoro_session:         25,
  flashcard_review:         10,
  wellness_checkin:         20,
  mock_interview_complete:  50,
  skills_gap_viewed:        25,
  cv_skill_added:            5,
  daily_challenge_complete: 30,
  bursary_viewed:           10,
  first_login:              10,
  // Finance
  budget_entry:              5,
  income_logged:            10,
  savings_goal_hit:        100,
  financial_health_check:   20,
  // Habits
  habit_checkin:            10,
  habit_streak_7:           50,
  habit_streak_30:         150,
  habit_streak_100:        500,
  // Notes
  note_shared:              30,
  note_saved:                8,
  // Meals
  meal_planned:              8,
  weekly_meal_plan:         35,
  // Work
  shift_logged:             20,
  side_hustle_logged:       25,
  // Learning
  past_paper_attempted:     20,
  // Commitment Contracts
  contract_completed:       75,
  // Tier 2 Anti-Procrastination
  intention_set:             5,
  body_double_joined:       15,
  journal_entry:            10,
  // Tier 3 Anti-Procrastination
  profiler_completed:       10,
  accountability_shared:    20,
  recovery_initiated:       15,
  // Community Challenges
  battle_won:              100,
  battle_participated:      25,
  compound_day:            200,
  mystery_box_opened:        0,   // value varies; set dynamically
  domain_streak_7:          75,
  domain_streak_30:        200,
}

// Max fires per day per event (undefined = unlimited).
// Prevents grinding while still rewarding realistic multi-action days.
const MAX_DAILY_FIRES: Partial<Record<XPEventName, number>> = {
  first_login:            1,
  skills_gap_viewed:      1,
  financial_health_check: 1,
  income_logged:          1,
  weekly_meal_plan:       1,
  bursary_viewed:         3,
  note_shared:            2,
  note_saved:             3,
  shift_logged:           3,
  budget_entry:           5,
  meal_planned:           5,
  habit_checkin:          10,
  past_paper_attempted:   2,
  contract_completed:     1,
  intention_set:          3,
  body_double_joined:     1,
  journal_entry:          2,
  profiler_completed:     1,
  accountability_shared:  2,
  recovery_initiated:     1,
  // Community Challenges
  battle_won:             1,
  battle_participated:    2,
  compound_day:           1,
  mystery_box_opened:     1,
}

/* ── Level System ───────────────────────────────────────────────────────────*/

export interface Level {
  name:    string
  emoji:   string
  minXP:   number
  color:   string
}

// 9-level system designed for a full 4-year degree arc.
// An engaged student (~80 XP/day, 5 days/week) hits:
//   Survivor   ~1 month   Grinder   ~3 months  Scholar  ~end of semester 1
//   Pioneer    ~end of year 1       Trailblazer ~end of year 2
//   Legend     ~end of year 3       Graduate    ~end of year 4
//   Alumni     post-grad prestige
export const LEVELS: Level[] = [
  { name: 'Fresher',     emoji: '🌱', minXP: 0,        color: '#4ecf9e' },
  { name: 'Survivor',    emoji: '💪', minXP: 500,      color: '#7090d0' },
  { name: 'Grinder',     emoji: '⚡', minXP: 2_000,    color: '#c9a84c' },
  { name: 'Scholar',     emoji: '📚', minXP: 6_000,    color: '#9b6fd4' },
  { name: 'Pioneer',     emoji: '🚀', minXP: 14_000,   color: '#e8834a' },
  { name: 'Trailblazer', emoji: '🌠', minXP: 26_000,   color: '#3bb8d4' },
  { name: 'Legend',      emoji: '🏆', minXP: 42_000,   color: '#ff6b6b' },
  { name: 'Graduate',    emoji: '🎓', minXP: 65_000,   color: '#e2c86e' },
  { name: 'Alumni',      emoji: '🌟', minXP: 100_000,  color: '#ffffff' },
]

export function getLevel(totalXP: number): Level {
  let level = LEVELS[0]
  for (const l of LEVELS) {
    if (totalXP >= l.minXP) level = l
  }
  return level
}

export function getLevelProgress(totalXP: number): { level: Level; next: Level | null; pct: number; xpThisLevel: number; xpToNext: number } {
  const level = getLevel(totalXP)
  const idx = LEVELS.indexOf(level)
  const next = idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null
  if (!next) return { level, next: null, pct: 100, xpThisLevel: totalXP - level.minXP, xpToNext: 0 }
  const span = next.minXP - level.minXP
  const earned = totalXP - level.minXP
  return { level, next, pct: Math.round((earned / span) * 100), xpThisLevel: earned, xpToNext: next.minXP - totalXP }
}

/* ── Badge System ───────────────────────────────────────────────────────────*/

export interface Badge {
  id:          string
  name:        string
  emoji:       string
  description: string
  color:       string
  check:       (state: XPState) => boolean
}

export interface XPState {
  totalXP:             number
  eventCounts:         Record<string, number>       // event → total count
  dailyEventLog:       Record<string, string[]>     // 'YYYY-MM-DD' → eventNames[]
  recentGains:         { xp: number; label: string; ts: number }[]
  dailyChallenges:     DailyChallenge[]
}

export const BADGES: Badge[] = [
  {
    id: 'first_step', name: 'First Step', emoji: '🌱', color: '#4ecf9e',
    description: 'Earn your first XP on VarsityOS',
    check: s => s.totalXP > 0,
  },
  {
    id: 'task_starter', name: 'Task Starter', emoji: '✅', color: '#4ecf9e',
    description: 'Complete your first task',
    check: s => (s.eventCounts['task_complete'] ?? 0) >= 1,
  },
  {
    id: 'task_crusher', name: 'Task Crusher', emoji: '💥', color: '#4ecf9e',
    description: 'Complete 25 tasks',
    check: s => (s.eventCounts['task_complete'] ?? 0) >= 25,
  },
  {
    id: 'all_done', name: 'Clear Day', emoji: '🏁', color: '#4ecf9e',
    description: 'Clear all tasks in a single day',
    check: s => (s.eventCounts['all_tasks_done'] ?? 0) >= 1,
  },
  {
    id: 'focus_starter', name: 'Focus Starter', emoji: '⏱️', color: '#c9a84c',
    description: 'Complete your first Pomodoro session',
    check: s => (s.eventCounts['pomodoro_session'] ?? 0) >= 1,
  },
  {
    id: 'focus_king', name: 'Focus King', emoji: '👑', color: '#c9a84c',
    description: 'Complete 10 Pomodoro sessions',
    check: s => (s.eventCounts['pomodoro_session'] ?? 0) >= 10,
  },
  {
    id: 'flash_starter', name: 'Card Flipper', emoji: '🃏', color: '#9b6fd4',
    description: 'Complete your first flashcard review session',
    check: s => (s.eventCounts['flashcard_review'] ?? 0) >= 1,
  },
  {
    id: 'flash_master', name: 'Flash Master', emoji: '⚡', color: '#9b6fd4',
    description: 'Complete 20 flashcard review sessions',
    check: s => (s.eventCounts['flashcard_review'] ?? 0) >= 20,
  },
  {
    id: 'mind_guard', name: 'Mind Guard', emoji: '🧠', color: '#7090d0',
    description: 'Complete 7 wellness check-ins',
    check: s => (s.eventCounts['wellness_checkin'] ?? 0) >= 7,
  },
  {
    id: 'self_aware', name: 'Self-Aware', emoji: '🪞', color: '#7090d0',
    description: 'Complete 30 wellness check-ins',
    check: s => (s.eventCounts['wellness_checkin'] ?? 0) >= 30,
  },
  {
    id: 'interview_ready', name: 'Interview Ready', emoji: '🎤', color: '#7090d0',
    description: 'Complete a mock interview',
    check: s => (s.eventCounts['mock_interview_complete'] ?? 0) >= 1,
  },
  {
    id: 'career_mapped', name: 'Career Mapped', emoji: '🎯', color: '#7090d0',
    description: 'Complete a skills gap analysis',
    check: s => (s.eventCounts['skills_gap_viewed'] ?? 0) >= 1,
  },
  {
    id: 'bursary_hunter', name: 'Bursary Hunter', emoji: '🎓', color: '#e8834a',
    description: 'Explore 5 bursary opportunities',
    check: s => (s.eventCounts['bursary_viewed'] ?? 0) >= 5,
  },
  {
    id: 'century', name: 'Century', emoji: '💯', color: '#c9a84c',
    description: 'Reach 100 XP',
    check: s => s.totalXP >= 100,
  },
  {
    id: 'scholar_badge', name: 'Scholar', emoji: '📖', color: '#9b6fd4',
    description: 'Reach 500 XP',
    check: s => s.totalXP >= 500,
  },
  {
    id: 'daily_grind', name: 'Daily Grind', emoji: '🔥', color: '#ff6b6b',
    description: 'Complete 5 daily challenges',
    check: s => (s.eventCounts['daily_challenge_complete'] ?? 0) >= 5,
  },
  // ── Finance ──────────────────────────────────────────────────────────────────
  {
    id: 'budget_starter', name: 'Budget Tracker', emoji: '💰', color: '#4ecf9e',
    description: 'Log your first expense — financial awareness starts here',
    check: s => (s.eventCounts['budget_entry'] ?? 0) >= 1,
  },
  {
    id: 'savings_hero', name: 'Savings Hero', emoji: '🏦', color: '#e8834a',
    description: 'Hit your first savings goal — discipline pays off',
    check: s => (s.eventCounts['savings_goal_hit'] ?? 0) >= 1,
  },
  {
    id: 'money_master', name: 'Money Master', emoji: '💎', color: '#c9a84c',
    description: 'Log 50 expenses — you own your finances',
    check: s => (s.eventCounts['budget_entry'] ?? 0) >= 50,
  },
  // ── Habits ────────────────────────────────────────────────────────────────────
  {
    id: 'habit_starter', name: 'Habit Starter', emoji: '🔄', color: '#4ecf9e',
    description: 'Complete your first habit check-in',
    check: s => (s.eventCounts['habit_checkin'] ?? 0) >= 1,
  },
  {
    id: 'habit_dedicated', name: 'Dedicated', emoji: '⚡', color: '#c9a84c',
    description: 'Earn a 7-day streak on any habit',
    check: s => (s.eventCounts['habit_streak_7'] ?? 0) >= 1,
  },
  {
    id: 'habit_consistent', name: 'Consistent', emoji: '🏅', color: '#9b6fd4',
    description: 'Earn a 30-day streak — that is a real lifestyle change',
    check: s => (s.eventCounts['habit_streak_30'] ?? 0) >= 1,
  },
  {
    id: 'habit_immortal', name: 'Immortal', emoji: '👑', color: '#e2c86e',
    description: '100-day habit streak — legendary, almost no one does this',
    check: s => (s.eventCounts['habit_streak_100'] ?? 0) >= 1,
  },
  // ── Notes & Community ────────────────────────────────────────────────────────
  {
    id: 'note_giver', name: 'Note Giver', emoji: '📝', color: '#7090d0',
    description: 'Share your first note with the community — Ubuntu in action',
    check: s => (s.eventCounts['note_shared'] ?? 0) >= 1,
  },
  {
    id: 'community_scholar', name: 'Community Scholar', emoji: '📚', color: '#9b6fd4',
    description: 'Save 10 notes from your peers — learning together',
    check: s => (s.eventCounts['note_saved'] ?? 0) >= 10,
  },
  // ── Meals ────────────────────────────────────────────────────────────────────
  {
    id: 'meal_planner_badge', name: 'Meal Planner', emoji: '🍱', color: '#4ecf9e',
    description: 'Plan 15 meals — fuelling your brain is part of studying',
    check: s => (s.eventCounts['meal_planned'] ?? 0) >= 15,
  },
  // ── Work & Hustle ────────────────────────────────────────────────────────────
  {
    id: 'shift_starter', name: 'Shift Starter', emoji: '⏰', color: '#4ecf9e',
    description: 'Log your first completed work shift',
    check: s => (s.eventCounts['shift_logged'] ?? 0) >= 1,
  },
  {
    id: 'hustler', name: 'Hustler', emoji: '💼', color: '#e8834a',
    description: 'Log your first side hustle — entrepreneurship starts now',
    check: s => (s.eventCounts['side_hustle_logged'] ?? 0) >= 1,
  },
  // ── XP Milestones ────────────────────────────────────────────────────────────
  {
    id: 'xp_1000', name: 'One Thousand', emoji: '💯', color: '#c9a84c',
    description: 'Earn 1,000 XP — you are building serious momentum',
    check: s => s.totalXP >= 1_000,
  },
  {
    id: 'xp_5000', name: 'Five K Club', emoji: '🔥', color: '#ff6b6b',
    description: 'Earn 5,000 XP — first semester complete!',
    check: s => s.totalXP >= 5_000,
  },
  // ── Long-term Level Milestones (years 1-4) ───────────────────────────────────
  {
    id: 'level_pioneer', name: 'Year 1 Pioneer', emoji: '🚀', color: '#e8834a',
    description: 'Reach Pioneer level — one full year of growth on VarsityOS',
    check: s => s.totalXP >= 14_000,
  },
  {
    id: 'level_trailblazer', name: 'Trailblazer', emoji: '🌠', color: '#3bb8d4',
    description: 'Reach Trailblazer level — two years, still going strong',
    check: s => s.totalXP >= 26_000,
  },
  {
    id: 'level_legend', name: 'Year 3 Legend', emoji: '🏆', color: '#ff6b6b',
    description: 'Reach Legend level — three years of university mastered',
    check: s => s.totalXP >= 42_000,
  },
  {
    id: 'level_graduate', name: 'True Graduate', emoji: '🎓', color: '#e2c86e',
    description: 'Complete your full university journey on VarsityOS — remarkable',
    check: s => s.totalXP >= 65_000,
  },
  // ── Commitment Contracts ────────────────────────────────────────────────────
  {
    id: 'contract_keeper', name: 'Contract Keeper', emoji: '🤝', color: '#4ecf9e',
    description: 'Complete your first commitment contract — your word is your bond',
    check: s => (s.eventCounts['contract_completed'] ?? 0) >= 1,
  },
  {
    id: 'word_is_bond', name: 'Word is Bond', emoji: '💎', color: '#c9a84c',
    description: 'Complete 5 commitment contracts — you are the most reliable person you know',
    check: s => (s.eventCounts['contract_completed'] ?? 0) >= 5,
  },
  // ── Compound Days ────────────────────────────────────────────────────────────
  {
    id: 'compound_first', name: 'Compound Starter', emoji: '🌐', color: '#4ecf9e',
    description: 'Your first Compound Day — 3 domains in a single day. Ubuntu in action.',
    check: s => (s.eventCounts['compound_day'] ?? 0) >= 1,
  },
  {
    id: 'compound_7', name: 'Compound Week', emoji: '💫', color: '#38BDF8',
    description: '7 Compound Days — you are genuinely well-rounded. Remarkable.',
    check: s => (s.eventCounts['compound_day'] ?? 0) >= 7,
  },
  {
    id: 'compound_30', name: 'Ubuntu Scholar', emoji: '🌍', color: '#f472b6',
    description: '30 Compound Days — you tend to all areas of your life. This is rare.',
    check: s => (s.eventCounts['compound_day'] ?? 0) >= 30,
  },
  // ── Mystery Box ──────────────────────────────────────────────────────────────
  {
    id: 'mystery_opener', name: 'Box Opener', emoji: '🎁', color: '#a78bfa',
    description: 'Open your first mystery box — complete all 3 daily challenges.',
    check: s => (s.eventCounts['mystery_box_opened'] ?? 0) >= 1,
  },
  {
    id: 'mystery_7', name: 'Lucky Week', emoji: '🎰', color: '#c9a84c',
    description: 'Open the mystery box 7 times. Consistency creates its own luck.',
    check: s => (s.eventCounts['mystery_box_opened'] ?? 0) >= 7,
  },
]

/* ── Domain System ──────────────────────────────────────────────────────────*/

export type DomainKey = 'academic' | 'money' | 'life' | 'career' | 'community'

export const DOMAIN_META: Record<DomainKey, { label: string; emoji: string; color: string; darkColor: string }> = {
  academic:  { label: 'Academic',   emoji: '📚', color: '#38BDF8', darkColor: 'rgba(56,189,248,0.15)' },
  money:     { label: 'Money',      emoji: '💰', color: '#4ecf9e', darkColor: 'rgba(78,207,158,0.15)' },
  life:      { label: 'Life',       emoji: '🌿', color: '#a78bfa', darkColor: 'rgba(167,139,250,0.15)' },
  career:    { label: 'Career',     emoji: '🚀', color: '#f59e0b', darkColor: 'rgba(245,158,11,0.15)' },
  community: { label: 'Community',  emoji: '🤝', color: '#f472b6', darkColor: 'rgba(244,114,182,0.15)' },
}

export const DOMAIN_EVENTS: Partial<Record<XPEventName, DomainKey>> = {
  task_complete:           'academic',
  all_tasks_done:          'academic',
  pomodoro_session:        'academic',
  flashcard_review:        'academic',
  past_paper_attempted:    'academic',
  contract_completed:      'academic',
  intention_set:           'academic',
  body_double_joined:      'academic',
  profiler_completed:      'academic',
  budget_entry:            'money',
  income_logged:           'money',
  savings_goal_hit:        'money',
  financial_health_check:  'money',
  wellness_checkin:        'life',
  habit_checkin:           'life',
  habit_streak_7:          'life',
  habit_streak_30:         'life',
  habit_streak_100:        'life',
  meal_planned:            'life',
  weekly_meal_plan:        'life',
  journal_entry:           'life',
  recovery_initiated:      'life',
  skills_gap_viewed:       'career',
  cv_skill_added:          'career',
  mock_interview_complete: 'career',
  bursary_viewed:          'career',
  shift_logged:            'career',
  side_hustle_logged:      'career',
  note_shared:             'community',
  note_saved:              'community',
  battle_won:              'community',
  battle_participated:     'community',
  accountability_shared:   'community',
}

export function getDomainsHitToday(): Set<DomainKey> {
  if (typeof window === 'undefined') return new Set()
  const today = dateStr()
  const state = loadXPState()
  const todayEvents = state.dailyEventLog[today] ?? []
  const domains = new Set<DomainKey>()
  for (const ev of todayEvents) {
    const domain = DOMAIN_EVENTS[ev as XPEventName]
    if (domain) domains.add(domain)
  }
  return domains
}

export function getDomainDomainsCount(): number {
  return getDomainsHitToday().size
}

export function getPendingXP(): number {
  const hit = getDomainsHitToday().size
  if (hit === 0) return 220
  if (hit === 1) return 180
  if (hit === 2) return 130
  if (hit === 3) return 80
  return 40
}

/* ── Archetype System ───────────────────────────────────────────────────────*/

export const ARCHETYPES = [
  { id: 'ubuntu_graduate', name: 'Ubuntu Graduate',    emoji: '🌍', description: 'You tend to all areas of life. Ubuntu — I am because we are.',   condition: (d: Record<DomainKey, number>) => Object.values(d).every(v => v > 0) },
  { id: 'scholar_builder', name: 'Scholar-Builder',    emoji: '🏗️', description: 'You combine academic excellence with career ambition.',            condition: (d: Record<DomainKey, number>) => d.academic > 2 && d.career > 2 },
  { id: 'scholar_saver',   name: 'Scholar-Saver',      emoji: '💎', description: 'You study hard and watch your rands. Financial discipline is real.', condition: (d: Record<DomainKey, number>) => d.academic > 2 && d.money > 2 },
  { id: 'social_scholar',  name: 'Social Scholar',     emoji: '🤝', description: 'You learn in community and give back. Ubuntu learner.',            condition: (d: Record<DomainKey, number>) => d.academic > 2 && d.community > 2 },
  { id: 'hustler',         name: 'The Hustler',        emoji: '⚡', description: 'Career-focused and always moving. Your future is being built now.',  condition: (d: Record<DomainKey, number>) => d.career > 3 },
  { id: 'money_wise',      name: 'Money-Wise',         emoji: '💰', description: 'Financial awareness is your superpower. Many students skip this.',  condition: (d: Record<DomainKey, number>) => d.money > 3 },
  { id: 'community_heart', name: 'Community Heart',    emoji: '💛', description: 'You show up for others. Leadership grows from here.',              condition: (d: Record<DomainKey, number>) => d.community > 3 },
  { id: 'life_first',      name: 'Life-First',         emoji: '🌿', description: 'You prioritise your wellbeing. This is harder than it looks.',     condition: (d: Record<DomainKey, number>) => d.life > 3 },
  { id: 'well_rounded',    name: 'Well-Rounded',       emoji: '🎯', description: 'Balance across 3+ areas. You are building a whole person.',        condition: (d: Record<DomainKey, number>) => Object.values(d).filter(v => v > 1).length >= 3 },
  { id: 'grinder',         name: 'The Grinder',        emoji: '🔥', description: 'You show up. Every day. That is everything.',                      condition: (d: Record<DomainKey, number>) => d.academic > 4 },
  { id: 'explorer',        name: 'Explorer',           emoji: '🧭', description: 'You are still finding your rhythm. Keep going — it clicks.',       condition: () => true },
]

export function calculateArchetype(state: XPState): typeof ARCHETYPES[number] {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const domainCounts: Record<DomainKey, number> = { academic: 0, money: 0, life: 0, career: 0, community: 0 }
  for (const [date, events] of Object.entries(state.dailyEventLog)) {
    if (new Date(date) < sevenDaysAgo) continue
    for (const ev of events) {
      const domain = DOMAIN_EVENTS[ev as XPEventName]
      if (domain) domainCounts[domain]++
    }
  }
  for (const archetype of ARCHETYPES) {
    if (archetype.condition(domainCounts)) return archetype
  }
  return ARCHETYPES[ARCHETYPES.length - 1]
}

/* ── Mystery Box Loot Table ─────────────────────────────────────────────────*/

export type MysteryRewardType = 'xp_small' | 'xp_medium' | 'xp_large' | 'multiplier' | 'shield' | 'badge_fragment'

export const MYSTERY_LOOT_TABLE: { type: MysteryRewardType; weight: number; label: string; emoji: string; xp: number; description: string }[] = [
  { type: 'xp_small',      weight: 35, label: 'XP Boost',        emoji: '✨', xp: 50,  description: '+50 XP dropped from the box!' },
  { type: 'xp_medium',     weight: 25, label: 'Big XP Haul',     emoji: '💫', xp: 150, description: '+150 XP — a generous box today!' },
  { type: 'xp_large',      weight: 10, label: 'Jackpot!',        emoji: '🎰', xp: 500, description: '+500 XP — JACKPOT! Today is your day.' },
  { type: 'multiplier',    weight: 15, label: '2× Multiplier',   emoji: '⚡', xp: 0,   description: '2× XP on everything for 1 hour!' },
  { type: 'shield',        weight: 10, label: 'Domain Shield',   emoji: '🛡️', xp: 0,   description: 'A shield for one of your domain streaks!' },
  { type: 'badge_fragment',weight: 5,  label: 'Rare Fragment',   emoji: '💎', xp: 100, description: 'A rare badge fragment! Collect 3 to unlock the Ubuntu Badge.' },
]

export function rollMysteryBox(): typeof MYSTERY_LOOT_TABLE[number] {
  const totalWeight = MYSTERY_LOOT_TABLE.reduce((s, r) => s + r.weight, 0)
  const roll = Math.random() * totalWeight
  let cumulative = 0
  for (const reward of MYSTERY_LOOT_TABLE) {
    cumulative += reward.weight
    if (roll <= cumulative) return reward
  }
  return MYSTERY_LOOT_TABLE[0]
}

/* ── Compound Day Detection ─────────────────────────────────────────────────*/

export function checkAndFireCompoundDay(): void {
  if (typeof window === 'undefined') return
  const today = dateStr()
  const state = loadXPState()
  const todayLog = state.dailyEventLog[today] ?? []

  // Already fired compound_day today
  if (todayLog.includes('compound_day')) return

  // Need 3+ domains hit
  const domainsHit = getDomainsHitToday()
  if (domainsHit.size < 3) return

  const xp = XP_VALUES['compound_day']
  state.totalXP += xp
  state.dailyEventLog[today] = [...todayLog, 'compound_day']
  state.eventCounts['compound_day'] = (state.eventCounts['compound_day'] ?? 0) + 1
  state.recentGains.push({ xp, label: '🔥 Compound Day!', ts: Date.now() })
  saveXPState(state)
  saveXPStateToDB(state).catch(() => {})

  window.dispatchEvent(new CustomEvent('varsityos:xp', { detail: { eventName: 'compound_day', xp } }))
  window.dispatchEvent(new CustomEvent('varsityos:compound_day', { detail: { domainsHit: Array.from(domainsHit), xp } }))

  // Persist the compound day server-side so it also advances the per-domain
  // streaks (Domain Flames). The server computes the XP bonus authoritatively;
  // we only send which domains were hit.
  fetch('/api/gamification/compound-day', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domains_hit: Array.from(domainsHit) }),
  }).catch(() => {})
}

/* ── Daily Challenges ───────────────────────────────────────────────────────*/

export interface DailyChallenge {
  id:          string
  title:       string
  description: string
  xp:          number
  icon:        string
  autoDetect?: XPEventName  // if this event fires today, auto-complete
}

const CHALLENGE_POOL: DailyChallenge[] = [
  // Study
  { id: 'c_task2',      title: 'Task duo',         description: 'Complete 2 tasks today',                    xp: 30, icon: '✅', autoDetect: 'task_complete' },
  { id: 'c_task3',      title: 'Triple win',       description: 'Complete 3 tasks today',                    xp: 40, icon: '🎯', autoDetect: 'task_complete' },
  { id: 'c_allclear',   title: 'All clear',        description: 'Clear all your due tasks today',            xp: 60, icon: '🏁', autoDetect: 'all_tasks_done' },
  { id: 'c_pomodoro',   title: 'Focus block',      description: 'Complete a Pomodoro session',               xp: 30, icon: '⏱️', autoDetect: 'pomodoro_session' },
  { id: 'c_flashcards', title: 'Card review',      description: 'Review flashcards today',                   xp: 25, icon: '🃏', autoDetect: 'flashcard_review' },
  { id: 'c_deep_work',  title: 'Deep work',        description: 'Do 2 Pomodoro sessions back-to-back',       xp: 50, icon: '🔥', autoDetect: 'pomodoro_session' },
  { id: 'c_note',       title: 'Note explorer',    description: 'Save a note from the marketplace',          xp: 20, icon: '📝', autoDetect: 'note_saved' },
  // Wellness
  { id: 'c_checkin',    title: 'Check in',         description: 'Do your wellness check-in',                 xp: 25, icon: '🧠', autoDetect: 'wellness_checkin' },
  { id: 'c_mindful',    title: 'Mind check',       description: 'Check your burnout score today',            xp: 20, icon: '🧘', autoDetect: 'wellness_checkin' },
  { id: 'c_sleep_log',  title: 'Sleep logged',     description: 'Log your sleep hours today',                xp: 20, icon: '😴' },
  { id: 'c_hydrate',    title: 'Hydration hero',   description: 'Drink 6+ glasses of water (honour system)', xp: 15, icon: '💧' },
  { id: 'c_outside',    title: 'Touch grass',      description: 'Spend 10 min outside campus today',         xp: 20, icon: '🌳' },
  // Budget / Money
  { id: 'c_budget',     title: 'Money tracker',    description: 'Log an expense in your budget',             xp: 20, icon: '💰', autoDetect: 'budget_entry' },
  { id: 'c_no_spend',   title: 'No-spend day',     description: 'Log zero non-essential spending today',     xp: 35, icon: '🤑' },
  { id: 'c_savings',    title: 'Save R5',          description: 'Add R5 to your savings goal today',         xp: 25, icon: '🏦' },
  // Meals
  { id: 'c_meal',       title: 'Meal prep',        description: 'Plan a meal in your meal planner',          xp: 20, icon: '🍱', autoDetect: 'meal_planned' },
  { id: 'c_grocery',    title: 'Grocery list',     description: 'Add 3 items to your grocery list',          xp: 20, icon: '🛒' },
  { id: 'c_cook',       title: 'Home cook',        description: 'Cook a meal at home today (no takeaways)',   xp: 30, icon: '👨‍🍳' },
  // Career
  { id: 'c_nova',       title: 'Ask Nova',         description: 'Have a conversation with Nova',             xp: 20, icon: '✦' },
  { id: 'c_bursary',    title: 'Opportunity scout',description: 'Browse the bursary finder',                 xp: 20, icon: '🎓', autoDetect: 'bursary_viewed' },
  { id: 'c_career',     title: 'Career check',     description: 'Open your Career OS today',                 xp: 20, icon: '💼', autoDetect: 'skills_gap_viewed' },
  { id: 'c_cv',         title: 'CV builder',       description: 'Add a skill to your CV',                   xp: 20, icon: '📄', autoDetect: 'cv_skill_added' },
  { id: 'c_interview',  title: 'Practice day',     description: 'Complete a mock interview',                 xp: 50, icon: '🎤', autoDetect: 'mock_interview_complete' },
  { id: 'c_job_search', title: 'Job scout',        description: 'Browse SA Jobs for 5 minutes',              xp: 20, icon: '🔍' },
  // Habits / Lifestyle
  { id: 'c_habits',     title: 'Habit hero',       description: 'Complete 3 habits today',                   xp: 30, icon: '🔄', autoDetect: 'habit_checkin' },
  { id: 'c_streak',     title: 'Streak keeper',    description: 'Keep your study streak alive',              xp: 25, icon: '⚡', autoDetect: 'pomodoro_session' },
  // Work
  { id: 'c_work',       title: 'Work logged',      description: 'Log a completed shift today',               xp: 25, icon: '⏰', autoDetect: 'shift_logged' },
  { id: 'c_hustle',     title: 'Side hustle',      description: 'Log a side hustle entry',                   xp: 25, icon: '💼', autoDetect: 'side_hustle_logged' },
  // Safety / Movement
  { id: 'c_commute',    title: 'Safe route',       description: 'Plan your commute route in Movement OS',    xp: 15, icon: '🚌' },
  { id: 'c_safety',     title: 'Safety ready',     description: 'Check emergency contacts in Safety OS',     xp: 15, icon: '🛡️' },
]

function dateStr(d = new Date()) { return d.toISOString().split('T')[0] }

function seededRandom(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  return () => {
    h ^= h >>> 13; h = Math.imul(h, 1540483477); h ^= h >>> 15
    return (h >>> 0) / 0xFFFFFFFF
  }
}

export function getTodayChallenges(): DailyChallenge[] {
  const rng = seededRandom(dateStr())
  const pool = [...CHALLENGE_POOL]
  // Fisher-Yates with seeded RNG
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, 3)
}

/* ── Storage Keys ───────────────────────────────────────────────────────────*/

const KEY_STATE      = 'varsityos_xp_state'
const KEY_CHALLENGES = 'varsityos_daily_challenges'  // { date, completed: string[] }

/* ── State I/O ──────────────────────────────────────────────────────────────*/

function emptyState(): XPState {
  return { totalXP: 0, eventCounts: {}, dailyEventLog: {}, recentGains: [], dailyChallenges: [] }
}

export function loadXPState(): XPState {
  if (typeof window === 'undefined') return emptyState()
  try { return JSON.parse(localStorage.getItem(KEY_STATE) ?? 'null') ?? emptyState() } catch { return emptyState() }
}

function saveXPState(s: XPState) {
  try { localStorage.setItem(KEY_STATE, JSON.stringify({ ...s, recentGains: s.recentGains.slice(-20) })) } catch { /* quota full */ }
}

function loadChallengeCompletion(): { date: string; completed: string[] } {
  try { return JSON.parse(localStorage.getItem(KEY_CHALLENGES) ?? 'null') ?? { date: '', completed: [] } } catch { return { date: '', completed: [] } }
}

function saveChallengeCompletion(c: { date: string; completed: string[] }) {
  try { localStorage.setItem(KEY_CHALLENGES, JSON.stringify(c)) } catch { /* quota full */ }
}

/* ── XP Dispatch ────────────────────────────────────────────────────────────*/

export function dispatchXP(eventName: XPEventName, labelOverride?: string) {
  if (typeof window === 'undefined') return
  const state = loadXPState()
  const today = dateStr()

  // Check daily fire cap
  const maxFires = MAX_DAILY_FIRES[eventName]
  if (maxFires !== undefined) {
    const todayCount = (state.dailyEventLog[today] ?? []).filter(e => e === eventName).length
    if (todayCount >= maxFires) return
  }

  // Snapshot pre-mutation for badge/level diff
  const prevUnlockedIds = new Set(getUnlockedBadges(state).map(b => b.id))
  const prevLevel       = getLevel(state.totalXP)

  const xp = XP_VALUES[eventName]
  const label = labelOverride ?? EVENT_LABELS[eventName] ?? eventName

  // Update state
  state.totalXP += xp
  state.eventCounts[eventName] = (state.eventCounts[eventName] ?? 0) + 1
  state.dailyEventLog[today] = [...(state.dailyEventLog[today] ?? []), eventName]
  state.recentGains.push({ xp, label, ts: Date.now() })

  saveXPState(state)

  // Auto-complete any matching daily challenge
  const challenges = getTodayChallenges()
  const completion = loadChallengeCompletion()
  if (completion.date !== today) {
    completion.date = today
    completion.completed = []
  }
  for (const ch of challenges) {
    if (ch.autoDetect === eventName && !completion.completed.includes(ch.id)) {
      // Minimum-count guards for multi-action challenges
      if (ch.id === 'c_task3'  && (state.eventCounts['task_complete'] ?? 0) < 3) continue
      if (ch.id === 'c_task2'  && (state.eventCounts['task_complete'] ?? 0) < 2) continue
      if (ch.id === 'c_habits' && (state.eventCounts['habit_checkin'] ?? 0) < 3) continue
      completion.completed.push(ch.id)
      // Award challenge XP (avoid double-counting if already fired)
      if (!state.dailyEventLog[today]?.includes(`challenge_${ch.id}`)) {
        state.totalXP += ch.xp
        state.eventCounts['daily_challenge_complete'] = (state.eventCounts['daily_challenge_complete'] ?? 0) + 1
        state.dailyEventLog[today] = [...(state.dailyEventLog[today] ?? []), `challenge_${ch.id}`]
        state.recentGains.push({ xp: ch.xp, label: `Challenge: ${ch.title}`, ts: Date.now() + 1 })
        saveXPState(state)
      }
    }
  }
  saveChallengeCompletion(completion)

  // Notify XP listeners
  window.dispatchEvent(new CustomEvent('varsityos:xp', { detail: { eventName, xp } }))

  // Emit badge unlock events for newly earned badges
  for (const badge of getUnlockedBadges(state).filter(b => !prevUnlockedIds.has(b.id))) {
    window.dispatchEvent(new CustomEvent('varsityos:badge_unlock', { detail: badge }))
  }

  // Emit level-up event if player crossed a level boundary
  const newLevel = getLevel(state.totalXP)
  if (newLevel.name !== prevLevel.name) {
    window.dispatchEvent(new CustomEvent('varsityos:level_up', { detail: newLevel }))
  }

  // Background DB sync — fire and forget
  saveXPStateToDB(state).catch(() => {})
  saveDailyChallengesDB(today, completion.completed).catch(() => {})
  // Check if compound day threshold reached
  checkAndFireCompoundDay()
}

export function completeDailyChallenge(challengeId: string, challengeTitle: string) {
  const today = dateStr()
  const completion = loadChallengeCompletion()
  if (completion.date !== today) { completion.date = today; completion.completed = [] }
  if (completion.completed.includes(challengeId)) return
  completion.completed.push(challengeId)
  saveChallengeCompletion(completion)

  const state = loadXPState()
  const xp = CHALLENGE_POOL.find(c => c.id === challengeId)?.xp ?? 30
  if (!state.dailyEventLog[today]?.includes(`challenge_${challengeId}`)) {
    state.totalXP += xp
    state.eventCounts['daily_challenge_complete'] = (state.eventCounts['daily_challenge_complete'] ?? 0) + 1
    state.dailyEventLog[today] = [...(state.dailyEventLog[today] ?? []), `challenge_${challengeId}`]
    state.recentGains.push({ xp, label: `Challenge: ${challengeTitle}`, ts: Date.now() })
    saveXPState(state)
  }
  window.dispatchEvent(new CustomEvent('varsityos:xp', { detail: { eventName: 'daily_challenge_complete', xp } }))

  // Background DB sync — fire and forget
  saveXPStateToDB(state).catch(() => {})
  saveDailyChallengesDB(today, completion.completed).catch(() => {})
}

export async function initXPFromDB(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const today = dateStr()
    const [dbState, dbCompletedIds] = await Promise.all([
      loadXPStateFromDB(),
      loadDailyChallengesFromDB(today),
    ])
    const localState = loadXPState()
    if (dbState.totalXP > localState.totalXP) {
      saveXPState({ ...dbState, dailyChallenges: [] })
    }
    if (dbCompletedIds.length > 0) {
      const localComp = loadChallengeCompletion()
      const localDone = localComp.date === today ? localComp.completed : []
      const merged = [...new Set([...localDone, ...dbCompletedIds])]
      saveChallengeCompletion({ date: today, completed: merged })
    }
  } catch {
    // silent — offline or unauthenticated
  }
}

export function getTodayChallengesWithStatus(): (DailyChallenge & { completed: boolean })[] {
  const today = dateStr()
  const challenges = getTodayChallenges()
  const completion = loadChallengeCompletion()
  const completedToday = completion.date === today ? completion.completed : []
  return challenges.map(c => ({ ...c, completed: completedToday.includes(c.id) }))
}

/* ── Badge Unlocks ──────────────────────────────────────────────────────────*/

export function getUnlockedBadges(state: XPState): Badge[] {
  return BADGES.filter(b => b.check(state))
}

export function getNewlyUnlockedBadges(prev: XPState, next: XPState): Badge[] {
  const prevIds = new Set(getUnlockedBadges(prev).map(b => b.id))
  return getUnlockedBadges(next).filter(b => !prevIds.has(b.id))
}

/* ── XP Penalty ─────────────────────────────────────────────────────────────*/

// Credit a variable amount of XP (e.g. Mystery Box loot) that isn't tied to a
// fixed XPEventName. Mirrors dispatchXP's badge/level/DB side-effects.
export function creditXP(amount: number, label: string) {
  if (typeof window === 'undefined') return
  if (!Number.isFinite(amount) || amount <= 0) return
  const state = loadXPState()
  const prevUnlockedIds = new Set(getUnlockedBadges(state).map(b => b.id))
  const prevLevel       = getLevel(state.totalXP)

  state.totalXP += amount
  state.recentGains.push({ xp: amount, label, ts: Date.now() })
  saveXPState(state)

  window.dispatchEvent(new CustomEvent('varsityos:xp', { detail: { eventName: 'bonus', xp: amount } }))
  for (const badge of getUnlockedBadges(state).filter(b => !prevUnlockedIds.has(b.id))) {
    window.dispatchEvent(new CustomEvent('varsityos:badge_unlock', { detail: badge }))
  }
  const newLevel = getLevel(state.totalXP)
  if (newLevel.name !== prevLevel.name) {
    window.dispatchEvent(new CustomEvent('varsityos:level_up', { detail: newLevel }))
  }
  saveXPStateToDB(state).catch(() => {})
}

export function penalizeXP(amount: number, reason: string) {
  if (typeof window === 'undefined') return
  const state = loadXPState()
  const deduct = Math.min(amount, state.totalXP)
  if (deduct <= 0) return

  state.totalXP -= deduct
  state.recentGains.push({ xp: -deduct, label: `⚠ ${reason}`, ts: Date.now() })
  saveXPState(state)
  saveXPStateToDB(state).catch(() => {})
  window.dispatchEvent(new CustomEvent('varsityos:xp', { detail: { eventName: 'penalty', xp: -deduct } }))
}

/* ── VarsityOS Score ────────────────────────────────────────────────────────*/

export interface VarsityScoreBreakdown {
  total:    number   // 0-1000
  academic: number   // 0-400
  wellness: number   // 0-300
  career:   number   // 0-200
  social:   number   // 0-100
}

export function getVarsityScore(): VarsityScoreBreakdown {
  if (typeof window === 'undefined') return { total: 0, academic: 0, wellness: 0, career: 0, social: 0 }
  const state = loadXPState()

  // Academic (0-400): task completions + pomodoro sessions + flashcard reviews
  const taskScore    = Math.min(150, (state.eventCounts['task_complete'] ?? 0) * 5)
  const pomodoroScore = Math.min(150, (state.eventCounts['pomodoro_session'] ?? 0) * 15)
  const flashScore   = Math.min(100, (state.eventCounts['flashcard_review'] ?? 0) * 5)
  const academic     = taskScore + pomodoroScore + flashScore

  // Wellness (0-300): check-in count + last burnout score
  const checkinScore = Math.min(150, (state.eventCounts['wellness_checkin'] ?? 0) * 10)
  let burnoutBonus = 0
  // Wellness check-ins persist to Supabase; the save path mirrors the latest burnout
  // score into this key so the score stays synchronous. (Lower burnout → higher bonus.)
  const lastBurnout = Number(localStorage.getItem('varsityos_last_burnout'))
  if (Number.isFinite(lastBurnout) && lastBurnout >= 0) {
    burnoutBonus = Math.round((1 - lastBurnout / 100) * 150)
  }
  const wellness = Math.min(300, checkinScore + burnoutBonus)

  // Career (0-200): interview + skills gap + CV skills
  const interviewScore  = Math.min(80, (state.eventCounts['mock_interview_complete'] ?? 0) * 80)
  const skillsGapScore  = Math.min(80, (state.eventCounts['skills_gap_viewed'] ?? 0) * 40)
  const cvSkillsScore   = Math.min(40, (() => {
    try { return (JSON.parse(localStorage.getItem('cv_skills') ?? '[]') as string[]).length * 5 } catch { return 0 }
  })())
  const career = Math.min(200, interviewScore + skillsGapScore + cvSkillsScore)

  // Social (0-100): bursary views + daily challenges
  const bursaryScore   = Math.min(50, (state.eventCounts['bursary_viewed'] ?? 0) * 10)
  const challengeScore = Math.min(50, (state.eventCounts['daily_challenge_complete'] ?? 0) * 5)
  const social = bursaryScore + challengeScore

  const total = Math.min(1000, academic + wellness + career + social)
  return { total, academic, wellness, career, social }
}

/* ── Labels ─────────────────────────────────────────────────────────────────*/

const EVENT_LABELS: Partial<Record<XPEventName, string>> = {
  task_complete:            'Task completed',
  all_tasks_done:           'All tasks cleared!',
  pomodoro_session:         'Focus session',
  flashcard_review:         'Flashcard review',
  wellness_checkin:         'Wellness check-in',
  mock_interview_complete:  'Mock interview done!',
  skills_gap_viewed:        'Skills gap analysis',
  cv_skill_added:           'CV skill added',
  daily_challenge_complete: 'Daily challenge',
  bursary_viewed:           'Bursary explored',
  first_login:              'First login',
  budget_entry:             'Expense logged',
  income_logged:            'Income recorded',
  savings_goal_hit:         'Savings goal hit! 🎉',
  financial_health_check:   'Finance health check',
  habit_checkin:            'Habit checked in',
  habit_streak_7:           '7-day habit streak!',
  habit_streak_30:          '30-day habit streak!',
  habit_streak_100:         '100-day habit streak!',
  note_shared:              'Notes shared with community',
  note_saved:               'Note saved',
  meal_planned:             'Meal planned',
  weekly_meal_plan:         'Week of meals planned!',
  shift_logged:             'Shift logged',
  side_hustle_logged:       'Side hustle recorded',
  past_paper_attempted:     'Past paper attempted',
  // Tier 3 Anti-Procrastination
  profiler_completed:       'Procrastination profile done',
  accountability_shared:    'Commitment shared publicly 💪',
  recovery_initiated:       'Spiral recovery started',
  // Community Challenges
  battle_won:               '🏆 Battle won!',
  battle_participated:      '⚔️ Battle completed',
  compound_day:             '🔥 Compound Day! All domains active!',
  mystery_box_opened:       '🎁 Mystery box opened!',
  domain_streak_7:          '7-day domain streak!',
  domain_streak_30:         '30-day domain streak! Legendary.',
}
