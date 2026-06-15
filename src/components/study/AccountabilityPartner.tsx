'use client'

// AccountabilityPartner — share a commitment with a study buddy via WhatsApp.
// Research: public commitment to a specific person (not just yourself) increases
// follow-through by 65% vs private commitment (Dominican University study, 2015).

import { useState, useCallback } from 'react'
import { dispatchXP } from '@/lib/xp-engine'
import type { Task } from '@/types'
import toast from 'react-hot-toast'

interface Props { tasks: Task[] }

function buildMessage(taskTitle: string, deadline: string, userName: string): string {
  return `Hey! I'm holding myself accountable 🤝\n\nI commit to finishing: "${taskTitle}"\nBy: ${deadline}\n\nPlease check in with me then — I'm counting on you! 💪\n\n(Sent via VarsityOS · ${userName})`
}

export default function AccountabilityPartner({ tasks }: Props) {
  const [taskTitle,   setTaskTitle]   = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [deadline,    setDeadline]    = useState('')
  const [time,        setTime]        = useState('17:00')
  const [shared,      setShared]      = useState(false)
  const [userName,    setUserName]    = useState('a VarsityOS student')

  const pending = tasks.filter(t => t.status !== 'done')
  const selectedTitle = taskTitle === '__custom__' ? customTitle : (pending.find(t => t.id === taskTitle)?.title ?? '')

  const formattedDeadline = deadline
    ? new Date(`${deadline}T${time}`).toLocaleDateString('en-ZA', {
        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
      })
    : ''

  const message = buildMessage(selectedTitle || '…', formattedDeadline || '…', userName)

  const handleWhatsApp = useCallback(() => {
    if (!selectedTitle || !deadline) { toast.error('Choose a task and deadline first'); return }
    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener')
    dispatchXP('accountability_shared')
    setShared(true)
    toast.success('Shared! +20 XP for going public 💪')
  }, [selectedTitle, deadline, message])

  const handleCopy = useCallback(() => {
    if (!selectedTitle || !deadline) { toast.error('Choose a task and deadline first'); return }
    navigator.clipboard.writeText(message).then(() => {
      toast.success('Copied — paste it to your accountability partner')
      dispatchXP('accountability_shared')
      setShared(true)
    }).catch(() => toast.error('Could not copy'))
  }, [selectedTitle, deadline, message])

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 10,
    fontFamily: 'Sora,sans-serif', fontSize: 13,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      borderRadius: 18, padding: '16px 18px',
      border: '1px solid rgba(78,207,158,0.18)',
      background: 'rgba(78,207,158,0.03)',
    }}>
      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#4ecf9e', letterSpacing: '0.18em', marginBottom: 10 }}>
        🤝 ACCOUNTABILITY PARTNER
      </div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 4 }}>
        Go public with your commitment
      </div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 18, lineHeight: 1.5 }}>
        Telling a specific person raises follow-through by 65%.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {/* Task selector */}
        {pending.length > 0 ? (
          <select value={taskTitle} onChange={e => setTaskTitle(e.target.value)} style={inputStyle}>
            <option value="">Select a task…</option>
            {pending.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            <option value="__custom__">Custom…</option>
          </select>
        ) : (
          <input
            type="text" value={customTitle}
            onChange={e => setCustomTitle(e.target.value)}
            placeholder="What are you committing to?"
            style={inputStyle}
          />
        )}

        {taskTitle === '__custom__' && (
          <input
            type="text" value={customTitle}
            onChange={e => setCustomTitle(e.target.value)}
            placeholder="Describe your commitment"
            style={inputStyle}
          />
        )}

        {/* Deadline */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...inputStyle, width: 100 }} />
        </div>

        {/* Your name (for the message) */}
        <input
          type="text" value={userName === 'a VarsityOS student' ? '' : userName}
          onChange={e => setUserName(e.target.value || 'a VarsityOS student')}
          placeholder="Your name (for the message)"
          style={inputStyle}
        />
      </div>

      {/* Message preview */}
      {selectedTitle && deadline && (
        <div style={{
          padding: '12px 14px', borderRadius: 12, marginBottom: 14,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          fontFamily: 'Sora,sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.65, whiteSpace: 'pre-line',
        }}>
          {message}
        </div>
      )}

      {shared ? (
        <div style={{
          textAlign: 'center', padding: '14px 0',
          fontFamily: 'Sora,sans-serif', fontSize: 13, color: '#4ecf9e', fontWeight: 700,
        }}>
          ✓ Shared! Now there's no backing out. 💪
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleWhatsApp} style={{
            flex: 2, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: '#25D366', color: '#fff',
            fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span>📱</span> WhatsApp
          </button>
          <button onClick={handleCopy} style={{
            flex: 1, padding: '12px 0', borderRadius: 12,
            border: '1px solid rgba(78,207,158,0.25)',
            background: 'rgba(78,207,158,0.07)', color: '#4ecf9e',
            fontFamily: 'Sora,sans-serif', fontSize: 13, cursor: 'pointer',
          }}>
            Copy
          </button>
        </div>
      )}
    </div>
  )
}
