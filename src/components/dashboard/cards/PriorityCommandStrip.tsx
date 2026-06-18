'use client'

import Link from 'next/link'
import { type Task, type Exam, type Module } from '@/types'
import { getDaysUntil } from '@/lib/utils'

export default function PriorityCommandStrip({ tasks, exams, totalBudget, remaining }: {
  tasks: Task[]; exams: Exam[]; totalBudget: number; remaining: number
}) {
  const _now = new Date()
  const todayStr = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`

  const overdueList = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < todayStr)
  const dueTodayList = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date === todayStr)
  const nextExam    = exams[0]
  const daysToExam  = nextExam ? getDaysUntil(nextExam.exam_date) : null
  const budgetPct   = totalBudget > 0 ? Math.round((remaining / totalBudget) * 100) : 100

  const items: Array<{ label: string; value: string; color: string; href: string; urgent: boolean }> = []

  if (overdueList.length > 0) {
    const first = overdueList[0].title
    items.push({
      label: `${overdueList.length} overdue`,
      value: first.length > 22 ? first.slice(0, 22) + '…' : first,
      color: '#ff6b6b', href: '/study', urgent: true,
    })
  } else if (dueTodayList.length > 0) {
    items.push({
      label: 'Due today',
      value: `${dueTodayList.length} task${dueTodayList.length > 1 ? 's' : ''}`,
      color: '#c9a84c', href: '/study', urgent: false,
    })
  }

  if (daysToExam !== null && daysToExam >= 0 && daysToExam <= 14) {
    const modName = (nextExam!.module as Module | undefined)?.module_name ?? nextExam!.exam_name ?? 'Exam'
    items.push({
      label: daysToExam === 0 ? 'Exam TODAY' : `${daysToExam}d to exam`,
      value: modName.length > 22 ? modName.slice(0, 22) + '…' : modName,
      color: daysToExam <= 2 ? '#ff6b6b' : daysToExam <= 5 ? '#c9a84c' : '#7090d0',
      href: '/study', urgent: daysToExam <= 2,
    })
  }

  if (totalBudget > 0 && budgetPct < 20) {
    items.push({
      label: `${budgetPct}% budget left`,
      value: `R${Math.round(remaining)} remaining`,
      color: budgetPct < 10 ? '#ff6b6b' : '#c9a84c',
      href: '/budget', urgent: budgetPct < 10,
    })
  }

  if (items.length === 0) return null

  return (
    <section>
      <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', fontWeight: 600, marginBottom: 8 }}>
        ◈ Priority right now
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }} className="scrollbar-none">
        {items.map((item, i) => (
          <Link key={i} href={item.href} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div
              className="priority-slide"
              style={{
                padding: '11px 14px', minWidth: 148,
                background: `${item.color}10`,
                border: `1px solid ${item.color}38`,
                borderRadius: 12, position: 'relative', overflow: 'hidden',
                animationDelay: `${i * 0.08}s`,
              }}
            >
              <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: item.color, borderRadius: '2px 0 0 2px' }} />
              {item.urgent && (
                <span className="dot-urgent" style={{ position: 'absolute', top: 8, right: 8, width: 5, height: 5, borderRadius: '50%', background: item.color }} />
              )}
              <div style={{ fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: item.color, fontWeight: 700, marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.value}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
