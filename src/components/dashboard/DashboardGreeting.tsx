'use client'

import { type Profile, type Budget, type Exam, type Task } from '@/types'
import { getDaysUntil } from '@/lib/utils'

interface Props {
  profile: Profile
  budget: Budget | null
  nextExam: Exam | null
  overdueTasks: Task[]
  weekStudyHours?: number
  isPremium: boolean
}

export default function DashboardGreeting({
  profile, budget, nextExam, overdueTasks, weekStudyHours, isPremium,
}: Props) {
  const hour = new Date().getHours()

  let timeLabel: string
  let isLateNight = false
  if (hour >= 5 && hour < 12)      timeLabel = 'Good morning'
  else if (hour >= 12 && hour < 18) timeLabel = 'Afternoon'
  else if (hour >= 18 && hour < 22) timeLabel = 'Evening'
  else { timeLabel = 'Still up'; isLateNight = true }

  // Highest-priority contextual line
  const contextLine = (() => {
    if (nextExam) {
      const days = getDaysUntil(nextExam.exam_date)
      if (days >= 0 && days <= 7) {
        const when = days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`
        return {
          text: `Your ${nextExam.name} is ${when}. Want Nova to build a final revision plan?`,
          color: 'text-red-300',
        }
      }
    }
    if (budget?.nsfas_enabled) {
      // NSFAS late heuristic: after 15th of month
      const dayOfMonth = new Date().getDate()
      if (dayOfMonth > 15) {
        return {
          text: "NSFAS hasn't arrived yet? Check your emergency options in budget.",
          color: 'text-amber-300',
        }
      }
    }
    if (overdueTasks.length > 0) {
      return {
        text: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} — let's knock them out.`,
        color: 'text-orange-300',
      }
    }
    if (isLateNight) {
      return {
        text: 'Late nights add up. Even 20 min less screen time helps memory consolidation.',
        color: 'text-purple-300',
      }
    }
    if (weekStudyHours && weekStudyHours >= 10) {
      return {
        text: `You've studied ${weekStudyHours} hours this week. That's solid.`,
        color: 'text-teal-300',
      }
    }
    return null
  })()

  const firstName = profile.name?.split(' ')[0] ?? 'Student'

  return (
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[0.6rem] text-teal-300/70 uppercase tracking-widest">
          {isLateNight ? 'Hey —' : `${timeLabel},`}
        </p>
        <h2 className="font-display font-black text-xl text-white leading-tight mt-0.5">
          {isLateNight ? 'Still up, ' : ''}{firstName}{' '}
          <span className="text-2xl">{profile.emoji ?? '🎓'}</span>
        </h2>
        <p className="font-mono text-[0.6rem] text-teal-200/60 mt-0.5">
          {profile.university?.split('(')[0]?.trim()} · {profile.year_of_study}
        </p>
        {contextLine && (
          <p className={`font-body text-xs mt-2 leading-snug max-w-[220px] ${contextLine.color}`}>
            {contextLine.text}
          </p>
        )}
      </div>
      {isPremium && (
        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-mono text-[0.58rem] uppercase tracking-wide flex-shrink-0 ml-3">
          ⭐ Premium
        </span>
      )}
    </div>
  )
}
