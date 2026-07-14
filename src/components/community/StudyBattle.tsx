'use client'

// StudyBattle — 1v1 XP race. Whoever gains more XP during the battle window wins.
// Invite via WhatsApp deeplink; join via 6-char code.
// On result: dispatchXP('battle_won') or dispatchXP('battle_participated') client-side.

import { useState, useEffect, useCallback, useRef } from 'react'
import { dispatchXP } from '@/lib/xp-engine'
import { loadXPState } from '@/lib/xp-engine'
import toast from 'react-hot-toast'

interface Battle {
  id:                  string
  battle_code:         string
  status:              'pending' | 'active' | 'complete' | 'cancelled'
  challenger_id:       string
  opponent_id:         string | null
  duration_hours:      number
  start_at:            string | null
  end_at:              string | null
  challenger_xp_start: number
  opponent_xp_start:   number | null
  challenger_xp_end:   number | null
  opponent_xp_end:     number | null
  winner_id:           string | null
}

interface LiveXP { challenger: number; opponent: number | null }

const DURATION_LABELS: Record<number, string> = { 24: '24 hours', 48: '2 days', 168: '1 week' }

function formatCountdown(endAt: string): string {
  const ms = new Date(endAt).getTime() - Date.now()
  if (ms <= 0) return 'Ended'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`
  return `${h}h ${m}m left`
}

// ── Create form ───────────────────────────────────────────────────────────────

function CreateForm({ onCreated, onCancel }: { onCreated: (b: Battle) => void; onCancel: () => void }) {
  const [duration, setDuration] = useState(24)
  const [loading,  setLoading]  = useState(false)

  const create = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/battles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_hours: duration }),
      })
      if (!res.ok) throw new Error()
      const d = await res.json()
      onCreated(d.battle)
    } catch {
      toast.error('Could not create battle')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
        Challenge someone to a study battle
      </div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.58)', marginBottom: 18, lineHeight: 1.5 }}>
        Whoever gains more XP in the window wins. Share the code via WhatsApp.
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([24, 48, 168] as const).map(h => (
          <button key={h} onClick={() => setDuration(h)} style={{
            flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
            fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700,
            background: duration === h ? '#c9a84c' : 'rgba(255,255,255,0.08)',
            color: duration === h ? '#000' : 'rgba(255,255,255,0.66)',
            border: duration === h ? 'none' : '1px solid rgba(255,255,255,0.1)',
          }}>
            {DURATION_LABELS[h]}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '11px 0', borderRadius: 11,
          border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
          color: 'rgba(255,255,255,0.5)', fontFamily: 'Sora,sans-serif', fontSize: 13, cursor: 'pointer',
        }}>Cancel</button>
        <button onClick={create} disabled={loading} style={{
          flex: 2, padding: '11px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
          background: loading ? 'rgba(201,168,76,0.4)' : '#c9a84c', color: '#000',
          fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 13,
        }}>
          {loading ? 'Creating…' : '⚔️ Create Battle'}
        </button>
      </div>
    </div>
  )
}

// ── Invite card (after creation, before someone joins) ────────────────────────

function InviteCard({ battle, onCancel }: { battle: Battle; onCancel: () => void }) {
  const shareMsg = `⚔️ I'm challenging you to a VarsityOS Study Battle!\n\nBattle code: ${battle.battle_code}\nDuration: ${DURATION_LABELS[battle.duration_hours]}\n\nJoin me at https://varsityos.co.za\nMay the best studier win 💪`

  const share = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`, '_blank', 'noopener')
  }
  const copy = () => {
    navigator.clipboard.writeText(battle.battle_code).then(() => toast.success('Code copied!'))
  }

  return (
    <div>
      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#c9a84c', letterSpacing: '0.18em', marginBottom: 12 }}>
        ⏳ WAITING FOR OPPONENT
      </div>

      {/* Battle code display */}
      <div style={{
        textAlign: 'center', padding: '20px 0', marginBottom: 16,
        background: 'rgba(201,168,76,0.06)', borderRadius: 14,
        border: '1px dashed rgba(201,168,76,0.3)',
      }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(201,168,76,0.6)', marginBottom: 8 }}>
          BATTLE CODE
        </div>
        <div onClick={copy} style={{
          fontFamily: '"JetBrains Mono",monospace', fontWeight: 900, fontSize: 32, color: '#c9a84c',
          letterSpacing: '0.25em', cursor: 'pointer',
        }}>
          {battle.battle_code}
        </div>
        <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>
          Tap code to copy · {DURATION_LABELS[battle.duration_hours]} race
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={share} style={{
          flex: 2, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: '#25D366', color: '#fff',
          fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13,
        }}>
          📱 Share on WhatsApp
        </button>
        <button onClick={onCancel} style={{
          flex: 1, padding: '12px 0', borderRadius: 12,
          border: '1px solid rgba(255,107,107,0.3)',
          background: 'rgba(255,107,107,0.06)', color: '#ff6b6b',
          fontFamily: 'Sora,sans-serif', fontSize: 12, cursor: 'pointer',
        }}>Cancel</button>
      </div>
    </div>
  )
}

// ── Join form ─────────────────────────────────────────────────────────────────

function JoinForm({ onJoined, onCancel }: { onJoined: (b: Battle) => void; onCancel: () => void }) {
  const [code,    setCode]    = useState('')
  const [preview, setPreview] = useState<Battle | null>(null)
  const [loading, setLoading] = useState(false)

  const lookup = async (c: string) => {
    if (c.length !== 6) { setPreview(null); return }
    try {
      const res = await fetch(`/api/battles/${c.toUpperCase()}`)
      if (!res.ok) { setPreview(null); return }
      const d = await res.json()
      setPreview(d.battle)
    } catch { setPreview(null) }
  }

  const join = async () => {
    if (!preview) return
    setLoading(true)
    try {
      const res = await fetch(`/api/battles/${preview.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join' }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Join failed')
      const d = await res.json()
      onJoined(d.battle)
      toast.success('Battle joined! The race is on 🏆')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not join')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 14 }}>
        Join a battle by code
      </div>
      <input
        type="text" value={code} maxLength={6} placeholder="Enter 6-char code"
        onChange={e => { const v = e.target.value.toUpperCase(); setCode(v); lookup(v) }}
        style={{
          width: '100%', padding: '12px', borderRadius: 12, boxSizing: 'border-box',
          fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 20,
          letterSpacing: '0.2em', textAlign: 'center',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          color: '#c9a84c', outline: 'none', marginBottom: 12,
        }}
      />

      {preview && (
        <div style={{
          padding: '10px 14px', borderRadius: 11, marginBottom: 12,
          background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
          fontFamily: 'Sora,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.6)',
        }}>
          ✓ Battle found · {DURATION_LABELS[preview.duration_hours]} race
        </div>
      )}
      {code.length === 6 && !preview && (
        <div style={{ marginBottom: 12, fontFamily: 'Sora,sans-serif', fontSize: 12, color: '#ff6b6b' }}>
          Code not found or already started.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '11px 0', borderRadius: 11,
          border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
          color: 'rgba(255,255,255,0.5)', fontFamily: 'Sora,sans-serif', fontSize: 13, cursor: 'pointer',
        }}>Cancel</button>
        <button onClick={join} disabled={!preview || loading} style={{
          flex: 2, padding: '11px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
          background: preview && !loading ? '#c9a84c' : 'rgba(255,255,255,0.07)',
          color: preview && !loading ? '#000' : 'rgba(255,255,255,0.2)',
          fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 13,
        }}>
          {loading ? 'Joining…' : '⚔️ Accept challenge'}
        </button>
      </div>
    </div>
  )
}

// ── Active battle card ────────────────────────────────────────────────────────

function ActiveBattle({ battle, liveXP, isChallenger, onResult }: {
  battle: Battle; liveXP: LiveXP; isChallenger: boolean; onResult: (b: Battle) => void
}) {
  const [countdown, setCountdown] = useState(() => battle.end_at ? formatCountdown(battle.end_at) : '')
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!battle.end_at) return
      setCountdown(formatCountdown(battle.end_at))
      if (new Date(battle.end_at) <= new Date()) clearInterval(timerRef.current)
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [battle.end_at])

  const myStart    = isChallenger ? battle.challenger_xp_start : (battle.opponent_xp_start ?? 0)
  const oppStart   = isChallenger ? (battle.opponent_xp_start ?? 0) : battle.challenger_xp_start
  const myLive     = isChallenger ? liveXP.challenger : (liveXP.opponent ?? 0)
  const oppLive    = isChallenger ? (liveXP.opponent ?? 0) : liveXP.challenger
  const myGain     = Math.max(0, myLive - myStart)
  const oppGain    = Math.max(0, oppLive - oppStart)
  const winning    = myGain >= oppGain
  const ended      = battle.end_at ? new Date(battle.end_at) <= new Date() : false

  const computeResult = async () => {
    try {
      const res = await fetch(`/api/battles/${battle.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'compute_result' }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const d = await res.json()
      onResult(d.battle)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not compute result')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#c9a84c', letterSpacing: '0.14em' }}>
          ⚔️ BATTLE ACTIVE
        </div>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: ended ? '#ff6b6b' : 'rgba(255,255,255,0.5)' }}>
          {ended ? 'ENDED' : countdown}
        </div>
      </div>

      {/* XP scoreboard */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        {/* Me */}
        <div style={{ textAlign: 'center', padding: '14px 10px', borderRadius: 12,
          background: winning ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.07)',
          border: `1px solid ${winning ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)'}`,
        }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>YOU</div>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 900, fontSize: 22, color: winning ? '#c9a84c' : '#fff' }}>
            +{myGain}
          </div>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>XP gained</div>
        </div>

        {/* VS */}
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>VS</div>

        {/* Opponent */}
        <div style={{ textAlign: 'center', padding: '14px 10px', borderRadius: 12,
          background: !winning ? 'rgba(255,107,107,0.08)' : 'rgba(255,255,255,0.07)',
          border: `1px solid ${!winning ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.08)'}`,
        }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>THEM</div>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 900, fontSize: 22, color: !winning ? '#ff6b6b' : '#fff' }}>
            +{battle.opponent_id ? oppGain : '?'}
          </div>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>XP gained</div>
        </div>
      </div>

      {ended && (
        <button onClick={computeResult} style={{
          width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: '#c9a84c', color: '#000',
          fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 14,
        }}>
          🏆 See final result
        </button>
      )}
    </div>
  )
}

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({ battle, isChallenger }: { battle: Battle; isChallenger: boolean }) {
  const myId    = isChallenger ? battle.challenger_id : battle.opponent_id
  const won     = battle.winner_id === myId
  const myGain  = isChallenger
    ? (battle.challenger_xp_end ?? 0) - (battle.challenger_xp_start ?? 0)
    : (battle.opponent_xp_end   ?? 0) - (battle.opponent_xp_start   ?? 0)
  const oppGain = isChallenger
    ? (battle.opponent_xp_end   ?? 0) - (battle.opponent_xp_start   ?? 0)
    : (battle.challenger_xp_end ?? 0) - (battle.challenger_xp_start ?? 0)

  useEffect(() => {
    const claimKey = `varsityos_battle_xp_${battle.id}`
    if (localStorage.getItem(claimKey)) return
    localStorage.setItem(claimKey, '1')
    dispatchXP('battle_participated')
    if (won) dispatchXP('battle_won')
  }, [battle.id, won])

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>{won ? '🏆' : '💪'}</div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 900, fontSize: 20, color: won ? '#c9a84c' : '#fff', marginBottom: 6 }}>
        {won ? 'You won!' : 'Good fight!'}
      </div>
      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.58)', marginBottom: 16 }}>
        You +{Math.max(0, myGain)} XP · They +{Math.max(0, oppGain)} XP
      </div>
      {won && (
        <div style={{
          padding: '8px 14px', borderRadius: 10, display: 'inline-block',
          background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)',
          fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#c9a84c',
        }}>
          +100 XP battle bonus awarded
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function StudyBattle() {
  const [view,       setView]       = useState<'lobby' | 'create' | 'join' | 'invite' | 'active' | 'result'>('lobby')
  const [battle,     setBattle]     = useState<Battle | null>(null)
  const [liveXP,     setLiveXP]     = useState<LiveXP>({ challenger: 0, opponent: null })
  const [myId,       setMyId]       = useState<string | null>(null)
  const [myBattles,  setMyBattles]  = useState<Battle[]>([])
  const [mounted,    setMounted]    = useState(false)

  useEffect(() => {
    setMounted(true)
    // Detect ?battle=CODE in URL
    const code = new URLSearchParams(window.location.search).get('battle')
    if (code) {
      setView('join')
    }
    // Load my current battles
    fetch('/api/battles').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.battles?.length) {
        setMyBattles(d.battles)
        const active = d.battles.find((b: Battle) => b.status === 'active' || b.status === 'pending')
        if (active) setBattle(active)
      }
    }).catch(() => {})
    // Get my user id from profile
    fetch('/api/profile/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.id) setMyId(d.id)
    }).catch(() => {})
  }, [])

  // Poll live XP when battle is active
  useEffect(() => {
    if (!battle || battle.status !== 'active') return
    const poll = async () => {
      try {
        const res = await fetch(`/api/battles/${battle.id}`)
        if (!res.ok) return
        const d = await res.json()
        setLiveXP(d.live_xp)
        if (d.battle.status === 'complete') {
          setBattle(d.battle)
          setView('result')
        }
      } catch { /* ignore */ }
    }
    poll()
    const t = setInterval(poll, 60_000)
    return () => clearInterval(t)
  }, [battle])

  const isChallenger = battle?.challenger_id === myId

  if (!mounted) return null

  // Check if I have an active/pending battle
  const activeBattle = myBattles.find(b => b.status === 'active')
  const pendingBattle = myBattles.find(b => b.status === 'pending')

  if (view === 'result' && battle) {
    return <ResultCard battle={battle} isChallenger={isChallenger} />
  }

  if (view === 'active' && battle) {
    return (
      <ActiveBattle
        battle={battle} liveXP={liveXP} isChallenger={isChallenger}
        onResult={b => { setBattle(b); setView('result') }}
      />
    )
  }

  if (view === 'invite' && battle) {
    return (
      <InviteCard
        battle={battle}
        onCancel={async () => {
          await fetch(`/api/battles/${battle.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'cancel' }),
          })
          setBattle(null); setView('lobby')
        }}
      />
    )
  }

  if (view === 'create') {
    return (
      <CreateForm
        onCreated={b => { setBattle(b); setView('invite') }}
        onCancel={() => setView('lobby')}
      />
    )
  }

  if (view === 'join') {
    return (
      <JoinForm
        onJoined={b => { setBattle(b); setLiveXP({ challenger: b.challenger_xp_start, opponent: b.opponent_xp_start }); setView('active') }}
        onCancel={() => setView('lobby')}
      />
    )
  }

  // Lobby
  return (
    <div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
        Study Battles ⚔️
      </div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.58)', marginBottom: 16, lineHeight: 1.5 }}>
        Challenge a friend. Whoever earns more XP in the window wins.
      </div>

      {/* Active battle summary */}
      {activeBattle && (
        <div onClick={() => { setBattle(activeBattle); setView('active') }} style={{
          padding: '12px 14px', borderRadius: 12, marginBottom: 12, cursor: 'pointer',
          background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)',
        }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#c9a84c', marginBottom: 4 }}>ACTIVE BATTLE</div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 13, color: 'var(--text-primary)' }}>
            Code: {activeBattle.battle_code} · {activeBattle.end_at ? formatCountdown(activeBattle.end_at) : ''}
          </div>
        </div>
      )}

      {pendingBattle && !activeBattle && (
        <div onClick={() => { setBattle(pendingBattle); setView('invite') }} style={{
          padding: '12px 14px', borderRadius: 12, marginBottom: 12, cursor: 'pointer',
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,0.58)', marginBottom: 4 }}>WAITING FOR OPPONENT</div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 13, color: 'var(--text-primary)' }}>
            Code: {pendingBattle.battle_code}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setView('create')} style={{
          flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: '#c9a84c', color: '#000',
          fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 13,
        }}>
          ⚔️ Start battle
        </button>
        <button onClick={() => setView('join')} style={{
          flex: 1, padding: '12px 0', borderRadius: 12,
          border: '1px solid rgba(201,168,76,0.3)',
          background: 'rgba(201,168,76,0.06)', color: '#c9a84c',
          fontFamily: 'Sora,sans-serif', fontSize: 13, cursor: 'pointer',
        }}>
          Join by code
        </button>
      </div>
    </div>
  )
}
