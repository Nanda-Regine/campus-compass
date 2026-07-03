'use client'

// DistractionDumper — capture distracting thoughts instantly without losing focus.
// Research: "parking" an intrusive thought (writing it down) removes the mental
// load of suppressing it, allowing return to deep work in <10 seconds
// (Smallwood & Schooler, 2006 — mind-wandering research).

import { useState, useEffect, useCallback, useRef } from 'react'

const SS_KEY = 'varsityos_distractions'

interface Distraction {
  id:   string
  text: string
  ts:   number
}

function loadDistractions(): Distraction[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(sessionStorage.getItem(SS_KEY) ?? '[]') } catch { return [] }
}

function saveDistractions(d: Distraction[]) {
  sessionStorage.setItem(SS_KEY, JSON.stringify(d))
}

const STYLE_ID = 'varsityos-dumper-styles'
function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes dd-pop-in  { from{transform:scale(0.85) translateY(8px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
    @keyframes dd-pop-out { from{transform:scale(1);opacity:1} to{transform:scale(0.85);opacity:0} }
    @keyframes dd-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
    @keyframes dd-check   { from{stroke-dashoffset:20} to{stroke-dashoffset:0} }
  `
  document.head.appendChild(el)
}

// ── Review Modal — shown after Pomodoro completes ─────────────────────────────

function ReviewModal({ items, onClear }: { items: Distraction[]; onClear: () => void }) {
  const [processed, setProcessed] = useState<string[]>([])
  const toggleProcessed = (id: string) =>
    setProcessed(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9750,
      background: 'rgba(4,6,18,0.92)', backdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#0d1225', borderRadius: 20, padding: 26, maxWidth: 380, width: '100%',
        maxHeight: '85dvh', overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.08)',
        animation: 'dd-pop-in 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#4ecf9e', letterSpacing: '0.18em', marginBottom: 10 }}>
          📋 SESSION DEBRIEF
        </div>
        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 17, color: '#fff', marginBottom: 6 }}>
          You captured {items.length} distraction{items.length !== 1 ? 's' : ''}
        </div>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>
          Review each — act on it, schedule it, or let it go.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20, maxHeight: 'calc(100dvh - 280px)', overflowY: 'auto' }}>
          {items.map(item => {
            const done = processed.includes(item.id)
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 14px', borderRadius: 11,
                background: done ? 'rgba(78,207,158,0.06)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${done ? 'rgba(78,207,158,0.2)' : 'rgba(255,255,255,0.07)'}`,
                cursor: 'pointer', transition: 'all 0.2s',
              }} onClick={() => toggleProcessed(item.id)}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                  border: `2px solid ${done ? '#4ecf9e' : 'rgba(255,255,255,0.2)'}`,
                  background: done ? '#4ecf9e' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {done && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3l2 2 4-4" stroke="#000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
                        style={{ strokeDasharray: 20, strokeDashoffset: 0, animation: 'dd-check 0.3s ease' }} />
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'Sora,sans-serif', fontSize: 13,
                    color: done ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.8)',
                    textDecoration: done ? 'line-through' : 'none',
                    lineHeight: 1.4,
                  }}>
                    {item.text}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <button onClick={onClear} style={{
          width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: '#4ecf9e', color: '#000',
          fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14,
        }}>
          Clear & close
        </button>
      </div>
    </div>
  )
}

// ── Capture Popup ─────────────────────────────────────────────────────────────

function CapturePopup({ onSave, onClose }: { onSave: (text: string) => void; onClose: () => void }) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSave = () => {
    if (text.trim()) { onSave(text.trim()); setText('') }
    else onClose()
  }

  return (
    <div style={{
      position: 'absolute', bottom: 60, right: 0,
      width: 280, padding: '14px 16px', borderRadius: 16,
      background: '#0d1225', border: '1px solid rgba(255,255,255,0.12)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      animation: 'dd-pop-in 0.25s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#4ecf9e', letterSpacing: '0.14em', marginBottom: 10 }}>
        📥 DUMP THE THOUGHT
      </div>
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose() }}
        placeholder="What's distracting you?"
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 9,
          fontFamily: 'Sora,sans-serif', fontSize: 13,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff', outline: 'none', boxSizing: 'border-box',
          marginBottom: 10,
        }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onClose} style={{
          flex: 1, padding: '8px 0', borderRadius: 9,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'transparent', color: 'rgba(255,255,255,0.3)',
          fontFamily: '"JetBrains Mono",monospace', fontSize: 10, cursor: 'pointer',
        }}>Esc</button>
        <button onClick={handleSave} style={{
          flex: 2, padding: '8px 0', borderRadius: 9, border: 'none',
          background: text.trim() ? '#4ecf9e' : 'rgba(255,255,255,0.07)',
          color: text.trim() ? '#000' : 'rgba(255,255,255,0.2)',
          fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 10,
          cursor: text.trim() ? 'pointer' : 'default',
        }}>
          {text.trim() ? '↵ Park it' : 'Skip'}
        </button>
      </div>
      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>
        Saved here · review after your session
      </div>
    </div>
  )
}

// ── Main Floating Widget ──────────────────────────────────────────────────────

export default function DistractionDumper() {
  const [items,        setItems]        = useState<Distraction[]>([])
  const [showCapture,  setShowCapture]  = useState(false)
  const [showReview,   setShowReview]   = useState(false)
  const [mounted,      setMounted]      = useState(false)

  useEffect(() => {
    injectStyles()
    setMounted(true)
    setItems(loadDistractions())

    // Auto-trigger review when a Pomodoro session completes
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.eventName === 'pomodoro_session') {
        const current = loadDistractions()
        if (current.length > 0) setShowReview(true)
      }
    }
    window.addEventListener('varsityos:xp', handler)
    return () => window.removeEventListener('varsityos:xp', handler)
  }, [])

  const addDistraction = useCallback((text: string) => {
    const item: Distraction = { id: crypto.randomUUID(), text, ts: Date.now() }
    const next = [...items, item]
    setItems(next)
    saveDistractions(next)
    setShowCapture(false)
  }, [items])

  const clearAll = useCallback(() => {
    setItems([])
    saveDistractions([])
    setShowReview(false)
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Floating button */}
      <div style={{
        position: 'fixed', bottom: 88, right: 18, zIndex: 8000,
      }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowCapture(v => !v)}
            title="Capture a distracting thought"
            style={{
              width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: showCapture ? '#4ecf9e' : '#1a2040',
              boxShadow: `0 4px 16px rgba(0,0,0,0.4)${items.length > 0 ? ', 0 0 0 2px rgba(78,207,158,0.4)' : ''}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              transition: 'all 0.2s',
              animation: items.length === 0 ? 'dd-float 3s ease-in-out infinite' : undefined,
            }}
          >
            📥
          </button>

          {/* Badge count */}
          {items.length > 0 && (
            <div style={{
              position: 'absolute', top: -4, right: -4,
              width: 18, height: 18, borderRadius: '50%',
              background: '#ff6b6b', color: '#fff',
              fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #04060f',
            }}>
              {items.length}
            </div>
          )}

          {/* Review button when items exist */}
          {items.length > 0 && !showCapture && (
            <button
              onClick={() => setShowReview(true)}
              style={{
                position: 'absolute', bottom: 52, right: 0,
                fontFamily: '"JetBrains Mono",monospace', fontSize: 9, fontWeight: 700,
                padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'rgba(78,207,158,0.15)', color: '#4ecf9e',
                whiteSpace: 'nowrap',
              }}
            >
              Review {items.length}
            </button>
          )}

          {showCapture && (
            <CapturePopup
              onSave={addDistraction}
              onClose={() => setShowCapture(false)}
            />
          )}
        </div>
      </div>

      {showReview && (
        <ReviewModal items={items} onClear={clearAll} />
      )}
    </>
  )
}
