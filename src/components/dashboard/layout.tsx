'use client'

import { useEffect, useState, useRef } from 'react'

// Labelled divider that gives Column 1 a scannable information hierarchy.
export function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
      <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
    </div>
  )
}

// Defers mounting (and the network/CPU cost) of below-the-fold widget clusters until they
// scroll near the viewport — a cheaper first paint on low-end phones. Renders a flex column so
// wrapped widgets keep their spacing, and mounts immediately if the cluster is already in view.
// In Data Saver mode it does NOT auto-load: it shows a tap-to-load stub so the dynamic chunks
// and their network calls only happen when the student explicitly asks for them.
export function Deferred({ children, gap = 14, minHeight = 200, dataSaver = false, label = 'this section' }: { children: React.ReactNode; gap?: number; minHeight?: number; dataSaver?: boolean; label?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (dataSaver) return // Data Saver: wait for an explicit tap, never auto-load
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') { setShow(true); return }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setShow(true); io.disconnect() }
    }, { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [dataSaver])
  if (dataSaver && !show) {
    return (
      <button
        onClick={() => setShow(true)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--bg-surface)', border: '1px dashed var(--border-subtle)', borderRadius: 12, padding: 14, cursor: 'pointer', width: '100%', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}
      >
        📡 Data Saver on — tap to load {label}
      </button>
    )
  }
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap, minHeight: show ? undefined : minHeight }}>
      {show ? children : null}
    </div>
  )
}

// Progressive disclosure for power-user clusters so they don't dominate the main scroll.
export function CollapsibleSection({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: open ? 16 : 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '11px 14px', cursor: 'pointer', width: '100%', textAlign: 'left' }}
      >
        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{label}</span>
        {hint && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{hint}</span>}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.4)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
      </button>
      {open && children}
    </div>
  )
}
