'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, BookMarked, Upload, ExternalLink, Bookmark, BookmarkCheck, Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { type CommunityNote, FILE_TYPE_LABELS, FILE_TYPE_COLORS } from '@/lib/notes-data'
import NoteUploadModal from './NoteUploadModal'

interface Props {
  userId: string
  userInstitution: string | null
  userFaculty: string | null
  userYear: string | null
}

export default function NotesMarketplace({ userId, userInstitution, userFaculty, userYear }: Props) {
  const [tab, setTab] = useState<'browse' | 'saved' | 'mine'>('browse')
  const [notes, setNotes] = useState<CommunityNote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search.trim()) params.set('module', search.trim())
    if (tab !== 'mine' && userInstitution) params.set('institution', userInstitution)
    if (tab === 'mine') params.set('mine', '1')

    const res = await fetch(`/api/notes?${params}`)
    if (res.ok) {
      const data = await res.json()
      let list: CommunityNote[] = data.notes ?? []
      if (tab === 'saved') list = list.filter((n: CommunityNote) => n.is_saved)
      setNotes(list)
    }
    setLoading(false)
  }, [tab, search, userInstitution])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  async function toggleSave(note: CommunityNote) {
    const res = await fetch('/api/notes/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note_id: note.id }),
    })
    if (!res.ok) return
    const { saved } = await res.json()
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, is_saved: saved, save_count: n.save_count + (saved ? 1 : -1) } : n))
    toast.success(saved ? 'Saved to your collection' : 'Removed from saved')
  }

  async function deleteNote(id: string) {
    if (!confirm('Delete this note?')) return
    const res = await fetch('/api/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setNotes(prev => prev.filter(n => n.id !== id))
      toast.success('Note deleted')
    }
  }

  const TABS = [
    { id: 'browse', label: 'Browse' },
    { id: 'saved',  label: 'Saved' },
    { id: 'mine',   label: 'My Notes' },
  ] as const

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              Notes Marketplace
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              {userInstitution ?? 'All institutions'} · free to access
            </div>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
              background: '#4ecf9e', borderRadius: 20, border: 'none',
              color: '#000', fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: '0.75rem', cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            Share
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by module code (e.g. MATH1014)"
            style={{
              width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
              background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)',
              borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.82rem',
              fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: '0.5px solid',
                borderColor: tab === t.id ? '#4ecf9e' : 'rgba(255,255,255,0.1)',
                background: tab === t.id ? 'rgba(78,207,158,0.12)' : 'rgba(255,255,255,0.04)',
                color: tab === t.id ? '#4ecf9e' : 'rgba(255,255,255,0.45)',
                fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem',
                fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes list */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 100, borderRadius: 14, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))
        ) : notes.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 48, color: 'rgba(255,255,255,0.25)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem' }}>
            <BookMarked size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            {tab === 'mine' ? "You haven't shared any notes yet" : tab === 'saved' ? "No saved notes yet" : "No notes found — be the first to share!"}
          </div>
        ) : (
          notes.map(note => <NoteCard key={note.id} note={note} isOwner={note.user_id === userId} onToggleSave={toggleSave} onDelete={deleteNote} />)
        )}
      </div>

      {showUpload && (
        <NoteUploadModal
          userInstitution={userInstitution}
          userFaculty={userFaculty}
          userYear={userYear}
          onClose={() => setShowUpload(false)}
          onCreated={() => { setShowUpload(false); fetchNotes() }}
        />
      )}
    </div>
  )
}

function NoteCard({
  note, isOwner, onToggleSave, onDelete,
}: {
  note: CommunityNote
  isOwner: boolean
  onToggleSave: (n: CommunityNote) => void
  onDelete: (id: string) => void
}) {
  const typeColor = FILE_TYPE_COLORS[note.file_type] ?? '#4ecf9e'
  const typeLabel = FILE_TYPE_LABELS[note.file_type] ?? 'Link'

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `0.5px solid ${typeColor}20`,
      borderRadius: 14, padding: 14,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Accent bar */}
        <div style={{ width: 3, minHeight: 40, borderRadius: 2, background: typeColor, flexShrink: 0, alignSelf: 'stretch' }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem',
              color: typeColor, background: `${typeColor}15`,
              border: `0.5px solid ${typeColor}35`,
              padding: '2px 7px', borderRadius: 9999,
            }}>{typeLabel}</span>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem',
              color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)',
              border: '0.5px solid rgba(255,255,255,0.1)',
              padding: '2px 7px', borderRadius: 9999,
            }}>{note.module_code}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {note.title}
          </div>
          {note.description && (
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', marginTop: 3, lineHeight: 1.4 }}>
              {note.description}
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', paddingLeft: 13 }}>
          {note.tags.map(tag => (
            <span key={tag} style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem',
              color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)',
              padding: '2px 6px', borderRadius: 9999,
            }}>#{tag}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.85rem' }}>{note.uploader_emoji ?? '🎓'}</span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
            {note.uploader_name ?? 'Student'}
            {note.year_of_study && ` · Year ${note.year_of_study}`}
          </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)' }}>
            · {note.save_count} saves
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {isOwner && (
            <button
              onClick={() => onDelete(note.id)}
              style={{ background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={() => onToggleSave(note)}
            style={{ background: note.is_saved ? 'rgba(78,207,158,0.12)' : 'rgba(255,255,255,0.05)', border: `0.5px solid ${note.is_saved ? 'rgba(78,207,158,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: note.is_saved ? '#4ecf9e' : 'rgba(255,255,255,0.4)' }}
          >
            {note.is_saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          </button>
          <a
            href={note.link_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: `${typeColor}15`, border: `0.5px solid ${typeColor}30`, borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: typeColor, textDecoration: 'none' }}
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  )
}
