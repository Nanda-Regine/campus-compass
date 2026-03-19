'use client'

import { useState, useEffect, useCallback } from 'react'
import TopBar from '@/components/layout/TopBar'
import Button from '@/components/ui/Button'
import { type PartTimeJob, type WorkShift } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  worked:    'bg-teal-600/10 text-teal-400 border-teal-600/20',
  missed:    'bg-red-500/10 text-red-400 border-red-500/20',
  swapped:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  declined:  'bg-white/5 text-white/30 border-white/10',
}

export default function ShiftsPage() {
  const [jobs, setJobs]     = useState<PartTimeJob[]>([])
  const [shifts, setShifts] = useState<WorkShift[]>([])
  const [loading, setLoading] = useState(true)
  const [addMode, setAddMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draftMode, setDraftMode] = useState<string | null>(null)
  const [draftText, setDraftText] = useState('')
  const [draftLoading, setDraftLoading] = useState(false)

  const [newShift, setNewShift] = useState({
    job_id: '',
    shift_date: '',
    start_time: '',
    end_time: '',
    status: 'scheduled',
    notes: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    const [jr, sr] = await Promise.all([
      fetch('/api/work/jobs'),
      fetch('/api/work/shifts'),
    ])
    if (jr.ok) { const d = await jr.json(); setJobs(d.jobs ?? []) }
    if (sr.ok) { const d = await sr.json(); setShifts(d.shifts ?? []) }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newShift.job_id || !newShift.shift_date || !newShift.start_time || !newShift.end_time) {
      toast.error('Please fill in all required fields')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/work/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShift),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setShifts(prev => [data.shift, ...prev])
      if (data.conflicts?.length > 0) {
        toast(`⚠️ Shift added but conflicts detected: ${data.conflicts[0].detail}`, { duration: 5000 })
      } else {
        toast.success('Shift added!')
      }
      setAddMode(false)
      setNewShift({ job_id: '', shift_date: '', start_time: '', end_time: '', status: 'scheduled', notes: '' })
    } catch (err) {
      toast.error('Failed to add shift')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDraftRequest = async (shiftId: string) => {
    setDraftMode(shiftId)
    setDraftLoading(true)
    try {
      const res = await fetch('/api/work/shift-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shift_id: shiftId, request_type: 'time_off' }),
      })
      const data = await res.json()
      setDraftText(data.draft ?? '')
    } catch {
      toast.error('Could not generate draft')
    } finally {
      setDraftLoading(false)
    }
  }

  const handleDeleteShift = async (shiftId: string) => {
    await fetch('/api/work/shifts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: shiftId }),
    })
    setShifts(prev => prev.filter(s => s.id !== shiftId))
    toast.success('Shift removed')
  }

  // Group shifts by month
  const grouped = shifts.reduce<Record<string, WorkShift[]>>((acc, s) => {
    const month = s.shift_date.slice(0, 7)
    if (!acc[month]) acc[month] = []
    acc[month].push(s)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#080f0e] pb-24">
      <TopBar title="Shifts" />
      <div className="px-4 py-3 space-y-4 max-w-2xl mx-auto">

        <div className="flex justify-end">
          <Button size="sm" onClick={() => setAddMode(v => !v)}>
            {addMode ? 'Cancel' : '+ Add shift'}
          </Button>
        </div>

        {/* ─── Add shift form ─── */}
        {addMode && (
          <form onSubmit={handleAddShift} className="bg-[#111a18] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest">New Shift</div>

            <div>
              <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest mb-1.5">Job</div>
              <select
                value={newShift.job_id}
                onChange={e => setNewShift(p => ({ ...p, job_id: e.target.value }))}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-teal-600/50 focus:outline-none"
              >
                <option value="">Select job…</option>
                {jobs.filter(j => j.status === 'active').map(j => (
                  <option key={j.id} value={j.id}>{j.employer_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest mb-1.5">Date</div>
                <input
                  type="date"
                  value={newShift.shift_date}
                  onChange={e => setNewShift(p => ({ ...p, shift_date: e.target.value }))}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-teal-600/50 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest mb-1.5">Start</div>
                  <input
                    type="time"
                    value={newShift.start_time}
                    onChange={e => setNewShift(p => ({ ...p, start_time: e.target.value }))}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-teal-600/50 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="font-mono text-[0.6rem] text-white/40 uppercase tracking-widest mb-1.5">End</div>
                  <input
                    type="time"
                    value={newShift.end_time}
                    onChange={e => setNewShift(p => ({ ...p, end_time: e.target.value }))}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-teal-600/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" loading={saving} size="sm">Save shift</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAddMode(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {/* ─── Draft message modal ─── */}
        {draftMode && (
          <div className="bg-[#111a18] border border-purple-500/20 rounded-2xl p-4 space-y-3">
            <div className="font-mono text-[0.6rem] text-purple-400 uppercase tracking-widest">🌟 Nova drafted this for you</div>
            {draftLoading ? (
              <div className="space-y-2">
                <div className="skeleton h-4 rounded w-full" />
                <div className="skeleton h-4 rounded w-4/5" />
              </div>
            ) : (
              <>
                <p className="font-body text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{draftText}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { navigator.clipboard.writeText(draftText); toast.success('Copied!') }}
                    className="font-mono text-[0.6rem] text-teal-400 hover:text-teal-300"
                  >
                    Copy to clipboard
                  </button>
                  <button
                    onClick={() => { setDraftMode(null); setDraftText('') }}
                    className="font-mono text-[0.6rem] text-white/30 hover:text-white/50"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── Shifts by month ─── */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">📅</div>
            <p className="font-display font-bold text-white text-sm">No shifts yet</p>
            <p className="font-mono text-[0.6rem] text-white/30 mt-1">Add your first shift above</p>
          </div>
        ) : (
          Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([month, monthShifts]) => (
            <section key={month}>
              <div className="font-mono text-[0.6rem] text-white/30 uppercase tracking-widest mb-2">
                {new Date(month + '-01').toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
              </div>
              <div className="space-y-2">
                {monthShifts.map(shift => (
                  <div key={shift.id} className="group bg-[#111a18] border border-white/7 hover:border-white/12 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 rounded-full bg-amber-500/60 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-sm text-white">
                          {shift.job?.employer_name ?? 'Shift'}
                        </div>
                        <div className="font-mono text-[0.58rem] text-white/40">
                          {shift.shift_date} · {shift.start_time}–{shift.end_time}
                          {' '}({shift.duration_hours.toFixed(1)}h)
                          {shift.earnings != null && ` · R${shift.earnings}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {shift.has_study_conflict && <span className="text-amber-400 text-xs">⚠️</span>}
                        <span className={cn('font-mono text-[0.55rem] px-2 py-0.5 rounded-full border', STATUS_COLORS[shift.status])}>
                          {shift.status}
                        </span>
                        <button
                          onClick={() => handleDraftRequest(shift.id)}
                          className="opacity-0 group-hover:opacity-100 font-mono text-[0.55rem] text-purple-400 hover:text-purple-300 transition-all"
                          title="Draft shift swap request"
                        >
                          📝
                        </button>
                        <button
                          onClick={() => handleDeleteShift(shift.id)}
                          className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {shift.has_study_conflict && shift.conflict_detail && (
                      <div className="mt-2 ml-5 font-mono text-[0.55rem] text-amber-400/70 leading-snug">
                        Conflict: {shift.conflict_detail}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
