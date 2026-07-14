'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useRef } from 'react'
import type { PastPaper, PaperType, PaperInsights } from '@/types'

const ACCENT = '#4ecf9e'

function TopicFrequencyChart({ papers }: { papers: PastPaper[] }) {
  const allTopics: Record<string, number> = {}
  papers.forEach(p => {
    if (p.ai_insights?.topTopics) {
      p.ai_insights.topTopics.forEach(t => {
        allTopics[t.topic] = (allTopics[t.topic] ?? 0) + t.frequency
      })
    }
  })
  const sorted = Object.entries(allTopics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  const max = sorted[0]?.[1] ?? 1
  return (
    <div className="flex flex-col gap-2">
      {sorted.map(([topic, freq]) => (
        <div key={topic}>
          <div className="flex justify-between mb-1">
            <span style={{ color: '#e5e7eb', fontSize: '13px' }}>{topic}</span>
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>{freq}x</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '4px', height: '8px' }}>
            <div
              style={{
                width: `${(freq / max) * 100}%`,
                background: 'rgba(78,207,158,0.6)',
                borderRadius: '4px',
                height: '8px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      ))}
      {sorted.length === 0 && (
        <p style={{ color: '#9ca3af', fontSize: '13px' }}>No topic data yet. Upload papers to see patterns.</p>
      )}
    </div>
  )
}

function AllQuestions({ papers }: { papers: PastPaper[] }) {
  const seen = new Set<string>()
  const questions: string[] = []
  papers.forEach(p => {
    p.ai_insights?.likelyQuestions?.forEach(q => {
      const key = q.toLowerCase().trim()
      if (!seen.has(key)) {
        seen.add(key)
        questions.push(q)
      }
    })
  })
  if (questions.length === 0) return <p style={{ color: '#9ca3af', fontSize: '13px' }}>No predicted questions yet.</p>
  return (
    <div className="flex flex-col gap-2">
      {questions.map((q, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span style={{ color: ACCENT, fontSize: '12px', marginTop: '3px' }}>→</span>
          <span style={{ color: '#d1fae5', fontSize: '13px' }}>{q}</span>
        </div>
      ))}
    </div>
  )
}

interface Props {
  userId: string
}

type ActiveTab = 'scan' | 'upload' | 'papers' | 'insights'
type ScanState = 'idle' | 'data_warning' | 'scanning' | 'done' | 'error'

interface UploadForm {
  module_code: string
  module_name: string
  year: number
  paper_type: PaperType
  extracted_text: string
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 2014 }, (_, i) => CURRENT_YEAR - i)

export default function PastPaperVault({ userId }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('upload')
  const [papers, setPapers] = useState<PastPaper[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [uploadForm, setUploadForm] = useState<UploadForm>({
    module_code: '',
    module_name: '',
    year: CURRENT_YEAR,
    paper_type: 'exam',
    extracted_text: '',
  })
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [ocrProgress, setOcrProgress] = useState(0)
  const [scanError, setScanError] = useState('')
  const pendingFileRef = useRef<File | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workerRef = useRef<any>(null)

  useEffect(() => {
    return () => { workerRef.current?.terminate() }
  }, [])

  async function fetchPapers() {
    const supabase = createClient()
    const { data } = await supabase
      .from('past_papers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setPapers((data as PastPaper[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchPapers()
  }, [userId])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadForm.module_code.trim() || !uploadForm.module_name.trim()) return
    setUploading(true)
    try {
      const res = await fetch('/api/study/past-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...uploadForm, user_id: userId }),
      })
      if (res.ok) {
        setSuccessMsg('Paper added. Nova is generating insights...')
        setUploadForm({
          module_code: '',
          module_name: '',
          year: CURRENT_YEAR,
          paper_type: 'exam',
          extracted_text: '',
        })
        await fetchPapers()
        setActiveTab('papers')
        setTimeout(() => setSuccessMsg(''), 4000)
      }
    } finally {
      setUploading(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    pendingFileRef.current = file
    setScanState('data_warning')
  }

  async function runOCR() {
    const file = pendingFileRef.current
    if (!file) return
    setScanState('scanning')
    setOcrProgress(0)
    setScanError('')
    try {
      const { createWorker } = await import('tesseract.js')
      workerRef.current = await createWorker('eng', 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100))
          }
        },
      })
      const { data: { text } } = await workerRef.current.recognize(file)
      await workerRef.current.terminate()
      workerRef.current = null
      const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
      setUploadForm(f => ({ ...f, extracted_text: cleaned }))
      setScanState('done')
      setTimeout(() => {
        setScanState('idle')
        setActiveTab('upload')
      }, 1200)
    } catch {
      setScanState('error')
      setScanError('OCR failed. Try a clearer image or paste text manually.')
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('past_papers').delete().eq('id', id)
    setPapers(prev => prev.filter(p => p.id !== id))
  }

  const PAPER_TYPES: PaperType[] = ['exam', 'test', 'assignment']

  const TABS: { id: ActiveTab; label: string }[] = [
    { id: 'scan',    label: 'Scan' },
    { id: 'upload',  label: 'Upload' },
    { id: 'papers',  label: `My Papers (${papers.length})` },
    { id: 'insights',label: 'Insights' },
  ]

  const totalPrepHours = papers.reduce((acc, p) => acc + (p.ai_insights?.estimatedPrepHours ?? 0), 0)

  return (
    <div style={{ color: '#e5e7eb' }}>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              border: activeTab === t.id ? `1px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.1)',
              background: activeTab === t.id ? 'rgba(78,207,158,0.15)' : 'transparent',
              color: activeTab === t.id ? ACCENT : '#9ca3af',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Scan Tab (Tesseract.js OCR) */}
      {activeTab === 'scan' && (
        <div className="flex flex-col gap-4">
          {/* Data usage warning */}
          {scanState === 'data_warning' && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '14px', padding: '16px' }}>
              <p style={{ color: '#fcd34d', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Uses ~8 MB on first scan</p>
              <p style={{ color: '#d1d5db', fontSize: '12px', lineHeight: '1.6', marginBottom: '12px' }}>
                Tesseract.js downloads language models once (cached afterwards). If you are on a prepaid or limited plan,
                you may want to paste the text manually instead.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={runOCR}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', color: '#fcd34d', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Scan anyway
                </button>
                <button
                  onClick={() => { setScanState('idle'); setActiveTab('upload') }}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}
                >
                  Paste text instead
                </button>
              </div>
            </div>
          )}

          {/* Idle / file picker */}
          {(scanState === 'idle' || scanState === 'error') && (
            <>
              <div style={{
                background: 'rgba(78,207,158,0.06)',
                border: '2px dashed rgba(78,207,158,0.25)',
                borderRadius: '16px',
                padding: '32px 24px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📸</div>
                <p style={{ color: '#d1fae5', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>Scan your past paper</p>
                <p style={{ color: '#6b7280', fontSize: '12px', lineHeight: '1.6', maxWidth: '300px', margin: '0 auto 16px' }}>
                  Take a photo of a printed paper or upload an image. Nova will extract the text and generate insights automatically.
                </p>
                <label style={{ cursor: 'pointer' }}>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <span style={{
                    display: 'inline-block',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${ACCENT}, #38bdf8)`,
                    color: '#0a0a0f',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}>
                    Choose image / Take photo
                  </span>
                </label>
              </div>
              {scanError && (
                <p style={{ color: '#f87171', fontSize: '12px', textAlign: 'center' }}>{scanError}</p>
              )}
            </>
          )}

          {/* Scanning in progress */}
          {scanState === 'scanning' && (
            <div style={{ background: 'rgba(78,207,158,0.06)', border: '1px solid rgba(78,207,158,0.15)', borderRadius: '16px', padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
              <p style={{ color: '#d1fae5', fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>Reading your paper…</p>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '8px', overflow: 'hidden', margin: '0 auto', maxWidth: '260px' }}>
                <div style={{ width: `${ocrProgress}%`, height: '100%', background: `linear-gradient(90deg, ${ACCENT}, #38bdf8)`, borderRadius: '999px', transition: 'width 0.3s ease' }} />
              </div>
              <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '10px' }}>{ocrProgress}% complete</p>
            </div>
          )}

          {/* Done */}
          {scanState === 'done' && (
            <div style={{ background: 'rgba(78,207,158,0.08)', border: '1px solid rgba(78,207,158,0.3)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
              <p style={{ color: '#d1fae5', fontWeight: 700, fontSize: '15px' }}>Text extracted. Opening upload form…</p>
            </div>
          )}

          <p style={{ color: '#4b5563', fontSize: '11px', textAlign: 'center', lineHeight: '1.5' }}>
            OCR runs entirely on your device — no image is uploaded to any server.
          </p>
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          {successMsg && (
            <div style={{
              background: 'rgba(78,207,158,0.12)',
              border: '1px solid rgba(78,207,158,0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#d1fae5',
              fontSize: '13px',
            }}>
              {successMsg}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label style={{ color: '#9ca3af', fontSize: '12px' }}>Module Code</label>
              <input
                value={uploadForm.module_code}
                onChange={e => setUploadForm(f => ({ ...f, module_code: e.target.value.toUpperCase() }))}
                placeholder="e.g. ECS2605"
                required
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#e5e7eb',
                  fontSize: '14px',
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label style={{ color: '#9ca3af', fontSize: '12px' }}>Module Name</label>
              <input
                value={uploadForm.module_name}
                onChange={e => setUploadForm(f => ({ ...f, module_name: e.target.value }))}
                placeholder="e.g. Macroeconomics"
                required
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#e5e7eb',
                  fontSize: '14px',
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label style={{ color: '#9ca3af', fontSize: '12px' }}>Year</label>
              <select
                value={uploadForm.year}
                onChange={e => setUploadForm(f => ({ ...f, year: Number(e.target.value) }))}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#e5e7eb',
                  fontSize: '14px',
                  outline: 'none',
                  width: '100%',
                }}
              >
                {YEARS.map(y => <option key={y} value={y} style={{ background: '#0a0a0f' }}>{y}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label style={{ color: '#9ca3af', fontSize: '12px' }}>Paper Type</label>
              <div className="flex gap-2 flex-wrap">
                {PAPER_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setUploadForm(f => ({ ...f, paper_type: type }))}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '999px',
                      border: uploadForm.paper_type === type ? `1px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.1)',
                      background: uploadForm.paper_type === type ? 'rgba(78,207,158,0.15)' : 'transparent',
                      color: uploadForm.paper_type === type ? ACCENT : '#9ca3af',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ color: '#9ca3af', fontSize: '12px' }}>Paste extracted text from paper or key questions</label>
            <textarea
              value={uploadForm.extracted_text}
              onChange={e => setUploadForm(f => ({ ...f, extracted_text: e.target.value }))}
              rows={6}
              placeholder="Paste the paper content here. Nova will analyse topics, predict questions, and estimate prep time."
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '12px',
                color: '#e5e7eb',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical',
                width: '100%',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            style={{
              background: uploading ? 'rgba(78,207,158,0.3)' : `linear-gradient(135deg, ${ACCENT}, #38bdf8)`,
              color: '#0a0a0f',
              fontWeight: 700,
              fontSize: '14px',
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            {uploading ? 'Uploading...' : 'Add Paper + Generate Insights'}
          </button>
        </form>
      )}

      {/* Papers Tab */}
      {activeTab === 'papers' && (
        <div>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', height: '100px', border: '1px solid rgba(255,255,255,0.06)' }} />
              ))}
            </div>
          ) : papers.length === 0 ? (
            <div style={{
              background: 'rgba(78,207,158,0.06)',
              border: '1px solid rgba(78,207,158,0.15)',
              borderRadius: '16px',
              padding: '32px 24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
              <p style={{ color: '#d1fae5', fontWeight: 600, marginBottom: '8px' }}>Your vault is empty</p>
              <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.6', maxWidth: '340px', margin: '0 auto' }}>
                Past papers are the single highest-ROI study tool. Students who practice past papers score 23% higher on average. Add your first paper to unlock AI insights.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {papers.map(paper => (
                <div key={paper.id} style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  padding: '16px',
                  position: 'relative',
                }}>
                  <button
                    onClick={() => { if (confirm('Delete this past paper?')) handleDelete(paper.id) }}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(248,113,113,0.15)',
                      border: '1px solid rgba(248,113,113,0.2)',
                      borderRadius: '6px',
                      color: '#f87171',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                    }}
                    aria-label="Delete paper"
                  >
                    ×
                  </button>
                  <div className="flex gap-2 flex-wrap mb-2">
                    <span style={{
                      background: 'rgba(78,207,158,0.15)',
                      color: ACCENT,
                      border: `1px solid rgba(78,207,158,0.3)`,
                      borderRadius: '999px',
                      padding: '2px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}>{paper.module_code}</span>
                    <span style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: '#9ca3af',
                      borderRadius: '999px',
                      padding: '2px 10px',
                      fontSize: '11px',
                    }}>{paper.year}</span>
                    <span style={{
                      background: 'rgba(56,189,248,0.1)',
                      color: '#38bdf8',
                      borderRadius: '999px',
                      padding: '2px 10px',
                      fontSize: '11px',
                      textTransform: 'capitalize',
                    }}>{paper.paper_type}</span>
                  </div>
                  <p style={{ color: '#e5e7eb', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>{paper.module_name}</p>

                  {paper.ai_insights && (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2 flex-wrap">
                        {paper.ai_insights.topTopics.slice(0, 3).map(t => (
                          <span key={t.topic} style={{
                            background: 'rgba(78,207,158,0.08)',
                            border: '1px solid rgba(78,207,158,0.15)',
                            borderRadius: '6px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            color: '#a7f3d0',
                          }}>
                            {t.topic} <span style={{ opacity: 0.6 }}>×{t.frequency}</span>
                          </span>
                        ))}
                      </div>
                      {paper.ai_insights.likelyQuestions.length > 0 && (
                        <span style={{ color: '#9ca3af', fontSize: '11px' }}>
                          {paper.ai_insights.likelyQuestions.length} predicted questions
                        </span>
                      )}
                      <button
                        onClick={() => setExpandedId(expandedId === paper.id ? null : paper.id)}
                        style={{
                          background: 'transparent',
                          border: `1px solid rgba(78,207,158,0.2)`,
                          color: ACCENT,
                          fontSize: '12px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          width: 'fit-content',
                        }}
                      >
                        {expandedId === paper.id ? 'Hide Insights' : 'View Insights'}
                      </button>
                      {expandedId === paper.id && (
                        <div style={{
                          background: 'rgba(78,207,158,0.05)',
                          border: '1px solid rgba(78,207,158,0.1)',
                          borderRadius: '10px',
                          padding: '12px',
                          marginTop: '4px',
                        }}>
                          <p style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Predicted Questions</p>
                          {paper.ai_insights.likelyQuestions.map((q, i) => (
                            <p key={i} style={{ color: '#d1fae5', fontSize: '12px', marginBottom: '4px' }}>→ {q}</p>
                          ))}
                          <p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '8px' }}>
                            Est. prep: {paper.ai_insights.estimatedPrepHours}h · Difficulty: {paper.ai_insights.difficultyLevel}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {!paper.ai_insights && (
                    <p style={{ color: '#6b7280', fontSize: '12px' }}>Insights generating...</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="flex flex-col gap-6">
          {papers.length === 0 ? (
            <div style={{
              background: 'rgba(78,207,158,0.06)',
              border: '1px solid rgba(78,207,158,0.15)',
              borderRadius: '16px',
              padding: '32px 24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
              <p style={{ color: '#d1fae5', fontWeight: 600, marginBottom: '8px' }}>No papers to analyse yet</p>
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>Upload past papers to unlock aggregated intelligence across all your modules.</p>
            </div>
          ) : (
            <>
              <div style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '20px',
              }}>
                <p style={{ color: ACCENT, fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>Topic Frequency Across Papers</p>
                <TopicFrequencyChart papers={papers} />
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '20px',
              }}>
                <p style={{ color: ACCENT, fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>High-Probability Questions</p>
                <AllQuestions papers={papers} />
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(78,207,158,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0,
                }}>⏱️</div>
                <div>
                  <p style={{ color: '#9ca3af', fontSize: '12px' }}>Total Estimated Prep Time</p>
                  <p style={{ color: '#e5e7eb', fontSize: '28px', fontWeight: 700 }}>{totalPrepHours}h</p>
                  <p style={{ color: '#9ca3af', fontSize: '12px' }}>across {papers.length} paper{papers.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
