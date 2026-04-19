'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

interface StudyAssistModalProps {
  open: boolean
  onClose: () => void
  type: 'study_plan' | 'exam_prep' | 'grade_calculator' | 'conflict_check'
  taskTitle?: string
  moduleName?: string
  dueDate?: string
  examName?: string
}

export default function StudyAssistModal({
  open, onClose, type, taskTitle, moduleName, dueDate, examName,
}: StudyAssistModalProps) {
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [result, setResult]     = useState<Record<string, unknown> | null>(null)

  // Grade calculator form state
  const [currentGrade, setCurrentGrade]           = useState('')
  const [targetGrade, setTargetGrade]             = useState('')
  const [assessmentWeights, setAssessmentWeights] = useState('')
  const [gradeModuleName, setGradeModuleName]     = useState(moduleName || '')
  const [submitted, setSubmitted]                 = useState(false)

  const autoFetch = type !== 'grade_calculator'

  const callApi = async (overrides?: Record<string, unknown>) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/study/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          taskTitle,
          moduleName: gradeModuleName || moduleName,
          dueDate,
          examName,
          ...overrides,
        }),
      })
      if (!res.ok) throw new Error('Failed to generate')
      const data = await res.json()
      setResult(data)
    } catch {
      setError('Something went wrong — please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch when modal opens for non-form types
  useEffect(() => {
    if (open && autoFetch && !result) {
      callApi()
    }
    if (!open) {
      setResult(null)
      setError(null)
      setSubmitted(false)
      setCurrentGrade('')
      setTargetGrade('')
      setAssessmentWeights('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const modalTitle = {
    study_plan: '✨ AI Study Plan',
    exam_prep: '📚 Exam Prep Guide',
    grade_calculator: '📊 Grade Calculator',
    conflict_check: '⚡ Deadline Conflict Check',
  }[type]

  return (
    <Modal open={open} onClose={onClose} title={modalTitle} size="lg">
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <p className="font-mono text-[0.62rem] text-white/30">Nova is thinking…</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="font-mono text-sm text-red-400">{error}</p>
          <button
            onClick={() => callApi()}
            className="font-mono text-xs bg-teal-600/20 text-teal-400 border border-teal-600/30 px-4 py-2 rounded-xl hover:bg-teal-600/30 transition-all"
          >
            Try again
          </button>
        </div>
      )}

      {/* Grade calculator form */}
      {type === 'grade_calculator' && !submitted && !loading && (
        <div className="space-y-4">
          <p className="font-mono text-[0.65rem] text-white/40">
            Enter your current marks and I'll calculate what you need to hit your target.
          </p>
          <div>
            <label className="font-mono text-[0.6rem] text-white/50 uppercase tracking-wide block mb-1.5">Module name</label>
            <input
              value={gradeModuleName}
              onChange={e => setGradeModuleName(e.target.value)}
              placeholder="e.g. Organic Chemistry"
              className="w-full bg-[var(--bg-surface)] border border-white/10 focus:border-teal-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[0.6rem] text-white/50 uppercase tracking-wide block mb-1.5">Current grade (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={currentGrade}
                onChange={e => setCurrentGrade(e.target.value)}
                placeholder="e.g. 58"
                className="w-full bg-[var(--bg-surface)] border border-white/10 focus:border-teal-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
              />
            </div>
            <div>
              <label className="font-mono text-[0.6rem] text-white/50 uppercase tracking-wide block mb-1.5">Target grade (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={targetGrade}
                onChange={e => setTargetGrade(e.target.value)}
                placeholder="e.g. 75"
                className="w-full bg-[var(--bg-surface)] border border-white/10 focus:border-teal-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="font-mono text-[0.6rem] text-white/50 uppercase tracking-wide block mb-1.5">
              Assessment weights (optional)
            </label>
            <input
              value={assessmentWeights}
              onChange={e => setAssessmentWeights(e.target.value)}
              placeholder="e.g. Assignments 30%, Exam 70%"
              className="w-full bg-[var(--bg-surface)] border border-white/10 focus:border-teal-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
            />
          </div>
          <button
            disabled={!currentGrade || !targetGrade}
            onClick={() => {
              setSubmitted(true)
              callApi({ currentGrade: Number(currentGrade), targetGrade: Number(targetGrade), assessmentWeights })
            }}
            className="w-full font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl transition-all"
          >
            Calculate
          </button>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          {/* STUDY PLAN */}
          {type === 'study_plan' && (() => {
            const plan = result.plan as {
              dailyPlan?: { day: string; focus: string; hours: number; tasks: string[]; tip?: string }[]
              warningFlags?: string[]
              motivationNote?: string
            }
            return (
              <>
                {plan?.warningFlags && plan.warningFlags.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                    {plan.warningFlags.map((flag, i) => (
                      <p key={i} className="font-mono text-[0.6rem] text-amber-400">⚠️ {flag}</p>
                    ))}
                  </div>
                )}
                <div className="space-y-3">
                  {plan?.dailyPlan?.map((day, i) => (
                    <div key={i} className="bg-[var(--bg-surface)] border border-teal-600/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-display font-bold text-sm text-teal-400">{day.day}</span>
                        <span className="font-mono text-[0.58rem] text-white/30">{day.hours}h</span>
                      </div>
                      <p className="font-body text-sm text-white/80 mb-2">{day.focus}</p>
                      <ul className="space-y-1">
                        {day.tasks.map((t, j) => (
                          <li key={j} className="font-mono text-[0.6rem] text-white/50 flex gap-1.5">
                            <span className="text-teal-600 flex-shrink-0">·</span>{t}
                          </li>
                        ))}
                      </ul>
                      {day.tip && (
                        <p className="font-mono text-[0.58rem] text-teal-400/60 mt-2 italic">💡 {day.tip}</p>
                      )}
                    </div>
                  ))}
                </div>
                {plan?.motivationNote && (
                  <p className="font-body text-sm text-white/40 italic text-center py-2">{plan.motivationNote}</p>
                )}
              </>
            )
          })()}

          {/* EXAM PREP */}
          {type === 'exam_prep' && (() => {
            const guide = result.guide as {
              prepPhases?: { phase: string; days: string; focus: string; dailyHours: number; techniques: string[]; milestone: string }[]
              studyTechniques?: { name: string; description: string; bestFor: string }[]
              dayBeforeTips?: string[]
              examDayTips?: string[]
              mentalHealthNote?: string
            }
            return (
              <>
                {guide?.prepPhases && guide.prepPhases.length > 0 && (
                  <div className="space-y-3">
                    <div className="font-mono text-[0.58rem] text-white/30 uppercase tracking-widest">Prep Phases</div>
                    {guide.prepPhases.map((phase, i) => (
                      <div key={i} className="bg-[var(--bg-surface)] border border-purple-500/20 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-display font-bold text-sm text-purple-300">{phase.phase}</span>
                          <span className="font-mono text-[0.55rem] text-white/30 flex-shrink-0">{phase.days}</span>
                        </div>
                        <p className="font-body text-sm text-white/70 mb-2">{phase.focus}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {phase.techniques.map((t, j) => (
                            <span key={j} className="font-mono text-[0.55rem] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                        <p className="font-mono text-[0.58rem] text-white/30 mt-2">✓ {phase.milestone}</p>
                      </div>
                    ))}
                  </div>
                )}
                {guide?.studyTechniques && guide.studyTechniques.length > 0 && (
                  <div>
                    <div className="font-mono text-[0.58rem] text-white/30 uppercase tracking-widest mb-2">Study Techniques</div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {guide.studyTechniques.map((t, i) => (
                        <div key={i} className="flex-shrink-0 bg-[var(--bg-surface)] border border-white/7 rounded-xl p-3 w-40">
                          <div className="font-display font-bold text-xs text-white mb-1">{t.name}</div>
                          <p className="font-mono text-[0.55rem] text-white/40 leading-relaxed">{t.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(guide?.dayBeforeTips || guide?.examDayTips) && (
                  <div className="grid grid-cols-2 gap-3">
                    {guide.dayBeforeTips && guide.dayBeforeTips.length > 0 && (
                      <div className="bg-[var(--bg-surface)] border border-white/7 rounded-xl p-3">
                        <div className="font-mono text-[0.55rem] text-amber-400 uppercase tracking-widest mb-2">Day Before</div>
                        <ul className="space-y-1.5">
                          {guide.dayBeforeTips.map((tip, i) => (
                            <li key={i} className="font-mono text-[0.58rem] text-white/50 flex gap-1.5"><span>·</span>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {guide.examDayTips && guide.examDayTips.length > 0 && (
                      <div className="bg-[var(--bg-surface)] border border-white/7 rounded-xl p-3">
                        <div className="font-mono text-[0.55rem] text-teal-400 uppercase tracking-widest mb-2">Exam Day</div>
                        <ul className="space-y-1.5">
                          {guide.examDayTips.map((tip, i) => (
                            <li key={i} className="font-mono text-[0.58rem] text-white/50 flex gap-1.5"><span>·</span>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {guide?.mentalHealthNote && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3">
                    <p className="font-body text-sm text-purple-300">💙 {guide.mentalHealthNote}</p>
                  </div>
                )}
              </>
            )
          })()}

          {/* GRADE CALCULATOR */}
          {type === 'grade_calculator' && (() => {
            const res = result.result as {
              requiredScore?: number
              isAchievable?: boolean
              explanation?: string
              advice?: string
              alternativeScenarios?: { targetGrade: number; requiredScore: number; label: string }[]
            }
            return (
              <>
                <div className="text-center py-4">
                  <div className={cn(
                    'font-display font-black text-6xl mb-2',
                    res?.requiredScore !== undefined && res.requiredScore > 100 ? 'text-red-400' : 'text-green-400'
                  )}>
                    {res?.requiredScore !== undefined ? `${res.requiredScore}%` : '—'}
                  </div>
                  <div className="font-mono text-[0.6rem] text-white/40 mb-3">Required on remaining assessment</div>
                  {res?.isAchievable !== undefined && (
                    <span className={cn(
                      'font-mono text-[0.6rem] px-3 py-1 rounded-full border',
                      res.isAchievable
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    )}>
                      {res.isAchievable ? '✓ Achievable' : '⚠ Very challenging'}
                    </span>
                  )}
                </div>
                {res?.explanation && (
                  <div className="bg-[var(--bg-surface)] border border-white/7 rounded-xl p-4">
                    <p className="font-body text-sm text-white/70 leading-relaxed">{res.explanation}</p>
                  </div>
                )}
                {res?.advice && (
                  <p className="font-body text-sm text-teal-400/80 leading-relaxed">{res.advice}</p>
                )}
                {res?.alternativeScenarios && res.alternativeScenarios.length > 0 && (
                  <div>
                    <div className="font-mono text-[0.58rem] text-white/30 uppercase tracking-widest mb-2">Alternative targets</div>
                    <div className="flex gap-2">
                      {res.alternativeScenarios.map((s, i) => (
                        <div key={i} className="flex-1 bg-[var(--bg-surface)] border border-white/7 rounded-xl p-3 text-center">
                          <div className="font-display font-black text-lg text-white">{s.requiredScore}%</div>
                          <div className="font-mono text-[0.55rem] text-white/30 mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => { setResult(null); setSubmitted(false); setCurrentGrade(''); setTargetGrade('') }}
                  className="w-full font-mono text-xs text-white/30 hover:text-white/50 py-2 transition-colors"
                >
                  ← Try different values
                </button>
              </>
            )
          })()}

          {/* CONFLICT CHECK */}
          {type === 'conflict_check' && (() => {
            const analysis = result.analysis as {
              conflictPeriods?: { dateRange: string; items: string[]; severity: 'high' | 'medium' | 'low'; suggestion: string }[]
              overallLoad?: string
              topPriority?: string
              rescheduleAdvice?: string
              burnoutRisk?: boolean
              burnoutNote?: string
            }
            const severityStyle = {
              high:   'bg-red-500/10 border-red-500/20 text-red-400',
              medium: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
              low:    'bg-teal-600/10 border-teal-600/20 text-teal-400',
            }
            return (
              <>
                {analysis?.overallLoad && (
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[0.58rem] text-white/40 uppercase tracking-widest">Overall load:</span>
                    <span className={cn(
                      'font-mono text-[0.6rem] px-2.5 py-1 rounded-full border',
                      analysis.overallLoad === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : analysis.overallLoad === 'heavy' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-teal-600/10 text-teal-400 border-teal-600/20'
                    )}>
                      {analysis.overallLoad}
                    </span>
                  </div>
                )}
                {analysis?.topPriority && (
                  <div className="bg-[var(--bg-surface)] border border-white/7 rounded-xl px-4 py-3">
                    <div className="font-mono text-[0.55rem] text-white/30 uppercase tracking-widest mb-1">Top priority</div>
                    <p className="font-display font-bold text-sm text-white">{analysis.topPriority}</p>
                  </div>
                )}
                {analysis?.conflictPeriods && analysis.conflictPeriods.length > 0 && (
                  <div className="space-y-3">
                    <div className="font-mono text-[0.58rem] text-white/30 uppercase tracking-widest">Conflict periods</div>
                    {analysis.conflictPeriods.map((period, i) => (
                      <div key={i} className={cn('rounded-xl p-4 border', severityStyle[period.severity] || severityStyle.low)}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-display font-bold text-sm">{period.dateRange}</span>
                          <span className="font-mono text-[0.55rem] uppercase">{period.severity}</span>
                        </div>
                        <ul className="space-y-0.5 mb-2">
                          {period.items.map((item, j) => (
                            <li key={j} className="font-mono text-[0.58rem] text-white/50">· {item}</li>
                          ))}
                        </ul>
                        <p className="font-mono text-[0.6rem] text-white/40">{period.suggestion}</p>
                      </div>
                    ))}
                  </div>
                )}
                {analysis?.rescheduleAdvice && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                    <p className="font-body text-sm text-blue-300">ℹ️ {analysis.rescheduleAdvice}</p>
                  </div>
                )}
                {analysis?.burnoutRisk && analysis.burnoutNote && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3">
                    <p className="font-body text-sm text-purple-300">💙 {analysis.burnoutNote}</p>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}
    </Modal>
  )
}
