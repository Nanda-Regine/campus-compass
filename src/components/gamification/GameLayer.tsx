'use client'

// ─────────────────────────────────────────────────────────────────────────────
// GameLayer — Global gamification overlay.
// Renders above everything else (z-index 9998+) with no layout impact.
//
// Three systems:
//  1. XP Float Toasts  — "+15 XP" bubbles rise and fade on every XP gain
//  2. Badge Unlock     — full-screen Trophy UI-style modal with particle burst
//  3. Level-Up         — confetti + large reveal when player levels up
//
// All driven by CustomEvents emitted from xp-engine.ts:
//   'varsityos:xp'           { xp, label }
//   'varsityos:badge_unlock'  Badge object
//   'varsityos:level_up'      Level object
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Badge, Level } from '@/lib/xp-engine'

// ── Keyframes (injected once) ─────────────────────────────────────────────────

const STYLE_ID = 'varsityos-gamelayer-styles'

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes gl-xp-float {
      0%   { opacity: 0; transform: translateY(4px) scale(0.8); }
      15%  { opacity: 1; transform: translateY(-6px) scale(1.05); }
      70%  { opacity: 1; transform: translateY(-32px) scale(1); }
      100% { opacity: 0; transform: translateY(-50px) scale(0.9); }
    }
    @keyframes gl-badge-pop {
      0%   { transform: scale(0.4) rotate(-10deg); opacity: 0; }
      55%  { transform: scale(1.14) rotate(3deg);  opacity: 1; }
      75%  { transform: scale(0.95) rotate(-1deg); }
      100% { transform: scale(1)    rotate(0deg);  opacity: 1; }
    }
    @keyframes gl-badge-glow {
      0%, 100% { box-shadow: 0 0 30px var(--bc), 0 0 60px var(--bc44); }
      50%       { box-shadow: 0 0 55px var(--bc), 0 0 110px var(--bc66); }
    }
    @keyframes gl-particle {
      0%   { transform: translate(0,0) scale(1.2); opacity: 1; }
      100% { transform: translate(var(--tx), var(--ty)) scale(0);  opacity: 0; }
    }
    @keyframes gl-ring-expand {
      0%   { transform: scale(0.85); opacity: 0.7; }
      100% { transform: scale(2.8);  opacity: 0;   }
    }
    @keyframes gl-overlay-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes gl-badge-text-in {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes gl-level-pop {
      0%   { transform: scale(0.65) translateY(24px); opacity: 0; }
      60%  { transform: scale(1.1)  translateY(-4px); opacity: 1; }
      100% { transform: scale(1)    translateY(0);    opacity: 1; }
    }
    @keyframes gl-confetti-fall {
      0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
      100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
    }
  `
  document.head.appendChild(el)
}

// ── 1. XP Float Toasts ────────────────────────────────────────────────────────

interface XPToast { id: number; xp: number }

function XPFloatLayer() {
  const [toasts, setToasts] = useState<XPToast[]>([])
  const counter = useRef(0)

  useEffect(() => {
    const handler = (e: Event) => {
      const { xp } = (e as CustomEvent<{ xp: number }>).detail
      if (!xp) return
      const id = ++counter.current
      setToasts(t => [...t.slice(-5), { id, xp }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 1900)
    }
    window.addEventListener('varsityos:xp', handler)
    return () => window.removeEventListener('varsityos:xp', handler)
  }, [])

  if (!toasts.length) return null

  return (
    <div style={{
      position: 'fixed', bottom: 110, right: 18, zIndex: 9998,
      display: 'flex', flexDirection: 'column-reverse', gap: 6,
      pointerEvents: 'none', userSelect: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          animation: 'gl-xp-float 1.9s ease forwards',
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 700, fontSize: 16,
          color: '#4ecf9e',
          textShadow: '0 0 14px rgba(78,207,158,0.9), 0 0 30px rgba(78,207,158,0.4)',
          whiteSpace: 'nowrap',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.7))',
        }}>
          +{t.xp} XP
        </div>
      ))}
    </div>
  )
}

// ── 2. Badge Unlock Modal ─────────────────────────────────────────────────────

const PARTICLE_VECTORS = [
  { tx: '64px',  ty: '-88px'  },
  { tx: '-64px', ty: '-88px'  },
  { tx: '96px',  ty: '-18px'  },
  { tx: '-96px', ty: '-18px'  },
  { tx: '76px',  ty: '64px'   },
  { tx: '-76px', ty: '64px'   },
  { tx: '0px',   ty: '-108px' },
  { tx: '0px',   ty: '86px'   },
  { tx: '48px',  ty: '-72px'  },
  { tx: '-48px', ty: '72px'   },
]

function BadgeUnlockModal({ badge, onDismiss }: { badge: Badge; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4200)
    return () => clearTimeout(t)
  }, [onDismiss])

  const c = badge.color

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(5,7,20,0.88)',
        backdropFilter: 'blur(12px) saturate(1.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'gl-overlay-in 0.3s ease',
        cursor: 'pointer',
      }}
    >
      {/* Ambient glow behind badge */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -55%)',
        width: 320, height: 320, borderRadius: '50%',
        background: `radial-gradient(circle, ${c}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>

        {/* Expanding rings */}
        {[0, 0.35, 0.7].map(delay => (
          <div key={delay} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 130, height: 130,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: `2px solid ${c}`,
            animation: `gl-ring-expand 1.6s ease-out ${delay}s infinite`,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Badge circle */}
        <div style={{
          ['--bc' as string]: c,
          ['--bc44' as string]: `${c}44`,
          ['--bc66' as string]: `${c}66`,
          width: 128, height: 128, borderRadius: '50%',
          margin: '0 auto 22px',
          background: `radial-gradient(circle at 38% 38%, ${c}44, ${c}1a)`,
          border: `3px solid ${c}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 56, position: 'relative',
          animation: 'gl-badge-pop 0.65s cubic-bezier(0.34,1.56,0.64,1) both, gl-badge-glow 2.4s ease-in-out 0.65s infinite',
        }}>
          {badge.emoji}

          {/* Particles */}
          {PARTICLE_VECTORS.map((p, i) => (
            <div key={i} style={{
              ['--tx' as string]: p.tx,
              ['--ty' as string]: p.ty,
              position: 'absolute', top: '50%', left: '50%',
              marginTop: -5, marginLeft: -5,
              width: 10, height: 10, borderRadius: '50%',
              background: i % 2 === 0 ? c : '#fff',
              boxShadow: `0 0 8px ${c}`,
              animation: `gl-particle 0.9s cubic-bezier(0.22,1,0.36,1) ${0.35 + i * 0.04}s both`,
            }} />
          ))}
        </div>

        {/* "Achievement Unlocked" label */}
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10, letterSpacing: '0.22em',
          color: c, textTransform: 'uppercase',
          textShadow: `0 0 20px ${c}`,
          animation: 'gl-badge-text-in 0.4s ease 0.5s both',
          marginBottom: 10,
        }}>
          Achievement Unlocked
        </div>

        {/* Badge name */}
        <div style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 900,
          fontSize: 30, color: '#fff', letterSpacing: '-0.02em',
          textShadow: '0 2px 24px rgba(0,0,0,0.9)',
          animation: 'gl-badge-text-in 0.4s ease 0.6s both',
          marginBottom: 10,
        }}>
          {badge.emoji} {badge.name}
        </div>

        {/* Description */}
        <div style={{
          fontFamily: 'Sora, sans-serif', fontSize: 15,
          color: 'rgba(255,255,255,0.55)',
          maxWidth: 270, lineHeight: 1.55,
          animation: 'gl-badge-text-in 0.4s ease 0.7s both',
        }}>
          {badge.description}
        </div>

        <div style={{
          marginTop: 28,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10, color: 'rgba(255,255,255,0.2)',
          animation: 'gl-badge-text-in 0.4s ease 0.9s both',
        }}>
          Tap to continue
        </div>
      </div>
    </div>
  )
}

// ── 3. Level-Up Overlay ───────────────────────────────────────────────────────

const CONFETTI_PALETTE = ['#4ecf9e','#7090d0','#c084fc','#f59e0b','#fb923c','#ff6b6b','#fbbf24','#34d399','#60a5fa','#f472b6']

function LevelUpOverlay({ level, onDismiss }: { level: Level; onDismiss: () => void }) {
  const confetti = Array.from({ length: 30 }, (_, i) => ({
    color: CONFETTI_PALETTE[i % CONFETTI_PALETTE.length],
    left: `${(i / 30) * 100}%`,
    delay: `${(i * 0.06).toFixed(2)}s`,
    dur: `${1.4 + (i % 5) * 0.22}s`,
    size: `${5 + (i % 4) * 3}px`,
    shape: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0%',
  }))

  useEffect(() => {
    const t = setTimeout(onDismiss, 4800)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: `radial-gradient(ellipse at 50% 38%, ${level.color}25 0%, rgba(5,7,20,0.94) 65%)`,
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'gl-overlay-in 0.4s ease',
        cursor: 'pointer', overflow: 'hidden',
      }}
    >
      {/* Confetti */}
      {confetti.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', top: -24, left: c.left,
          width: c.size, height: c.size,
          borderRadius: c.shape,
          background: c.color,
          animation: `gl-confetti-fall ${c.dur} ease-in ${c.delay} both`,
          boxShadow: `0 0 4px ${c.color}88`,
        }} />
      ))}

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Emoji */}
        <div style={{
          fontSize: 88, lineHeight: 1, marginBottom: 18,
          animation: 'gl-level-pop 0.65s cubic-bezier(0.34,1.56,0.64,1) both',
          filter: `drop-shadow(0 0 36px ${level.color}) drop-shadow(0 0 60px ${level.color}66)`,
        }}>
          {level.emoji}
        </div>

        {/* LEVEL UP label */}
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 12, letterSpacing: '0.24em',
          color: level.color, textTransform: 'uppercase',
          textShadow: `0 0 24px ${level.color}`,
          animation: 'gl-level-pop 0.5s ease 0.12s both',
          marginBottom: 14,
        }}>
          Level Up!
        </div>

        {/* Level name */}
        <div style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 900,
          fontSize: 52, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1,
          textShadow: `0 0 50px ${level.color}aa, 0 4px 32px rgba(0,0,0,0.9)`,
          animation: 'gl-level-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
        }}>
          {level.name}
        </div>

        <div style={{
          marginTop: 28,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10, color: 'rgba(255,255,255,0.22)',
          animation: 'gl-badge-text-in 0.4s ease 0.8s both',
        }}>
          Tap to continue
        </div>
      </div>
    </div>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function GameLayer() {
  const [badgeQueue, setBadgeQueue] = useState<Badge[]>([])
  const [levelUp, setLevelUp]       = useState<Level | null>(null)
  const [mounted, setMounted]       = useState(false)

  const dismissBadge = useCallback(() => setBadgeQueue(q => q.slice(1)), [])
  const dismissLevel = useCallback(() => setLevelUp(null), [])

  useEffect(() => {
    injectStyles()
    setMounted(true)

    const onBadge = (e: Event) => {
      const badge = (e as CustomEvent<Badge>).detail
      setBadgeQueue(q => [...q, badge])
    }
    const onLevel = (e: Event) => {
      const lvl = (e as CustomEvent<Level>).detail
      setLevelUp(lvl)
    }

    window.addEventListener('varsityos:badge_unlock', onBadge)
    window.addEventListener('varsityos:level_up', onLevel)
    return () => {
      window.removeEventListener('varsityos:badge_unlock', onBadge)
      window.removeEventListener('varsityos:level_up', onLevel)
    }
  }, [])

  if (!mounted) return null

  const activeBadge = badgeQueue[0] ?? null

  return (
    <>
      <XPFloatLayer />
      {/* Show level-up only when no badge modal is queued */}
      {levelUp && !activeBadge && (
        <LevelUpOverlay level={levelUp} onDismiss={dismissLevel} />
      )}
      {activeBadge && (
        <BadgeUnlockModal badge={activeBadge} onDismiss={dismissBadge} />
      )}
    </>
  )
}
