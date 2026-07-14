'use client'

import { useState, useEffect, useRef } from 'react'
import { loadXPState, getLevelProgress } from '@/lib/xp-engine'

/* ─────────────────────────────────────────────────────────────────────────────
   Keyframes are injected once as a <style> tag so we can use named animations
   without Tailwind or CSS Modules.
───────────────────────────────────────────────────────────────────────────── */
const STYLE_ID = 'varsityos-levelcard-styles'

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes vc-bg-pan {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes vc-glow-pulse {
      0%, 100% { opacity: 0.55; box-shadow: 0 0 0px 0px var(--vc-color); }
      50%       { opacity: 1;    box-shadow: 0 0 22px 4px var(--vc-color); }
    }
    @keyframes vc-emoji-float {
      0%, 100% { transform: translateY(0px) scale(1); }
      50%       { transform: translateY(-4px) scale(1.08); }
    }
    @keyframes vc-shimmer {
      0%   { transform: translateX(-100%); }
      60%  { transform: translateX(400%); }
      100% { transform: translateX(400%); }
    }
    @keyframes vc-bar-grow {
      from { width: 0%; }
    }
    @keyframes vc-badge-pop {
      0%   { transform: scale(0.6); opacity: 0; }
      70%  { transform: scale(1.15); opacity: 1; }
      100% { transform: scale(1); }
    }
    @keyframes vc-xp-count-in {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes vc-border-spin {
      0%   { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
  `
  document.head.appendChild(el)
}

/* ─────────────────────────────────────────────────────────────────────────────
   Segmented progress bar
   Renders pct% filled across N equal segments with a shimmer sweep.
───────────────────────────────────────────────────────────────────────────── */
function SegmentedBar({ pct, color }: { pct: number; color: string }) {
  const SEGMENTS = 10
  return (
    <div style={{ display: 'flex', gap: 3, width: '100%' }}>
      {Array.from({ length: SEGMENTS }).map((_, i) => {
        const segPct = (i + 1) / SEGMENTS * 100
        const filled = pct >= segPct
        const partial = !filled && pct > i / SEGMENTS * 100
        const fillWidth = partial
          ? `${((pct - i / SEGMENTS * 100) / (1 / SEGMENTS * 100)) * 100}%`
          : filled ? '100%' : '0%'

        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.07)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* fill layer */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: fillWidth,
                background: `linear-gradient(90deg, ${color}cc, ${color})`,
                borderRadius: 4,
                animation: filled || partial
                  ? 'vc-bar-grow 0.9s cubic-bezier(0.22,1,0.36,1) both'
                  : 'none',
                animationDelay: `${i * 0.05}s`,
              }}
            />
            {/* shimmer sweep — only on filled/partial segments */}
            {(filled || partial) && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '30%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
                  animation: 'vc-shimmer 2.6s ease-in-out infinite',
                  animationDelay: `${i * 0.12 + 1}s`,
                  borderRadius: 4,
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────────────────── */
export default function LevelCard() {
  const [xp, setXP] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [prevXP, setPrevXP] = useState<number | null>(null)
  const [gainFlash, setGainFlash] = useState<number | null>(null)
  const gainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    injectStyles()
    setMounted(true)
    setXP(loadXPState().totalXP)

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ xp: number }>).detail
      setPrevXP(curr => curr)
      setXP(loadXPState().totalXP)
      if (detail?.xp) {
        setGainFlash(detail.xp)
        if (gainTimerRef.current) clearTimeout(gainTimerRef.current)
        gainTimerRef.current = setTimeout(() => setGainFlash(null), 2800)
      }
    }
    window.addEventListener('varsityos:xp', handler)
    return () => {
      window.removeEventListener('varsityos:xp', handler)
      if (gainTimerRef.current) clearTimeout(gainTimerRef.current)
    }
  }, [])

  if (!mounted) return null

  const { level, next, pct, xpThisLevel, xpToNext } = getLevelProgress(xp)
  const c = level.color  // shorthand

  return (
    <div
      style={{
        // CSS custom prop so nested elements can reference the colour
        ['--vc-color' as string]: c,
        position: 'relative',
        borderRadius: 18,
        overflow: 'hidden',
        // animated gradient border via a pseudo-wrapper technique:
        // outer div has the spinning gradient, inner div sits 2px inside
        padding: 2,
        background: `linear-gradient(270deg, ${c}, ${c}80, #1a1b2e, ${c}60, ${c})`,
        backgroundSize: '300% 300%',
        animation: 'vc-border-spin 5s linear infinite',
        maxWidth: 560,
        width: '100%',
        margin: '0 auto',
      }}
    >
      {/* Inner card with animated gradient background */}
      <div
        style={{
          position: 'relative',
          borderRadius: 16,
          padding: '18px 20px 16px',
          overflow: 'hidden',
          background: `linear-gradient(135deg, #0d0f1c 0%, #12142a 40%, ${c}22 100%)`,
          backgroundSize: '300% 300%',
          animation: 'vc-bg-pan 8s ease infinite',
        }}
      >
        {/* Subtle radial glow behind the emoji area */}
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: -20,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${c}35 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* ── Top row: badge + name + XP counter ──────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>

          {/* Glowing emoji circle */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              background: `radial-gradient(circle at 35% 35%, ${c}40, ${c}18)`,
              border: `1.5px solid ${c}60`,
              animation: 'vc-glow-pulse 3s ease-in-out infinite, vc-emoji-float 4s ease-in-out infinite',
              // the animationDelay staggers float so it doesn't sync with glow
              animationDelay: '0s, 0.8s',
            }}
          >
            {level.emoji}
          </div>

          {/* Name + subtitle block */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* "LEVEL" micro-label */}
            <div
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 600,
                fontSize: 9,
                letterSpacing: '0.18em',
                color: `${c}99`,
                textTransform: 'uppercase',
                marginBottom: 2,
              }}
            >
              CURRENT LEVEL
            </div>

            {/* Level name */}
            <div
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 800,
                fontSize: 22,
                lineHeight: 1.1,
                color: c,
                textShadow: `0 0 18px ${c}88`,
                letterSpacing: '-0.01em',
              }}
            >
              {level.name}
            </div>
          </div>

          {/* XP number + flash gain */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              key={xp}
              style={{
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontWeight: 700,
                fontSize: 20,
                color: '#ffffff',
                lineHeight: 1,
                animation: 'vc-xp-count-in 0.4s ease both',
              }}
            >
              {xp.toLocaleString()}
              <span
                style={{
                  fontFamily: 'Sora, sans-serif',
                  fontWeight: 500,
                  fontSize: 11,
                  color: '#fff',
                  marginLeft: 3,
                }}
              >
                XP
              </span>
            </div>

            {/* +XX gain flash */}
            {gainFlash !== null && (
              <div
                key={gainFlash + Date.now()}
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontWeight: 700,
                  fontSize: 12,
                  color: c,
                  textShadow: `0 0 10px ${c}`,
                  animation: 'vc-xp-count-in 0.3s ease both',
                  marginTop: 2,
                }}
              >
                +{gainFlash} XP
              </div>
            )}
          </div>
        </div>

        {/* ── Segmented progress bar ───────────────────────────────────────── */}
        <SegmentedBar pct={pct} color={c} />

        {/* ── Bottom metadata row ──────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          {/* Filled fraction */}
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              color: '#fff',
              letterSpacing: '0.03em',
            }}
          >
            {xpThisLevel.toLocaleString()} / {next ? (xpThisLevel + xpToNext).toLocaleString() : '—'} XP this level
          </span>

          {/* Next level hint */}
          {next ? (
            <span
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 600,
                fontSize: 10,
                color: `${c}cc`,
                background: `${c}18`,
                border: `1px solid ${c}30`,
                borderRadius: 99,
                padding: '2px 8px',
                whiteSpace: 'nowrap',
              }}
            >
              {xpToNext.toLocaleString()} XP to {next.emoji} {next.name}
            </span>
          ) : (
            <span
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 700,
                fontSize: 10,
                color: c,
                background: `${c}18`,
                border: `1px solid ${c}30`,
                borderRadius: 99,
                padding: '2px 8px',
              }}
            >
              Max Level {level.emoji}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
