'use client'

import { useState, useEffect } from 'react'
import { BADGES, loadXPState, getUnlockedBadges, Badge, XPState } from '@/lib/xp-engine'

export default function BadgesPanel() {
  const [state, setState] = useState<XPState | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setState(loadXPState())
    const handler = () => setState(loadXPState())
    window.addEventListener('varsityos:xp', handler)
    return () => window.removeEventListener('varsityos:xp', handler)
  }, [])

  if (!mounted || !state) return null

  const unlocked = new Set(getUnlockedBadges(state).map(b => b.id))
  const unlockedBadges = BADGES.filter(b => unlocked.has(b.id))
  const lockedBadges   = BADGES.filter(b => !unlocked.has(b.id))

  return (
    <div>
      {/* Stats row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
          Badges
        </span>
        <span style={{
          fontFamily: 'JetBrains Mono,monospace', fontSize: 10,
          color: unlockedBadges.length === BADGES.length ? '#4ecf9e' : 'rgba(255,255,255,0.4)',
        }}>
          {unlockedBadges.length}/{BADGES.length} unlocked
        </span>
      </div>

      {unlockedBadges.length === 0 && (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>
          Start using VarsityOS to earn your first badge.
        </p>
      )}

      {/* Unlocked */}
      {unlockedBadges.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Earned</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
            {unlockedBadges.map(b => <BadgeChip key={b.id} badge={b} unlocked />)}
          </div>
        </div>
      )}

      {/* Locked */}
      {lockedBadges.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Locked</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
            {lockedBadges.map(b => <BadgeChip key={b.id} badge={b} unlocked={false} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function BadgeChip({ badge, unlocked }: { badge: Badge; unlocked: boolean }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={badge.description}
      style={{
        position: 'relative',
        background: unlocked ? `${badge.color}0f` : 'rgba(255,255,255,0.025)',
        border: `1px solid ${unlocked ? badge.color + '28' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 10, padding: '10px 6px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        cursor: 'default', transition: 'all 0.2s',
        boxShadow: hovered && unlocked ? `0 0 12px ${badge.color}25` : 'none',
        filter: unlocked ? 'none' : 'grayscale(1) opacity(0.35)',
      }}
    >
      <span style={{ fontSize: 22 }}>{badge.emoji}</span>
      <span style={{
        fontSize: 9, textAlign: 'center', lineHeight: 1.3,
        color: unlocked ? badge.color : 'rgba(255,255,255,0.3)',
        fontFamily: 'Sora,sans-serif', fontWeight: 600,
      }}>
        {badge.name}
      </span>

      {/* Tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(13,14,20,0.97)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 7, padding: '5px 8px', width: 130, zIndex: 50,
          fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, textAlign: 'center',
          pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          {unlocked ? badge.description : `🔒 ${badge.description}`}
        </div>
      )}
    </div>
  )
}
