'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Capability {
  icon: string
  label: string
  description: string
  prompts: { label: string; message: string }[]
}

const CAPABILITIES: Capability[] = [
  {
    icon: '🧠',
    label: 'Mental Health',
    description: 'Emotional support, coping tools, crisis help',
    prompts: [
      { label: 'Breathing exercise', message: 'Can we do a breathing exercise? I need to calm down.' },
      { label: 'I feel overwhelmed', message: "I'm feeling completely overwhelmed right now." },
      { label: 'Motivation boost', message: "I'm struggling to stay motivated this semester." },
      { label: 'Feeling lonely', message: "I've been feeling really isolated and lonely lately." },
      { label: 'Exam anxiety', message: "I have exam anxiety and don't know how to manage it." },
    ],
  },
  {
    icon: '📚',
    label: 'Study Help',
    description: 'Study plans, exam prep, techniques, grades',
    prompts: [
      { label: 'Build a study plan', message: 'Help me build a study plan for my upcoming exams.' },
      { label: 'Exam prep strategy', message: 'How should I prepare for my exam next week?' },
      { label: 'Grade calculator', message: "What mark do I need in my final exam to pass?" },
      { label: 'Pomodoro technique', message: 'Explain the Pomodoro technique and how to use it.' },
      { label: 'Best study methods', message: 'What are the most effective study techniques for university?' },
    ],
  },
  {
    icon: '💸',
    label: 'Budget & Finance',
    description: 'Spending analysis, NSFAS, saving tips',
    prompts: [
      { label: 'Budget health check', message: 'Can you check how my budget is looking this month?' },
      { label: 'Save money tips', message: 'Give me practical tips to save money as a student.' },
      { label: 'NSFAS questions', message: 'I have questions about my NSFAS allowance.' },
      { label: 'Money stress', message: "I'm stressed about running out of money before month end." },
      { label: 'Spending breakdown', message: 'Help me understand where my money is going.' },
    ],
  },
  {
    icon: '🍲',
    label: 'Meal Planning',
    description: 'Budget recipes, grocery lists, nutrition',
    prompts: [
      { label: 'Cheap meal ideas', message: 'Give me cheap, filling meal ideas for this week.' },
      { label: 'Recipe on a budget', message: 'Generate a recipe I can make for under R30.' },
      { label: 'Meal prep tips', message: 'How do I meal prep for the week as a student?' },
      { label: 'Healthy on a budget', message: 'How do I eat healthily when I have very little money?' },
    ],
  },
  {
    icon: '💼',
    label: 'Work & Balance',
    description: 'Part-time job tips, time management, conflicts',
    prompts: [
      { label: 'Check shift conflicts', message: 'Are any of my shifts clashing with my lectures or exams?' },
      { label: 'Balance work & study', message: 'Help me balance my part-time job with my studies.' },
      { label: 'Time management', message: "I'm struggling to manage my time between work, studying and life." },
      { label: 'Job hunting tips', message: 'Where can I find part-time jobs near campus as a student?' },
    ],
  },
  {
    icon: '🎓',
    label: 'Academic Rights',
    description: 'Student rights, NSFAS appeals, university life',
    prompts: [
      { label: 'Know my rights', message: 'What are my rights as a South African university student?' },
      { label: 'NSFAS appeal', message: 'How do I appeal a NSFAS decision?' },
      { label: 'Semester check-in', message: 'Give me a full check-in on how my semester is going.' },
      { label: 'Group assignment help', message: 'I have a difficult group project — give me advice on managing the group.' },
    ],
  },
]

interface Props {
  onSelectPrompt: (message: string) => void
  onClose: () => void
}

export default function NovaCapabilitiesMenu({ onSelectPrompt, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState<number | null>(null)

  return (
    <div className="bg-[#0d1714] border-t border-white/7 animate-slide-up max-h-[75vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/7 sticky top-0 bg-[#0d1714] z-10">
        <div>
          <h3 className="font-display font-bold text-white text-sm">What can Nova do?</h3>
          <p className="font-mono text-[0.58rem] text-white/35">Tap a category, then pick a conversation starter</p>
        </div>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white/60 text-sm w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-all"
        >
          ✕
        </button>
      </div>

      <div className="p-3">
        {/* Category grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {CAPABILITIES.map((cap, i) => (
            <button
              key={cap.label}
              onClick={() => setActiveCategory(activeCategory === i ? null : i)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all text-center',
                activeCategory === i
                  ? 'bg-teal-600/20 border-teal-500/40'
                  : 'bg-white/3 border-white/7 hover:bg-white/7 hover:border-white/15'
              )}
            >
              <span className="text-2xl">{cap.icon}</span>
              <span className={cn('font-display font-bold text-[0.62rem] leading-tight',
                activeCategory === i ? 'text-teal-300' : 'text-white/80'
              )}>
                {cap.label}
              </span>
            </button>
          ))}
        </div>

        {/* Prompt list for active category */}
        {activeCategory !== null && (
          <div className="animate-fade-in">
            <p className="font-mono text-[0.58rem] text-white/30 mb-2 px-1">
              {CAPABILITIES[activeCategory].description}
            </p>
            <div className="space-y-1.5">
              {CAPABILITIES[activeCategory].prompts.map(p => (
                <button
                  key={p.label}
                  onClick={() => {
                    onSelectPrompt(p.message)
                    onClose()
                  }}
                  className="w-full text-left bg-white/3 hover:bg-teal-600/10 border border-white/7 hover:border-teal-600/25 rounded-xl px-4 py-2.5 transition-all group"
                >
                  <span className="font-body text-sm text-white/75 group-hover:text-teal-300 transition-colors">
                    {p.label}
                  </span>
                  <span className="font-mono text-[0.55rem] text-white/25 ml-2">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeCategory === null && (
          <p className="font-mono text-[0.6rem] text-white/20 text-center py-2">
            Tap a category above to see conversation starters
          </p>
        )}
      </div>

      {/* Footer note */}
      <div className="px-4 pb-4">
        <p className="font-mono text-[0.55rem] text-white/15 text-center leading-relaxed">
          Nova already knows your schedule, budget, and exams — no need to repeat yourself.
          For serious mental health concerns, please contact a professional.
        </p>
      </div>
    </div>
  )
}
