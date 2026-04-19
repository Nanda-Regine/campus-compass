'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { type PartTimeJob, type WorkShift, JOB_TYPE_LABELS } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Props {
  userId: string
}

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-teal-600/15 text-teal-400 border-teal-600/25',
  seasonal: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  ended:    'bg-white/5 text-white/30 border-white/10',
}

const SHIFT_STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  worked:    'bg-teal-600/10 text-teal-400 border-teal-600/20',
  missed:    'bg-red-500/10 text-red-400 border-red-500/20',
  swapped:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  declined:  'bg-white/5 text-white/30 border-white/10',
}

export default function WorkClient({ userId }: Props) {
  const [jobs, setJobs]     = useState<PartTimeJob[]>([])
  const [shifts, setShifts] = useState<WorkShift[]>([])
  const [loading, setLoading] = useState(true)
  const [novaInsight, setNovaInsight] = useState<string | null>(null)
  const [insightLoading, setInsightLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [jobsRes, shiftsRes] = await Promise.all([
      fetch('/api/work/jobs'),
      fetch('/api/work/shifts?from=' + getThisWeekStart() + '&to=' + getThisWeekEnd()),
    ])
    if (jobsRes.ok) {
      const d = await jobsRes.json()
      setJobs(d.jobs ?? [])
    }
    if (shiftsRes.ok) {
      const d = await shiftsRes.json()
      setShifts(d.shifts ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const activeJobs = jobs.filter(j => j.status === 'active')

  // Weekly stats
  const weekHours    = shifts.filter(s => s.status !== 'declined').reduce((sum, s) => sum + s.duration_hours, 0)
  const weekEarnings = shifts.filter(s => s.status === 'worked').reduce((sum, s) => sum + (s.earnings ?? 0), 0)
  const conflictShifts = shifts.filter(s => s.has_study_conflict && s.status === 'scheduled')

  const handleMarkWorked = async (shiftId: string) => {
    const res = await fetch('/api/work/shifts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: shiftId, status: 'worked' }),
    })
    if (res.ok) {
      setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, status: 'worked' as const } : s))
      toast.success('Shift marked as worked!')
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Remove this job? All shifts will be deleted.')) return
    const res = await fetch('/api/work/jobs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: jobId }),
    })
    if (res.ok) {
      setJobs(prev => prev.filter(j => j.id !== jobId))
      toast.success('Job removed')
    }
  }

  const loadNovaInsight = async () => {
    setInsightLoading(true)
    try {
      const res = await fetch('/api/nova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `I'm working ${weekHours.toFixed(1)} hours this week${activeJobs.length > 0 ? ` at ${activeJobs.map(j => j.employer_name).join(', ')}` : ''}. I have ${conflictShifts.length} shift${conflictShifts.length !== 1 ? 's' : ''} that conflict with study commitments. Give me one practical tip for balancing work and study this week. Max 3 sentences.`,
          history: [],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setNovaInsight(data.message ?? '')
      }
    } catch { /* silent */ } finally {
      setInsightLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse rounded-2xl bg-white/5 h-20" />
        ))}
        <div className="animate-pulse rounded-xl bg-white/5 h-10" />
        {[1, 2].map(i => (
          <div key={i} className="animate-pulse rounded-xl bg-white/5 h-14" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ─── Stats row ─── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Jobs',   value: String(activeJobs.length),          color: 'text-teal-400' },
          { label: 'Hours this wk', value: weekHours.toFixed(1),               color: weekHours > 25 ? 'text-red-400' : 'text-white' },
          { label: 'Earned this wk',value: `R${weekEarnings.toFixed(0)}`,      color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[var(--bg-surface)] border border-white/7 rounded-2xl p-3 text-center">
            <div className={`font-display font-black text-lg ${stat.color}`}>{stat.value}</div>
            <div className="font-mono text-[0.53rem] text-white/30 uppercase mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ─── Conflict alerts ─── */}
      {conflictShifts.length > 0 && (
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-4 space-y-2">
          <div className="font-mono text-[0.6rem] text-amber-400 uppercase tracking-widest">
            ⚠️ {conflictShifts.length} shift{conflictShifts.length > 1 ? 's' : ''} with study conflicts
          </div>
          {conflictShifts.map(s => (
            <div key={s.id} className="text-sm text-white/70">
              <span className="font-body">{s.shift_date} {s.start_time}–{s.end_time}</span>
              {s.conflict_detail && (
                <span className="font-mono text-[0.58rem] text-amber-400/70 ml-2">conflicts with {s.conflict_detail}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Nova tip ─── */}
      {novaInsight ? (
        <div className="bg-purple-500/8 border border-purple-500/20 rounded-2xl p-4">
          <div className="font-mono text-[0.58rem] text-purple-400 uppercase tracking-widest mb-2">🌟 Nova</div>
          <p className="font-body text-sm text-white/75 leading-relaxed">{novaInsight}</p>
        </div>
      ) : (
        <button
          onClick={loadNovaInsight}
          disabled={insightLoading}
          className="w-full flex items-center gap-3 bg-purple-500/5 border border-purple-500/15 hover:border-purple-500/30 rounded-2xl p-4 transition-all text-left"
        >
          <span className="text-xl">🌟</span>
          <div>
            <div className="font-display font-bold text-purple-300 text-sm">
              {insightLoading ? 'Nova is thinking...' : 'Get Nova\'s take on your week'}
            </div>
            <div className="font-mono text-[0.58rem] text-white/30">Work-study balance tip →</div>
          </div>
        </button>
      )}

      {/* ─── Jobs list ─── */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest">
            Your jobs ({jobs.length})
          </div>
          <Link href="/dashboard/work/add-job" className="font-mono text-[0.6rem] text-teal-500 hover:text-teal-400">
            + Add job →
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💼</div>
            <p className="font-display font-bold text-white">No jobs added yet</p>
            <p className="font-mono text-[0.6rem] text-white/30 mt-1 mb-4">
              Add your first part-time job to start tracking shifts and earnings.
            </p>
            <Link
              href="/dashboard/work/add-job"
              className="inline-block bg-teal-600 hover:bg-teal-500 text-white font-display font-bold text-sm px-4 py-2 rounded-xl transition-all"
            >
              Add a job
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map(job => (
              <div key={job.id} className="group bg-[var(--bg-surface)] border border-white/7 hover:border-white/12 rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all">
                <div className="text-xl flex-shrink-0">{JOB_TYPE_LABELS[job.job_type]?.split(' ')[0] ?? '💼'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-white text-sm truncate">{job.employer_name}</div>
                  <div className="font-mono text-[0.58rem] text-white/40 mt-0.5">
                    {job.role_title ?? JOB_TYPE_LABELS[job.job_type]?.split(' ').slice(1).join(' ')}
                    {job.pay_rate && ` · R${job.pay_rate}/${job.pay_type === 'hourly' ? 'hr' : 'shift'}`}
                    {job.location && ` · ${job.location}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('font-mono text-[0.55rem] px-2 py-0.5 rounded-full border', STATUS_STYLES[job.status])}>
                    {job.status}
                  </span>
                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── This week's shifts ─── */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest">This week</div>
          <Link href="/dashboard/work/shifts" className="font-mono text-[0.6rem] text-teal-500 hover:text-teal-400">
            All shifts →
          </Link>
        </div>

        {shifts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📅</div>
            <p className="font-display font-bold text-white text-sm">No shifts this week</p>
            <p className="font-mono text-[0.6rem] text-white/30 mt-1">Your schedule is clear — enjoy the break!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {shifts.slice(0, 5).map(shift => (
              <div key={shift.id} className="bg-[var(--bg-surface)] border border-white/7 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-1.5 h-8 rounded-full flex-shrink-0 bg-amber-500/60" />
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-sm text-white truncate">
                    {shift.job?.employer_name ?? 'Shift'}
                  </div>
                  <div className="font-mono text-[0.58rem] text-white/40">
                    {shift.shift_date} · {shift.start_time}–{shift.end_time}
                    {shift.earnings && ` · R${shift.earnings}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {shift.has_study_conflict && (
                    <span className="text-amber-400 text-xs" title="Study conflict">⚠️</span>
                  )}
                  <span className={cn('font-mono text-[0.55rem] px-2 py-0.5 rounded-full border', SHIFT_STATUS_STYLES[shift.status])}>
                    {shift.status}
                  </span>
                  {shift.status === 'scheduled' && (
                    <button
                      onClick={() => handleMarkWorked(shift.id)}
                      className="font-mono text-[0.55rem] text-teal-400 hover:text-teal-300"
                    >
                      ✓
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Quick links ─── */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/work/shifts" className="bg-[var(--bg-surface)] border border-white/7 hover:border-amber-500/30 rounded-2xl p-4 transition-all">
          <div className="text-2xl mb-2">📅</div>
          <div className="font-display font-bold text-white text-sm">Add Shift</div>
          <div className="font-mono text-[0.58rem] text-amber-400 mt-0.5">Log your schedule →</div>
        </Link>
        <Link href="/dashboard/work/earnings" className="bg-[var(--bg-surface)] border border-white/7 hover:border-teal-600/30 rounded-2xl p-4 transition-all">
          <div className="text-2xl mb-2">💸</div>
          <div className="font-display font-bold text-white text-sm">Earnings</div>
          <div className="font-mono text-[0.58rem] text-teal-400 mt-0.5">View income history →</div>
        </Link>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────

function getThisWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d.toISOString().split('T')[0]
}

function getThisWeekEnd(): string {
  const start = new Date(getThisWeekStart())
  start.setDate(start.getDate() + 6)
  return start.toISOString().split('T')[0]
}
