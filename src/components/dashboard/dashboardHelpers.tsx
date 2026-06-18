import type { TimetableEntry } from '@/types'
import { type DayMode } from '@/components/dashboard/DayModeBanner'

/* ── DayMode-driven design tokens ─────────────────────────── */
export const DASH_THEME: Record<DayMode, {
  heroBg: string; accent: string; accentDim: string; accentGlow: string
  orb1: string; orb2: string; border: string
}> = {
  wake: {
    // Dawn — warm Kente gold breaking through deep cosmos
    heroBg: 'linear-gradient(145deg,#1A0E00 0%,#2E1A00 45%,#180C04 75%,#05040C 100%)',
    accent: '#D4A84B', accentDim: 'rgba(212,168,75,0.12)', accentGlow: 'rgba(212,168,75,0.30)',
    orb1: 'rgba(212,168,75,0.18)', orb2: 'rgba(232,191,106,0.10)',
    border: 'rgba(212,168,75,0.26)',
  },
  commute: {
    // Morning transit — sapphire sky before the city wakes
    heroBg: 'linear-gradient(145deg,#020E22 0%,#041830 45%,#020810 75%,#05040C 100%)',
    accent: '#5B9CF5', accentDim: 'rgba(91,156,245,0.12)', accentGlow: 'rgba(91,156,245,0.30)',
    orb1: 'rgba(91,156,245,0.18)', orb2: 'rgba(147,197,253,0.10)',
    border: 'rgba(91,156,245,0.26)',
  },
  class: {
    // Lecture hours — deep jade focus, ancestral knowledge
    heroBg: 'linear-gradient(145deg,#001A10 0%,#002818 45%,#000E08 75%,#05040C 100%)',
    accent: '#00CFA0', accentDim: 'rgba(0,207,160,0.12)', accentGlow: 'rgba(0,207,160,0.30)',
    orb1: 'rgba(0,207,160,0.18)', orb2: 'rgba(26,218,168,0.10)',
    border: 'rgba(0,207,160,0.26)',
  },
  study: {
    // Deep study — full amethyst cosmos, full power
    heroBg: 'linear-gradient(145deg,#0C0820 0%,#1A0C38 45%,#0A0618 75%,#05040C 100%)',
    accent: '#A855F7', accentDim: 'rgba(168,85,247,0.13)', accentGlow: 'rgba(168,85,247,0.32)',
    orb1: 'rgba(168,85,247,0.20)', orb2: 'rgba(139,92,246,0.12)',
    border: 'rgba(168,85,247,0.26)',
  },
  'wind-down': {
    // Copper sunset — warm and slow, day releasing
    heroBg: 'linear-gradient(145deg,#1A0800 0%,#2C1200 45%,#120600 75%,#05040C 100%)',
    accent: '#E87040', accentDim: 'rgba(232,112,64,0.12)', accentGlow: 'rgba(232,112,64,0.30)',
    orb1: 'rgba(232,112,64,0.18)', orb2: 'rgba(240,144,96,0.10)',
    border: 'rgba(232,112,64,0.26)',
  },
  sleep: {
    // Deep night — near-black cosmic stillness, stars barely visible
    heroBg: 'linear-gradient(145deg,#05040C 0%,#080617 45%,#040310 75%,#05040C 100%)',
    accent: '#6A7FA8', accentDim: 'rgba(106,127,168,0.10)', accentGlow: 'rgba(106,127,168,0.22)',
    orb1: 'rgba(106,127,168,0.12)', orb2: 'rgba(148,111,255,0.06)',
    border: 'rgba(106,127,168,0.18)',
  },
}

export const MODE_LABEL: Record<DayMode, { label: string; emoji: string }> = {
  wake:        { label: 'Wake',       emoji: '🌅' },
  commute:     { label: 'Commute',    emoji: '🚌' },
  class:       { label: 'Class',      emoji: '🎓' },
  study:       { label: 'Study',      emoji: '📚' },
  'wind-down': { label: 'Wind Down',  emoji: '🌙' },
  sleep:       { label: 'Night',      emoji: '🌃' },
}

/* ── helpers ─────────────────────────────────────────────── */
export function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getWeekBadge() {
  const now = new Date()
  const day = now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const f = (d: Date) => d.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
  return `${f(weekStart)} – ${f(weekEnd)}`
}

export function FlameIcon({ streak }: { streak: number }) {
  if (streak === 0) return <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
  return <span>🔥</span>
}

export function toISODate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function getTodaySlots(timetable: TimetableEntry[]) {
  const now   = new Date()
  const jsDay = now.getDay()
  const dbDay = jsDay === 0 ? 7 : jsDay
  return {
    slots: timetable
      .filter(s => (s.day_of_week as number) === dbDay)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')),
    currentTime: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
  }
}
