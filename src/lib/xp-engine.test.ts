import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// The XP engine's only import is the Supabase-backed persistence module. Stub it
// so importing the engine never pulls in the browser/Supabase client — these
// tests exercise the pure logic (and the localStorage-backed helpers via
// happy-dom), not the network.
vi.mock('@/lib/db/xp', () => ({
  saveXPStateToDB: vi.fn(),
  saveDailyChallengesDB: vi.fn(),
  loadXPStateFromDB: vi.fn(async () => null),
  loadDailyChallengesFromDB: vi.fn(async () => []),
}))

import {
  getLevel,
  getLevelProgress,
  LEVELS,
  MYSTERY_LOOT_TABLE,
  rollMysteryBox,
  calculateArchetype,
  getUnlockedBadges,
  getDomainsHitToday,
  getPendingXP,
  type XPState,
} from './xp-engine'

const KEY_STATE = 'varsityos_xp_state'

// Build a minimal XPState with a given daily event log.
function makeState(dailyEventLog: Record<string, string[]> = {}, totalXP = 0, eventCounts: Record<string, number> = {}): XPState {
  return { totalXP, eventCounts, dailyEventLog, recentGains: [], dailyChallenges: [] }
}

// SAST calendar day — must match the engine's internal dateStr() so seeded
// localStorage lines up with what getDomainsHitToday() reads.
const sastToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })
// A UTC date string N days ago, for archetype's rolling-7-day window.
const daysAgoISO = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('getLevel — thresholds', () => {
  it('floors to Fresher below the first threshold', () => {
    expect(getLevel(0).name).toBe('Fresher')
    expect(getLevel(499).name).toBe('Fresher')
  })
  it('selects the higher level exactly at a boundary (>=)', () => {
    expect(getLevel(500).name).toBe('Survivor')
    expect(getLevel(2_000).name).toBe('Grinder')
  })
  it('caps at the top level and never exceeds it', () => {
    expect(getLevel(100_000).name).toBe('Alumni')
    expect(getLevel(10_000_000).name).toBe('Alumni')
  })
  it('picks the right band mid-range', () => {
    expect(getLevel(5_999).name).toBe('Grinder')
    expect(getLevel(6_000).name).toBe('Scholar')
  })
})

describe('getLevelProgress — progress math', () => {
  it('computes pct, xpThisLevel and xpToNext without off-by-one', () => {
    // Halfway from Survivor(500) to Grinder(2000): span 1500, at 1250 → earned 750 → 50%
    const p = getLevelProgress(1_250)
    expect(p.level.name).toBe('Survivor')
    expect(p.next?.name).toBe('Grinder')
    expect(p.pct).toBe(50)
    expect(p.xpThisLevel).toBe(750)
    expect(p.xpToNext).toBe(750)
  })
  it('reports 0% at the start of a level and 100% at max', () => {
    expect(getLevelProgress(500).pct).toBe(0)
    const max = getLevelProgress(120_000)
    expect(max.next).toBeNull()
    expect(max.pct).toBe(100)
    expect(max.xpToNext).toBe(0)
  })
  it('level/next are adjacent entries in LEVELS', () => {
    const p = getLevelProgress(3_000)
    const i = LEVELS.indexOf(p.level)
    expect(LEVELS[i + 1]).toBe(p.next)
  })
})

describe('MYSTERY_LOOT_TABLE — invariants', () => {
  it('weights sum to exactly 100', () => {
    expect(MYSTERY_LOOT_TABLE.reduce((s, r) => s + r.weight, 0)).toBe(100)
  })
  it('xp values match the server-side allowlist (client/server contract)', () => {
    // Mirrors LOOT_XP in src/app/api/gamification/mystery-box/route.ts
    const expected: Record<string, number> = {
      xp_small: 50, xp_medium: 150, xp_large: 500, multiplier: 0, shield: 0, badge_fragment: 100,
    }
    for (const r of MYSTERY_LOOT_TABLE) expect(r.xp).toBe(expected[r.type])
  })
})

describe('rollMysteryBox — weighted draw', () => {
  it('always returns a defined table entry (never undefined) across many rolls', () => {
    for (let i = 0; i < 1000; i++) {
      const r = rollMysteryBox()
      expect(MYSTERY_LOOT_TABLE).toContain(r)
    }
  })
  it('maps roll position to the correct tier at cumulative boundaries', () => {
    // totalWeight 100 → roll = random*100; cumulative 35/60/70/85/95/100
    const cases: [number, string][] = [
      [0,     'xp_small'],       // roll 0
      [0.349, 'xp_small'],       // 34.9 ≤ 35
      [0.36,  'xp_medium'],      // 36 → next band
      [0.69,  'xp_large'],       // 69 ≤ 70
      [0.80,  'multiplier'],     // 80 ≤ 85
      [0.90,  'shield'],         // 90 ≤ 95
      [0.99,  'badge_fragment'], // 99 ≤ 100
    ]
    for (const [rand, type] of cases) {
      vi.spyOn(Math, 'random').mockReturnValue(rand)
      expect(rollMysteryBox().type).toBe(type)
      vi.restoreAllMocks()
    }
  })
})

describe('calculateArchetype — pure over the 7-day domain counts', () => {
  it('returns Explorer for an empty state (catch-all)', () => {
    expect(calculateArchetype(makeState()).id).toBe('explorer')
  })
  it('returns Ubuntu Graduate when every domain is touched at least once', () => {
    const state = makeState({
      [daysAgoISO(0)]: ['task_complete', 'budget_entry', 'wellness_checkin', 'cv_skill_added', 'note_shared'],
    })
    expect(calculateArchetype(state).id).toBe('ubuntu_graduate')
  })
  it('returns Scholar-Builder for academic+career focus (no other domains)', () => {
    const state = makeState({
      [daysAgoISO(0)]: ['task_complete', 'task_complete', 'task_complete', 'cv_skill_added', 'cv_skill_added', 'cv_skill_added'],
    })
    expect(calculateArchetype(state).id).toBe('scholar_builder')
  })
  it('ignores events older than 7 days', () => {
    const state = makeState({
      [daysAgoISO(30)]: ['task_complete', 'budget_entry', 'wellness_checkin', 'cv_skill_added', 'note_shared'],
    })
    expect(calculateArchetype(state).id).toBe('explorer')
  })
})

describe('getUnlockedBadges — pure over state', () => {
  it('unlocks nothing at zero XP', () => {
    const ids = getUnlockedBadges(makeState()).map(b => b.id)
    expect(ids).not.toContain('first_step')
  })
  it('unlocks First Step once any XP is earned', () => {
    const ids = getUnlockedBadges(makeState({}, 100)).map(b => b.id)
    expect(ids).toContain('first_step')
  })
  it('unlocks Task Starter after the first task', () => {
    const ids = getUnlockedBadges(makeState({}, 15, { task_complete: 1 })).map(b => b.id)
    expect(ids).toContain('task_starter')
  })
})

describe('getDomainsHitToday / getPendingXP — read today from localStorage (SAST)', () => {
  it('maps today\'s events to distinct domains', () => {
    localStorage.setItem(KEY_STATE, JSON.stringify(makeState({
      [sastToday()]: ['task_complete', 'budget_entry', 'wellness_checkin'],
    })))
    expect([...getDomainsHitToday()].sort()).toEqual(['academic', 'life', 'money'])
  })
  it('pending XP steps down as more domains are hit', () => {
    expect(getPendingXP()).toBe(220) // none today
    localStorage.setItem(KEY_STATE, JSON.stringify(makeState({
      [sastToday()]: ['task_complete', 'budget_entry', 'wellness_checkin'],
    })))
    expect(getPendingXP()).toBe(80) // 3 domains
  })
  it('ignores events logged under yesterday\'s key', () => {
    localStorage.setItem(KEY_STATE, JSON.stringify(makeState({
      [daysAgoISO(1)]: ['task_complete', 'budget_entry', 'wellness_checkin'],
    })))
    expect(getDomainsHitToday().size).toBe(0)
  })
})
