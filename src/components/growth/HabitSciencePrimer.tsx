'use client'

import { useState, useEffect } from 'react'

const ACCENT = '#c084fc'
const LS_STACKS_KEY = 'varsity_habit_stacks'
const LS_STREAK_KEY = 'varsity_habit_streak'
const LS_IDENTITY_KEY = 'varsity_identity_habits'

interface HabitStack { id: number; existing: string; newHabit: string }
interface IdentityStatement { id: number; text: string }

function loadStacks(): HabitStack[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS_STACKS_KEY) ?? '[]') } catch { return [] }
}
function saveStacks(s: HabitStack[]) {
  if (typeof window !== 'undefined') localStorage.setItem(LS_STACKS_KEY, JSON.stringify(s))
}

function loadStreak(): boolean[] {
  if (typeof window === 'undefined') return Array(42).fill(false)
  try {
    const raw = JSON.parse(localStorage.getItem(LS_STREAK_KEY) ?? 'null')
    if (Array.isArray(raw) && raw.length === 42) return raw
    return Array(42).fill(false)
  } catch { return Array(42).fill(false) }
}
function saveStreak(s: boolean[]) {
  if (typeof window !== 'undefined') localStorage.setItem(LS_STREAK_KEY, JSON.stringify(s))
}

function loadIdentity(): IdentityStatement[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS_IDENTITY_KEY) ?? '[]') } catch { return [] }
}
function saveIdentity(s: IdentityStatement[]) {
  if (typeof window !== 'undefined') localStorage.setItem(LS_IDENTITY_KEY, JSON.stringify(s))
}

function calcStreakCount(grid: boolean[]): number {
  let count = 0
  for (let i = grid.length - 1; i >= 0; i--) {
    if (grid[i]) count++
    else break
  }
  return count
}

function getTwoMinVersion(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes('exercise') || lower.includes('gym') || lower.includes('workout') || lower.includes('run')) {
    return 'Do 5 jumping jacks right now — that is it. Just start moving for 2 minutes.'
  }
  if (lower.includes('read') || lower.includes('book')) {
    return 'Read one paragraph — just one. Then decide if you want to continue.'
  }
  if (lower.includes('study') || lower.includes('notes') || lower.includes('lecture') || lower.includes('revision')) {
    return 'Open your notes and read the first heading. Sit there for 2 minutes. That is enough to start.'
  }
  if (lower.includes('meditat') || lower.includes('breath') || lower.includes('mindful')) {
    return 'Close your eyes and take 3 slow deep breaths. That is your 2-minute meditation.'
  }
  if (lower.includes('journal') || lower.includes('writ') || lower.includes('diary')) {
    return 'Write one sentence about how you feel right now. One sentence. Done.'
  }
  if (lower.includes('cook') || lower.includes('meal') || lower.includes('eat')) {
    return 'Fill the kettle and get one ingredient out of the cupboard. You have started.'
  }
  if (lower.includes('clean') || lower.includes('tidy') || lower.includes('organis')) {
    return 'Pick up one thing and put it where it belongs. One thing. That is the habit starting.'
  }
  return 'Do just the very first step for 2 minutes — open the thing, put on the shoes, sit in the chair. Starting is the habit.'
}

type Tab = 'loop' | 'stacking' | 'twominute' | 'streak' | 'identity' | 'ubuntu'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'loop',       label: 'Habit Loop',   emoji: '🔄' },
  { id: 'stacking',   label: 'Stacking',     emoji: '🧱' },
  { id: 'twominute',  label: '2-Min Rule',   emoji: '⏱️' },
  { id: 'streak',     label: 'Streak',       emoji: '🔥' },
  { id: 'identity',   label: 'Identity',     emoji: '🪞' },
  { id: 'ubuntu',     label: 'Ubuntu',       emoji: '🤝' },
]

export default function HabitSciencePrimer() {
  const [tab, setTab] = useState<Tab>('loop')
  const [stacks, setStacks] = useState<HabitStack[]>([])
  const [stackExisting, setStackExisting] = useState('')
  const [stackNew, setStackNew] = useState('')
  const [twoMinInput, setTwoMinInput] = useState('')
  const [twoMinResult, setTwoMinResult] = useState('')
  const [grid, setGrid] = useState<boolean[]>(Array(42).fill(false))
  const [identity, setIdentity] = useState<IdentityStatement[]>([])
  const [identityInputs, setIdentityInputs] = useState<[string, string, string]>(['', '', ''])
  const [identitySaved, setIdentitySaved] = useState(false)

  useEffect(() => {
    setStacks(loadStacks())
    setGrid(loadStreak())
    const saved = loadIdentity()
    setIdentity(saved)
    if (saved.length > 0) {
      setIdentityInputs([
        saved[0]?.text ?? '',
        saved[1]?.text ?? '',
        saved[2]?.text ?? '',
      ])
    }
  }, [])

  const addStack = () => {
    if (!stackExisting.trim() || !stackNew.trim()) return
    const updated = [...stacks, { id: Date.now(), existing: stackExisting.trim(), newHabit: stackNew.trim() }]
    setStacks(updated)
    saveStacks(updated)
    setStackExisting('')
    setStackNew('')
  }

  const removeStack = (id: number) => {
    const updated = stacks.filter(s => s.id !== id)
    setStacks(updated)
    saveStacks(updated)
  }

  const toggleGrid = (i: number) => {
    const updated = [...grid]
    updated[i] = !updated[i]
    setGrid(updated)
    saveStreak(updated)
  }

  const saveIdentityStatements = () => {
    const statements: IdentityStatement[] = identityInputs
      .filter(t => t.trim() !== '')
      .map((text, i) => ({ id: i, text: text.trim() }))
    setIdentity(statements)
    saveIdentity(statements)
    setIdentitySaved(true)
    setTimeout(() => setIdentitySaved(false), 2000)
  }

  const streakCount = calcStreakCount(grid)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(192,132,252,0.25)`, borderRadius: 16, padding: '16px 18px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ACCENT},transparent)` }} />
        <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: ACCENT, letterSpacing: '0.09em', marginBottom: 4 }}>HABIT SCIENCE PRIMER</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>The science of building habits that stick</div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 3 }}>James Clear, BJ Fogg, and neuroscience — adapted for your student life.</div>
      </div>

      <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '1px solid var(--border-subtle)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flexShrink: 0, padding: '8px 10px',
              background: 'none', border: 'none',
              borderBottom: tab === t.id ? `2px solid ${ACCENT}` : '2px solid transparent',
              color: tab === t.id ? ACCENT : 'var(--text-tertiary)',
              fontSize: '0.63rem', fontFamily: 'var(--font-mono)', fontWeight: tab === t.id ? 700 : 400,
              cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap',
            }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {tab === 'loop' && <HabitLoopSection />}
      {tab === 'stacking' && (
        <StackingSection
          stacks={stacks}
          existing={stackExisting}
          newHabit={stackNew}
          onExistingChange={setStackExisting}
          onNewChange={setStackNew}
          onAdd={addStack}
          onRemove={removeStack}
        />
      )}
      {tab === 'twominute' && (
        <TwoMinSection
          input={twoMinInput}
          result={twoMinResult}
          onInputChange={setTwoMinInput}
          onGenerate={() => setTwoMinResult(getTwoMinVersion(twoMinInput))}
        />
      )}
      {tab === 'streak' && (
        <StreakSection grid={grid} streakCount={streakCount} onToggle={toggleGrid} />
      )}
      {tab === 'identity' && (
        <IdentitySection
          inputs={identityInputs}
          savedStatements={identity}
          onInputChange={(i, val) => {
            const updated: [string, string, string] = [...identityInputs]
            updated[i] = val
            setIdentityInputs(updated)
          }}
          onSave={saveIdentityStatements}
          saved={identitySaved}
        />
      )}
      {tab === 'ubuntu' && <UbuntuSection />}
    </div>
  )
}

function HabitLoopSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        Every habit — good or bad — follows the same three-part loop. Understanding it gives you the power to reshape any behaviour.
      </div>

      <div style={{ position: 'relative', padding: '32px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 220, height: 220 }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 72, height: 72, borderRadius: '50%', background: `rgba(192,132,252,0.12)`, border: `2px solid ${ACCENT}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <div style={{ fontSize: '1.1rem' }}>👁️</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: ACCENT, fontFamily: 'var(--font-mono)' }}>CUE</div>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 72, height: 72, borderRadius: '50%', background: 'rgba(52,211,153,0.1)', border: '2px solid var(--teal, #34D399)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <div style={{ fontSize: '1.1rem' }}>⚙️</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--teal, #34D399)', fontFamily: 'var(--font-mono)' }}>ROUTINE</div>
          </div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 72, height: 72, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', border: '2px solid var(--gold, #FBBF24)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <div style={{ fontSize: '1.1rem' }}>🎯</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--gold, #FBBF24)', fontFamily: 'var(--font-mono)' }}>REWARD</div>
          </div>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} viewBox="0 0 220 220" fill="none">
            <path d="M 110 72 Q 50 100 60 148" stroke="rgba(192,132,252,0.4)" strokeWidth="1.5" strokeDasharray="4 3" fill="none" markerEnd="url(#arrowPurple)" />
            <path d="M 90 162 Q 110 175 130 162" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" strokeDasharray="4 3" fill="none" markerEnd="url(#arrowGreen)" />
            <path d="M 160 148 Q 170 100 110 72" stroke="rgba(251,191,36,0.4)" strokeWidth="1.5" strokeDasharray="4 3" fill="none" markerEnd="url(#arrowGold)" />
            <defs>
              <marker id="arrowPurple" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 z" fill="rgba(192,132,252,0.6)" />
              </marker>
              <marker id="arrowGreen" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 z" fill="rgba(52,211,153,0.6)" />
              </marker>
              <marker id="arrowGold" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 z" fill="rgba(251,191,36,0.6)" />
              </marker>
            </defs>
          </svg>
        </div>
      </div>

      {[
        { emoji: '👁️', label: 'Cue', color: ACCENT, bg: 'rgba(192,132,252,0.07)', border: 'rgba(192,132,252,0.2)', description: 'The trigger that initiates the behaviour.', example: 'Example: Sitting down at your desk triggers the habit of opening social media.' },
        { emoji: '⚙️', label: 'Routine', color: 'var(--teal, #34D399)', bg: 'rgba(52,211,153,0.07)', border: 'rgba(52,211,153,0.2)', description: 'The behaviour itself — what you actually do.', example: 'Example: You scroll Instagram for 20 minutes without thinking.' },
        { emoji: '🎯', label: 'Reward', color: 'var(--gold, #FBBF24)', bg: 'rgba(251,191,36,0.07)', border: 'rgba(251,191,36,0.2)', description: 'The benefit that reinforces the loop and makes it stick.', example: 'Example: Dopamine hit from likes and new content. Your brain records: repeat this.' },
      ].map(item => (
        <div key={item.label} style={{ background: item.bg, border: `1px solid ${item.border}`, borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>{item.emoji}</div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 6 }}>{item.description}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.55, fontStyle: 'italic' }}>{item.example}</div>
            </div>
          </div>
        </div>
      ))}

      <div style={{ padding: '12px 14px', background: `rgba(192,132,252,0.06)`, border: `1px solid rgba(192,132,252,0.15)`, borderRadius: 12, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.65, fontStyle: 'italic' }}>
        &ldquo;Habits are not a finish line to be crossed — they are a lifestyle to be lived.&rdquo; — James Clear
      </div>
    </div>
  )
}

function StackingSection({ stacks, existing, newHabit, onExistingChange, onNewChange, onAdd, onRemove }: {
  stacks: HabitStack[]
  existing: string
  newHabit: string
  onExistingChange: (v: string) => void
  onNewChange: (v: string) => void
  onAdd: () => void
  onRemove: (id: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Habit stacking</strong> is one of the most powerful techniques for building new habits. Instead of starting from scratch, you link a new behaviour to something you already do without thinking.
      </div>
      <div style={{ padding: '12px 14px', background: `rgba(192,132,252,0.06)`, border: `1px solid rgba(192,132,252,0.15)`, borderRadius: 12 }}>
        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: ACCENT, marginBottom: 6 }}>THE FORMULA</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 600 }}>
          &ldquo;After I <span style={{ color: ACCENT }}>[existing habit]</span>, I will <span style={{ color: 'var(--teal, #34D399)' }}>[new habit]</span>.&rdquo;
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px' }}>
        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 10 }}>BUILD YOUR STACK</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>After I...</div>
            <input
              value={existing}
              onChange={e => onExistingChange(e.target.value)}
              placeholder="e.g. make my morning coffee"
              style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>I will...</div>
            <input
              value={newHabit}
              onChange={e => onNewChange(e.target.value)}
              placeholder="e.g. review yesterday's lecture notes for 5 minutes"
              style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={onAdd}
            disabled={!existing.trim() || !newHabit.trim()}
            style={{ padding: '10px 0', background: `rgba(192,132,252,0.1)`, border: `1px solid rgba(192,132,252,0.3)`, borderRadius: 10, color: ACCENT, fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer', opacity: !existing.trim() || !newHabit.trim() ? 0.4 : 1 }}>
            + Add to my stack
          </button>
        </div>
      </div>

      {stacks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>MY HABIT STACKS</div>
          {stacks.map(stack => (
            <div key={stack.id} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 3 }}>After I...</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5 }}>{stack.existing}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 3 }}>I will...</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: ACCENT }}>{stack.newHabit}</div>
              </div>
              <button onClick={() => onRemove(stack.id)} style={{ marginLeft: 10, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {stacks.length === 0 && (
        <div style={{ padding: '14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
          Your habit stacks will appear here.
        </div>
      )}
    </div>
  )
}

function TwoMinSection({ input, result, onInputChange, onGenerate }: {
  input: string
  result: string
  onInputChange: (v: string) => void
  onGenerate: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>The 2-Minute Rule</strong>: When you start a new habit, it should take less than two minutes to do. The goal is not to do the full habit — it is to start the habit.
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { full: 'Study for an hour', two: 'Open your notes' },
          { full: 'Run 5km', two: 'Put on running shoes' },
          { full: 'Read a book chapter', two: 'Read one page' },
        ].map(ex => (
          <div key={ex.full} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 10px' }}>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginBottom: 2 }}>Full habit</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.4 }}>{ex.full}</div>
            <div style={{ fontSize: '0.67rem', color: ACCENT, marginBottom: 2 }}>2-min version</div>
            <div style={{ fontSize: '0.72rem', color: ACCENT, fontWeight: 600, lineHeight: 1.4 }}>{ex.two}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px' }}>
        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 10 }}>TRY IT — ENTER YOUR HABIT</div>
        <input
          value={input}
          onChange={e => onInputChange(e.target.value)}
          placeholder="e.g. exercise every morning"
          style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
        />
        <button
          onClick={onGenerate}
          disabled={!input.trim()}
          style={{ width: '100%', padding: '10px 0', background: `rgba(192,132,252,0.1)`, border: `1px solid rgba(192,132,252,0.3)`, borderRadius: 10, color: ACCENT, fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer', opacity: !input.trim() ? 0.4 : 1 }}>
          Get 2-min version ⏱️
        </button>
      </div>

      {result && (
        <div style={{ background: `rgba(192,132,252,0.08)`, border: `1px solid rgba(192,132,252,0.3)`, borderRadius: 14, padding: '16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ACCENT},transparent)` }} />
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: ACCENT, marginBottom: 8 }}>YOUR 2-MINUTE VERSION</div>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.65 }}>{result}</div>
        </div>
      )}

      <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.65, fontStyle: 'italic' }}>
        &ldquo;The secret is to always stay below the point where it feels like work.&rdquo; — James Clear
      </div>
    </div>
  )
}

function StreakSection({ grid, streakCount, onToggle }: { grid: boolean[]; streakCount: number; onToggle: (i: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Never Miss Twice</strong> — the rule that saves every streak. Missing once is an accident. Missing twice is starting a new habit.
      </div>
      <div style={{ padding: '12px 14px', background: `rgba(192,132,252,0.07)`, border: `1px solid rgba(192,132,252,0.2)`, borderRadius: 12, fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.65, fontStyle: 'italic' }}>
        &ldquo;Lost days hurt you more than successful days help you. If you miss one day, you lose momentum. If you miss two, you lose the habit. Never miss twice.&rdquo; — James Clear
      </div>

      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>42-DAY TRACKER (6 WEEKS)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: '1.1rem' }}>🔥</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: ACCENT }}>{streakCount}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>day streak</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 2 }}>{d}</div>
          ))}
          {grid.map((filled, i) => (
            <button
              key={i}
              onClick={() => onToggle(i)}
              style={{
                width: '100%', aspectRatio: '1', borderRadius: '50%',
                background: filled ? ACCENT : 'rgba(255,255,255,0.07)',
                border: `1.5px solid ${filled ? ACCENT : 'rgba(255,255,255,0.1)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: filled ? `0 0 6px rgba(192,132,252,0.4)` : 'none',
              }}
            />
          ))}
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 10, fontSize: '0.62rem', color: 'var(--text-muted)' }}>
          <span>Tap a circle to mark as complete</span>
          <span style={{ marginLeft: 'auto' }}>{grid.filter(Boolean).length}/42 days</span>
        </div>
      </div>
    </div>
  )
}

function IdentitySection({ inputs, savedStatements, onInputChange, onSave, saved }: {
  inputs: [string, string, string]
  savedStatements: IdentityStatement[]
  onInputChange: (i: number, val: string) => void
  onSave: () => void
  saved: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        <strong style={{ color: ACCENT }}>Identity-based habits</strong> are the most powerful kind. Instead of focusing on what you want to achieve, focus on who you want to become. The goal is not to finish a book — it is to become a reader.
      </div>
      <div style={{ padding: '12px 14px', background: `rgba(192,132,252,0.06)`, border: `1px solid rgba(192,132,252,0.15)`, borderRadius: 12 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: ACCENT, marginBottom: 6 }}>The shift</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { from: 'I want to study more.', to: 'I am a student who studies every day.' },
            { from: 'I want to be healthier.', to: 'I am a person who moves their body daily.' },
            { from: 'I want to save money.', to: 'I am someone who spends with intention.' },
          ].map((shift, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.73rem' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }}>✕</span>
              <span style={{ color: 'var(--text-muted)', flex: 1 }}>{shift.from}</span>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }}>→</span>
              <span style={{ color: ACCENT, flex: 1, fontWeight: 600 }}>{shift.to}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px' }}>
        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 10 }}>WRITE YOUR IDENTITY STATEMENTS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {([0, 1, 2] as const).map(i => (
            <input
              key={i}
              value={inputs[i]}
              onChange={e => onInputChange(i, e.target.value)}
              placeholder={i === 0 ? 'I am a student who...' : i === 1 ? 'I am a person who...' : 'I am someone who...'}
              style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
            />
          ))}
          <button
            onClick={onSave}
            style={{ padding: '10px 0', background: saved ? 'rgba(52,211,153,0.1)' : `rgba(192,132,252,0.1)`, border: `1px solid ${saved ? 'rgba(52,211,153,0.3)' : 'rgba(192,132,252,0.3)'}`, borderRadius: 10, color: saved ? 'var(--teal, #34D399)' : ACCENT, fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            {saved ? '✓ Saved' : 'Save identity statements'}
          </button>
        </div>
      </div>

      {savedStatements.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>YOUR IDENTITY</div>
          {savedStatements.map(s => (
            <div key={s.id} style={{ background: `rgba(192,132,252,0.06)`, border: `1px solid rgba(192,132,252,0.18)`, borderRadius: 12, padding: '12px 14px', borderLeft: `3px solid ${ACCENT}` }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', fontStyle: 'italic' }}>&ldquo;{s.text}&rdquo;</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UbuntuSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: `rgba(192,132,252,0.08)`, border: `1px solid rgba(192,132,252,0.3)`, borderRadius: 16, padding: '20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ACCENT},transparent)` }} />
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: ACCENT, lineHeight: 1.55, marginBottom: 6, fontStyle: 'italic' }}>
          &ldquo;Umuntu ngumuntu ngabantu&rdquo;
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          A person is a person through other people.
        </div>
        <div style={{ marginTop: 6, fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>— Zulu/Nguni proverb</div>
      </div>

      <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
        Science confirms what Ubuntu knew for centuries: <strong style={{ color: ACCENT }}>social accountability doubles habit success rates</strong>. When you commit to a habit publicly — or to one trusted person — you are 65% more likely to follow through. When you have regular check-ins with an accountability partner, that rises to 95%.
      </div>

      {[
        { emoji: '📣', title: 'Declare publicly', desc: 'Tell one person what you are committing to. Make it specific: not "I will study more" but "I will study for 30 minutes every morning before 9am."' },
        { emoji: '🤝', title: 'Find a habit partner', desc: 'Someone who has a habit they want to build too. Check in with each other weekly. You will both do better.' },
        { emoji: '🏆', title: 'Celebrate together', desc: 'When you hit a streak milestone, tell your accountability partner. Celebration reinforces the identity. You are building something real.' },
      ].map(item => (
        <div key={item.title} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>{item.emoji}</div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
          </div>
        </div>
      ))}

      <a
        href="/wisdom"
        style={{ display: 'block', padding: '13px 0', background: `rgba(192,132,252,0.1)`, border: `1px solid rgba(192,132,252,0.3)`, borderRadius: 14, color: ACCENT, fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', transition: 'background 0.2s' }}>
        🤝 Find an accountability partner →
      </a>
    </div>
  )
}
