'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { signals } from '@/store/signals'
import { cn } from '@/lib/utils'

interface SleepLog {
  id: string
  sleep_date: string
  bedtime: string
  wake_time: string
  quality: number | null
  notes: string | null
}

type TabId = 'log' | 'stats' | 'chronotype'

// Chronotype quiz
const QUIZ_QUESTIONS = [
  {
    q: 'Without an alarm, when do you naturally wake up?',
    options: ['Before 6 am', '6–7 am', '7–8 am', 'After 8 am'],
  },
  {
    q: 'When do you feel sharpest for studying?',
    options: ['Early morning (before 9)', 'Late morning (9–12)', 'Afternoon (12–6)', 'Evening / night'],
  },
  {
    q: 'How hard is it to wake up at 6 am?',
    options: ['Easy — I\'m up', 'Slightly hard', 'Hard', 'Very hard'],
  },
  {
    q: 'When are you most creative / productive?',
    options: ['Before 9 am', '9 am – noon', 'Noon – 6 pm', 'After 6 pm'],
  },
  {
    q: 'When do you naturally start feeling sleepy?',
    options: ['Before 9 pm', '9–11 pm', '11 pm – 1 am', 'After 1 am'],
  },
]

// sleep duration in hours between two time strings
function sleepHours(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  let diff = (wh * 60 + wm) - (bh * 60 + bm)
  if (diff < 0) diff += 24 * 60
  return Math.round((diff / 60) * 10) / 10
}

function qualityEmoji(q: number) {
  return ['', '😴', '😕', '😐', '😊', '🌟'][q] ?? ''
}

function hoursColor(h: number) {
  if (h >= 7)   return '#4ecf9e'
  if (h >= 6)   return '#f59e0b'
  return '#FB7185'
}

interface SleepModuleProps {
  initialLogs: SleepLog[]
  userId: string
  today: string
}

export default function SleepModule({ initialLogs, userId, today }: SleepModuleProps) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<TabId>('log')
  const [logs, setLogs] = useState<SleepLog[]>(initialLogs)

  // Log form state
  const [bedtime, setBedtime]     = useState('22:30')
  const [wakeTime, setWakeTime]   = useState('06:30')
  const [quality, setQuality]     = useState<number>(4)
  const [notes, setNotes]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)

  // Chronotype quiz state
  const [answers, setAnswers]     = useState<number[]>(Array(5).fill(-1))
  const [quizDone, setQuizDone]   = useState(false)

  // Pre-fill today's log if it exists
  useEffect(() => {
    const todayLog = logs.find(l => l.sleep_date === today)
    if (todayLog) {
      setBedtime(todayLog.bedtime.slice(0, 5))
      setWakeTime(todayLog.wake_time.slice(0, 5))
      setQuality(todayLog.quality ?? 4)
      setNotes(todayLog.notes ?? '')
      setEditId(todayLog.id)
    }
  }, [logs, today])

  // Load quiz from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chronotype_answers')
    if (saved) { setAnswers(JSON.parse(saved)); setQuizDone(true) }
  }, [])

  const saveLog = useCallback(async () => {
    setSaving(true)
    const payload = {
      user_id: userId,
      sleep_date: today,
      bedtime: bedtime + ':00',
      wake_time: wakeTime + ':00',
      quality,
      notes: notes.trim() || null,
    }

    let error
    if (editId) {
      const res = await supabase.from('sleep_logs').update(payload).eq('id', editId).select().single()
      error = res.error
      if (!error && res.data) {
        setLogs(prev => prev.map(l => l.id === editId ? res.data as SleepLog : l))
      }
    } else {
      const res = await supabase.from('sleep_logs').insert(payload).select().single()
      error = res.error
      if (!error && res.data) {
        setLogs(prev => [res.data as SleepLog, ...prev])
        setEditId((res.data as SleepLog).id)
      }
    }

    if (error) toast.error('Failed to save sleep log')
    else {
      toast.success('Sleep logged ✓')
      const hrs = sleepHours(bedtime, wakeTime)
      signals.emit({ type: 'sleep_logged', payload: { hoursSlept: hrs, quality: quality ?? 3 } })
    }
    setSaving(false)
  }, [supabase, userId, today, bedtime, wakeTime, quality, notes, editId])

  async function deleteLog(id: string) {
    setLogs(prev => prev.filter(l => l.id !== id))
    if (editId === id) setEditId(null)
    await supabase.from('sleep_logs').delete().eq('id', id)
    toast.success('Removed')
  }

  // Stats derived from logs
  const recentLogs = [...logs].sort((a, b) => b.sleep_date.localeCompare(a.sleep_date)).slice(0, 7)
  const avgHours = recentLogs.length > 0
    ? recentLogs.reduce((s, l) => s + sleepHours(l.bedtime, l.wake_time), 0) / recentLogs.length
    : 0
  const sleepDebt = recentLogs.length > 0
    ? Math.max(0, recentLogs.reduce((s, l) => s + (7 - sleepHours(l.bedtime, l.wake_time)), 0))
    : 0

  // Chronotype scoring
  const quizScore = answers.reduce((s, a) => s + (a >= 0 ? a + 1 : 0), 0)
  const chronotype = quizScore <= 9
    ? { name: 'Lion 🦁', desc: 'Early bird. Peak performance before noon. Schedule your hardest modules for 7–10 am.', color: '#f59e0b' }
    : quizScore <= 14
    ? { name: 'Bear 🐻', desc: 'Goes with the sun. Most productive 9 am–2 pm. Study mid-morning, admin in afternoon.', color: '#4ecf9e' }
    : { name: 'Wolf 🐺', desc: 'Night owl. Peak creativity after 6 pm. Lean into late-night study sessions — they\'re genuinely your best hours.', color: '#818CF8' }

  const todayHours = (() => {
    const todayLog = logs.find(l => l.sleep_date === today)
    return todayLog ? sleepHours(todayLog.bedtime, todayLog.wake_time) : null
  })()

  return (
    <div className="space-y-0">
      {/* Tabs */}
      <div className="flex border-b border-white/7 mb-4">
        {([
          { id: 'log' as TabId,        label: 'Log Sleep',  icon: '🌙' },
          { id: 'stats' as TabId,      label: 'Stats',      icon: '📊' },
          { id: 'chronotype' as TabId, label: 'Chronotype', icon: '🦁' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-3 font-display text-xs font-bold transition-all relative whitespace-nowrap"
            style={{
              color: activeTab === tab.id ? '#818CF8' : 'rgba(255,255,255,0.38)',
              borderBottom: activeTab === tab.id ? '2px solid #818CF8' : '2px solid transparent',
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Log tab ─── */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          {/* Today's summary chip */}
          {todayHours !== null && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{ background: `${hoursColor(todayHours)}18`, border: `0.5px solid ${hoursColor(todayHours)}40` }}>
              <span style={{ color: hoursColor(todayHours), fontSize: '1.2rem' }}>
                {todayHours >= 7 ? '✨' : todayHours >= 6 ? '⚠️' : '😴'}
              </span>
              <div>
                <div className="font-display font-bold text-sm text-white">
                  {todayHours}h logged for today
                </div>
                <div className="font-mono text-[0.55rem] text-white/40">
                  {todayHours >= 8 ? 'Excellent recovery' : todayHours >= 7 ? 'Good — aim for 7–9h' : todayHours >= 6 ? 'Slightly short — one more hour helps a lot' : 'Significantly sleep deprived — rest is productive'}
                </div>
              </div>
            </div>
          )}

          {/* Form card */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 space-y-4">
            <div className="font-mono text-[0.58rem] text-white/35 uppercase tracking-widest">
              {editId ? 'Update today\'s sleep' : 'Log last night\'s sleep'}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[0.58rem] text-white/40 block mb-1.5">Bed time</label>
                <input
                  type="time"
                  value={bedtime}
                  onChange={e => setBedtime(e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="font-mono text-[0.58rem] text-white/40 block mb-1.5">Wake time</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={e => setWakeTime(e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-all"
                />
              </div>
            </div>

            {/* Duration preview */}
            {bedtime && wakeTime && (
              <div className="flex items-center gap-2">
                <div className="font-mono text-[0.6rem] text-white/30">Duration:</div>
                <div
                  className="font-display font-black text-base"
                  style={{ color: hoursColor(sleepHours(bedtime, wakeTime)) }}
                >
                  {sleepHours(bedtime, wakeTime)}h
                </div>
                {sleepHours(bedtime, wakeTime) < 6 && (
                  <div className="font-mono text-[0.55rem] text-rose-400">Too short — cognitive function drops significantly below 6h</div>
                )}
              </div>
            )}

            {/* Quality */}
            <div>
              <label className="font-mono text-[0.58rem] text-white/40 block mb-2">Sleep quality</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(q => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl text-lg transition-all border',
                      quality === q
                        ? 'border-indigo-500/50 bg-indigo-500/15'
                        : 'border-white/8 bg-white/4 opacity-50 hover:opacity-80'
                    )}
                  >
                    {qualityEmoji(q)}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="font-mono text-[0.58rem] text-white/40 block mb-1.5">Notes (optional)</label>
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. stressed about exam, woke up twice"
                className="w-full bg-[var(--bg-base)] border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition-all"
              />
            </div>

            <button
              onClick={saveLog}
              disabled={saving}
              className="w-full font-display font-bold text-sm py-3 rounded-xl transition-all disabled:opacity-50"
              style={{ background: 'rgba(129,140,248,0.15)', border: '0.5px solid rgba(129,140,248,0.35)', color: '#818CF8' }}
            >
              {saving ? 'Saving…' : editId ? '✓ Update Sleep Log' : '🌙 Log Sleep'}
            </button>
          </div>

          {/* Recent logs list */}
          {recentLogs.length > 0 && (
            <div>
              <div className="font-mono text-[0.58rem] text-white/30 uppercase tracking-widest mb-2">Recent nights</div>
              <div className="space-y-2">
                {recentLogs.map(log => {
                  const h = sleepHours(log.bedtime, log.wake_time)
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 group"
                    >
                      <div
                        className="w-1.5 h-8 rounded-full flex-shrink-0"
                        style={{ background: hoursColor(h) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-display font-bold text-sm text-white">{log.sleep_date}</div>
                          <div className="font-mono text-[0.58rem] font-bold" style={{ color: hoursColor(h) }}>{h}h</div>
                          {log.quality && <span className="text-sm">{qualityEmoji(log.quality)}</span>}
                        </div>
                        <div className="font-mono text-[0.55rem] text-white/30">
                          {log.bedtime.slice(0, 5)} → {log.wake_time.slice(0, 5)}
                          {log.notes && ` · ${log.notes}`}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteLog(log.id)}
                        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all text-xs flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Stats tab ─── */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {recentLogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🌙</div>
              <div className="font-display font-bold text-white mb-1">No sleep data yet</div>
              <div className="font-mono text-[0.6rem] text-white/30">Log a few nights to see your stats</div>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3 text-center">
                  <div className="font-display font-black text-lg" style={{ color: hoursColor(avgHours) }}>{avgHours.toFixed(1)}h</div>
                  <div className="font-mono text-[0.55rem] text-white/35 mt-0.5">Avg / night</div>
                </div>
                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3 text-center">
                  <div className="font-display font-black text-lg" style={{ color: sleepDebt > 5 ? '#FB7185' : sleepDebt > 2 ? '#f59e0b' : '#4ecf9e' }}>
                    {sleepDebt.toFixed(1)}h
                  </div>
                  <div className="font-mono text-[0.55rem] text-white/35 mt-0.5">Sleep debt</div>
                </div>
                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3 text-center">
                  <div className="font-display font-black text-lg text-indigo-400">{recentLogs.length}</div>
                  <div className="font-mono text-[0.55rem] text-white/35 mt-0.5">Nights logged</div>
                </div>
              </div>

              {/* 7-day bar chart */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4">
                <div className="font-mono text-[0.58rem] text-white/30 uppercase tracking-widest mb-3">Last 7 nights</div>
                <div className="flex items-end gap-2 h-24">
                  {recentLogs.slice(0, 7).reverse().map(log => {
                    const h = sleepHours(log.bedtime, log.wake_time)
                    const pct = Math.min(h / 10, 1)
                    const date = log.sleep_date.slice(5) // MM-DD
                    return (
                      <div key={log.id} className="flex-1 flex flex-col items-center gap-1">
                        <div className="font-mono text-[0.5rem] text-white/30">{h}h</div>
                        <div
                          className="w-full rounded-t-md transition-all"
                          style={{
                            height: `${pct * 72}px`,
                            minHeight: 4,
                            background: hoursColor(h),
                            opacity: 0.85,
                          }}
                        />
                        <div className="font-mono text-[0.48rem] text-white/25 text-center leading-tight">{date}</div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-teal-400" />
                    <div className="font-mono text-[0.52rem] text-white/35">7h+ (goal)</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <div className="font-mono text-[0.52rem] text-white/35">6–7h</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-400" />
                    <div className="font-mono text-[0.52rem] text-white/35">&lt;6h</div>
                  </div>
                </div>
              </div>

              {/* Sleep debt explainer */}
              {sleepDebt > 2 && (
                <div
                  className="rounded-xl p-4 space-y-2"
                  style={{ background: 'rgba(251,113,133,0.07)', border: '0.5px solid rgba(251,113,133,0.2)' }}
                >
                  <div className="font-mono text-[0.58rem] text-rose-400 uppercase tracking-widest">
                    ⚠️ Sleep debt: {sleepDebt.toFixed(1)}h
                  </div>
                  <div className="font-body text-sm text-white/70 leading-relaxed">
                    You&apos;ve accumulated {sleepDebt.toFixed(1)} hours of sleep debt this week. Your memory consolidation, focus span, and exam recall all drop significantly with each additional hour of debt. You cannot fully &ldquo;catch up&rdquo; in one sleep — spread recovery across 2–3 nights.
                  </div>
                </div>
              )}

              {/* Exam tips */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4">
                <div className="font-mono text-[0.58rem] text-indigo-400 uppercase tracking-widest mb-3">🧠 Sleep science for exams</div>
                <div className="space-y-2.5">
                  {[
                    { tip: 'Sleep consolidates memory', detail: 'Your brain replays what you studied during slow-wave sleep. Reviewing notes right before bed then sleeping 7h outperforms a midnight study session.' },
                    { tip: 'REM sleep = creative thinking', detail: 'REM sleep (mostly in the last 2h) is when your brain connects concepts. Cutting sleep short kills this phase first.' },
                    { tip: 'All-nighters decrease performance', detail: '24h without sleep = BAC equivalent of 0.10%. You feel productive but your recall, problem solving and writing quality drop measurably.' },
                    { tip: 'Consistent wake time is key', detail: 'Keeping the same wake time (even on weekends) stabilises your circadian rhythm and makes early lectures manageable.' },
                  ].map(item => (
                    <div key={item.tip} className="flex gap-3">
                      <div className="w-1 bg-indigo-500/40 rounded-full flex-shrink-0 mt-1" />
                      <div>
                        <div className="font-display font-bold text-sm text-white">{item.tip}</div>
                        <div className="font-body text-[0.78rem] text-white/50 leading-relaxed mt-0.5">{item.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Chronotype tab ─── */}
      {activeTab === 'chronotype' && (
        <div className="space-y-4">
          {quizDone ? (
            <>
              {/* Result card */}
              <div
                className="rounded-2xl p-5 text-center"
                style={{ background: `${chronotype.color}12`, border: `0.5px solid ${chronotype.color}35` }}
              >
                <div className="text-4xl mb-2">{chronotype.name.split(' ')[1]}</div>
                <div className="font-display font-black text-xl text-white mb-1">{chronotype.name}</div>
                <div className="font-body text-sm text-white/65 leading-relaxed max-w-xs mx-auto">{chronotype.desc}</div>
              </div>

              {/* Score breakdown */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4">
                <div className="font-mono text-[0.58rem] text-white/30 uppercase tracking-widest mb-3">Your chronotype spectrum</div>
                <div className="relative h-2 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{
                      width: `${((quizScore - 5) / 15) * 100}%`,
                      background: `linear-gradient(90deg, #f59e0b, #4ecf9e, #818CF8)`,
                    }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-lg"
                    style={{
                      left: `calc(${((quizScore - 5) / 15) * 100}% - 6px)`,
                      background: chronotype.color,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <div className="font-mono text-[0.52rem] text-amber-400">Lion</div>
                  <div className="font-mono text-[0.52rem] text-teal-400">Bear</div>
                  <div className="font-mono text-[0.52rem] text-indigo-400">Wolf</div>
                </div>
              </div>

              <button
                onClick={() => { setAnswers(Array(5).fill(-1)); setQuizDone(false); localStorage.removeItem('chronotype_answers') }}
                className="w-full font-mono text-[0.6rem] text-white/30 hover:text-white/50 py-2 transition-colors"
              >
                Retake quiz
              </button>
            </>
          ) : (
            <>
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4">
                <div className="font-display font-bold text-white mb-1">Discover your chronotype</div>
                <div className="font-body text-sm text-white/55 mb-4">
                  Your chronotype is your body&apos;s natural sleep–wake preference. Knowing it lets you schedule study sessions at your peak cognitive hours.
                </div>
                <div className="space-y-5">
                  {QUIZ_QUESTIONS.map((q, qi) => (
                    <div key={qi}>
                      <div className="font-display font-bold text-sm text-white mb-2">
                        <span className="font-mono text-[0.58rem] text-indigo-400 mr-2">{qi + 1}.</span>
                        {q.q}
                      </div>
                      <div className="space-y-1.5">
                        {q.options.map((opt, oi) => (
                          <button
                            key={oi}
                            onClick={() => setAnswers(prev => { const n = [...prev]; n[qi] = oi; return n })}
                            className={cn(
                              'w-full text-left px-3 py-2.5 rounded-xl border font-body text-sm transition-all',
                              answers[qi] === oi
                                ? 'bg-indigo-500/15 border-indigo-500/40 text-white'
                                : 'bg-[var(--bg-base)] border-white/8 text-white/55 hover:border-white/15'
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  if (answers.some(a => a === -1)) { toast.error('Answer all questions first'); return }
                  localStorage.setItem('chronotype_answers', JSON.stringify(answers))
                  setQuizDone(true)
                }}
                disabled={answers.some(a => a === -1)}
                className="w-full font-display font-bold text-sm py-3 rounded-xl transition-all disabled:opacity-40"
                style={{ background: 'rgba(129,140,248,0.15)', border: '0.5px solid rgba(129,140,248,0.35)', color: '#818CF8' }}
              >
                See my chronotype →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
