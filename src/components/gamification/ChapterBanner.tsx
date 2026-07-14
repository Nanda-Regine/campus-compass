'use client'

import { useState, useEffect } from 'react'

interface Chapter {
  id: string
  name: string
  slug: string
  emoji: string
  start_date: string
  end_date: string
}

export default function ChapterBanner() {
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [chapterXP, setChapterXP] = useState(0)
  const [daysLeft, setDaysLeft] = useState(0)

  useEffect(() => {
    fetch('/api/gamification/chapter')
      .then(r => r.json())
      .then(d => {
        if (d.chapter) {
          setChapter(d.chapter)
          setChapterXP(d.chapter_xp ?? 0)
          const end = new Date(d.chapter.end_date)
          const today = new Date()
          const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          setDaysLeft(Math.max(0, diff))
        }
      })
      .catch(() => {})
  }, [])

  if (!chapter) return null

  const progress = (() => {
    const start = new Date(chapter.start_date).getTime()
    const end = new Date(chapter.end_date).getTime()
    const now = Date.now()
    return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)))
  })()

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(78,207,158,0.07), rgba(56,189,248,0.04))',
      border: '1px solid rgba(78,207,158,0.15)', borderRadius: 16, padding: '14px 16px',
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
            Current Chapter
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{chapter.emoji}</span>
            <span style={{ fontFamily: "'Sora', 'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {chapter.name.replace(/[^\x20-\x7E\xC0-\xFF]/g, '').trim() || chapter.name}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: '#4ecf9e' }}>
            {chapterXP.toLocaleString()} XP
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
            this chapter
          </div>
        </div>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #4ecf9e, #38BDF8)', borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)' }}>
        {daysLeft > 0 ? `${daysLeft} days remaining in this chapter` : 'Chapter ending today'}
      </div>
    </div>
  )
}
