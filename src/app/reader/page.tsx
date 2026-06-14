'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'

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

const FONT_SIZES = [15, 18, 22] as const
const FONT_LABELS = ['Aa', 'Aa+', 'Aa++'] as const

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  if (m < 1) return 'just started'
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export default function ReaderPage() {
  const [doc, setDoc] = useState<ReaderDoc | null>(null)
  const [sectionIdx, setSectionIdx] = useState(0)
  const [fontIdx, setFontIdx] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  // Restore last document from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('reader-doc')
      if (saved) {
        const parsed = JSON.parse(saved) as { doc: ReaderDoc; sectionIdx: number }
        setDoc(parsed.doc)
        setSectionIdx(parsed.sectionIdx ?? 0)
      }
    } catch { /* ignore */ }
  }, [])

  // Persist position whenever it changes
  useEffect(() => {
    if (!doc) return
    try {
      localStorage.setItem('reader-doc', JSON.stringify({ doc, sectionIdx }))
    } catch { /* quota */ }
  }, [doc, sectionIdx])

  // Reading timer
  useEffect(() => {
    if (!doc) return
    const start = Date.now()
    setStartedAt(start)
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 15_000)
    return () => clearInterval(id)
  }, [doc])

  // Scroll reading area to top on section change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [sectionIdx])

  // Touch-swipe: left = next, right = prev
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !doc) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) < 60) return
    setSectionIdx(i => dx < 0 ? Math.min(i + 1, doc.sections.length - 1) : Math.max(i - 1, 0))
    touchStartX.current = null
  }

  const handleFile = async (file: File) => {
    const allowed = /\.(pdf|docx|doc)$/i
    if (!allowed.test(file.name)) {
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
      toast.success(`"${data.title}" loaded — ${data.sections.length} sections`)
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

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const askNova = () => {
    if (!doc) return
    const section = doc.sections[sectionIdx]
    const excerpt = section.content.slice(0, 1200)
    const prompt = encodeURIComponent(`Can you summarise this section from "${doc.title}" and highlight the 3 most important points?\n\n${excerpt}`)
    window.location.href = `/nova?prompt=${prompt}`
  }

  // ─── Upload screen ────────────────────────────────────────────────────────────
  if (!doc) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100, overflowY: 'auto',
        background: 'linear-gradient(160deg, #060d0b 0%, #091410 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 16px 40px',
      }}>
        {/* Top bar */}
        <div style={{ width: '100%', maxWidth: 520, display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12 }}>
          <Link href="/study" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
            ← Study
          </Link>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            Reading Mode
          </span>
        </div>

        <div style={{ maxWidth: 520, width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>📚</div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 26, color: '#fff', margin: 0 }}>
              Reading Mode
            </h1>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 10, lineHeight: 1.65, maxWidth: 380, margin: '10px auto 0' }}>
              Upload your textbook or notes. We break it into comfortable sections — no wall of text, no overwhelm.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => !uploading && fileRef.current?.click()}
            style={{
              border: '2px dashed rgba(245,158,11,0.25)',
              borderRadius: 22,
              padding: '44px 24px',
              textAlign: 'center',
              cursor: uploading ? 'wait' : 'pointer',
              background: uploading ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)',
              transition: 'background 0.2s',
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.doc"
              style={{ display: 'none' }}
              onChange={onInputChange}
            />
            {uploading ? (
              <>
                <div style={{ fontSize: 34, marginBottom: 10 }}>⏳</div>
                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                  Extracting text…
                </p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                  This takes a few seconds for large files
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 34, marginBottom: 10 }}>📄</div>
                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                  Drop your file here, or tap to browse
                </p>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
                  PDF & DOCX · max 20 MB · text must be selectable
                </p>
              </>
            )}
          </div>

          {/* Feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
            {[
              { icon: '📑', label: 'Section by section', sub: 'One chunk at a time, no wall of text' },
              { icon: 'Aa', label: 'Font size control', sub: 'Small · Medium · Large' },
              { icon: '⏱', label: 'Reading timer', sub: 'Track how long you study' },
              { icon: '🤖', label: 'Ask Nova', sub: 'AI summary of each section' },
            ].map(f => (
              <div key={f.label} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '14px 16px',
              }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{f.label}</p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3, lineHeight: 1.4 }}>{f.sub}</p>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 20, lineHeight: 1.5 }}>
            Files are processed on-device and not stored. Scanned PDFs (image-only) won&apos;t work — the text must be selectable.
          </p>
        </div>
      </div>
    )
  }

  // ─── Reading screen ───────────────────────────────────────────────────────────
  const section = doc.sections[sectionIdx]
  const total = doc.sections.length
  const progress = ((sectionIdx + 1) / total) * 100

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', background: '#060d0b', overflow: 'hidden' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Top bar ── */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Close / back */}
        <button
          onClick={() => setDoc(null)}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', padding: 0, flexShrink: 0 }}
        >
          ← Close
        </button>

        {/* Title + progress */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doc.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#f59e0b', borderRadius: 2, transition: 'width 0.35s' }} />
            </div>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
              {sectionIdx + 1} / {total}
            </span>
          </div>
        </div>

        {/* Font size toggle */}
        <button
          onClick={() => setFontIdx(i => (i + 1) % FONT_SIZES.length as 0 | 1 | 2)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: 'rgba(255,255,255,0.65)',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700,
            fontSize: 11,
            padding: '5px 10px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {FONT_LABELS[fontIdx]}
        </button>

        {/* Timer */}
        {startedAt && (
          <div style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.18)',
            borderRadius: 8,
            padding: '5px 9px',
            fontFamily: 'DM Mono, monospace',
            fontSize: 10,
            color: '#f59e0b',
            flexShrink: 0,
          }}>
            {formatTime(elapsed)}
          </div>
        )}
      </div>

      {/* ── Reading area (cream card) ── */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px', display: 'flex', justifyContent: 'center' }}
      >
        <div style={{
          maxWidth: 680,
          width: '100%',
          background: '#fafaf8',
          borderRadius: '0 0 20px 20px',
          padding: '32px 28px 48px',
          minHeight: '100%',
          boxSizing: 'border-box',
        }}>
          {/* Section label */}
          {section.title !== `Section ${sectionIdx + 1}` && section.title !== `Page ${sectionIdx + 1}` ? (
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16, marginTop: 0 }}>
              {section.title}
            </p>
          ) : null}

          {/* Content */}
          <div style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontSize: FONT_SIZES[fontIdx],
            lineHeight: 1.9,
            color: '#1c1c1e',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {section.content}
          </div>

          {/* Footer stats */}
          <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#d1d5db' }}>
              {section.wordCount.toLocaleString()} words
            </span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#d1d5db' }}>
              ~{Math.ceil(section.wordCount / 200)} min read
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom navigation ── */}
      <div style={{
        flexShrink: 0,
        padding: '10px 12px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#060d0b',
      }}>
        {/* Previous */}
        <button
          onClick={() => setSectionIdx(i => Math.max(0, i - 1))}
          disabled={sectionIdx === 0}
          style={{
            flex: 1,
            padding: '14px 0',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.08)',
            background: sectionIdx === 0 ? 'transparent' : 'rgba(255,255,255,0.03)',
            color: sectionIdx === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.6)',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700,
            fontSize: 14,
            cursor: sectionIdx === 0 ? 'default' : 'pointer',
          }}
        >
          ← Prev
        </button>

        {/* Ask Nova */}
        <button
          onClick={askNova}
          style={{
            padding: '14px 18px',
            borderRadius: 14,
            border: '1px solid rgba(78,207,158,0.25)',
            background: 'rgba(78,207,158,0.07)',
            color: '#4ecf9e',
            fontFamily: 'Sora, sans-serif',
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Ask Nova
        </button>

        {/* Next */}
        <button
          onClick={() => setSectionIdx(i => Math.min(total - 1, i + 1))}
          disabled={sectionIdx === total - 1}
          style={{
            flex: 1,
            padding: '14px 0',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.08)',
            background: sectionIdx === total - 1 ? 'transparent' : 'rgba(245,158,11,0.08)',
            color: sectionIdx === total - 1 ? 'rgba(255,255,255,0.18)' : '#f59e0b',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700,
            fontSize: 14,
            cursor: sectionIdx === total - 1 ? 'default' : 'pointer',
          }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
