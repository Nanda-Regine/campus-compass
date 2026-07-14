'use client'

import { useEffect, useState, useCallback } from 'react'
import { rollMysteryBox, MYSTERY_LOOT_TABLE, dispatchXP, creditXP } from '@/lib/xp-engine'

type Reward = typeof MYSTERY_LOOT_TABLE[number]

const STYLE_ID = 'varsityos-mysterybox-styles'
function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = `
    @keyframes mb-shake { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-8deg)} 40%{transform:rotate(8deg)} 60%{transform:rotate(-5deg)} 80%{transform:rotate(5deg)} }
    @keyframes mb-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes mb-open { 0%{transform:scale(1) rotate(0)} 50%{transform:scale(1.2) rotate(-5deg)} 100%{transform:scale(0) rotate(10deg);opacity:0} }
    @keyframes mb-reveal { from{opacity:0;transform:scale(0.4) translateY(30px)} to{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes mb-sparkle { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
    @keyframes mb-fade-in { from{opacity:0} to{opacity:1} }
  `
  document.head.appendChild(s)
}

export default function MysteryBox() {
  const [phase, setPhase] = useState<'idle' | 'ready' | 'opening' | 'revealed'>('idle')
  const [reward, setReward] = useState<Reward | null>(null)
  const [alreadyClaimed, setAlreadyClaimed] = useState(false)

  useEffect(() => {
    injectStyles()
    // Check if already claimed today
    fetch('/api/gamification/mystery-box')
      .then(r => r.json())
      .then(d => { if (d.claimed) setAlreadyClaimed(true) })
      .catch(() => {})

    const handler = () => {
      if (alreadyClaimed) return
      setPhase('ready')
    }
    window.addEventListener('varsityos:mystery_box_ready', handler)
    return () => window.removeEventListener('varsityos:mystery_box_ready', handler)
  }, [alreadyClaimed])

  const openBox = useCallback(async () => {
    if (phase !== 'ready' || alreadyClaimed) return
    setPhase('opening')

    const rolled = rollMysteryBox()
    setReward(rolled)

    setTimeout(async () => {
      setPhase('revealed')
      // Applies the rolled reward locally (badge counter + XP + multiplier).
      const applyReward = () => {
        // Record the open (badge counter + daily claim) regardless of whether
        // this roll carried XP. XP_VALUES['mystery_box_opened'] is 0.
        dispatchXP('mystery_box_opened')
        if (rolled.xp > 0) creditXP(rolled.xp, `🎁 ${rolled.label}`)
        if (rolled.type === 'multiplier') {
          localStorage.setItem('varsityos_xp_multiplier', JSON.stringify({ value: 2, expires: Date.now() + 3600000 }))
        }
      }
      // Persist claim. The server enforces one claim/day and returns 409 on a
      // duplicate (e.g. already opened on another device or before a reload).
      // fetch does NOT throw on 409, so only credit when the POST actually
      // succeeded — otherwise the box would double-award XP the claim table
      // explicitly refused to record.
      try {
        const res = await fetch('/api/gamification/mystery-box', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reward_type: rolled.type,
            reward_value: { label: rolled.label, description: rolled.description },
            xp_awarded: rolled.xp,
          }),
        })
        if (res.ok) applyReward()
        // else (e.g. 409 already claimed) → credit nothing
      } catch {
        // Network unreachable — credit optimistically (best-effort, offline).
        applyReward()
      }
      setAlreadyClaimed(true)
    }, 900)
  }, [phase, alreadyClaimed])

  if (phase === 'idle') return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9950,
        background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        animation: 'mb-fade-in 0.3s ease both',
      }}
      onClick={phase === 'revealed' ? () => setPhase('idle') : undefined}
    >
      {phase === 'ready' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.58)', letterSpacing: '0.2em', marginBottom: 20, textTransform: 'uppercase' }}>
            All 3 challenges complete!
          </div>
          <div
            style={{ fontSize: 80, cursor: 'pointer', animation: 'mb-bounce 1.2s ease-in-out infinite', display: 'block', marginBottom: 20 }}
            onClick={openBox}
          >
            🎁
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: '#fff', marginBottom: 8 }}>
            Mystery Box Unlocked!
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.58)', marginBottom: 24 }}>
            Tap the box to reveal your reward
          </div>
          <button
            onClick={openBox}
            style={{
              background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(167,139,250,0.1))',
              border: '1px solid rgba(167,139,250,0.5)', color: '#a78bfa',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem',
              padding: '12px 32px', borderRadius: 14, cursor: 'pointer',
            }}
          >
            Open Box ✨
          </button>
        </div>
      )}

      {phase === 'opening' && (
        <div style={{ fontSize: 80, animation: 'mb-open 0.9s ease forwards' }}>🎁</div>
      )}

      {phase === 'revealed' && reward && (
        <div style={{ textAlign: 'center', animation: 'mb-reveal 0.6s cubic-bezier(0.34,1.56,0.64,1) both' }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>{reward.emoji}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(167,139,250,0.8)', letterSpacing: '0.2em', marginBottom: 6, textTransform: 'uppercase' }}>
            You got
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.8rem', color: '#fff', marginBottom: 8 }}>
            {reward.label}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'rgba(255,255,255,0.66)', marginBottom: 24 }}>
            {reward.description}
          </div>
          {reward.xp > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(78,207,158,0.12)', border: '1px solid rgba(78,207,158,0.4)',
              borderRadius: 12, padding: '8px 20px', marginBottom: 20,
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: '#4ecf9e' }}>+{reward.xp} XP</span>
            </div>
          )}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)' }}>
            Tap anywhere to continue
          </div>
        </div>
      )}
    </div>
  )
}
