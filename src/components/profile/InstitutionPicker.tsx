'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── Institution groups ────────────────────────────────────────────────────────

export const INSTITUTION_GROUPS: { label: string; items: string[] }[] = [
  {
    label: 'Traditional Universities',
    items: [
      'University of Cape Town (UCT)',
      'University of the Witwatersrand (Wits)',
      'University of Pretoria (UP)',
      'Stellenbosch University (SU)',
      'University of KwaZulu-Natal (UKZN)',
      'University of the Free State (UFS)',
      'North-West University (NWU)',
      'Rhodes University',
      'University of Fort Hare (UFH)',
      'University of Limpopo (UL)',
      'University of Venda (UNIVEN)',
    ],
  },
  {
    label: 'Comprehensive Universities',
    items: [
      'University of Johannesburg (UJ)',
      'University of the Western Cape (UWC)',
      'Nelson Mandela University (NMU)',
      'Walter Sisulu University (WSU)',
      'Sol Plaatje University (SPU)',
      'University of Mpumalanga (UMP)',
    ],
  },
  {
    label: 'Universities of Technology',
    items: [
      'Tshwane University of Technology (TUT)',
      'Cape Peninsula University of Technology (CPUT)',
      'Durban University of Technology (DUT)',
      'Vaal University of Technology (VUT)',
      'Central University of Technology (CUT)',
      'Mangosuthu University of Technology (MUT)',
      'University of Zululand (UNIZULU)',
      'Sefako Makgatho Health Sciences University (SMU)',
    ],
  },
  {
    label: 'Distance / Online',
    items: ['University of South Africa (UNISA)'],
  },
  {
    label: 'Private Universities & HEIs',
    items: [
      'Varsity College (IIE)',
      'Rosebank College (IIE)',
      'MSC College (IIE)',
      'Pearson Institute of Higher Education',
      'Boston City Campus',
      'MANCOSA',
      'Monash South Africa',
      'Regenesys Business School',
      'The Da Vinci Institute',
      'AFDA',
      'Vega School',
      'AAA School of Advertising',
      'Stadio Higher Education',
      'Richfield Graduate Institute',
      'Regent Business School',
      'Lyceum College',
      'Damelin',
    ],
  },
  {
    label: 'TVET – Eastern Cape',
    items: [
      'Buffalo City TVET College',
      'East Cape Midlands TVET College',
      'Ikhala TVET College',
      'Ingwe TVET College',
      'King Hintsa TVET College',
      'King Sabata Dalindyebo TVET College',
      'Lovedale TVET College',
      'Port Elizabeth TVET College',
    ],
  },
  {
    label: 'TVET – Free State',
    items: [
      'Flavius Mareka TVET College',
      'Goldfields TVET College',
      'Maluti TVET College',
      'Motheo TVET College',
    ],
  },
  {
    label: 'TVET – Gauteng',
    items: [
      'Central Johannesburg TVET College',
      'Ekurhuleni East TVET College',
      'Ekurhuleni West TVET College',
      'Joburg South TVET College',
      'Sedibeng TVET College',
      'South West Gauteng TVET College',
      'Tshwane North TVET College',
      'Tshwane South TVET College',
      'Western Tshwane TVET College',
    ],
  },
  {
    label: 'TVET – KwaZulu-Natal',
    items: [
      'Coastal KZN TVET College',
      'Elangeni TVET College',
      'Esayidi TVET College',
      'Majuba TVET College',
      'Mnambithi TVET College',
      'Mthashana TVET College',
      'Thekwini TVET College',
      'Umfolozi TVET College',
      'Umgungundlovu TVET College',
    ],
  },
  {
    label: 'TVET – Limpopo',
    items: [
      'Capricorn TVET College',
      'Lephalale TVET College',
      'Mopani South East TVET College',
      'Sekhukhune TVET College',
      'Vhembe TVET College',
    ],
  },
  {
    label: 'TVET – Mpumalanga',
    items: [
      'Ehlanzeni TVET College',
      'Gert Sibande TVET College',
      'Nkangala TVET College',
    ],
  },
  {
    label: 'TVET – Northern Cape',
    items: [
      'John Taolo Gaetsewe TVET College',
      'Namaqua TVET College',
      'Northern Cape Rural TVET College',
      'Northern Cape Urban TVET College',
    ],
  },
  {
    label: 'TVET – North West',
    items: ['Orbit TVET College', 'Taletso TVET College', 'Vuselela TVET College'],
  },
  {
    label: 'TVET – Western Cape',
    items: [
      'Boland TVET College',
      'Cape Town TVET College',
      'False Bay TVET College',
      'Northlink TVET College',
      'South Cape TVET College',
      'West Coast TVET College',
    ],
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { value: string; onChange: (v: string) => void }

export default function InstitutionPicker({ value, onChange }: Props) {
  const [open,   setOpen]   = useState(false)
  const [query,  setQuery]  = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef  = useRef<HTMLDivElement>(null)

  const filtered = query.trim()
    ? INSTITUTION_GROUPS.flatMap(g =>
        g.items.filter(item => item.toLowerCase().includes(query.toLowerCase()))
      )
    : null // null = show grouped

  const close = useCallback(() => { setOpen(false); setQuery('') }, [])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close()
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', onKey) }
  }, [open, close])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40)
  }, [open])

  function select(item: string) { onChange(item); close() }

  function highlight(text: string) {
    if (!query.trim()) return <span>{text}</span>
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return <span>{text}</span>
    return (
      <span>
        {text.slice(0, idx)}
        <mark style={{ background: 'rgba(78,207,158,0.25)', color: '#4ecf9e', borderRadius: 2 }}>{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </span>
    )
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full rounded-xl px-4 py-3 font-display text-sm text-left outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${open ? 'rgba(78,207,158,0.4)' : 'rgba(255,255,255,0.09)'}`,
          color: value ? 'var(--text-secondary)' : 'rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {value || 'Search your institution…'}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, flexShrink: 0 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 999,
          background: '#161625', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          maxHeight: '60vh', display: 'flex', flexDirection: 'column',
        }}>
          {/* Search */}
          <div style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type to search (e.g. UCT, TUT, Cape Town TVET)…"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 10, boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#e5e7eb', fontSize: 13, outline: 'none',
              }}
            />
          </div>

          {/* Results */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered !== null ? (
              // Search mode — flat list
              filtered.length === 0 ? (
                <div style={{ padding: '16px', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                  No institution found for &ldquo;{query}&rdquo;
                </div>
              ) : (
                filtered.map(item => (
                  <button
                    key={item} type="button" onClick={() => select(item)}
                    style={{
                      width: '100%', padding: '11px 14px', background: value === item ? 'rgba(78,207,158,0.1)' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'DM Sans,sans-serif', fontSize: 13.5, color: value === item ? '#4ecf9e' : '#e5e7eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <span>{highlight(item)}</span>
                    {value === item && <span style={{ color: '#4ecf9e', fontSize: 12 }}>✓</span>}
                  </button>
                ))
              )
            ) : (
              // Grouped mode
              INSTITUTION_GROUPS.map(group => (
                <div key={group.label}>
                  <div style={{
                    padding: '8px 14px 4px', fontFamily: '"JetBrains Mono",monospace',
                    fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em',
                    textTransform: 'uppercase', background: 'rgba(0,0,0,0.2)',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    position: 'sticky', top: 0,
                  }}>
                    {group.label}
                  </div>
                  {group.items.map(item => (
                    <button
                      key={item} type="button" onClick={() => select(item)}
                      style={{
                        width: '100%', padding: '10px 14px',
                        background: value === item ? 'rgba(78,207,158,0.1)' : 'transparent',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                        fontFamily: 'DM Sans,sans-serif', fontSize: 13.5,
                        color: value === item ? '#4ecf9e' : '#e5e7eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                      }}
                    >
                      <span>{item}</span>
                      {value === item && <span style={{ color: '#4ecf9e', fontSize: 12 }}>✓</span>}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer count */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)', padding: '7px 14px',
            fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: 'rgba(255,255,255,0.2)',
            display: 'flex', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <span>
              {filtered !== null ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : '90+ institutions'}
            </span>
            <span>ESC to close</span>
          </div>
        </div>
      )}
    </div>
  )
}
