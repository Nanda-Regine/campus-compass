'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Module } from '@/types'

// ── Types ────────────────────────────────────────────────────────────────────

interface Flashcard { front: string; back: string }
interface QuizQuestion { question: string; options: string[]; answer: string; explanation: string }

interface StudyKit {
  summary: string
  key_concepts: string[]
  flashcards: Flashcard[]
  quiz: QuizQuestion[]
}

interface DeckRow { id: string; name: string; module_name: string }

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { modules: Module[] }

export default function StudyKitGenerator({ modules }: Props) {
  const supabase = createClient()

  const [text, setText]         = useState('')
  const [subject, setSubject]   = useState('')
  const [generating, setGen]    = useState(false)
  const [kit, setKit]           = useState<StudyKit | null>(null)
  const [error, setError]       = useState('')

  // Flashcard saving
  const [decks, setDecks]       = useState<DeckRow[]>([])
  const [deckId, setDeckId]     = useState<string>('__new__')
  const [newDeckName, setNewDeckName] = useState('')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  // Quiz UI
  const [quizIdx, setQuizIdx]   = useState(0)
  const [picked, setPicked]     = useState<Record<number, string>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})

  // Flashcard flip
  const [flipped, setFlipped]   = useState<Record<number, boolean>>({})

  const loadDecks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('flashcard_decks')
      .select('id, name, module_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
    if (data) setDecks(data as DeckRow[])
  }, [supabase])

  useEffect(() => { loadDecks() }, [loadDecks])

  const generate = async () => {
    if (text.trim().length < 50) { setError('Paste at least 50 characters of notes.'); return }
    setGen(true); setError(''); setKit(null); setSaved(false)
    setFlipped({}); setPicked({}); setRevealed({}); setQuizIdx(0)
    try {
      const res = await fetch('/api/study/generate-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), subject: subject.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setKit(data as StudyKit)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setGen(false)
    }
  }

  const saveFlashcards = async () => {
    if (!kit?.flashcards.length) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      let targetDeckId = deckId

      // Create new deck if needed
      if (deckId === '__new__') {
        const name = newDeckName.trim() || (subject.trim() ? subject : 'Study Kit')
        const { data: newDeck, error: de } = await supabase
          .from('flashcard_decks')
          .insert({
            user_id: user.id,
            name: name.slice(0, 80),
            module_name: subject.trim().slice(0, 80) || '',
            color: '#c084fc',
          })
          .select('id')
          .single()
        if (de || !newDeck) throw new Error(de?.message || 'Failed to create deck')
        targetDeckId = newDeck.id
      }

      const today = new Date().toISOString().split('T')[0]
      const { data: { user: u } } = await supabase.auth.getUser()

      const rows = kit.flashcards.map(c => ({
        deck_id:      targetDeckId,
        user_id:      u!.id,
        front:        c.front,
        back:         c.back,
        next_review:  today,
        state:        0,
        interval_days: 0,
        ease_factor:  5,
        repetitions:  0,
        stability:    0,
        lapses:       0,
      }))

      const { error: ie } = await supabase.from('flashcard_cards').insert(rows)
      if (ie) throw new Error(ie.message)

      setSaved(true)
      toast.success(`${kit.flashcards.length} flashcards added to deck!`)
      await loadDecks()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const charCount  = text.length
  const charPct    = Math.min(charCount / 5000, 1)
  const charColor  = charCount < 50 ? '#ef4444' : charCount < 4000 ? '#4ecf9e' : '#f59e0b'

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div>
        <div className="font-mono text-[0.55rem] text-purple-400 tracking-widest mb-0.5">AI STUDY KIT</div>
        <div className="font-display font-bold text-white text-lg leading-tight">Generate from notes</div>
        <div className="font-mono text-[0.6rem] text-white/80 mt-1 leading-relaxed">
          Paste lecture notes or a past-paper question. Nova generates a summary, key concepts, 10 flashcards, and a quiz in seconds.
        </div>
      </div>

      {/* Input area */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject / topic (optional)"
            className="col-span-2 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/72 outline-none focus:border-purple-500 font-body"
          />
        </div>

        <div className="relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your lecture notes, textbook excerpt, or past-paper question here…"
            rows={7}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/72 outline-none focus:border-purple-500 resize-none font-body leading-relaxed"
          />
          {/* Character progress */}
          <div className="absolute bottom-2 right-2.5 flex items-center gap-1.5">
            <div className="h-1 w-16 rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${charPct * 100}%`, background: charColor }} />
            </div>
            <span className="font-mono text-[0.48rem]" style={{ color: charColor }}>
              {charCount.toLocaleString()}/5000
            </span>
          </div>
        </div>

        {error && (
          <div className="font-mono text-[0.6rem] text-red-400 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <button
          onClick={generate}
          disabled={generating || text.trim().length < 50}
          className="w-full font-display font-bold text-sm py-3 rounded-xl transition-all disabled:opacity-40"
          style={{
            background: generating ? 'rgba(192,132,252,0.15)' : 'linear-gradient(135deg,#9333ea,#7c3aed)',
            color: '#fff',
            boxShadow: generating ? 'none' : '0 4px 20px rgba(147,51,234,0.3)',
          }}
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating study kit…
            </span>
          ) : '✨ Generate Study Kit'}
        </button>
      </div>

      {/* ── Results ──────────────────────────────────────────────────────────── */}
      {kit && (
        <div className="space-y-5">

          {/* Summary */}
          <div className="bg-purple-500/6 border border-purple-500/20 rounded-2xl p-4">
            <div className="font-mono text-[0.55rem] text-purple-400 tracking-widest mb-2">SUMMARY</div>
            <p className="font-body text-sm text-white/80 leading-relaxed">{kit.summary}</p>
          </div>

          {/* Key Concepts */}
          {kit.key_concepts.length > 0 && (
            <div className="bg-white/3 border border-white/7 rounded-2xl p-4">
              <div className="font-mono text-[0.55rem] text-white/80 tracking-widest mb-3">KEY CONCEPTS</div>
              <div className="flex flex-wrap gap-1.5">
                {kit.key_concepts.map((c, i) => (
                  <span key={i} className="font-mono text-[0.6rem] px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Flashcards */}
          {kit.flashcards.length > 0 && (
            <div className="bg-white/3 border border-white/7 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[0.55rem] text-white/80 tracking-widest">
                  FLASHCARDS ({kit.flashcards.length})
                </div>
                <span className="font-mono text-[0.65rem] text-white/75">tap to flip</span>
              </div>
              <div className="space-y-2">
                {kit.flashcards.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setFlipped(prev => ({ ...prev, [i]: !prev[i] }))}
                    className={cn(
                      'w-full text-left rounded-xl px-3 py-3 border transition-all',
                      flipped[i]
                        ? 'bg-purple-500/8 border-purple-500/20'
                        : 'bg-white/3 border-white/8 hover:border-white/15'
                    )}
                  >
                    <div className="font-mono text-[0.65rem] mb-1" style={{ color: flipped[i] ? '#c084fc' : 'rgba(255,255,255,0.45)' }}>
                      {flipped[i] ? 'BACK (answer)' : 'FRONT (question)'}
                    </div>
                    <div className="font-body text-xs text-white leading-relaxed">
                      {flipped[i] ? c.back : c.front}
                    </div>
                  </button>
                ))}
              </div>

              {/* Save to deck */}
              {!saved ? (
                <div className="mt-4 pt-3 border-t border-white/8 space-y-2">
                  <div className="font-mono text-[0.55rem] text-white/80 tracking-widest">SAVE TO FLASHCARD DECK</div>
                  <select
                    value={deckId}
                    onChange={e => setDeckId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 outline-none focus:border-purple-500 font-body"
                  >
                    <option value="__new__">+ Create new deck</option>
                    {decks.map(d => (
                      <option key={d.id} value={d.id}>{d.name}{d.module_name ? ` (${d.module_name})` : ''}</option>
                    ))}
                  </select>
                  {deckId === '__new__' && (
                    <input
                      value={newDeckName}
                      onChange={e => setNewDeckName(e.target.value)}
                      placeholder={`Deck name (default: "${subject || 'Study Kit'}")`}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/72 outline-none focus:border-purple-500 font-body"
                    />
                  )}
                  <button
                    onClick={saveFlashcards}
                    disabled={saving}
                    className="w-full font-display font-bold text-sm py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all"
                  >
                    {saving ? 'Saving…' : `Save ${kit.flashcards.length} flashcards to deck`}
                  </button>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-white/8 text-center">
                  <div className="font-mono text-[0.6rem] text-emerald-400">
                    ✓ Flashcards saved! Go to the Cards tab to study them.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quiz */}
          {kit.quiz.length > 0 && (
            <div className="bg-white/3 border border-white/7 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[0.55rem] text-white/80 tracking-widest">QUIZ</div>
                <span className="font-mono text-[0.65rem] text-white/75">
                  {quizIdx + 1}/{kit.quiz.length}
                </span>
              </div>

              {(() => {
                const q = kit.quiz[quizIdx]
                const userPick  = picked[quizIdx]
                const isRevealedQ = revealed[quizIdx]

                return (
                  <div className="space-y-3">
                    <div className="font-body text-sm text-white leading-relaxed font-medium">{q.question}</div>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => {
                        const letter  = opt[0]
                        const isRight = letter === q.answer
                        const isPicked = letter === userPick
                        const showResult = isRevealedQ

                        return (
                          <button
                            key={oi}
                            onClick={() => {
                              if (isRevealedQ) return
                              setPicked(prev => ({ ...prev, [quizIdx]: letter }))
                              setRevealed(prev => ({ ...prev, [quizIdx]: true }))
                            }}
                            className={cn(
                              'w-full text-left rounded-xl px-3 py-2.5 border transition-all font-body text-sm',
                              !showResult && 'bg-white/3 border-white/10 hover:border-white/20 text-white/70',
                              showResult && isRight && 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
                              showResult && isPicked && !isRight && 'bg-red-500/10 border-red-500/25 text-red-300',
                              showResult && !isPicked && !isRight && 'bg-white/2 border-white/5 text-white/78',
                            )}
                          >
                            {opt}
                            {showResult && isRight && <span className="ml-2 text-emerald-400">✓</span>}
                            {showResult && isPicked && !isRight && <span className="ml-2 text-red-400">✗</span>}
                          </button>
                        )
                      })}
                    </div>

                    {isRevealedQ && (
                      <div className="bg-white/3 border border-white/8 rounded-xl px-3 py-2">
                        <span className="font-mono text-[0.65rem] text-white/78 block mb-0.5">EXPLANATION</span>
                        <span className="font-body text-xs text-white/80 leading-relaxed">{q.explanation}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setQuizIdx(i => Math.max(0, i - 1))}
                        disabled={quizIdx === 0}
                        className="flex-1 font-mono text-[0.6rem] py-2 rounded-xl border border-white/10 text-white/82 disabled:opacity-25 hover:border-white/20 transition-all"
                      >
                        ← Prev
                      </button>
                      <button
                        onClick={() => setQuizIdx(i => Math.min(kit.quiz.length - 1, i + 1))}
                        disabled={quizIdx === kit.quiz.length - 1}
                        className="flex-1 font-mono text-[0.6rem] py-2 rounded-xl border border-white/10 text-white/82 disabled:opacity-25 hover:border-white/20 transition-all"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Regenerate */}
          <button
            onClick={() => { setKit(null); setSaved(false); setText(''); setSubject('') }}
            className="w-full font-mono text-[0.6rem] py-2 rounded-xl border border-white/10 text-white/78 hover:text-white/70 hover:border-white/20 transition-all"
          >
            ← Clear and start over
          </button>
        </div>
      )}

      {/* Tips (pre-generate) */}
      {!kit && !generating && (
        <div className="bg-white/2 border border-white/6 rounded-2xl p-4 space-y-2">
          <div className="font-mono text-[0.55rem] text-white/75 tracking-widest">TIPS FOR BEST RESULTS</div>
          <ul className="space-y-1.5">
            {[
              'Paste complete paragraphs, not just headings',
              'Include definitions and examples from your slides',
              'One topic at a time gives better flashcards',
              'Works great with past-paper questions for exam prep',
              'Screenshotted notes? Use Past Papers → Scan first to extract text',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-mono text-[0.48rem] text-purple-400 mt-0.5 flex-shrink-0">→</span>
                <span className="font-mono text-[0.58rem] text-white/80 leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
