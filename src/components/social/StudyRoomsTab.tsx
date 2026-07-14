'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { dispatchXP } from '@/lib/xp-engine'

interface Room {
  id: string
  name: string
  topic: string | null
  host_id: string
  focus_minutes: number
  ends_at: string
  members: string[]
  member_count: number
  is_member: boolean
  is_host: boolean
}

const ACCENT = '#9B6FFF'
const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)',
  borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem',
}

function remaining(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now()
  if (ms <= 0) return 'ending…'
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function StudyRoomsTab({ userInstitution }: { userId: string; userInstitution: string | null }) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [, setTick] = useState(0)
  const [form, setForm] = useState({ name: '', topic: '', focus_minutes: 50 })
  const joinedXp = useRef(false)

  const load = useCallback(async () => {
    try {
      const url = userInstitution ? `/api/social/study-rooms?institution=${encodeURIComponent(userInstitution)}` : '/api/social/study-rooms'
      const res = await fetchWithTimeout(url)
      const data = await res.json()
      setRooms(data.rooms || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [userInstitution])

  useEffect(() => { void load() }, [load])
  // live countdown + periodic refresh
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    const r = setInterval(() => void load(), 20000)
    return () => { clearInterval(t); clearInterval(r) }
  }, [load])

  async function toggleJoin(room: Room) {
    setBusy(room.id)
    const action = room.is_member ? 'leave' : 'join'
    try {
      const res = await fetchWithTimeout(`/api/social/study-rooms?id=${room.id}&action=${action}`, { method: 'PATCH', signal: AbortSignal.timeout(10000) })
      if (!res.ok) throw new Error('request failed')
      // Award XP only AFTER the join actually persisted (was firing before the request).
      if (action === 'join' && !joinedXp.current) { joinedXp.current = true; dispatchXP('body_double_joined') }
      await load()
    } catch {
      const { default: toast } = await import('react-hot-toast')
      toast.error("Couldn't update the room — try again")
    } finally { setBusy(null) }
  }

  async function create() {
    if (!form.name.trim()) return
    setBusy('create')
    try {
      const res = await fetchWithTimeout('/api/social/study-rooms', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, institution: userInstitution }),
      })
      if (res.ok) { setCreating(false); setForm({ name: '', topic: '', focus_minutes: 50 }); dispatchXP('body_double_joined'); await load() }
    } finally { setBusy(null) }
  }

  async function endRoom(id: string) {
    setBusy(id)
    setRooms(list => list.filter(r => r.id !== id))
    try { await fetchWithTimeout(`/api/social/study-rooms?id=${id}`, { method: 'DELETE' }) } finally { setBusy(null) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}40`, borderRadius: 12, padding: '12px 14px', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        🎯 Study together, apart. Join a live focus room and grind alongside your cohort — the quiet accountability of others working makes it far easier to start. Camera-free, pressure-free.
      </div>

      <button onClick={() => setCreating(v => !v)} style={{
        padding: '11px 0', background: creating ? 'transparent' : `${ACCENT}1a`, border: `1px solid ${ACCENT}40`,
        borderRadius: 10, color: ACCENT, fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: 'pointer',
      }}>{creating ? 'Cancel' : '+ Start a focus room'}</button>

      {creating && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Room name — e.g. Exam grind 🔥" style={inp} />
          <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="Topic (optional) — e.g. STATS exam prep" style={inp} />
          <div style={{ display: 'flex', gap: 8 }}>
            {[25, 50, 90].map(m => (
              <button key={m} onClick={() => setForm(f => ({ ...f, focus_minutes: m }))} style={{
                flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700,
                border: `1px solid ${form.focus_minutes === m ? ACCENT : 'var(--border-default)'}`,
                background: form.focus_minutes === m ? `${ACCENT}1a` : 'transparent',
                color: form.focus_minutes === m ? ACCENT : 'var(--text-muted)',
              }}>{m} min</button>
            ))}
          </div>
          <button onClick={create} disabled={busy === 'create' || !form.name.trim()} style={{
            padding: '10px 0', background: ACCENT, border: 'none', borderRadius: 9, color: '#fff',
            fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: 'pointer', opacity: form.name.trim() ? 1 : 0.5,
          }}>{busy === 'create' ? 'Starting…' : 'Go live'}</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: 20 }}>Loading rooms…</div>
      ) : rooms.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '28px 16px', lineHeight: 1.6 }}>
          No live rooms right now. Start one — others will see it and join you. 🚀
        </div>
      ) : (
        rooms.map(r => (
          <div key={r.id} style={{ background: 'var(--bg-surface)', border: `1px solid ${r.is_member ? `${ACCENT}50` : 'var(--border-subtle)'}`, borderRadius: 12, padding: '13px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', flexShrink: 0, boxShadow: '0 0 6px #34d399' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{r.name}</span>
                </div>
                {r.topic && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>{r.topic}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: ACCENT }}>{remaining(r.ends_at)}</div>
                <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>left</div>
              </div>
            </div>

            {/* Participants */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
              {r.members.slice(0, 8).map((m, i) => (
                <span key={i} style={{ fontSize: '0.64rem', padding: '3px 9px', borderRadius: 100, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>{m}</span>
              ))}
              {r.member_count > 8 && <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', padding: '3px 4px' }}>+{r.member_count - 8}</span>}
              {r.member_count === 0 && <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Be the first in</span>}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => toggleJoin(r)} disabled={busy === r.id} style={{
                flex: 1, padding: '9px 0', borderRadius: 9, fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${r.is_member ? 'var(--border-default)' : ACCENT}`,
                background: r.is_member ? 'transparent' : ACCENT,
                color: r.is_member ? 'var(--text-muted)' : '#fff',
              }}>{r.is_member ? 'Leave room' : '🎯 Join & focus'}</button>
              {r.is_host && (
                <button onClick={() => endRoom(r.id)} disabled={busy === r.id} style={{
                  padding: '9px 14px', borderRadius: 9, fontSize: '0.74rem', cursor: 'pointer',
                  border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-muted)',
                }}>End</button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
