'use client'

// ─── Attendance Tracker ───────────────────────────────────────
// Per-module attendance with 80% threshold warnings (SA standard for exam entry).
// Tracks streaks, generates catch-up alerts, and shows the pattern
// of absences so Nova can intervene early.

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, CheckCircle2, XCircle, Clock, Wifi, X, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface Module { id: string; module_name: string }
interface AttendanceRecord {
  id:        string
  module_id: string
  date:      string
  status:    'present' | 'absent' | 'late' | 'online' | 'cancelled'
  notes:     string | null
}

interface ModuleStat {
  module:      Module
  records:     AttendanceRecord[]
  total:       number
  present:     number  // present + late + online count as attended
  absent:      number
  pct:         number
  risk:        'safe' | 'watch' | 'warning' | 'critical'
  streak:      number  // consecutive absences
}

type Status = 'present' | 'absent' | 'late' | 'online'

const STATUS_ICONS: Record<Status, React.ReactNode> = {
  present:  <CheckCircle2 size={14} />,
  absent:   <XCircle size={14} />,
  late:     <Clock size={14} />,
  online:   <Wifi size={14} />,
}

const STATUS_COLORS: Record<Status, string> = {
  present: '#4ecf9e',
  absent:  '#f87171',
  late:    '#f59e0b',
  online:  '#38BDF8',
}

const STATUS_LABELS: Record<Status, string> = {
  present: 'Present',
  absent:  'Absent',
  late:    'Late',
  online:  'Online / Recorded',
}

function calcRisk(pct: number): ModuleStat['risk'] {
  if (pct >= 85) return 'safe'
  if (pct >= 80) return 'watch'
  if (pct >= 70) return 'warning'
  return 'critical'
}

const RISK_COLORS = { safe: '#4ecf9e', watch: '#f59e0b', warning: '#f97316', critical: '#f87171' }
const RISK_LABELS = { safe: 'On track', watch: 'At limit', warning: 'Below 80%', critical: 'At risk of exclusion' }

function calcConsecutiveAbsences(records: AttendanceRecord[]): number {
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  for (const r of sorted) {
    if (r.status === 'absent') streak++
    else break
  }
  return streak
}

export default function AttendanceTab({ modules, userId }: { modules: Module[]; userId: string }) {
  const supabase    = createClient()
  const [stats,     setStats]     = useState<ModuleStat[]>([])
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [marking,   setMarking]   = useState<{ moduleId: string; date: string } | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const loadRecords = useCallback(async () => {
    if (!modules.length) { setLoading(false); return }
    const { data } = await supabase
      .from('attendance_records')
      .select('id, module_id, date, status, notes')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    const records = (data ?? []) as AttendanceRecord[]
    const computed: ModuleStat[] = modules.map(mod => {
      const modRecords = records.filter(r => r.module_id === mod.id)
      const attended   = modRecords.filter(r => r.status !== 'absent' && r.status !== 'cancelled').length
      const absent     = modRecords.filter(r => r.status === 'absent').length
      const total      = modRecords.filter(r => r.status !== 'cancelled').length
      const pct        = total === 0 ? 100 : Math.round((attended / total) * 100)
      return {
        module:  mod,
        records: modRecords,
        total,
        present: attended,
        absent,
        pct,
        risk:   calcRisk(pct),
        streak: calcConsecutiveAbsences(modRecords),
      }
    })

    setStats(computed.sort((a, b) => a.pct - b.pct))
    setLoading(false)
  }, [modules, userId, supabase])

  useEffect(() => { loadRecords() }, [loadRecords])

  const markAttendance = async (moduleId: string, status: Status) => {
    setMarking({ moduleId, date: selectedDate })
    const { error } = await supabase.from('attendance_records').upsert(
      { user_id: userId, module_id: moduleId, date: selectedDate, status },
      { onConflict: 'user_id,module_id,date' }
    )
    if (error) { toast.error('Could not save'); }
    else       { toast.success(STATUS_LABELS[status]); await loadRecords() }
    setMarking(null)
  }

  const today = new Date().toISOString().split('T')[0]

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 24, height: 24, border: '2px solid var(--border-subtle)', borderTopColor: '#4ecf9e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!modules.length) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2rem', marginBottom: 12 }}>📚</div>
      <p style={{ fontSize: '0.85rem' }}>Add modules first to track attendance.</p>
    </div>
  )

  const criticalCount = stats.filter(s => s.risk === 'critical' || s.risk === 'warning').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Summary banner */}
      {criticalCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 12, padding: '12px 14px',
        }}>
          <AlertTriangle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f87171' }}>
              {criticalCount} module{criticalCount > 1 ? 's' : ''} below 80% attendance
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
              SA universities require ≥80% attendance for exam entry. Act now.
            </div>
          </div>
        </div>
      )}

      {/* Date selector for marking */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>Mark for:</span>
        <input
          type="date"
          value={selectedDate}
          max={today}
          onChange={e => setSelectedDate(e.target.value)}
          style={{
            padding: '5px 10px', borderRadius: 8, fontSize: '0.78rem',
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)', cursor: 'pointer',
          }}
        />
        {selectedDate !== today && (
          <button
            onClick={() => setSelectedDate(today)}
            style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Today
          </button>
        )}
      </div>

      {/* Module cards */}
      {stats.map(stat => {
        const isOpen    = expanded === stat.module.id
        const todayRec  = stat.records.find(r => r.date === selectedDate)
        const color     = RISK_COLORS[stat.risk]
        const isMarking = marking?.moduleId === stat.module.id

        return (
          <div key={stat.module.id} style={{
            position: 'relative', overflow: 'hidden',
            background: 'var(--bg-surface)',
            border: `1px solid ${stat.risk === 'safe' ? 'var(--border-subtle)' : `${color}30`}`,
            borderRadius: 14,
          }}>
            {/* Top accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />

            <div style={{ padding: '14px 14px 12px' }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {stat.module.module_name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', fontWeight: 700,
                      color, background: `${color}15`, border: `0.5px solid ${color}40`,
                      padding: '2px 7px', borderRadius: 999,
                    }}>
                      {stat.pct}% {RISK_LABELS[stat.risk]}
                    </span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                      {stat.present}/{stat.total} classes
                    </span>
                    {stat.streak > 1 && (
                      <span style={{ fontSize: '0.62rem', color: '#f87171', fontWeight: 600 }}>
                        ⚠ {stat.streak} absences in a row
                      </span>
                    )}
                  </div>
                </div>

                {/* Attendance ring */}
                <div style={{ position: 'relative', width: 42, height: 42, flexShrink: 0 }}>
                  <svg width={42} height={42} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={21} cy={21} r={17} fill="none" stroke="var(--border-subtle)" strokeWidth={3} />
                    <circle cx={21} cy={21} r={17} fill="none" stroke={color} strokeWidth={3}
                      strokeDasharray={`${(stat.pct / 100) * 2 * Math.PI * 17} ${2 * Math.PI * 17}`}
                      strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.4s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', fontWeight: 700, color }}>
                    {stat.pct}
                  </div>
                </div>
              </div>

              {/* Mark attendance buttons */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: todayRec ? 8 : 0 }}>
                {(['present', 'absent', 'late', 'online'] as Status[]).map(s => {
                  const isSelected = todayRec?.status === s
                  return (
                    <button
                      key={s}
                      onClick={() => markAttendance(stat.module.id, s)}
                      disabled={isMarking || false}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '5px 10px', borderRadius: 20, border: '0.5px solid',
                        borderColor: isSelected ? STATUS_COLORS[s] : 'var(--border-subtle)',
                        background:  isSelected ? `${STATUS_COLORS[s]}18` : 'var(--bg-base)',
                        color:       isSelected ? STATUS_COLORS[s] : 'var(--text-muted)',
                        fontSize: '0.68rem', fontWeight: isSelected ? 700 : 400,
                        cursor: 'pointer', transition: 'all 0.15s',
                        opacity: isMarking ? 0.6 : 1,
                      }}
                    >
                      {STATUS_ICONS[s]}
                      {STATUS_LABELS[s]}
                    </button>
                  )
                })}
              </div>

              {/* History toggle */}
              {stat.records.length > 0 && (
                <button
                  onClick={() => setExpanded(isOpen ? null : stat.module.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.68rem' }}
                >
                  {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {isOpen ? 'Hide history' : `View ${stat.records.length} records`}
                </button>
              )}
            </div>

            {/* History drawer */}
            {isOpen && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '10px 14px 12px', maxHeight: 200, overflowY: 'auto' }}>
                {stat.records.slice(0, 30).map(rec => (
                  <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBlock: 4 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text-muted)', width: 80, flexShrink: 0 }}>
                      {new Date(rec.date + 'T12:00:00').toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', fontWeight: 600, color: STATUS_COLORS[rec.status as Status] ?? 'var(--text-muted)' }}>
                      {rec.status in STATUS_ICONS ? STATUS_ICONS[rec.status as Status] : <X size={12} />}
                      {STATUS_LABELS[rec.status as Status] ?? rec.status}
                    </span>
                    {rec.notes && <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{rec.notes}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
