'use client'
// ─── Study Group OS ───────────────────────────────────────────
// Find, create, and join study groups by module/subject
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface StudyGroup {
  id: string; creator_id: string; name: string; subject: string | null; module_code: string | null;
  university: string | null; description: string | null; is_public: boolean; max_members: number;
  meeting_type: 'online' | 'in_person' | 'hybrid'; meeting_link: string | null; venue: string | null;
  created_at: string; member_count?: number; is_member?: boolean
}
type Tab = 'browse' | 'create' | 'mine'
const MEETING_TYPE_LABEL: Record<string, string> = { online: 'Online', in_person: 'In-person', hybrid: 'Hybrid' }
const MEETING_TYPE_COLOR: Record<string, string> = { online: 'var(--sky,#38BDF8)', in_person: 'var(--teal)', hybrid: 'var(--indigo,#6366F1)' }

export default function StudyGroupOS({ userId, university }: { userId: string; university?: string }) {
  const [tab, setTab] = useState<Tab>('browse')
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => { loadGroups() }, [university])

  async function loadGroups() {
    setLoading(true)
    let q = supabase.from('study_groups').select('*').eq('is_public', true).order('created_at', { ascending: false }).limit(40)
    if (university) q = q.eq('university', university)
    const { data: gdata } = await q
    if (!gdata) { setLoading(false); return }
    // Get member counts + membership status
    const ids = gdata.map((g: StudyGroup) => g.id)
    const { data: mdata } = await supabase.from('study_group_members').select('group_id,user_id').in('group_id', ids)
    const counts: Record<string, number> = {}
    const mine = new Set<string>()
    ;(mdata || []).forEach((m: { group_id: string; user_id: string }) => {
      counts[m.group_id] = (counts[m.group_id] || 0) + 1
      if (m.user_id === userId) mine.add(m.group_id)
    })
    setGroups((gdata as StudyGroup[]).map(g => ({ ...g, member_count: counts[g.id] || 0, is_member: mine.has(g.id) })))
    setLoading(false)
  }

  const filtered = groups.filter(g => {
    if (!search) return true
    const s = search.toLowerCase()
    return g.name.toLowerCase().includes(s) || (g.subject || '').toLowerCase().includes(s) || (g.module_code || '').toLowerCase().includes(s)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-surface)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: '16px 18px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,var(--indigo,#6366F1),transparent)' }} />
        <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--indigo,#6366F1)', letterSpacing: '0.09em', marginBottom: 4 }}>STUDY GROUP OS</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Find your people — study together</div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 3 }}>{groups.length} group{groups.length !== 1 ? 's' : ''} available · {university || 'All universities'}</div>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)' }}>
        {([['browse', 'Browse', '🔍'], ['create', 'Create Group', '➕'], ['mine', 'My Groups', '👥']] as [Tab, string, string][]).map(([id, l, e]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: '9px 0', background: 'none', border: 'none', borderBottom: tab === id ? '2px solid var(--indigo,#6366F1)' : '2px solid transparent', color: tab === id ? 'var(--indigo,#6366F1)' : 'var(--text-tertiary)', fontSize: '0.67rem', fontFamily: 'var(--font-mono)', fontWeight: tab === id ? 700 : 400, cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap' }}>
            {e} {l}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Search by module, subject, group name..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.82rem' }} />
          {loading && <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Loading groups...</div>}
          {!loading && filtered.length === 0 && <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>No groups found. Create the first one!</div>}
          {filtered.map(g => <GroupCard key={g.id} group={g} userId={userId} onRefresh={loadGroups} />)}
        </div>
      )}

      {tab === 'create' && <CreateGroupForm userId={userId} university={university} onDone={() => { loadGroups(); setTab('mine') }} />}

      {tab === 'mine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {groups.filter(g => g.is_member || g.creator_id === userId).length === 0 && <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>You haven&apos;t joined any groups yet.</div>}
          {groups.filter(g => g.is_member || g.creator_id === userId).map(g => <GroupCard key={g.id} group={g} userId={userId} onRefresh={loadGroups} />)}
        </div>
      )}
    </div>
  )
}

function GroupCard({ group: g, userId, onRefresh }: { group: StudyGroup; userId: string; onRefresh: () => void }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const join = async () => {
    setLoading(true)
    await supabase.from('study_group_members').upsert({ group_id: g.id, user_id: userId })
    onRefresh()
    setLoading(false)
  }
  const leave = async () => {
    setLoading(true)
    await supabase.from('study_group_members').delete().eq('group_id', g.id).eq('user_id', userId)
    onRefresh()
    setLoading(false)
  }
  const full = (g.member_count || 0) >= g.max_members
  const isOwner = g.creator_id === userId

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 13, padding: '13px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>{g.name}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>{[g.module_code, g.subject].filter(Boolean).join(' · ')}</div>
        </div>
        <span style={{ fontSize: '0.6rem', padding: '3px 8px', background: `${MEETING_TYPE_COLOR[g.meeting_type]}12`, border: `1px solid ${MEETING_TYPE_COLOR[g.meeting_type]}30`, borderRadius: 100, color: MEETING_TYPE_COLOR[g.meeting_type], fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{MEETING_TYPE_LABEL[g.meeting_type]}</span>
      </div>
      {g.description && <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', lineHeight: 1.55, marginBottom: 8 }}>{g.description}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: '0.65rem', color: full ? 'var(--coral)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{g.member_count || 0}/{g.max_members} members{full ? ' · FULL' : ''}</span>
          {g.venue && <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>📍 {g.venue}</span>}
          {isOwner && <span style={{ fontSize: '0.58rem', color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>owner</span>}
        </div>
        {!isOwner && (
          g.is_member ? (
            <button onClick={leave} disabled={loading} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-muted)', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>Leave</button>
          ) : (
            <button onClick={join} disabled={loading || full} style={{ padding: '5px 12px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, color: 'var(--indigo,#6366F1)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: full ? 'default' : 'pointer', opacity: full ? 0.5 : 1 }}>
              {loading ? '...' : full ? 'Full' : 'Join →'}
            </button>
          )
        )}
      </div>
      {g.meeting_link && g.is_member && <a href={g.meeting_link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 8, fontSize: '0.65rem', color: 'var(--teal)', fontFamily: 'var(--font-mono)' }}>Open meeting link →</a>}
    </div>
  )
}

function CreateGroupForm({ userId, university, onDone }: { userId: string; university?: string; onDone: () => void }) {
  const [form, setForm] = useState({ name: '', subject: '', module_code: '', university: university || '', description: '', max_members: '6', meeting_type: 'hybrid', meeting_link: '', venue: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const f = (k: keyof typeof form, v: string) => setForm(x => ({ ...x, [k]: v }))

  const submit = async () => {
    if (!form.name) return
    setSaving(true)
    const { data: group, error: gErr } = await supabase.from('study_groups').insert({ creator_id: userId, name: form.name, subject: form.subject || null, module_code: form.module_code || null, university: form.university || null, description: form.description || null, max_members: parseInt(form.max_members) || 6, meeting_type: form.meeting_type, meeting_link: form.meeting_link || null, venue: form.venue || null }).select('id').single()
    if (gErr || !group) { setSaving(false); return }
    await supabase.from('study_group_members').insert({ group_id: group.id, user_id: userId, role: 'admin' })
    setSaving(false)
    onDone()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[{ l: 'Group name *', k: 'name', p: 'e.g. ECO2011 Study Group' }, { l: 'Subject', k: 'subject', p: 'e.g. Microeconomics' }, { l: 'Module code', k: 'module_code', p: 'e.g. ECO2011' }, { l: 'University', k: 'university', p: 'UCT, Wits, UP...' }, { l: 'Meeting link (Google Meet, Zoom, etc.)', k: 'meeting_link', p: 'https://...' }, { l: 'Venue (for in-person)', k: 'venue', p: 'Library Room 3, Upper Campus' }].map(({ l, k, p }) => (
        <div key={k}><div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginBottom: 3 }}>{l}</div>
          <input value={form[k as keyof typeof form]} onChange={e => f(k as keyof typeof form, e.target.value)} placeholder={p} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }} /></div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginBottom: 3 }}>Meeting type</div>
          <select value={form.meeting_type} onChange={e => f('meeting_type', e.target.value)} style={{ width: '100%', padding: '9px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.78rem' }}>
            <option value="hybrid">Hybrid</option><option value="online">Online only</option><option value="in_person">In-person</option>
          </select></div>
        <div><div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginBottom: 3 }}>Max members</div>
          <select value={form.max_members} onChange={e => f('max_members', e.target.value)} style={{ width: '100%', padding: '9px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.78rem' }}>
            {[3, 4, 5, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n} people</option>)}
          </select></div>
      </div>
      <div><div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginBottom: 3 }}>Description (optional)</div>
        <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2} maxLength={300} placeholder="What are you studying? How do you run sessions?" style={{ width: '100%', padding: '9px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.75rem', resize: 'none' }} /></div>
      <button onClick={submit} disabled={saving || !form.name} style={{ padding: '12px 0', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, color: 'var(--indigo,#6366F1)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer', opacity: form.name ? 1 : 0.5 }}>
        {saving ? 'Creating...' : 'Create group →'}
      </button>
    </div>
  )
}
