'use client'

import { useState } from 'react'
import { X, Link2, BookOpen, FileText, Presentation, Image, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import type { NoteFileType } from '@/lib/notes-data'

const FILE_TYPES: { value: NoteFileType; label: string; icon: React.ElementType }[] = [
  { value: 'pdf',    label: 'PDF',    icon: FileText },
  { value: 'doc',    label: 'Doc',    icon: BookOpen },
  { value: 'slides', label: 'Slides', icon: Presentation },
  { value: 'images', label: 'Images', icon: Image },
  { value: 'link',   label: 'Link',   icon: Globe },
]

interface Props {
  userInstitution: string | null
  userFaculty: string | null
  userYear: string | null
  onClose: () => void
  onCreated: () => void
}

import { dispatchXP } from '@/lib/xp-engine'

export default function NoteUploadModal({ userInstitution, userFaculty, userYear, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [moduleCode, setModuleCode] = useState('')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [fileType, setFileType] = useState<NoteFileType>('pdf')
  const [tags, setTags] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !moduleCode.trim() || !linkUrl.trim()) {
      toast.error('Title, module code and link are required')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, module_code: moduleCode, description, link_url: linkUrl, file_type: fileType,
          institution: userInstitution, faculty: userFaculty, year_of_study: userYear,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      dispatchXP('note_shared')
      toast.success('Notes shared!')
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to share')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.12)',
    borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.82rem',
    fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end',
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        width: '100%', maxHeight: '90vh', overflowY: 'auto',
        background: '#0d1117',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: '20px 20px 0 0',
        padding: '20px 20px 40px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            Share Your Notes
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* File type selector */}
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Type</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FILE_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFileType(value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                    borderRadius: 20, border: '0.5px solid',
                    borderColor: fileType === value ? '#4ecf9e' : 'rgba(255,255,255,0.12)',
                    background: fileType === value ? 'rgba(78,207,158,0.12)' : 'rgba(255,255,255,0.07)',
                    color: fileType === value ? '#4ecf9e' : 'rgba(255,255,255,0.66)',
                    fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', cursor: 'pointer',
                  }}
                >
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Title *</label>
            <input aria-label="Title" style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Calculus Chapter 3 Summary" maxLength={120} required />
          </div>

          <div>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Module Code *</label>
            <input aria-label="Module code" style={inputStyle} value={moduleCode} onChange={e => setModuleCode(e.target.value.toUpperCase())} placeholder="e.g. MATH1014" maxLength={20} required />
          </div>

          <div>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
              <Link2 size={10} style={{ display: 'inline', marginRight: 4 }} />
              Google Drive / OneDrive / Dropbox link *
            </label>
            <input aria-label="Google Drive / OneDrive / Dropbox link" inputMode="url" style={inputStyle} type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://drive.google.com/..." required />
            <div style={{ fontSize: '0.65rem', color: '#fff', fontFamily: 'DM Sans, sans-serif', marginTop: 4 }}>
              Share the link with "Anyone with link can view" access
            </div>
          </div>

          <div>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Description</label>
            <textarea
              aria-label="Description"
              style={{ ...inputStyle, resize: 'none', height: 72 }}
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="What's covered? Any tips?" maxLength={500}
            />
          </div>

          <div>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Tags (comma-separated)</label>
            <input aria-label="Tags (comma-separated)" style={inputStyle} value={tags} onChange={e => setTags(e.target.value)} placeholder="exam prep, chapter 3, formulas" />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 4, padding: '13px', borderRadius: 12, border: 'none',
              background: submitting ? 'rgba(78,207,158,0.3)' : '#4ecf9e',
              color: '#000', fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: '0.88rem', cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Sharing...' : 'Share Notes with Community'}
          </button>
        </form>
      </div>
    </div>
  )
}
