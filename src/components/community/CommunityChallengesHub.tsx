'use client'

// CommunityChallengesHub — tabbed card wrapping Leaderboard, Battles, and Bounty Board.

import { useState } from 'react'
import CampusLeaderboard from './CampusLeaderboard'
import StudyBattle from './StudyBattle'
import WeeklyBountyBoard from './WeeklyBountyBoard'

type Tab = 'leaderboard' | 'battles' | 'bounty'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'leaderboard', label: 'Rankings',  emoji: '🏆' },
  { id: 'battles',     label: 'Battles',   emoji: '⚔️' },
  { id: 'bounty',      label: 'Bounty',    emoji: '🎯' },
]

const STYLE_ID = 'varsityos-hub-styles'
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `@keyframes hub-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }`
  document.head.appendChild(el)
}

export default function CommunityChallengesHub() {
  const [tab, setTab] = useState<Tab>('leaderboard')

  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      border: '1px solid rgba(201,168,76,0.15)',
      background: 'rgba(201,168,76,0.02)',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#c9a84c', letterSpacing: '0.18em', marginBottom: 4 }}>
          🌍 COMMUNITY CHALLENGES
        </div>
        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 15, color: '#fff' }}>
          Compete, collaborate, win
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.15)',
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
            background: 'transparent',
            borderBottom: tab === t.id ? '2px solid #c9a84c' : '2px solid transparent',
            fontFamily: 'Sora,sans-serif', fontSize: 11, fontWeight: tab === t.id ? 700 : 400,
            color: tab === t.id ? '#c9a84c' : 'rgba(255,255,255,0.3)',
            transition: 'all 0.15s',
          }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '18px 18px 20px', animation: 'hub-in 0.3s ease' }} key={tab}>
        {tab === 'leaderboard' && <CampusLeaderboard />}
        {tab === 'battles'     && <StudyBattle />}
        {tab === 'bounty'      && <WeeklyBountyBoard />}
      </div>
    </div>
  )
}
