'use client'

import dynamic from 'next/dynamic'

// DigitalSkillsAcademy embeds the entire curriculum (the big static TRACKS dataset) plus its
// lesson UI — ~36 kB. Lazy-load it so the /skills route ships a light shell and the academy
// streams in as its own chunk, giving a fast first paint on low-end / prepaid devices.
const DigitalSkillsAcademy = dynamic(() => import('./DigitalSkillsAcademy'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '60px 0', color: 'var(--text-muted)' }}>
      <div style={{ width: 26, height: 26, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '0.8rem' }}>Loading Skills Academy…</span>
    </div>
  ),
})

export default function SkillsAcademyClient() {
  return <DigitalSkillsAcademy />
}
