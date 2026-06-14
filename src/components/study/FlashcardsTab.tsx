'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { Plus, Trash2, ChevronLeft, Layers, BookOpen, Edit3, Check } from 'lucide-react'
import type { Module } from '@/types'
import { dispatchXP } from '@/lib/xp-engine'
import { MODULE_COLOURS } from '@/types'
import { loadDecksFromDB, saveDeckToDB, deleteDeckFromDB, updateCardInDB } from '@/lib/db/flashcards'
import { useAppStore } from '@/store'
import { useUpgradePrompt } from '@/components/ui/UpgradePromptModal'

// ── Types ────────────────────────────────────────────────────────────────────

interface Card {
  id:          string
  front:       string
  back:        string
  interval:    number        // days between reviews
  easeFactor:  number        // SM-2 ease factor, starts 2.5
  repetitions: number
  nextReview:  string        // ISO date string
  lastReview:  string | null
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

// ── SM-2 algorithm ────────────────────────────────────────────────────────────
// quality: 0=Again  1=Hard  2=Good  3=Easy

function sm2(card: Card, quality: 0 | 1 | 2 | 3): Card {
  const today = new Date().toISOString().split('T')[0]
  let { interval, easeFactor, repetitions } = card

  if (quality < 2) {
    // Forgotten — reset
    interval    = 1
    repetitions = 0
  } else {
    // Remembered
    if (repetitions === 0)      interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)

    easeFactor = Math.max(1.3, easeFactor + 0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02))
    repetitions++
  }

  const next = new Date()
  next.setDate(next.getDate() + interval)

  return {
    ...card,
    interval,
    easeFactor,
    repetitions,
    lastReview: today,
    nextReview: next.toISOString().split('T')[0],
  }
}

function isDue(card: Card): boolean {
  const today = new Date().toISOString().split('T')[0]
  return card.nextReview <= today
}

// ── localStorage helpers ──────────────────────────────────────────────────────

const LS_KEY = 'varsityos_flashcard_decks'

function loadDecks(): Deck[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as Deck[] }
  catch { return [] }
}
function saveDecks(decks: Deck[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(decks))
}

function uid() { return Math.random().toString(36).slice(2, 9) }

function today() { return new Date().toISOString().split('T')[0] }

function newCard(front: string, back: string): Card {
  return { id: uid(), front, back, interval: 0, easeFactor: 2.5, repetitions: 0, nextReview: today(), lastReview: null }
}

// ── Module colour lookup ──────────────────────────────────────────────────────

const PALETTE = ['#4ecf9e','#7090d0','#c084fc','#f59e0b','#fb923c','#34d399']

function moduleAccent(modules: Module[], id: string | null): string {
  if (!id) return '#4ecf9e'
  const mod = modules.find(m => m.id === id)
  if (!mod?.color) return '#4ecf9e'
  return MODULE_COLOURS[mod.color]?.dot ?? '#4ecf9e'
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
          const mastered = deck.cards.filter(c => c.repetitions >= 3).length

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
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'var(--text-tertiary)' }}>
                    {mastered}/{total} mastered
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'var(--text-tertiary)' }}>
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
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'var(--text-tertiary)', minWidth: 16 }}>{i+1}.</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-primary)', marginBottom: 3 }}>
                      {c.front}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {c.back}
                    </div>
                    {c.repetitions > 0 && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: accentColor, marginTop: 4 }}>
                        {c.repetitions}× reviewed · due {c.nextReview}
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
  onRate: (cardId: string, quality: 0 | 1 | 2 | 3) => void
  onBack: () => void
}) {
  const dueCards = deck.cards.filter(isDue)
  const [idx, setIdx]     = useState(0)
  const [phase, setPhase] = useState<StudyPhase>('front')
  const [flipped, setFlipped] = useState(false)
  const [done, setDone]   = useState(false)

  const card = dueCards[idx]

  function flip() { setFlipped(true); setPhase('back') }

  function rate(q: 0 | 1 | 2 | 3) {
    onRate(card.id, q)
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
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1.4, maxWidth: 320,
            }}>
              {card.front}
            </div>
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
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5, maxWidth: 320,
            }}>
              {card.back}
            </div>
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
              { q: 0 as const, label: 'Again',  sub: 'Reset',  color: '#ff6b6b' },
              { q: 1 as const, label: 'Hard',   sub: '< 1 day', color: '#e8834a' },
              { q: 2 as const, label: 'Good',   sub: 'Next', color: '#7090d0' },
              { q: 3 as const, label: 'Easy',   sub: 'Skip',  color: '#4ecf9e' },
            ]).map(({ q, label, sub, color }) => (
              <button key={q} onClick={() => rate(q)} style={{
                padding: '10px 4px', borderRadius: 10, border: `0.5px solid ${color}40`,
                background: `${color}12`, cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.72rem',
                color, transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}>
                {label}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: `${color}90`, fontWeight: 400 }}>{sub}</span>
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

  function handleRate(deckId: string, cardId: string, quality: 0 | 1 | 2 | 3) {
    let ratedCard: Card | undefined
    const updated = decks.map(d => {
      if (d.id !== deckId) return d
      return { ...d, cards: d.cards.map(c => {
        if (c.id !== cardId) return c
        ratedCard = sm2(c, quality)
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
        onRate={(cardId, q) => handleRate(deck.id, cardId, q)}
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
            'Your decks and SM-2 progress sync across devices and are never lost. Upgrade to Nova Scholar to unlock cloud sync.',
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
