export const ENCOURAGEMENT_BY_TYPE = {
  task_done: [
    'Done. One less thing standing between you and your degree.',
    'Tick. Your future self is grateful.',
    'That\'s the one. Keep moving.',
    'Checked off. Ubuntu — you did that for yourself AND everyone who believes in you.',
    'Completed. Small wins build big lives.',
    'Done. Consistent action is how degrees get finished.',
  ],
  streak: (days: number) => [
    `${days} days straight. Discipline is just respect for your own goals.`,
    `${days}-day streak. The version of you from ${days} days ago would be proud.`,
    `${days} days consistent. Consistency is the quiet superpower.`,
    `${days} days in a row. That\'s not luck — that\'s character.`,
  ],
  budget_on_track: [
    'Budget on track. Your money is listening to you.',
    'Every rand accounted for. That\'s financial intelligence.',
    'You\'re managing like someone who knows where they\'re going.',
    'In budget. That\'s the discipline that builds futures.',
  ],
  savings_progress: [
    'Getting closer. Every rand counts.',
    'Your future self is watching. Keep going.',
    'That goal is getting real.',
    'Progress. One contribution at a time.',
  ],
  savings_complete: [
    'You did it. You set a goal and you hit it. That\'s not small — that\'s character.',
    'Goal reached. What\'s next?',
    'Saved. Proven. Unstoppable.',
    'You built that from nothing. That\'s everything.',
  ],
  check_in: [
    'Good. You showed up for yourself today.',
    'Check-in done. Self-awareness is a skill.',
    'Noted. Nova sees you.',
  ],
  study_session: [
    'Session done. That\'s time you can\'t get back — and it was well spent.',
    'Pomodoro complete. Your brain thanks you.',
    'Study session logged. Progress over perfection.',
  ],
} as const

type EncouragementKey = keyof typeof ENCOURAGEMENT_BY_TYPE

export function getRandomEncouragement(type: EncouragementKey, param?: number): string {
  const pool = typeof ENCOURAGEMENT_BY_TYPE[type] === 'function'
    ? (ENCOURAGEMENT_BY_TYPE[type] as (n: number) => string[])(param ?? 1)
    : (ENCOURAGEMENT_BY_TYPE[type] as readonly string[])
  const arr = pool as string[]
  return arr[Math.floor(Math.random() * arr.length)]
}
