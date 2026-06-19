// Room activity tracking — records both page visits AND task completions.
// Call recordRoomActivity(roomId) from anywhere to light up the nav ring.

const STORAGE_KEY = 'varsityos_room_visits'
const EVENT_NAME  = 'varsityos:room_activity'

export const XP_EVENT_TO_ROOM: Record<string, string> = {
  // Study room
  task_complete:           'study',
  all_tasks_done:          'study',
  flashcard_review:        'study',
  pomodoro_session:        'study',
  past_paper_attempted:    'study',
  note_saved:              'study',
  note_shared:             'study',
  intention_set:           'study',
  body_double_joined:      'study',
  journal_entry:           'study',
  profiler_completed:      'study',
  accountability_shared:   'study',
  recovery_initiated:      'study',
  // Finance room
  budget_entry:            'finance',
  income_logged:           'finance',
  savings_goal_hit:        'finance',
  financial_health_check:  'finance',
  bursary_viewed:          'finance',
  // Career room
  shift_logged:            'career',
  side_hustle_logged:      'career',
  mock_interview_complete: 'career',
  skills_gap_viewed:       'career',
  cv_skill_added:          'career',
  contract_completed:      'career',
  // Life room
  wellness_checkin:        'life',
  habit_checkin:           'life',
  habit_streak_7:          'life',
  habit_streak_30:         'life',
  habit_streak_100:        'life',
  meal_planned:            'life',
  weekly_meal_plan:        'life',
  // Home room
  first_login:             'home',
  compound_day:            'home',
  battle_won:              'home',
  battle_participated:     'home',
  mystery_box_opened:      'home',
  domain_streak_7:         'home',
  domain_streak_30:        'home',
}

export function recordRoomActivity(roomId: string): void {
  if (typeof window === 'undefined') return
  try {
    const data: Record<string, string[]> = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    const today = new Date().toLocaleDateString('en-CA')
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30)
    const visits = (data[roomId] ?? []).filter((d: string) => new Date(d) > cutoff)
    if (!visits.includes(today)) visits.push(today)
    data[roomId] = visits
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { roomId } }))
}

export function loadRoomActivity(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    const data: Record<string, string[]> = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i)
      return d.toLocaleDateString('en-CA')
    })
    const ROOM_IDS = ['home', 'study', 'finance', 'career', 'life']
    const result: Record<string, number> = {}
    for (const id of ROOM_IDS) {
      const visits = new Set<string>(data[id] ?? [])
      result[id] = last7.filter(d => visits.has(d)).length / 7
    }
    return result
  } catch { return {} }
}
