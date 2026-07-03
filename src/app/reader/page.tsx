'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { AmbientImage } from '@/components/ui/AmbientImage'

interface Section {
  index: number
  title: string
  content: string
  wordCount: number
}

interface ReaderDoc {
  title: string
  type: 'pdf' | 'docx'
  sections: Section[]
  totalWords: number
  estimatedMinutes: number
}

type Theme = 'dark' | 'sepia' | 'paper'

const THEMES: Record<Theme, { bg: string; text: string; sub: string; border: string; label: string }> = {
  dark:  { bg: '#060d0b',  text: '#e8e8e8',  sub: '#9ca3af', border: 'rgba(255,255,255,0.07)', label: 'Dark'  },
  sepia: { bg: '#fdf6e3',  text: '#3b2f1e',  sub: '#8b7355', border: '#e5d8c0',                label: 'Sepia' },
  paper: { bg: '#fafaf8',  text: '#1c1c1e',  sub: '#9ca3af', border: '#e5e7eb',                label: 'Paper' },
}

const FONT_SIZES = [15, 18, 22] as const
const FONT_LABELS = ['S', 'M', 'L'] as const

const BOOKMARKS_KEY = 'reader-bookmarks'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  if (m < 1) return 'just started'
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

function loadBookmarks(): Record<string, number[]> {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? '{}') } catch { return {} }
}
function saveBookmarks(bm: Record<string, number[]>) {
  try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bm)) } catch {}
}

export default function ReaderPage() {
  const [doc, setDoc]             = useState<ReaderDoc | null>(null)
  const [sectionIdx, setSectionIdx] = useState(0)
  const [fontIdx, setFontIdx]     = useState<0 | 1 | 2>(1)
  const [theme, setTheme]         = useState<Theme>('dark')
  const [uploading, setUploading] = useState(false)
  const [elapsed, setElapsed]     = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [showOutline, setShowOutline] = useState(false)
  const [novaText, setNovaText]   = useState<string | null>(null)
  const [novaLoading, setNovaLoading] = useState(false)
  const [bookmarks, setBookmarks] = useState<Record<string, number[]>>(loadBookmarks)
  const fileRef   = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  // Restore last document + theme from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('reader-doc')
      if (saved) {
        const parsed = JSON.parse(saved) as { doc: ReaderDoc; sectionIdx: number; theme?: Theme }
        setDoc(parsed.doc)
        setSectionIdx(parsed.sectionIdx ?? 0)
        if (parsed.theme) setTheme(parsed.theme)
      }
    } catch { /* ignore */ }
  }, [])

  // Persist position + theme
  useEffect(() => {
    if (!doc) return
    try { localStorage.setItem('reader-doc', JSON.stringify({ doc, sectionIdx, theme })) } catch {}
  }, [doc, sectionIdx, theme])

  // Reading timer
  useEffect(() => {
    if (!doc) return
    const start = Date.now()
    setStartedAt(start)
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 15_000)
    return () => clearInterval(id)
  }, [doc])

  // Scroll to top on section change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setNovaText(null)
  }, [sectionIdx])

  // Keyboard navigation
  useEffect(() => {
    if (!doc) return
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setSectionIdx(i => Math.min(i + 1, doc.sections.length - 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setSectionIdx(i => Math.max(i - 1, 0))
      } else if (e.key === 'o' || e.key === 'O') {
        setShowOutline(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [doc])

  // Touch-swipe
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !doc) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) < 60) return
    setSectionIdx(i => dx < 0 ? Math.min(i + 1, doc.sections.length - 1) : Math.max(i - 1, 0))
    touchStartX.current = null
  }

  const handleFile = async (file: File) => {
    if (!/\.(pdf|docx|doc)$/i.test(file.name)) {
      toast.error('Please upload a PDF or Word document')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large — max 20 MB')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/reader/extract', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        toast.error(err.error ?? 'Could not read this file')
        return
      }
      const data = await res.json() as ReaderDoc
      setDoc(data)
      setSectionIdx(0)
      setElapsed(0)
      setNovaText(null)
      toast.success(`"${data.title}" — ${data.sections.length} sections`)
    } catch (err) {
      console.error('[Reader]', err)
      toast.error('Failed to process document — please try again')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleBookmark = () => {
    if (!doc) return
    const key = doc.title
    const current = bookmarks[key] ?? []
    const next = current.includes(sectionIdx)
      ? current.filter(i => i !== sectionIdx)
      : [...current, sectionIdx].sort((a, b) => a - b)
    const updated = { ...bookmarks, [key]: next }
    setBookmarks(updated)
    saveBookmarks(updated)
    toast.success(current.includes(sectionIdx) ? 'Bookmark removed' : 'Section bookmarked')
  }

  const askNova = async () => {
    if (!doc) return
    const section = doc.sections[sectionIdx]
    const excerpt = section.content.slice(0, 2000)
    setNovaLoading(true)
    setNovaText(null)
    try {
      const res = await fetch('/api/nova/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Summarise this section from "${doc.title}" in 3–4 bullet points, then list the 2 most important concepts to remember:\n\n${excerpt}`,
        }),
      })
      if (!res.ok) throw new Error('Nova unavailable')
      const data = await res.json() as { response?: string; message?: string }
      setNovaText(data.response ?? data.message ?? 'No response')
    } catch {
      // Fallback: navigate to Nova with the prompt
      const prompt = encodeURIComponent(`Summarise this section from "${doc.title}" and highlight the 3 most important points:\n\n${excerpt}`)
      window.location.href = `/nova?prompt=${prompt}`
    } finally {
      setNovaLoading(false)
    }
  }

  // ── Upload screen ─────────────────────────────────────────────────────────────
  if (!doc) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100, overflowY: 'auto',
        background: 'linear-gradient(160deg, #060d0b 0%, #091410 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '0 16px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: 520, display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12 }}>
          <Link href="/study" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
            ← Study
          </Link>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            Reading Mode
          </span>
        </div>

        <div style={{ maxWidth: 520, width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>📖</div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 26, color: '#fff', margin: 0 }}>
              Reading Mode
            </h1>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 10, lineHeight: 1.65, maxWidth: 380, margin: '10px auto 0' }}>
              Upload your textbook or notes. We split it into comfortable sections — jump around, bookmark, and ask Nova to explain anything.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => !uploading && fileRef.current?.click()}
            style={{
              border: '2px dashed rgba(245,158,11,0.3)',
              borderRadius: 22,
              padding: '44px 24px',
              textAlign: 'center',
              cursor: uploading ? 'wait' : 'pointer',
              background: uploading ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)',
              transition: 'background 0.2s',
            }}
          >
            <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            {uploading ? (
              <>
                <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Extracting text…</p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>This takes a few seconds for large files</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.8)', margin: 0 }}>Drop your file here, or tap to browse</p>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>PDF & DOCX · max 20 MB · text must be selectable</p>
              </>
            )}
          </div>

          {/* Feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
            {[
              { icon: '📑', label: 'Section outline', sub: 'Jump to any section instantly' },
              { icon: '🎨', label: 'Dark · Sepia · Paper', sub: '3 reading themes' },
              { icon: '🤖', label: 'Ask Nova', sub: 'AI summary without leaving the page' },
              { icon: '🔖', label: 'Bookmarks', sub: 'Flag sections to revisit' },
              { icon: '⏱', label: 'Reading timer', sub: 'Track your study time' },
              { icon: '⌨️', label: 'Keyboard nav', sub: '← → arrow keys' },
            ].map(f => (
              <div key={f.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ fontSize: 20, marginBottom: 5 }}>{f.icon}</div>
                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{f.label}</p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, lineHeight: 1.4 }}>{f.sub}</p>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 18, lineHeight: 1.5 }}>
            Files are processed server-side and not stored. Scanned PDFs (image-only) won&apos;t work — text must be selectable.
          </p>
        </div>
      </div>
    )
  }

  // ── Reading screen ────────────────────────────────────────────────────────────
  const section    = doc.sections[sectionIdx]
  const total      = doc.sections.length
  const progress   = ((sectionIdx + 1) / total) * 100
  const t          = THEMES[theme]
  const wordsLeft  = doc.sections.slice(sectionIdx).reduce((s, sec) => s + sec.wordCount, 0)
  const minsLeft   = Math.ceil(wordsLeft / 200)
  const docBookmarks = bookmarks[doc.title] ?? []
  const isBookmarked = docBookmarks.includes(sectionIdx)
  const themeOrder: Theme[] = ['dark', 'sepia', 'paper']

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', background: t.bg, overflow: 'hidden', transition: 'background 0.25s', overflowX: 'hidden' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <AmbientImage zone="study" opacity={0.32} blurPx={2} saturation={1.4} />
      {/* ── Top bar ── */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px',
        borderBottom: `1px solid ${t.border}`,
        background: t.bg,
      }}>
        <button
          onClick={() => setDoc(null)}
          style={{ background: 'none', border: 'none', color: t.sub, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', padding: 0, flexShrink: 0 }}
        >
          ←
        </button>

        {/* Title + progress */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 11, color: t.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doc.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <div style={{ flex: 1, height: 2, background: theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#f59e0b', borderRadius: 2, transition: 'width 0.35s' }} />
            </div>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: t.sub, flexShrink: 0 }}>
              {sectionIdx + 1}/{total} · {minsLeft}m left
            </span>
          </div>
        </div>

        {/* Outline toggle */}
        <button
          onClick={() => setShowOutline(v => !v)}
          title="Section outline (O)"
          style={{ background: showOutline ? 'rgba(245,158,11,0.15)' : (theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'), border: `1px solid ${showOutline ? 'rgba(245,158,11,0.4)' : t.border}`, borderRadius: 8, color: showOutline ? '#f59e0b' : t.sub, fontSize: 15, minWidth: 40, minHeight: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          ☰
        </button>

        {/* Bookmark */}
        <button
          onClick={toggleBookmark}
          title="Bookmark this section"
          style={{ background: isBookmarked ? 'rgba(245,158,11,0.12)' : (theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'), border: `1px solid ${isBookmarked ? 'rgba(245,158,11,0.4)' : t.border}`, borderRadius: 8, color: isBookmarked ? '#f59e0b' : t.sub, fontSize: 15, minWidth: 40, minHeight: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          {isBookmarked ? '🔖' : '🏷'}
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(prev => themeOrder[(themeOrder.indexOf(prev) + 1) % 3])}
          title="Toggle reading theme"
          style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: `1px solid ${t.border}`, borderRadius: 8, color: t.sub, fontFamily: 'DM Mono, monospace', fontSize: 10, minWidth: 40, minHeight: 40, padding: '0 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          {t.label}
        </button>

        {/* Font size */}
        <button
          onClick={() => setFontIdx(i => ((i + 1) % 3) as 0 | 1 | 2)}
          style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: `1px solid ${t.border}`, borderRadius: 8, color: t.sub, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 12, minWidth: 40, minHeight: 40, padding: '0 10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          {FONT_LABELS[fontIdx]}
        </button>

        {/* Timer */}
        {startedAt && elapsed > 0 && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 8, padding: '5px 8px', fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#f59e0b', flexShrink: 0 }}>
            {formatTime(elapsed)}
          </div>
        )}
      </div>

      {/* ── Section outline overlay ── */}
      {showOutline && (
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: '80%', maxWidth: 300,
          background: theme === 'dark' ? '#0a1410' : theme === 'sepia' ? '#f5eedc' : '#f3f4f6',
          borderRight: `1px solid ${t.border}`,
          zIndex: 20, display: 'flex', flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13, color: t.text }}>Contents</span>
            <button onClick={() => setShowOutline(false)} style={{ background: 'none', border: 'none', color: t.sub, cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
          {/* Bookmarked sections */}
          {docBookmarks.length > 0 && (
            <div style={{ padding: '8px 12px 4px', borderBottom: `1px solid ${t.border}` }}>
              <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>Bookmarks</p>
              {docBookmarks.map(idx => (
                <button key={idx} onClick={() => { setSectionIdx(idx); setShowOutline(false) }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 7, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#f59e0b' }}>
                  🔖 {doc.sections[idx]?.title || `Section ${idx + 1}`}
                </button>
              ))}
            </div>
          )}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
            {doc.sections.map((sec, i) => (
              <button
                key={i}
                onClick={() => { setSectionIdx(i); setShowOutline(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                  background: i === sectionIdx ? (theme === 'dark' ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.1)') : 'none',
                  border: 'none', cursor: 'pointer',
                  padding: '8px 8px', borderRadius: 8, marginBottom: 1,
                }}
              >
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: i === sectionIdx ? '#f59e0b' : t.sub, flexShrink: 0, width: 20, textAlign: 'right' }}>{i + 1}</span>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: i === sectionIdx ? '#f59e0b' : t.text, lineHeight: 1.35, flex: 1 }}>
                  {sec.title}
                </span>
                {docBookmarks.includes(i) && <span style={{ fontSize: 10, flexShrink: 0 }}>🔖</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Outline backdrop */}
      {showOutline && (
        <div onClick={() => setShowOutline(false)} style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(0,0,0,0.4)' }} />
      )}

      {/* ── Reading area ── */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          maxWidth: 680, width: '100%',
          background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : (theme === 'sepia' ? '#fdf6e3' : '#fafaf8'),
          borderRadius: '0 0 20px 20px',
          padding: '28px 24px 48px',
          minHeight: '100%', boxSizing: 'border-box',
          border: theme === 'dark' ? 'none' : `1px solid ${t.border}`,
          borderTop: 'none',
        }}>
          {/* Section heading */}
          {section.title !== `Section ${sectionIdx + 1}` && section.title !== `Page ${sectionIdx + 1}` && (
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: t.sub, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 18, marginTop: 0 }}>
              {section.title}
            </p>
          )}

          {/* Content */}
          <div style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontSize: FONT_SIZES[fontIdx],
            lineHeight: 1.9,
            color: t.text,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            transition: 'color 0.25s, font-size 0.15s',
          }}>
            {section.content}
          </div>

          {/* Nova response */}
          {(novaText || novaLoading) && (
            <div style={{ marginTop: 32, padding: '16px 18px', background: theme === 'dark' ? 'rgba(78,207,158,0.07)' : 'rgba(78,207,158,0.06)', border: '0.5px solid rgba(78,207,158,0.25)', borderRadius: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#4ecf9e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>✦ Nova</span>
                {novaText && <button onClick={() => setNovaText(null)} style={{ background: 'none', border: 'none', color: t.sub, cursor: 'pointer', fontSize: 14 }}>✕</button>}
              </div>
              {novaLoading
                ? <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: t.sub, margin: 0 }}>Thinking…</p>
                : <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: t.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{novaText}</div>
              }
            </div>
          )}

          {/* Footer stats */}
          <div style={{ marginTop: 36, paddingTop: 14, borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: t.sub }}>{section.wordCount.toLocaleString()} words</span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: t.sub }}>~{Math.ceil(section.wordCount / 200)} min</span>
          </div>
        </div>
      </div>

      {/* ── Bottom navigation ── */}
      <div style={{
        flexShrink: 0, padding: '10px 12px', borderTop: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', gap: 8, background: t.bg,
      }}>
        <button
          onClick={() => setSectionIdx(i => Math.max(0, i - 1))}
          disabled={sectionIdx === 0}
          style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: `1px solid ${t.border}`, background: 'transparent', color: sectionIdx === 0 ? t.sub + '60' : t.sub, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, cursor: sectionIdx === 0 ? 'default' : 'pointer', opacity: sectionIdx === 0 ? 0.35 : 1 }}
        >
          ←
        </button>

        <button
          onClick={askNova}
          disabled={novaLoading}
          style={{ padding: '13px 16px', borderRadius: 14, border: '1px solid rgba(78,207,158,0.3)', background: 'rgba(78,207,158,0.08)', color: '#4ecf9e', fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 12, cursor: novaLoading ? 'wait' : 'pointer', flexShrink: 0, whiteSpace: 'nowrap', opacity: novaLoading ? 0.6 : 1 }}
        >
          {novaLoading ? '…' : '✦ Ask Nova'}
        </button>

        <button
          onClick={() => setSectionIdx(i => Math.min(total - 1, i + 1))}
          disabled={sectionIdx === total - 1}
          style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: `1px solid rgba(245,158,11,${sectionIdx === total - 1 ? '0.1' : '0.25'})`, background: sectionIdx === total - 1 ? 'transparent' : 'rgba(245,158,11,0.08)', color: sectionIdx === total - 1 ? t.sub + '60' : '#f59e0b', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, cursor: sectionIdx === total - 1 ? 'default' : 'pointer', opacity: sectionIdx === total - 1 ? 0.35 : 1 }}
        >
          →
        </button>
      </div>
    </div>
  )
}
