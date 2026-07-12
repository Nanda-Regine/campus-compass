'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { Trash2, ChevronLeft, Edit3 } from 'lucide-react'
import { FSRS, createEmptyCard, generatorParameters, Rating, type Card as FSRSCard } from 'ts-fsrs'
import katex from 'katex'
import type { Module } from '@/types'
import { dispatchXP } from '@/lib/xp-engine'
import { MODULE_COLOURS } from '@/types'
import { loadDecksFromDB, saveDeckToDB, deleteDeckFromDB, updateCardInDB } from '@/lib/db/flashcards'
import { useAppStore } from '@/store'
import { useUpgradePrompt } from '@/components/ui/UpgradePromptModal'

// ── Math rendering ────────────────────────────────────────────────────────────
// Supports $...$ inline and $$...$$ block math (KaTeX). Falls back to plain text.

function renderMathSegment(latex: string, display: boolean): string {
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode: display, output: 'htmlAndMathml' })
  } catch {
    // Escape the raw fallback — latex may contain markup and this string goes
    // straight into dangerouslySetInnerHTML.
    return escapeHtml(display ? `$$${latex}$$` : `$${latex}$`)
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function parseMathHtml(text: string): string {
  // Split into math ($$…$$ or $…$) and non-math runs, keeping the delimiters.
  // Math is rendered by KaTeX (safe, escaped HTML); every non-math run is
  // HTML-escaped so a user-authored card like `$x$<img src=x onerror=…>` cannot
  // inject markup — the whole string is fed to dangerouslySetInnerHTML.
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g)
  return parts
    .map(part => {
      if (part.length >= 4 && part.startsWith('$$') && part.endsWith('$$')) {
        return renderMathSegment(part.slice(2, -2), true)
      }
      if (part.length >= 2 && part.startsWith('$') && part.endsWith('$')) {
        return renderMathSegment(part.slice(1, -1), false)
      }
      return escapeHtml(part)
    })
    .join('')
}

function MathText({ text, style }: { text: string; style?: CSSProperties }) {
  const hasMath = /\$/.test(text)
  if (!hasMath) return <span style={style}>{text}</span>
  return (
    <span
      style={style}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: parseMathHtml(text) }}
    />
  )
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Card {
  id:             string
  front:          string
  back:           string
  // FSRS-5 scheduling state
  due:            string        // ISO date YYYY-MM-DD
  stability:      number
  difficulty:     number
  elapsed_days:   number
  scheduled_days: number
  reps:           number
  lapses:         number
  learning_steps: number        // position in the learning step sequence
  state:          0 | 1 | 2 | 3  // New / Learning / Review / Relearning
  last_review:    string | null
}

interface Deck {
  id:         string
  name:       string
  moduleId:   string | null
  moduleName: string
  color:      string         // hex accent colour
  cards:      Card[]
  createdAt:  string
}

// ── FSRS-5 algorithm ─────────────────────────────────────────────────────────
// Ratings: 1=Again  2=Hard  3=Good  4=Easy

const _fsrs = new FSRS(generatorParameters({ enable_fuzz: true }))

function rateCard(card: Card, rating: 1 | 2 | 3 | 4): Card {
  const now = new Date()
  const fsrsCard: FSRSCard = {
    due:            new Date(card.due),
    stability:      card.stability,
    difficulty:     card.difficulty,
    elapsed_days:   card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps:           card.reps,
    lapses:         card.lapses,
    learning_steps: card.learning_steps,
    state:          card.state,
    last_review:    card.last_review ? new Date(card.last_review) : undefined,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (_fsrs.repeat(fsrsCard, now) as any)[rating] as { card: FSRSCard }
  const next   = result.card
  return {
    ...card,
    due:            next.due.toISOString().split('T')[0],
    stability:      next.stability,
    difficulty:     next.difficulty,
    elapsed_days:   next.elapsed_days,
    scheduled_days: next.scheduled_days,
    reps:           next.reps,
    lapses:         next.lapses,
    learning_steps: next.learning_steps ?? 0,
    state:          next.state as 0 | 1 | 2 | 3,
    last_review:    now.toISOString().split('T')[0],
  }
}

function isDue(card: Card): boolean {
  return card.due <= new Date().toISOString().split('T')[0]
}

// ── Migrate old SM-2 cards to FSRS on first load ─────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateCard(raw: Record<string, any>): Card {
  if (typeof raw.due === 'string' && typeof raw.stability === 'number') {
    return { learning_steps: 0, ...raw } as Card  // Already FSRS; backfill learning_steps if absent
  }
  const reps = (raw.repetitions as number) ?? 0
  return {
    id:            raw.id as string,
    front:         raw.front as string,
    back:          raw.back as string,
    due:            (raw.nextReview as string) ?? today(),
    stability:      Math.max(1, (raw.interval as number) ?? 0),
    difficulty:     5.0,
    elapsed_days:   0,
    scheduled_days: (raw.interval as number) ?? 0,
    reps,
    lapses:         0,
    learning_steps: 0,
    state:          reps === 0 ? 0 : 2,
    last_review:    (raw.lastReview as string | null) ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateDeck(raw: Record<string, any>): Deck {
  return {
    id:         raw.id as string,
    name:       raw.name as string,
    moduleId:   raw.moduleId as string | null,
    moduleName: raw.moduleName as string,
    color:      raw.color as string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cards:      ((raw.cards as any[]) ?? []).map(migrateCard),
    createdAt:  raw.createdAt as string,
  }
}

// ── localStorage helpers ──────────────────────────────────────────────────────

const LS_KEY = 'varsityos_flashcard_decks'

function loadDecks(): Deck[] {
  if (typeof window === 'undefined') return []
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as Record<string, any>[]
    return raw.map(migrateDeck)
  }
  catch { return [] }
}
function saveDecks(decks: Deck[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(decks))
}

function uid() { return Math.random().toString(36).slice(2, 9) }

function today() { return new Date().toISOString().split('T')[0] }

function newCard(front: string, back: string): Card {
  const empty = createEmptyCard()
  return {
    id:            uid(),
    front,
    back,
    due:           today(),
    stability:     empty.stability,
    difficulty:    empty.difficulty,
    elapsed_days:  empty.elapsed_days,
    scheduled_days: empty.scheduled_days,
    reps:           empty.reps,
    lapses:         empty.lapses,
    learning_steps: empty.learning_steps ?? 0,
    state:          empty.state as 0 | 1 | 2 | 3,
    last_review:    null,
  }
}

// ── Module colour lookup ──────────────────────────────────────────────────────

const PALETTE = ['#4ecf9e','#7090d0','#c084fc','#f59e0b','#fb923c','#34d399']

function moduleAccent(modules: Module[], id: string | null): string {
  if (!id) return '#4ecf9e'
  const mod = modules.find(m => m.id === id)
  if (!mod?.color) return '#4ecf9e'
  return MODULE_COLOURS[mod.color]?.dot ?? '#4ecf9e'
}

// ── FSRS explainer ────────────────────────────────────────────────────────────

function FSRSExplainer() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      borderRadius: 13, overflow: 'hidden',
      background: 'rgba(129,140,248,0.05)',
      border: '0.5px solid rgba(129,140,248,0.2)',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '10px 14px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', gap: 8,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 12 }}>🧠</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, color: '#818CF8', letterSpacing: '0.06em' }}>
            How FSRS-5 spaced repetition works
          </span>
        </span>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            FSRS-5 (Free Spaced Repetition Scheduler) is the current state-of-the-art memory algorithm — measurably more accurate than SM-2. It models your memory using two parameters: <em>stability</em> (how long a memory lasts) and <em>difficulty</em> (how hard a card is for you personally).
          </p>
          {[
            { label: 'Stability & difficulty', text: 'Every card tracks its own stability (how quickly you forget it) and difficulty (1–10). Easy cards build stability fast; hard cards need more reviews at shorter intervals. FSRS learns your patterns over time.' },
            { label: 'Optimal interval', text: 'FSRS schedules your next review at exactly the moment your recall probability would drop below 90%. This is mathematically optimal — no wasted reviews, no forgotten cards. SM-2 approximated this; FSRS computes it.' },
            { label: 'Four ratings', text: 'Again (forgot) · Hard (struggled) · Good (remembered with effort) · Easy (instant recall). Each updates the card\'s stability and difficulty independently, so your review schedule adapts to you specifically.' },
            { label: 'Why it matters', text: 'In independent benchmarks, FSRS achieves ~10–20% better retention than SM-2 at the same number of reviews. For a 200-card deck studied over a semester, that\'s real grade-point difference.' },
          ].map(item => (
            <div key={item.label} style={{ paddingLeft: 8, borderLeft: '2px solid rgba(129,140,248,0.35)' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#818CF8', marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: '0.63rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{item.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DueChip({ count, color }: { count: number; color: string }) {
  if (count === 0) return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.54rem', color: 'rgba(255,255,255,0.25)' }}>
      All done
    </span>
  )
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: '0.54rem', color,
      background: `${color}18`, border: `0.5px solid ${color}40`,
      padding: '2px 7px', borderRadius: 9999,
    }}>
      {count} due
    </span>
  )
}

// ── Deck list screen ──────────────────────────────────────────────────────────

function DeckListScreen({
  decks, modules, onStudy, onEdit, onNewDeck,
}: {
  decks: Deck[]
  modules: Module[]
  onStudy: (deckId: string) => void
  onEdit:  (deckId: string) => void
  onNewDeck: () => void
}) {
  const totalDue = decks.reduce((s, d) => s + d.cards.filter(isDue).length, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header stat */}
      {totalDue > 0 && (
        <div style={{
          padding: '12px 16px', borderRadius: 14,
          background: 'rgba(78,207,158,0.06)',
          border: '0.5px solid rgba(78,207,158,0.15)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>🃏</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
              {totalDue} card{totalDue === 1 ? '' : 's'} due for review
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: '#4ecf9e', marginTop: 2 }}>
              Tap a deck to start studying
            </div>
          </div>
        </div>
      )}

      {/* FSRS-5 How it works — collapsible */}
      <FSRSExplainer />

      {/* Deck cards */}
      {decks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontSize: 36 }}>🃏</div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, marginTop: 12 }}>
            No flashcard decks yet
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: 4, maxWidth: 260, margin: '6px auto 0' }}>
            Create a deck for each module and add flashcards. The app will remind you when cards are due.
          </p>
          <button onClick={onNewDeck} style={primaryBtn}>
            + Create first deck
          </button>
        </div>
      ) : (
        decks.map(deck => {
          const due    = deck.cards.filter(isDue).length
          const total  = deck.cards.length
          const mastered = deck.cards.filter(c => c.reps >= 3).length

          return (
            <div key={deck.id} style={{
              borderRadius: 16, padding: '14px 16px',
              background: 'rgba(255,255,255,0.03)',
              border: `0.5px solid ${deck.color}28`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                {/* Colour dot */}
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: deck.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {deck.name}
                  </div>
                  {deck.moduleName && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: deck.color, marginTop: 2 }}>
                      {deck.moduleName}
                    </div>
                  )}
                </div>
                <DueChip count={due} color={deck.color} />
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: total > 0 ? `${(mastered / total) * 100}%` : '0%', background: deck.color, borderRadius: 2, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                    {mastered}/{total} mastered
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                    {total} cards
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => onStudy(deck.id)}
                  disabled={due === 0}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: due === 0 ? 'default' : 'pointer',
                    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.75rem',
                    background: due > 0 ? deck.color : 'rgba(255,255,255,0.06)',
                    color: due > 0 ? '#0a1628' : 'rgba(255,255,255,0.25)',
                    transition: 'all 0.15s',
                  }}
                >
                  {due > 0 ? `Study (${due})` : 'Up to date ✓'}
                </button>
                <button
                  onClick={() => onEdit(deck.id)}
                  style={{
                    width: 36, height: 36, borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  <Edit3 size={14} />
                </button>
              </div>
            </div>
          )
        })
      )}

      {decks.length > 0 && (
        <button onClick={onNewDeck} style={ghostBtn}>
          + New deck
        </button>
      )}
    </div>
  )
}

// ── Deck editor screen ────────────────────────────────────────────────────────

function DeckEditorScreen({
  deck, modules, onSave, onDelete, onBack,
}: {
  deck:    Deck | null  // null = new deck
  modules: Module[]
  onSave:  (d: Deck) => void
  onDelete: (id: string) => void
  onBack:  () => void
}) {
  const isNew = deck === null
  const [name,     setName]     = useState(deck?.name     ?? '')
  const [moduleId, setModuleId] = useState(deck?.moduleId ?? '')
  const [cards,    setCards]    = useState<Card[]>(deck?.cards ?? [])
  const [newFront, setNewFront] = useState('')
  const [newBack,  setNewBack]  = useState('')
  const [editing,  setEditing]  = useState<string | null>(null)
  const [editF,    setEditF]    = useState('')
  const [editB,    setEditB]    = useState('')

  const chosenMod  = modules.find(m => m.id === moduleId)
  const accentColor = moduleAccent(modules, moduleId || null)

  function addCard() {
    if (!newFront.trim() || !newBack.trim()) return
    setCards(prev => [...prev, newCard(newFront.trim(), newBack.trim())])
    setNewFront('')
    setNewBack('')
  }

  function removeCard(id: string) { setCards(prev => prev.filter(c => c.id !== id)) }

  function startEdit(c: Card) { setEditing(c.id); setEditF(c.front); setEditB(c.back) }
  function saveEdit(id: string) {
    setCards(prev => prev.map(c => c.id === id ? { ...c, front: editF.trim(), back: editB.trim() } : c))
    setEditing(null)
  }

  function save() {
    if (!name.trim()) return
    const deckData: Deck = {
      id:         deck?.id ?? uid(),
      name:       name.trim(),
      moduleId:   moduleId || null,
      moduleName: chosenMod?.module_name ?? '',
      color:      accentColor,
      cards,
      createdAt:  deck?.createdAt ?? new Date().toISOString(),
    }
    onSave(deckData)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Back + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0, display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {isNew ? 'New deck' : 'Edit deck'}
        </span>
        {!isNew && (
          <button
            onClick={() => { if (window.confirm('Delete this deck?')) { onDelete(deck!.id); onBack() } }}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,107,107,0.6)', display: 'flex', alignItems: 'center' }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Deck settings */}
      <div style={cardBox}>
        <label style={labelStyle}>Deck name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chemistry Reactions"
          style={inputStyle} />
        <label style={{ ...labelStyle, marginTop: 10 }}>Module (optional)</label>
        <select value={moduleId} onChange={e => setModuleId(e.target.value)} style={inputStyle}>
          <option value="">No module</option>
          {modules.map(m => <option key={m.id} value={m.id}>{m.module_name}</option>)}
        </select>
      </div>

      {/* Add new card */}
      <div style={cardBox}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
          Add card
        </div>
        <textarea value={newFront} onChange={e => setNewFront(e.target.value)}
          placeholder="Front (question / term)" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        <textarea value={newBack} onChange={e => setNewBack(e.target.value)}
          placeholder="Back (answer / definition)" rows={2}
          style={{ ...inputStyle, resize: 'vertical', marginTop: 6 }}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) addCard() }} />
        <button onClick={addCard} disabled={!newFront.trim() || !newBack.trim()} style={{
          marginTop: 8, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.72rem',
          background: accentColor, color: '#0a1628', opacity: (!newFront.trim() || !newBack.trim()) ? 0.4 : 1,
          transition: 'opacity 0.15s',
        }}>
          Add card
        </button>
      </div>

      {/* Card list */}
      {cards.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {cards.length} card{cards.length === 1 ? '' : 's'}
          </div>
          {cards.map((c, i) => (
            <div key={c.id} style={{
              borderRadius: 12, padding: '10px 12px',
              background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)',
            }}>
              {editing === c.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <textarea value={editF} onChange={e => setEditF(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                  <textarea value={editB} onChange={e => setEditB(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => saveEdit(c.id)} style={smallAccentBtn(accentColor)}>Save</button>
                    <button onClick={() => setEditing(null)} style={smallGhostBtn}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-tertiary)', minWidth: 16 }}>{i+1}.</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-primary)', marginBottom: 3 }}>
                      {c.front}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {c.back}
                    </div>
                    {c.reps > 0 && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: accentColor, marginTop: 4 }}>
                        {c.reps}× reviewed · due {c.due}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => startEdit(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4 }}><Edit3 size={12} /></button>
                    <button onClick={() => removeCard(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,107,107,0.4)', padding: 4 }}><Trash2 size={12} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Save */}
      <button onClick={save} disabled={!name.trim()} style={{
        padding: '10px 0', borderRadius: 12, border: 'none', cursor: !name.trim() ? 'default' : 'pointer',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem',
        background: !name.trim() ? 'rgba(255,255,255,0.06)' : accentColor,
        color: !name.trim() ? 'rgba(255,255,255,0.2)' : '#0a1628',
        transition: 'all 0.15s',
      }}>
        {isNew ? 'Create deck' : 'Save changes'}
      </button>
    </div>
  )
}

// ── Study session screen ──────────────────────────────────────────────────────

type StudyPhase = 'front' | 'back'

function StudyScreen({
  deck, onRate, onBack,
}: {
  deck:   Deck
  onRate: (cardId: string, rating: 1 | 2 | 3 | 4) => void
  onBack: () => void
}) {
  const dueCards = deck.cards.filter(isDue)
  const [idx, setIdx]     = useState(0)
  const [phase, setPhase] = useState<StudyPhase>('front')
  const [flipped, setFlipped] = useState(false)
  const [done, setDone]   = useState(false)

  const card = dueCards[idx]

  function flip() { setFlipped(true); setPhase('back') }

  function rate(rating: 1 | 2 | 3 | 4) {
    onRate(card.id, rating)
    const next = idx + 1
    if (next >= dueCards.length) {
      dispatchXP('flashcard_review')
      setDone(true)
    } else {
      setIdx(next)
      setPhase('front')
      setFlipped(false)
    }
  }

  if (done || dueCards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <div style={{ fontSize: 40 }}>🎉</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginTop: 12 }}>
          Session complete!
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-tertiary)', marginTop: 6 }}>
          You reviewed {dueCards.length} card{dueCards.length === 1 ? '' : 's'}.
        </div>
        <button onClick={onBack} style={{ ...primaryBtn, marginTop: 24 }}>Back to decks</button>
      </div>
    )
  }

  const progress = idx / dueCards.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0, display: 'flex' }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
            {deck.name}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
            {idx + 1} of {dueCards.length}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: deck.color }}>
          {Math.round(progress * 100)}%
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
        <div style={{ height: '100%', width: `${progress * 100}%`, background: deck.color, borderRadius: 2, transition: 'width 0.3s ease' }} />
      </div>

      {/* 3D flip card */}
      <div
        onClick={phase === 'front' ? flip : undefined}
        style={{ perspective: 1000, cursor: phase === 'front' ? 'pointer' : 'default', minHeight: 200 }}
      >
        <div style={{
          position: 'relative', transformStyle: 'preserve-3d',
          transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: 200,
        }}>
          {/* Front face */}
          <div style={{
            borderRadius: 20, padding: '36px 24px', minHeight: 200,
            background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))`,
            border: `1px solid ${deck.color}30`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', gap: 16, backfaceVisibility: 'hidden',
            boxShadow: `0 0 40px ${deck.color}0d, inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.54rem',
              color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em',
              background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: 99,
              border: '0.5px solid rgba(255,255,255,0.08)',
            }}>
              Question
            </div>
            <MathText
              text={card.front}
              style={{
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1.4, maxWidth: 320,
              }}
            />
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.56rem',
              color: deck.color, opacity: 0.6, marginTop: 4,
            }}>
              Tap to reveal answer
            </div>
          </div>

          {/* Back face */}
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: 20, padding: '36px 24px', minHeight: 200,
            background: `linear-gradient(135deg, ${deck.color}10, ${deck.color}05)`,
            border: `1px solid ${deck.color}50`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', gap: 16,
            backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
            boxShadow: `0 0 40px ${deck.color}15, inset 0 1px 0 ${deck.color}20`,
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.54rem',
              color: deck.color, textTransform: 'uppercase', letterSpacing: '0.1em',
              background: `${deck.color}15`, padding: '3px 10px', borderRadius: 99,
              border: `0.5px solid ${deck.color}30`,
            }}>
              Answer
            </div>
            <MathText
              text={card.back}
              style={{
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5, maxWidth: 320,
              }}
            />
          </div>
        </div>
      </div>

      {/* Rating buttons (only when back is shown) */}
      {phase === 'back' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--text-tertiary)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            How well did you know it?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {([
              { r: 1 as const, label: 'Again', sub: 'Forgot',   color: '#ff6b6b' },
              { r: 2 as const, label: 'Hard',  sub: 'Struggled', color: '#e8834a' },
              { r: 3 as const, label: 'Good',  sub: 'Recalled',  color: '#7090d0' },
              { r: 4 as const, label: 'Easy',  sub: 'Instant',   color: '#4ecf9e' },
            ]).map(({ r, label, sub, color }) => (
              <button key={r} onClick={() => rate(r)} style={{
                padding: '10px 4px', borderRadius: 10, border: `0.5px solid ${color}40`,
                background: `${color}12`, cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.72rem',
                color, transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}>
                {label}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: `${color}90`, fontWeight: 400 }}>{sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Flip button (alternative tap target) */}
      {phase === 'front' && (
        <button onClick={flip} style={{
          padding: '11px 0', borderRadius: 12, border: `0.5px solid ${deck.color}50`,
          background: `${deck.color}15`, cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8rem',
          color: deck.color,
        }}>
          Flip card
        </button>
      )}
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const primaryBtn: CSSProperties = {
  marginTop: 16, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.78rem',
  background: '#4ecf9e', color: '#0a1628',
}

const ghostBtn: CSSProperties = {
  padding: '10px 0', borderRadius: 12,
  border: '0.5px solid rgba(255,255,255,0.08)', background: 'transparent',
  cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600,
  fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', width: '100%',
  transition: 'all 0.15s',
}

const cardBox: CSSProperties = {
  borderRadius: 14, padding: '14px', background: 'rgba(255,255,255,0.03)',
  border: '0.5px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 6,
}

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--text-tertiary)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

const inputStyle: CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)',
  fontFamily: 'var(--font-display)', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box',
}

function smallAccentBtn(color: string): CSSProperties {
  return {
    padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.7rem',
    background: color, color: '#0a1628',
  }
}

const smallGhostBtn: CSSProperties = {
  padding: '5px 12px', borderRadius: 7, border: '0.5px solid rgba(255,255,255,0.1)',
  background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-display)',
  fontWeight: 400, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)',
}

// ── Main FlashcardsTab ────────────────────────────────────────────────────────

type Screen = { type: 'list' } | { type: 'study'; deckId: string } | { type: 'edit'; deckId: string | null }

interface Props { modules: Module[] }

export default function FlashcardsTab({ modules }: Props) {
  const appProfile = useAppStore(s => s.profile)
  const isPremium  = appProfile?.is_premium || ['scholar', 'nova_unlimited'].includes(appProfile?.subscription_tier ?? '')
  const { show: showUpgrade, modal: upgradeModal } = useUpgradePrompt()

  const [decks,   setDecks]   = useState<Deck[]>([])
  const [screen,  setScreen]  = useState<Screen>({ type: 'list' })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    async function init() {
      if (isPremium) {
        const dbDecks = await loadDecksFromDB()
        if (dbDecks.length > 0) {
          setDecks(dbDecks)
          saveDecks(dbDecks)
          setMounted(true)
          return
        }
      }
      setDecks(loadDecks())
      setMounted(true)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium])

  function handleSaveDeck(d: Deck) {
    const idx = decks.findIndex(x => x.id === d.id)
    const updated = idx >= 0 ? decks.map((x, i) => i === idx ? d : x) : [...decks, d]
    setDecks(updated)
    saveDecks(updated)
    if (isPremium) saveDeckToDB(d).catch(() => {})
    setScreen({ type: 'list' })
  }

  function handleDeleteDeck(id: string) {
    const updated = decks.filter(d => d.id !== id)
    setDecks(updated)
    saveDecks(updated)
    if (isPremium) deleteDeckFromDB(id).catch(() => {})
  }

  function handleRate(deckId: string, cardId: string, rating: 1 | 2 | 3 | 4) {
    let ratedCard: Card | undefined
    const updated = decks.map(d => {
      if (d.id !== deckId) return d
      return { ...d, cards: d.cards.map(c => {
        if (c.id !== cardId) return c
        ratedCard = rateCard(c, rating)
        return ratedCard
      })}
    })
    setDecks(updated)
    saveDecks(updated)
    if (ratedCard && isPremium) updateCardInDB(ratedCard, deckId).catch(() => {})
  }

  if (!mounted) return <div style={{ height: 100 }} />

  if (screen.type === 'edit') {
    const deck = screen.deckId ? decks.find(d => d.id === screen.deckId) ?? null : null
    return (
      <DeckEditorScreen
        deck={deck}
        modules={modules}
        onSave={handleSaveDeck}
        onDelete={handleDeleteDeck}
        onBack={() => setScreen({ type: 'list' })}
      />
    )
  }

  if (screen.type === 'study') {
    const deck = decks.find(d => d.id === screen.deckId)
    if (!deck) { setScreen({ type: 'list' }); return null }
    return (
      <StudyScreen
        deck={deck}
        onRate={(cardId, r) => handleRate(deck.id, cardId, r)}
        onBack={() => setScreen({ type: 'list' })}
      />
    )
  }

  return (
    <>
      {upgradeModal}
      {!isPremium && (
        <button
          onClick={() => showUpgrade(
            'Flashcard cloud sync',
            'Your decks and FSRS progress sync across devices and are never lost. Upgrade to Nova Scholar to unlock cloud sync.',
          )}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 10, marginBottom: 12, cursor: 'pointer',
            background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.18)',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 16 }}>☁️</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#38BDF8' }}>Cloud sync — Scholar feature</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Decks saved locally only · Tap to upgrade</div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(56,189,248,0.6)' }}>⭐ R29</span>
        </button>
      )}
      <DeckListScreen
        decks={decks}
        modules={modules}
        onStudy={id => setScreen({ type: 'study', deckId: id })}
        onEdit={id => setScreen({ type: 'edit', deckId: id })}
        onNewDeck={() => setScreen({ type: 'edit', deckId: null })}
      />
    </>
  )
}
