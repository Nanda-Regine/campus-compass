'use client'

import { useState, useRef } from 'react'

interface PreviewData {
  slotCount: number
  examCount: number
  skipped: number
  sampleSlots: { day_of_week_text: string; start_time: string; end_time: string; venue: string | null; slot_type: string }[]
  sampleExams: { exam_name: string; exam_date: string; exam_type: string }[]
}

export default function ICSImportButton({ onImported }: { onImported: () => void }) {
  const [open, setOpen]         = useState(false)
  const [mode, setMode]         = useState<'url' | 'file'>('url')
  const [url, setUrl]           = useState('')
  const [icsText, setIcsText]   = useState('')
  const [replace, setReplace]   = useState(false)
  const [step, setStep]         = useState<'input' | 'preview' | 'done'>('input')
  const [preview, setPreview]   = useState<PreviewData | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep('input'); setPreview(null); setError('')
    setUrl(''); setIcsText(''); setMode('url'); setReplace(false)
  }
  const close = () => { setOpen(false); reset() }

  const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setIcsText((ev.target?.result as string) ?? '')
    reader.readAsText(file)
  }

  const fetchPreview = async () => {
    setLoading(true); setError('')
    try {
      const body = mode === 'url' ? { url: url.trim() } : { icsText }
      const res  = await fetch('/api/timetable/import-ics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, confirm: false, replace }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to parse'); return }
      if (data.slotCount === 0 && data.examCount === 0) {
        setError('No timetable entries or exams found in this calendar.')
        return
      }
      setPreview(data as PreviewData)
      setStep('preview')
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  const confirmImport = async () => {
    setLoading(true); setError('')
    try {
      const body = mode === 'url' ? { url: url.trim() } : { icsText }
      const res  = await fetch('/api/timetable/import-ics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, confirm: true, replace }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Import failed'); return }
      setStep('done')
      onImported()
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)',
          color: '#38BDF8', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 14 }}>📅</span> Import ICS
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }} onClick={e => { if (e.target === e.currentTarget) close() }}>
          <div style={{
            width: '100%', maxWidth: 460,
            background: 'var(--bg-surface, #0f1a19)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 18, overflow: 'hidden',
          }}>
            {/* Header accent */}
            <div style={{ height: 2, background: 'linear-gradient(90deg, #38BDF8, rgba(56,189,248,0.1))' }} />

            <div style={{ padding: '20px 20px 24px' }}>
              {/* Title row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <span style={{
                    fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: '#38BDF8', fontWeight: 700,
                  }}>Import calendar</span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '4px 0 0' }}>
                    {step === 'input' ? 'Import from .ics' : step === 'preview' ? 'Preview import' : 'Import complete'}
                  </h3>
                </div>
                <button onClick={close} style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18,
                  cursor: 'pointer', lineHeight: 1, padding: 4,
                }}>✕</button>
              </div>

              {/* STEP: Input */}
              {step === 'input' && (
                <>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                    Paste your university&apos;s calendar URL or upload a downloaded .ics file.
                    Your timetable slots and exam dates will be added automatically.
                  </p>

                  {/* Mode toggle */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    {(['url', 'file'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        style={{
                          flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: mode === m ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${mode === m ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          color: mode === m ? '#38BDF8' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        {m === 'url' ? '🔗 Calendar URL' : '📁 Upload file'}
                      </button>
                    ))}
                  </div>

                  {mode === 'url' ? (
                    <div>
                      <label style={labelStyle}>Calendar URL (.ics)</label>
                      <input
                        type="url"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="https://myuniversity.ac.za/calendar.ics"
                        style={inputStyle}
                      />
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                        In most university portals: Settings → Calendar → Copy ICS link / Subscribe.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label style={labelStyle}>ICS file</label>
                      <div
                        onClick={() => fileRef.current?.click()}
                        style={{
                          padding: '20px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                          border: '2px dashed rgba(56,189,248,0.3)',
                          background: 'rgba(56,189,248,0.04)',
                          color: icsText ? '#38BDF8' : 'var(--text-muted)',
                          fontSize: 13,
                        }}
                      >
                        {icsText ? '✓ File loaded — ready to preview' : 'Click to select .ics file'}
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".ics,text/calendar"
                        onChange={handleFileRead}
                        style={{ display: 'none' }}
                      />
                    </div>
                  )}

                  {/* Replace toggle */}
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginTop: 14,
                    padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
                    background: replace ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${replace ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                    <input
                      type="checkbox"
                      checked={replace}
                      onChange={e => setReplace(e.target.checked)}
                      style={{ width: 14, height: 14, accentColor: '#ef4444', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: replace ? '#f87171' : 'var(--text-secondary)' }}>
                        Replace existing timetable
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                        Deletes all current slots before importing. Use when re-importing your calendar.
                      </div>
                    </div>
                  </label>

                  {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 10 }}>{error}</p>}

                  <button
                    onClick={fetchPreview}
                    disabled={loading || (mode === 'url' ? !url.trim() : !icsText)}
                    style={{
                      ...primaryBtnStyle,
                      marginTop: 14,
                      opacity: loading || (mode === 'url' ? !url.trim() : !icsText) ? 0.5 : 1,
                      cursor: loading ? 'wait' : 'pointer',
                    }}
                  >
                    {loading ? 'Parsing…' : 'Preview import'}
                  </button>
                </>
              )}

              {/* STEP: Preview */}
              {step === 'preview' && preview && (
                <>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16,
                  }}>
                    <CountChip label="Timetable slots" count={preview.slotCount} colour="#38BDF8" />
                    <CountChip label="Exams / tests" count={preview.examCount} colour="#f59e0b" />
                  </div>

                  {preview.sampleSlots.length > 0 && (
                    <SampleList
                      label="Slots (sample)"
                      items={preview.sampleSlots.map(s =>
                        `${s.day_of_week_text} ${s.start_time}–${s.end_time}${s.venue ? ` · ${s.venue}` : ''} (${s.slot_type})`
                      )}
                    />
                  )}

                  {preview.sampleExams.length > 0 && (
                    <SampleList
                      label="Exams (sample)"
                      items={preview.sampleExams.map(e =>
                        `${new Date(e.exam_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} — ${e.exam_name}`
                      )}
                    />
                  )}

                  {preview.skipped > 0 && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                      {preview.skipped} event{preview.skipped !== 1 ? 's' : ''} skipped (missing date or unsupported format).
                    </p>
                  )}

                  {replace && (
                    <div style={{
                      padding: '8px 12px', borderRadius: 8, marginBottom: 12,
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      fontSize: 11, color: '#f87171',
                    }}>
                      ⚠ Your existing timetable slots will be deleted before importing.
                    </div>
                  )}

                  {error && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 10 }}>{error}</p>}

                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button onClick={() => { setStep('input'); setError('') }} style={ghostBtnStyle}>
                      ← Back
                    </button>
                    <button
                      onClick={confirmImport}
                      disabled={loading}
                      style={{
                        ...primaryBtnStyle, flex: 1,
                        opacity: loading ? 0.7 : 1,
                        cursor: loading ? 'wait' : 'pointer',
                        ...(replace ? { border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', background: 'rgba(239,68,68,0.1)' } : {}),
                      }}
                    >
                      {loading ? 'Importing…' : replace
                        ? `Replace & import ${preview.slotCount + preview.examCount} entries`
                        : `Import ${preview.slotCount + preview.examCount} entries`}
                    </button>
                  </div>
                </>
              )}

              {/* STEP: Done */}
              {step === 'done' && (
                <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
                  <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Timetable imported!</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                    Your classes and exams are now in VarsityOS. You can link modules to each slot manually.
                  </p>
                  <button onClick={close} style={primaryBtnStyle}>Done</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function CountChip({ label, count, colour }: { label: string; count: number; colour: string }) {
  return (
    <div style={{
      padding: '12px', borderRadius: 10, textAlign: 'center',
      background: `${colour}0a`, border: `1px solid ${colour}20`,
    }}>
      <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 800, color: colour }}>{count}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function SampleList({ label, items }: { label: string; items: string[] }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            fontSize: 11, color: 'var(--text-secondary)', padding: '6px 10px',
            background: 'rgba(255,255,255,0.03)', borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{item}</div>
        ))}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.04em',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 13,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
}
const primaryBtnStyle: React.CSSProperties = {
  width: '100%', padding: '12px 0', borderRadius: 10, fontWeight: 700, fontSize: 13,
  background: 'linear-gradient(135deg, rgba(56,189,248,0.25), rgba(56,189,248,0.12))',
  border: '1px solid rgba(56,189,248,0.4)', color: '#38BDF8',
  cursor: 'pointer',
}
const ghostBtnStyle: React.CSSProperties = {
  padding: '12px 16px', borderRadius: 10, fontWeight: 600, fontSize: 12,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: 'var(--text-muted)', cursor: 'pointer',
}
