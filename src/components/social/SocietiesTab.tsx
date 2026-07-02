'use client'

import { useState, useEffect, useCallback } from 'react'

interface Society {
  id: string
  name: string
  category: string
  description: string | null
  institution: string | null
  contact: string | null
  created_by: string
  member_count: number
  is_member: boolean
  is_owner: boolean
}

const CATEGORIES: { key: string; label: string; icon: string; color: string }[] = [
  { key: 'academic', label: 'Academic', icon: '📚', color: '#9B6FFF' },
  { key: 'cultural', label: 'Cultural', icon: '🎭', color: '#f472b6' },
  { key: 'sport', label: 'Sport', icon: '⚽', color: '#34d399' },
  { key: 'faith', label: 'Faith', icon: '🙏', color: '#60a5fa' },
  { key: 'political', label: 'Political', icon: '🗳️', color: '#fb923c' },
  { key: 'social', label: 'Social', icon: '🎉', color: '#4ecf9e' },
  { key: 'entrepreneurship', label: 'Hustle', icon: '💡', color: '#fbbf24' },
  { key: 'other', label: 'Other', icon: '✨', color: '#9ca3af' },
]
const CAT = Object.fromEntries(CATEGORIES.map(c => [c.key, c]))
const ACCENT = '#7090D0'

export default function SocietiesTab({ userInstitution }: { userId: string; userInstitution: string | null }) {
  const [societies, setSocieties] = useState<Society[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', category: 'social', description: '', contact: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const url = userInstitution ? `/api/social/societies?institution=${encodeURIComponent(userInstitution)}` : '/api/social/societies'
      const res = await fetch(url)
      const data = await res.json()
      setSocieties(data.societies || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [userInstitution])

  useEffect(() => { void load() }, [load])

  async function toggleJoin(s: Society) {
    setBusy(s.id)
    const action = s.is_member ? 'leave' : 'join'
    const snapshot = societies // for rollback if the request fails
    setSocieties(list => list.map(x => x.id === s.id ? { ...x, is_member: !x.is_member, member_count: x.member_count + (x.is_member ? -1 : 1) } : x))
    try {
      const res = await fetch(`/api/social/societies?id=${s.id}&action=${action}`, { method: 'PATCH', signal: AbortSignal.timeout(10000) })
      if (!res.ok) throw new Error('request failed')
    } catch {
      setSocieties(snapshot) // revert — don't show the user as joined when it didn't persist
      const { default: toast } = await import('react-hot-toast')
      toast.error("Couldn't update — check your connection and try again")
    } finally { setBusy(null) }
  }

  async function create() {
    if (!form.name.trim()) return
    setBusy('create')
    try {
      const res = await fetch('/api/social/societies', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, institution: userInstitution }),
      })
      if (res.ok) { setCreating(false); setForm({ name: '', category: 'social', description: '', contact: '' }); await load() }
    } finally { setBusy(null) }
  }

  async function remove(id: string) {
    setBusy(id)
    setSocieties(list => list.filter(x => x.id !== id))
    try { await fetch(`/api/social/societies?id=${id}`, { method: 'DELETE' }) } finally { setBusy(null) }
  }

  const filtered = societies.filter(s =>
    (filter === 'all' || s.category === filter) &&
    (!search.trim() || s.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search societies…"
        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.85rem' }} />

      {/* Category filter chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        <Chip active={filter === 'all'} onClick={() => setFilter('all')} label="All" icon="🌐" color={ACCENT} />
        {CATEGORIES.map(c => <Chip key={c.key} active={filter === c.key} onClick={() => setFilter(c.key)} label={c.label} icon={c.icon} color={c.color} />)}
      </div>

      <button onClick={() => setCreating(v => !v)} style={{
        padding: '10px 0', background: creating ? 'transparent' : `${ACCENT}1a`, border: `1px solid ${ACCENT}40`,
        borderRadius: 10, color: ACCENT, fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: 'pointer',
      }}>{creating ? 'Cancel' : '+ Start a society'}</button>

      {creating && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Society name"
            style={inp} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setForm(f => ({ ...f, category: c.key }))} style={{
                padding: '5px 10px', borderRadius: 100, fontSize: '0.68rem', cursor: 'pointer',
                border: `1px solid ${form.category === c.key ? c.color : 'var(--border-default)'}`,
                background: form.category === c.key ? `${c.color}1a` : 'transparent',
                color: form.category === c.key ? c.color : 'var(--text-muted)',
              }}>{c.icon} {c.label}</button>
            ))}
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="What's it about? When do you meet?"
            style={{ ...inp, resize: 'none', fontFamily: 'var(--font-body)' }} />
          <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Contact / WhatsApp group link (optional)"
            style={inp} />
          <button onClick={create} disabled={busy === 'create' || !form.name.trim()} style={{
            padding: '10px 0', background: ACCENT, border: 'none', borderRadius: 9, color: '#fff',
            fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: 'pointer', opacity: form.name.trim() ? 1 : 0.5,
          }}>{busy === 'create' ? 'Creating…' : 'Create society'}</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: 20 }}>Loading societies…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '28px 16px', lineHeight: 1.6 }}>
          {search || filter !== 'all' ? 'No societies match.' : 'No societies yet — be the first to start one for your campus! 🎉'}
        </div>
      ) : (
        filtered.map(s => {
          const cat = CAT[s.category] || CAT.other
          return (
            <div key={s.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: `3px solid ${cat.color}`, borderRadius: 12, padding: '13px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{cat.icon} {s.name}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>{cat.label} · {s.member_count} member{s.member_count === 1 ? '' : 's'}</div>
                </div>
                <button onClick={() => toggleJoin(s)} disabled={busy === s.id} style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${s.is_member ? 'var(--border-default)' : cat.color}`,
                  background: s.is_member ? 'transparent' : `${cat.color}1a`,
                  color: s.is_member ? 'var(--text-muted)' : cat.color,
                }}>{s.is_member ? '✓ Joined' : 'Join'}</button>
              </div>
              {s.description && <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>{s.description}</div>}
              {s.contact && s.is_member && (
                <a href={s.contact.startsWith('http') ? s.contact : undefined} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: 8, fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: cat.color, textDecoration: 'none' }}>
                  {s.contact.startsWith('http') ? 'Open group →' : `Contact: ${s.contact}`}
                </a>
              )}
              {s.is_owner && (
                <button onClick={() => remove(s.id)} style={{ display: 'block', marginTop: 8, fontSize: '0.64rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Delete society</button>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)',
  borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem',
}

function Chip({ active, onClick, label, icon, color }: { active: boolean; onClick: () => void; label: string; icon: string; color: string }) {
  return (
    <button onClick={onClick} style={{
      flexShrink: 0, padding: '6px 12px', borderRadius: 100, fontSize: '0.7rem', fontWeight: active ? 700 : 400, cursor: 'pointer',
      border: `1px solid ${active ? color : 'var(--border-subtle)'}`,
      background: active ? `${color}1a` : 'transparent',
      color: active ? color : 'var(--text-muted)', whiteSpace: 'nowrap',
    }}>{icon} {label}</button>
  )
}
