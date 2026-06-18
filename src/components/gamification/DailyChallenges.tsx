'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTodayChallengesWithStatus, completeDailyChallenge, DailyChallenge } from '@/lib/xp-engine'

type Challenge = DailyChallenge & { completed: boolean }

// Map each challenge icon to a vibrant color scheme
const ICON_COLORS: Record<string, { bg: string; glow: string; border: string }> = {
  '✅': { bg: 'linear-gradient(135deg, #1a4d3a, #0d2e21)', glow: 'rgba(78,207,158,0.55)', border: 'rgba(78,207,158,0.5)' },
  '🧠': { bg: 'linear-gradient(135deg, #2a1f4d, #160f2e)', glow: 'rgba(155,111,212,0.55)', border: 'rgba(155,111,212,0.5)' },
  '⏱️': { bg: 'linear-gradient(135deg, #4d3a0d, #2e220a)', glow: 'rgba(201,168,76,0.55)', border: 'rgba(201,168,76,0.5)' },
  '🃏': { bg: 'linear-gradient(135deg, #2a1f4d, #160f2e)', glow: 'rgba(155,111,212,0.55)', border: 'rgba(155,111,212,0.5)' },
  '🏁': { bg: 'linear-gradient(135deg, #1a1a1a, #0d0d0d)', glow: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.35)' },
  '✦':  { bg: 'linear-gradient(135deg, #0d2a4d, #08192e)', glow: 'rgba(112,144,208,0.55)', border: 'rgba(112,144,208,0.5)' },
  '🎓': { bg: 'linear-gradient(135deg, #4d2a0d, #2e180a)', glow: 'rgba(232,131,74,0.55)', border: 'rgba(232,131,74,0.5)' },
  '💼': { bg: 'linear-gradient(135deg, #0d2a4d, #08192e)', glow: 'rgba(112,144,208,0.55)', border: 'rgba(112,144,208,0.5)' },
  '📄': { bg: 'linear-gradient(135deg, #1a3a4d, #0d2030)', glow: 'rgba(78,170,207,0.55)', border: 'rgba(78,170,207,0.5)' },
  '🎤': { bg: 'linear-gradient(135deg, #4d0d1a, #2e0810)', glow: 'rgba(255,107,107,0.55)', border: 'rgba(255,107,107,0.5)' },
  '🎯': { bg: 'linear-gradient(135deg, #4d0d0d, #2e0808)', glow: 'rgba(255,107,107,0.55)', border: 'rgba(255,107,107,0.5)' },
  '🧘': { bg: 'linear-gradient(135deg, #2a1f4d, #160f2e)', glow: 'rgba(155,111,212,0.55)', border: 'rgba(155,111,212,0.5)' },
}

const DEFAULT_ICON_COLOR = { bg: 'linear-gradient(135deg, #1a1f2e, #0d1018)', glow: 'rgba(112,144,208,0.45)', border: 'rgba(112,144,208,0.4)' }

function getIconColor(icon: string) {
  return ICON_COLORS[icon] ?? DEFAULT_ICON_COLOR
}

// ── Keyframe injection ────────────────────────────────────────────────────────
let stylesInjected = false
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return
  stylesInjected = true
  const style = document.createElement('style')
  style.textContent = `
    @keyframes dc-flame-pulse {
      0%, 100% { transform: scale(1) rotate(-3deg); }
      50%       { transform: scale(1.18) rotate(3deg); }
    }
    @keyframes dc-bar-fill {
      from { width: 0%; }
    }
    @keyframes dc-card-pop {
      0%   { transform: scale(0.97); opacity: 0.7; }
      60%  { transform: scale(1.015); }
      100% { transform: scale(1);   opacity: 1; }
    }
    @keyframes dc-checkmark-pop {
      0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
      60%  { transform: scale(1.35) rotate(8deg); }
      100% { transform: scale(1)  rotate(0deg);  opacity: 1; }
    }
    @keyframes dc-star-spin {
      0%   { transform: rotate(0deg)   scale(1); }
      50%  { transform: rotate(180deg) scale(1.1); }
      100% { transform: rotate(360deg) scale(1); }
    }
    @keyframes dc-celebration-shimmer {
      0%   { background-position: 0%   50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0%   50%; }
    }
    @keyframes dc-float {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-4px); }
    }
    @keyframes dc-glow-pulse {
      0%, 100% { box-shadow: 0 0 8px var(--dc-glow, rgba(78,207,158,0.4)); }
      50%       { box-shadow: 0 0 20px var(--dc-glow, rgba(78,207,158,0.7)), 0 0 40px var(--dc-glow, rgba(78,207,158,0.3)); }
    }
    @keyframes dc-xp-bounce {
      0%, 100% { transform: translateY(0); }
      40%       { transform: translateY(-3px); }
    }
  `
  document.head.appendChild(style)
}

export default function DailyChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [mounted, setMounted]       = useState(false)
  const [prevDone, setPrevDone]     = useState(0)
  const [justCompleted, setJustCompleted] = useState(false)

  const refresh = useCallback(() => {
    setChallenges(getTodayChallengesWithStatus())
  }, [])

  useEffect(() => {
    injectStyles()
    setMounted(true)
    refresh()
    window.addEventListener('varsityos:xp', refresh)
    return () => window.removeEventListener('varsityos:xp', refresh)
  }, [refresh])

  const done = challenges.filter(c => c.completed).length

  // Trigger celebration animation when all 3 complete
  useEffect(() => {
    if (done === 3 && prevDone < 3) {
      setJustCompleted(true)
      const todayKey = `varsityos_mb_ready_${new Date().toISOString().split('T')[0]}`
      if (!localStorage.getItem(todayKey)) {
        localStorage.setItem(todayKey, '1')
        window.dispatchEvent(new CustomEvent('varsityos:mystery_box_ready'))
      }
    }
    setPrevDone(done)
  }, [done, prevDone])

  if (!mounted) return null

  const pct = Math.round((done / 3) * 100)

  // Progress bar color: red → amber → green
  const barColor = done === 0 ? '#7090d0' : done === 1 ? '#c9a84c' : done === 2 ? '#e8834a' : '#4ecf9e'

  return (
    <div style={{
      background: 'rgba(10,11,18,0.97)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: '16px 16px 14px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle top gradient accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${barColor}, transparent)`,
        opacity: 0.7,
        transition: 'background 0.6s',
      }} />

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 20,
            animation: 'dc-flame-pulse 1.8s ease-in-out infinite',
            display: 'inline-block',
            filter: 'drop-shadow(0 0 6px rgba(255,150,50,0.8))',
          }}>
            🔥
          </span>
          <span style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 800,
            fontSize: 14,
            color: '#fff',
            letterSpacing: '-0.01em',
          }}>
            Daily Quests
          </span>
        </div>

        {/* Quest counter badge */}
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          fontWeight: 700,
          color: done === 3 ? '#4ecf9e' : 'rgba(255,255,255,0.55)',
          background: done === 3
            ? 'linear-gradient(135deg, rgba(78,207,158,0.18), rgba(78,207,158,0.08))'
            : 'rgba(255,255,255,0.05)',
          border: `1.5px solid ${done === 3 ? 'rgba(78,207,158,0.45)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 20,
          padding: '3px 10px',
          transition: 'all 0.4s',
        }}>
          {done}/3
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          height: 7,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 99,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: done === 3
              ? 'linear-gradient(90deg, #4ecf9e, #7af7c8, #4ecf9e)'
              : `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
            backgroundSize: done === 3 ? '200% 100%' : '100% 100%',
            borderRadius: 99,
            transition: 'width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.6s',
            animation: done === 3 ? 'dc-celebration-shimmer 2s linear infinite' : undefined,
            boxShadow: `0 0 8px ${barColor}88`,
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 5,
        }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              fontFamily: 'Sora, sans-serif',
              fontSize: 9,
              fontWeight: 600,
              color: i < done ? barColor : 'rgba(255,255,255,0.22)',
              transition: 'color 0.4s',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
            }}>
              {i < done ? 'Done' : `Quest ${i + 1}`}
            </span>
          ))}
        </div>
      </div>

      {/* ── Quest Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {challenges.map((ch, idx) => (
          <QuestCard key={ch.id} challenge={ch} index={idx} onComplete={refresh} />
        ))}
      </div>

      {/* ── All Complete Banner ── */}
      {done === 3 && (
        <div style={{
          marginTop: 12,
          padding: '12px 14px',
          background: 'linear-gradient(135deg, rgba(78,207,158,0.15), rgba(122,247,200,0.08), rgba(78,207,158,0.12))',
          backgroundSize: '200% 200%',
          border: '1px solid rgba(78,207,158,0.35)',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 10,
          animation: justCompleted
            ? 'dc-card-pop 0.5s ease-out, dc-celebration-shimmer 3s ease infinite'
            : 'dc-celebration-shimmer 3s ease infinite',
        }}>
          <div style={{
            fontSize: 22,
            animation: 'dc-float 2.5s ease-in-out infinite',
            display: 'inline-block',
            filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.7))',
          }}>
            🏆
          </div>
          <div>
            <div style={{
              fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 12,
              color: '#4ecf9e',
              letterSpacing: '-0.01em',
            }}>
              All quests complete!
            </div>
            <div style={{
              fontFamily: 'Sora, sans-serif', fontSize: 10, fontWeight: 400,
              color: 'rgba(78,207,158,0.65)', marginTop: 1,
            }}>
              Come back tomorrow for new challenges
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {['⭐', '✨', '⭐'].map((star, i) => (
              <span key={i} style={{
                fontSize: 13,
                animation: `dc-star-spin 3s linear infinite`,
                animationDelay: `${i * 0.4}s`,
                display: 'inline-block',
                opacity: 0.9,
              }}>
                {star}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Quest Card ────────────────────────────────────────────────────────────────

function QuestCard({
  challenge: ch, index, onComplete,
}: {
  challenge: Challenge
  index: number
  onComplete: () => void
}) {
  const [pressing, setPressing]       = useState(false)
  const [justDone, setJustDone]       = useState(false)
  const iconColor = getIconColor(ch.icon)

  function handleMark() {
    if (ch.completed) return
    setJustDone(true)
    completeDailyChallenge(ch.id, ch.title)
    onComplete()
  }

  const cardBg = ch.completed
    ? 'linear-gradient(135deg, rgba(78,207,158,0.09) 0%, rgba(10,11,18,0.0) 100%)'
    : 'linear-gradient(135deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)'

  const cardBorder = ch.completed
    ? 'rgba(78,207,158,0.32)'
    : 'rgba(255,255,255,0.08)'

  return (
    <div style={{
      position: 'relative',
      padding: '1.5px',
      borderRadius: 13,
      background: ch.completed
        ? 'linear-gradient(135deg, rgba(78,207,158,0.5), rgba(78,207,158,0.1), rgba(78,207,158,0.3))'
        : `linear-gradient(135deg, ${iconColor.border}, rgba(255,255,255,0.06), rgba(255,255,255,0.03))`,
      animation: justDone ? 'dc-card-pop 0.45s cubic-bezier(0.34,1.56,0.64,1)' : undefined,
      transition: 'all 0.35s ease',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '10px 11px',
        borderRadius: 12,
        background: ch.completed
          ? 'linear-gradient(135deg, rgba(78,207,158,0.08), rgba(10,11,18,0.95))'
          : 'linear-gradient(135deg, rgba(13,14,22,0.98), rgba(10,11,18,0.99))',
        opacity: ch.completed ? 0.88 : 1,
        transition: 'all 0.35s ease',
        cursor: (!ch.autoDetect && !ch.completed) ? 'pointer' : 'default',
        boxShadow: ch.completed
          ? 'inset 0 0 20px rgba(78,207,158,0.05)'
          : pressing ? 'inset 0 0 16px rgba(255,255,255,0.04)' : 'none',
      }}
        onClick={(!ch.autoDetect && !ch.completed) ? handleMark : undefined}
      >
        {/* Icon circle */}
        <div style={{
          width: 42, height: 42, flexShrink: 0,
          borderRadius: 12,
          background: ch.completed
            ? 'linear-gradient(135deg, rgba(78,207,158,0.22), rgba(78,207,158,0.08))'
            : iconColor.bg,
          border: `1.5px solid ${ch.completed ? 'rgba(78,207,158,0.4)' : iconColor.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
          boxShadow: ch.completed
            ? `0 0 14px rgba(78,207,158,0.45), 0 0 4px rgba(78,207,158,0.3)`
            : `0 0 10px ${iconColor.glow}, 0 2px 6px rgba(0,0,0,0.4)`,
          transition: 'all 0.4s ease',
          position: 'relative',
          overflow: 'visible',
        }}>
          <span style={{
            display: 'inline-block',
            transition: 'transform 0.3s, filter 0.3s',
            filter: ch.completed
              ? 'grayscale(0.3) brightness(0.75)'
              : `drop-shadow(0 0 4px ${iconColor.glow})`,
          }}>
            {ch.icon}
          </span>
        </div>

        {/* Text content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 700,
            fontSize: 12.5,
            color: ch.completed ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.92)',
            textDecoration: ch.completed ? 'line-through' : 'none',
            textDecorationColor: 'rgba(78,207,158,0.5)',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            transition: 'all 0.3s',
          }}>
            {ch.title}
          </div>
          <div style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: 10,
            color: ch.completed ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.38)',
            marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            transition: 'color 0.3s',
          }}>
            {ch.description}
          </div>
        </div>

        {/* XP Pill */}
        <div style={{
          flexShrink: 0,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          fontWeight: 700,
          color: ch.completed ? 'rgba(78,207,158,0.55)' : '#e8b84c',
          background: ch.completed
            ? 'rgba(78,207,158,0.08)'
            : 'linear-gradient(135deg, rgba(232,184,76,0.18), rgba(201,168,76,0.1))',
          border: `1px solid ${ch.completed ? 'rgba(78,207,158,0.2)' : 'rgba(232,184,76,0.35)'}`,
          borderRadius: 20,
          padding: '3px 8px',
          letterSpacing: '0.02em',
          animation: !ch.completed ? 'dc-xp-bounce 3s ease-in-out infinite' : undefined,
          animationDelay: `${index * 0.3}s`,
          boxShadow: ch.completed ? 'none' : '0 0 8px rgba(232,184,76,0.25)',
          transition: 'all 0.4s',
          whiteSpace: 'nowrap',
        }}>
          +{ch.xp} XP
        </div>

        {/* Mark done button (manual challenges) */}
        {!ch.autoDetect && !ch.completed && (
          <button
            onMouseDown={() => setPressing(true)}
            onMouseUp={() => { setPressing(false); handleMark() }}
            onMouseLeave={() => setPressing(false)}
            onClick={(e) => e.stopPropagation()}
            style={{
              flexShrink: 0,
              width: 28, height: 28,
              borderRadius: 8,
              background: pressing
                ? 'linear-gradient(135deg, rgba(78,207,158,0.35), rgba(78,207,158,0.2))'
                : 'linear-gradient(135deg, rgba(78,207,158,0.15), rgba(78,207,158,0.07))',
              border: `1.5px solid ${pressing ? 'rgba(78,207,158,0.6)' : 'rgba(78,207,158,0.35)'}`,
              color: '#4ecf9e',
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
              boxShadow: pressing ? '0 0 12px rgba(78,207,158,0.4)' : 'none',
              transform: pressing ? 'scale(0.93)' : 'scale(1)',
            }}
            title="Mark quest as done"
          >
            ✓
          </button>
        )}

        {/* Completed checkmark */}
        {ch.completed && (
          <div style={{
            flexShrink: 0,
            width: 28, height: 28,
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(78,207,158,0.25), rgba(78,207,158,0.1))',
            border: '1.5px solid rgba(78,207,158,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px rgba(78,207,158,0.4), 0 0 4px rgba(78,207,158,0.3)',
            animation: justDone ? 'dc-checkmark-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)' : undefined,
          }}>
            <span style={{ fontSize: 14, color: '#4ecf9e', fontWeight: 900 }}>✓</span>
          </div>
        )}
      </div>
    </div>
  )
}
