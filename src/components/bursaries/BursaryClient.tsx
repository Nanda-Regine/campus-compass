'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { dispatchXP } from '@/lib/xp-engine'
import Link from 'next/link'
import { Search, ChevronDown, ChevronUp, ExternalLink, Bookmark, BookmarkCheck } from 'lucide-react'
import { BURSARIES, filterBursaries, type Bursary, type BursaryBasisFilter } from '@/lib/bursary-data'
import { loadSavedBursaries, saveBursary, unsaveBursary } from '@/lib/db/saved-bursaries'
import { AmbientImage } from '@/components/ui/AmbientImage'
import dynamic from 'next/dynamic'

const BursaryTracker = dynamic(() => import('./BursaryTracker'), { ssr: false })

// ── Basis filter options ──────────────────────────────────────────────────────

const BASIS_OPTIONS: { value: BursaryBasisFilter; label: string }[] = [
  { value: 'all',   label: 'All' },
  { value: 'need',  label: 'Need-based' },
  { value: 'merit', label: 'Merit' },
  { value: 'both',  label: 'Need + Merit' },
]

const FIELD_GROUPS = [
  'Accounting', 'Agriculture', 'Commerce', 'Computer Science',
  'Data Science', 'Education', 'Engineering', 'Finance',
  'ICT', 'Medicine', 'Nursing', 'Science',
]

// ── Bursary card ─────────────────────────────────────────────────────────────

function BursaryCard({
  b, saved, onToggleSave,
}: {
  b: Bursary
  saved: boolean
  onToggleSave: (b: Bursary) => void
}) {
  const [open, setOpen] = useState(false)

  const typeColor = b.type === 'bursary' ? '#4ecf9e' : b.type === 'scholarship' ? '#7090d0' : '#f59e0b'
  const typeLabel = b.type === 'bursary' ? 'Bursary' : b.type === 'scholarship' ? 'Scholarship' : 'Loan-Bursary'

  const novaPrompt = encodeURIComponent(
    `Tell me about the ${b.name} (${b.provider}). How do I apply? Am I likely to qualify? Give me a step-by-step application plan.`
  )

  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      background: 'rgba(255,255,255,0.06)',
      border: `0.5px solid ${typeColor}25`,
      transition: 'border-color 0.15s',
    }}>
      {/* Header — always visible */}
      <button
        onClick={() => { if (!open) dispatchXP('bursary_viewed'); setOpen(v => !v) }}
        style={{
          width: '100%', padding: '14px 16px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'flex-start',
        }}
      >
        {/* Left accent */}
        <div style={{ width: 3, borderRadius: 2, alignSelf: 'stretch', background: typeColor, flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem',
              color: 'var(--text-primary)', lineHeight: 1.3,
            }}>
              {b.name}
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
              color: typeColor, background: `${typeColor}15`,
              border: `0.5px solid ${typeColor}35`,
              padding: '2px 7px', borderRadius: 9999, flexShrink: 0,
            }}>
              {typeLabel}
            </span>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.57rem', color: 'var(--text-tertiary)', marginTop: 3 }}>
            {b.provider}
          </div>

          {/* Tag chip */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: typeColor, marginTop: 6 }}>
            {b.tag}
          </div>

          {/* Amount pill */}
          <div style={{
            display: 'inline-block', marginTop: 6,
            fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
            color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)',
            border: '0.5px solid rgba(255,255,255,0.08)',
            padding: '3px 8px', borderRadius: 6,
          }}>
            {b.amount}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); onToggleSave(b) }}
            title={saved ? 'Remove from saved' : 'Save bursary'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: saved ? typeColor : 'rgba(255,255,255,0.2)',
              transition: 'color 0.15s',
            }}
          >
            {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>
          <div style={{ color: 'rgba(255,255,255,0.45)', paddingTop: 2 }}>
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div style={{ padding: '0 16px 16px 29px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {b.description}
          </p>

          {/* Fields & year */}
          <div>
            <div style={labelStyle}>Fields covered</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
              {b.fields.map(f => (
                <span key={f} style={chip}>{f}</span>
              ))}
            </div>
          </div>

          <div>
            <div style={labelStyle}>Eligible years</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--text-primary)', marginTop: 3 }}>
              {b.years}
            </div>
          </div>

          {/* Requirements */}
          <div>
            <div style={labelStyle}>Requirements</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 5 }}>
              {b.requirements.map((r, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: typeColor, flexShrink: 0, fontSize: 10, marginTop: 3 }}>●</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Deadline */}
          <div style={{
            padding: '8px 10px', borderRadius: 8,
            background: 'rgba(245,158,11,0.07)',
            border: '0.5px solid rgba(245,158,11,0.18)',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.57rem', color: '#f59e0b' }}>
              📅 {b.deadline}
            </span>
          </div>

          {/* How to apply */}
          <div>
            <div style={labelStyle}>How to apply</div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '5px 0 0' }}>
              {b.howToApply}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Ask Nova */}
            <Link
              href={`/nova?prompt=${novaPrompt}`}
              style={{
                flex: '1 1 120px',
                padding: '8px 12px', borderRadius: 10, textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: `${typeColor}18`, border: `0.5px solid ${typeColor}40`,
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.72rem', color: typeColor,
              }}
            >
              🌟 Ask Nova
            </Link>

            {/* Website */}
            <a
              href={`https://${b.contact}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                flex: '1 1 100px',
                padding: '8px 12px', borderRadius: 10, textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'rgba(255,255,255,0.07)',
                border: '0.5px solid rgba(255,255,255,0.1)',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.66)',
              }}
            >
              <ExternalLink size={12} /> Website
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared micro-styles ───────────────────────────────────────────────────────

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-tertiary)',
  textTransform: 'uppercase', letterSpacing: '0.07em',
}

const chip: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.54rem',
  color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.06)',
  border: '0.5px solid rgba(255,255,255,0.08)',
  padding: '3px 8px', borderRadius: 6,
}

// ── Main client component ────────────────────────────────────────────────────

type PageTab = 'find' | 'tracker'

export default function BursaryClient() {
  const [pageTab,   setPageTab]   = useState<PageTab>('find')
  const [query,     setQuery]     = useState('')
  const [field,     setField]     = useState('')
  const [basis,     setBasis]     = useState<BursaryBasisFilter>('all')
  const [showSaved, setShowSaved] = useState(false)
  const [savedIds,  setSavedIds]  = useState<Set<string>>(new Set())

  useEffect(() => {
    loadSavedBursaries().then(ids => setSavedIds(new Set(ids)))
  }, [])

  function handleToggleSave(b: Bursary) {
    if (savedIds.has(b.id)) {
      setSavedIds(prev => { const s = new Set(prev); s.delete(b.id); return s })
      unsaveBursary(b.id).catch(() => {})
    } else {
      setSavedIds(prev => new Set([...prev, b.id]))
      saveBursary(b.id, b.name).catch(() => {})
    }
  }

  const filtered = filterBursaries(BURSARIES, query, field, basis)
  const results  = showSaved ? filtered.filter(b => savedIds.has(b.id)) : filtered
  const dueCount = results.length

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      {/* Holographic iridescent — cosmic funding energy */}
      <AmbientImage zone="nsfas" opacity={0.15} blurPx={16} saturation={1.5} overlayColor="rgba(5,4,12,0.72)" />
      {/* Page header */}
      <div style={{
        padding: '20px 20px 0',
        borderBottom: '0.5px solid var(--border-subtle)',
        paddingBottom: 16,
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: '1.25rem', color: 'var(--text-primary)',
          letterSpacing: '-0.02em', marginBottom: 4,
        }}>
          Bursaries & Scholarships
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          {BURSARIES.length} curated SA opportunities · Tap any card to expand · Ask Nova for a personal plan
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
          {([['find','🔍 Find Bursaries'], ['tracker','📋 My Applications']] as [PageTab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setPageTab(id)}
              style={{
                flex: 1, padding: '10px 8px', border: 'none', background: 'transparent', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: pageTab === id ? 700 : 400,
                fontSize: '0.72rem',
                color: pageTab === id ? '#c084fc' : 'rgba(255,255,255,0.55)',
                borderBottom: pageTab === id ? '2px solid #c084fc' : '2px solid transparent',
                transition: 'all 0.2s ease',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Applications tracker */}
        {pageTab === 'tracker' && <BursaryTracker />}

        {pageTab === 'find' && <>
        {/* Nova prompt banner */}
        <Link
          href="/nova?prompt=I%20want%20to%20find%20a%20bursary.%20Based%20on%20my%20profile%2C%20what%20bursaries%20should%20I%20apply%20for%3F%20Give%20me%20a%20step-by-step%20application%20plan."
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            borderRadius: 14, textDecoration: 'none',
            background: 'rgba(155,111,212,0.08)', border: '0.5px solid rgba(155,111,212,0.2)',
          }}
        >
          <span style={{ fontSize: 22 }}>🌟</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: '#c084fc' }}>
              Get a personal bursary plan from Nova
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.57rem', color: 'rgba(192,132,252,0.6)', marginTop: 2 }}>
              Nova knows your degree, year, and funding type — tap for a custom application strategy
            </div>
          </div>
        </Link>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.5)',
          }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, field, or provider…"
            style={{
              width: '100%', padding: '9px 12px 9px 32px', borderRadius: 10, boxSizing: 'border-box',
              border: '0.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)',
              color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: '0.8rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Filters row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Field filter */}
          <select
            value={field}
            onChange={e => setField(e.target.value)}
            style={{
              flex: '1 1 140px', padding: '7px 10px', borderRadius: 8,
              border: '0.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)',
              color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', outline: 'none',
            }}
          >
            <option value="">All fields</option>
            {FIELD_GROUPS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          {/* Basis filter */}
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            {BASIS_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => setBasis(o.value)}
                style={{
                  padding: '7px 10px', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', fontSize: '0.56rem',
                  background: basis === o.value ? 'rgba(78,207,158,0.15)' : 'rgba(255,255,255,0.06)',
                  color: basis === o.value ? '#4ecf9e' : 'rgba(255,255,255,0.55)',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Saved toggle */}
          <button
            onClick={() => setShowSaved(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: '0.56rem', flexShrink: 0,
              background: showSaved ? 'rgba(240,180,41,0.15)' : 'rgba(255,255,255,0.07)',
              color: showSaved ? '#f0b429' : 'rgba(255,255,255,0.55)',
              border: `0.5px solid ${showSaved ? 'rgba(240,180,41,0.3)' : 'rgba(255,255,255,0.08)'}`,
              transition: 'all 0.15s',
            }}
          >
            <BookmarkCheck size={12} />
            Saved {savedIds.size > 0 ? `(${savedIds.size})` : ''}
          </button>
        </div>

        {/* Result count */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--text-tertiary)' }}>
          {dueCount} result{dueCount === 1 ? '' : 's'} {showSaved ? '· saved only' : query || field ? '· filtered' : ''}
        </div>

        {/* Bursary list */}
        {results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 28 }}>{showSaved ? '🔖' : '🔍'}</div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, marginTop: 10 }}>
              {showSaved ? 'No saved bursaries yet' : 'No results'}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
              {showSaved ? 'Tap the bookmark icon on any bursary to save it here.' : 'Try different search terms or clear filters.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.map(b => (
              <BursaryCard
                key={b.id}
                b={b}
                saved={savedIds.has(b.id)}
                onToggleSave={handleToggleSave}
              />
            ))}
          </div>
        )}

        {/* Nova fallback tip */}
        <div style={{
          padding: '12px 14px', borderRadius: 12,
          background: 'rgba(78,207,158,0.04)',
          border: '0.5px solid rgba(78,207,158,0.1)',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#4ecf9e', marginBottom: 4 }}>
            Can&apos;t find what you need?
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.57rem', color: 'var(--text-tertiary)', lineHeight: 1.5, margin: 0 }}>
            Ask Nova — she knows hundreds of SA bursaries and can advise based on your degree, university, and financial situation.
            Also check your university&apos;s financial aid office directly.
          </p>
        </div>
        </>}
      </div>
    </div>
  )
}
