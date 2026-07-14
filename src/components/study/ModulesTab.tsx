'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useForm } from 'react-hook-form'

const CatchUpPlanner = dynamic(() => import('@/components/study/CatchUpPlanner'), { ssr: false })
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '@/store'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { type Module, type ModuleColour, MODULE_COLOURS, type Task, type Exam } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { SupabaseClient } from '@supabase/supabase-js'
import { signals } from '@/store/signals'

const COLOUR_OPTIONS: ModuleColour[] = ['teal', 'coral', 'purple', 'amber', 'blue', 'green']

const COLOUR_LABELS: Record<ModuleColour, string> = {
  teal: 'Teal', coral: 'Coral', purple: 'Purple', amber: 'Amber', blue: 'Blue', green: 'Green',
}

const schema = z.object({
  name:     z.string().min(2, 'Module name is required'),
  code:     z.string().optional(),
  colour:   z.string(),
  credits:  z.string().optional(),
  lecturer: z.string().optional(),
  venue:    z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  modules:  Module[]
  tasks?:   Task[]
  exams?:   Exam[]
  userId:   string
  supabase: SupabaseClient
}

// ─── Attendance localStorage helpers ────────────────────────
interface AttendanceRecord { date: string; attended: boolean }
type AttendanceMap = Record<string, AttendanceRecord[]>
const ATT_KEY = 'varsityos-attendance'
function loadAtt(): AttendanceMap {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(ATT_KEY) || '{}') } catch { return {} }
}
function saveAtt(m: AttendanceMap) { localStorage.setItem(ATT_KEY, JSON.stringify(m)) }

// ─── Unified Module Tools ────────────────────────────────────
// Consolidates WillIPass + AttendanceTracker + CatchUpPlanner into a single
// chip strip — one panel expands at a time, saving vertical space per card.
type ToolPanel = 'pass' | 'attendance' | 'catchup' | null

function ModuleTools({
  moduleId, moduleName, color, supabase, userId,
}: {
  moduleId: string; moduleName: string; color: string
  supabase: SupabaseClient; userId: string
}) {
  const [panel, setPanel] = useState<ToolPanel>(null)
  const toggle = (p: Exclude<ToolPanel, null>) => setPanel(v => v === p ? null : p)

  // ── Attendance state ──
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [syncing, setSyncing] = useState(false)

  const loadRecords = useCallback(() => {
    setRecords(loadAtt()[moduleId] || [])
  }, [moduleId])

  useEffect(() => { loadRecords() }, [loadRecords])

  const today        = new Date().toISOString().split('T')[0]
  const presentCount = records.filter(r => r.attended).length
  const totalCount   = records.length
  const pct          = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : null
  const todayRecord  = records.find(r => r.date === today)

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split('T')[0]
  })

  const markAtt = (attended: boolean) => {
    const all     = loadAtt()
    const current = all[moduleId] || []
    const idx     = current.findIndex(r => r.date === today)
    const updated = idx >= 0
      ? current.map((r, i) => i === idx ? { ...r, attended } : r)
      : [...current, { date: today, attended }]
    const sorted  = [...updated].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 90)
    all[moduleId] = sorted
    saveAtt(all)
    setRecords(sorted)
    signals.emit({
      type: 'attendance_marked',
      payload: { moduleId, attended, moduleCode: moduleName },
    })

    // Sync to Supabase using the live schema (date/status). The present/absent
    // toggle maps onto the status enum so this UI stays consistent with AttendanceTab.
    setSyncing(true)
    supabase.from('attendance_records')
      .upsert(
        { user_id: userId, module_id: moduleId, date: today, status: attended ? 'present' : 'absent' },
        { onConflict: 'user_id,module_id,date' }
      )
      .then(({ error }) => {
        setSyncing(false)
        // Previously the error was swallowed: localStorage said "marked" while the
        // DB never got it. Surface the failure so the student knows to retry online.
        if (error) toast.error('Saved on this device, but could not sync attendance — check your connection.')
      })
  }

  // ── Will I Pass state ──
  const [yearMark, setYearMark] = useState(55)
  const [ymWeight, setYmWeight] = useState(60)
  const examWeight = 100 - ymWeight
  const required   = (50 - yearMark * (ymWeight / 100)) / (examWeight / 100)
  const verdict: 'pass' | 'fail' | 'need' =
    required <= 0 ? 'pass' : required > 100 ? 'fail' : 'need'

  const TOOLS = [
    { id: 'pass' as const,       icon: '🎯', label: 'Pass calc',                                    warn: false },
    { id: 'attendance' as const, icon: '📋', label: pct !== null ? `Att. ${pct}%` : 'Attendance',  warn: pct !== null && pct < 80 },
    { id: 'catchup' as const,    icon: '🚀', label: 'Catch up',                                     warn: false },
  ]

  return (
    <div style={{ marginTop: 10 }}>
      {/* ── Chip strip ── */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {TOOLS.map(t => (
          <button
            key={t.id}
            onClick={() => toggle(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 9px', borderRadius: 20,
              background: panel === t.id ? `${color}18` : 'transparent',
              border: `1px solid ${panel === t.id ? color + '50' : color + '22'}`,
              color: panel === t.id ? color : `${color}99`,
              fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {t.icon} {t.label}
            {t.warn && <span style={{ color: '#EF4444', marginLeft: 2, fontSize: '0.62rem' }}>⚠</span>}
          </button>
        ))}
      </div>

      {/* ── Pass calculator panel ── */}
      {panel === 'pass' && (
        <div style={{ marginTop: 10, padding: '12px 14px', background: 'rgba(0,0,0,0.18)', border: `1px solid ${color}25`, borderRadius: 10 }}>
          <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color, marginBottom: 10, letterSpacing: '0.07em' }}>
            WILL I PASS?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)' }}>Year mark</span>
                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color }}>{yearMark}%</span>
              </div>
              <input type="range" min={0} max={100} value={yearMark}
                onChange={e => setYearMark(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: color }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)' }}>Weighting</span>
                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color }}>{ymWeight}% YM / {examWeight}% Exam</span>
              </div>
              <input type="range" min={40} max={70} step={5} value={ymWeight}
                onChange={e => setYmWeight(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: color }} />
            </div>
            <div style={{
              padding: '10px 12px', borderRadius: 8, textAlign: 'center',
              background: verdict === 'pass' ? 'rgba(52,211,153,0.12)' : verdict === 'fail' ? 'rgba(239,68,68,0.12)' : `${color}12`,
              border: `1px solid ${verdict === 'pass' ? 'rgba(52,211,153,0.3)' : verdict === 'fail' ? 'rgba(239,68,68,0.3)' : `${color}30`}`,
            }}>
              {verdict === 'pass' && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--teal)' }}>✓ You will pass — even 0% on exam!</div>}
              {verdict === 'fail' && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#EF4444' }}>✗ Cannot pass — year mark too low</div>}
              {verdict === 'need' && <>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color }}>{Math.ceil(required)}%</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>needed on final exam to pass</div>
              </>}
            </div>
          </div>
        </div>
      )}

      {/* ── Attendance tracker panel ── */}
      {panel === 'attendance' && (
        <div style={{ marginTop: 10, padding: '12px 14px', background: 'rgba(0,0,0,0.18)', border: `1px solid ${color}25`, borderRadius: 10 }}>
          <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color, marginBottom: 10, letterSpacing: '0.07em', display: 'flex', justifyContent: 'space-between' }}>
            <span>ATTENDANCE{pct !== null ? ` · ${pct}%` : ''}</span>
            <span style={{ display: 'flex', gap: 8 }}>
              {pct !== null && pct < 80 && <span style={{ color: '#EF4444' }}>⚠ Below 80%</span>}
              {syncing && <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>syncing…</span>}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <button onClick={() => markAtt(true)} style={{
              flex: 1, padding: '7px 0', borderRadius: 7, cursor: 'pointer',
              background: todayRecord?.attended ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.06)',
              border: `1px solid ${todayRecord?.attended ? 'rgba(52,211,153,0.4)' : 'rgba(52,211,153,0.2)'}`,
              color: 'var(--teal)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
            }}>
              {todayRecord?.attended ? '✓ Attended today' : '✓ Mark present'}
            </button>
            <button onClick={() => markAtt(false)} style={{
              flex: 1, padding: '7px 0', borderRadius: 7, cursor: 'pointer',
              background: todayRecord && !todayRecord.attended ? 'rgba(239,68,68,0.12)' : 'transparent',
              border: `1px solid ${todayRecord && !todayRecord.attended ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: todayRecord && !todayRecord.attended ? '#EF4444' : 'rgba(255,255,255,0.3)',
              fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
            }}>
              ✗ Mark absent
            </button>
          </div>
          <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
            {last7.map(d => {
              const r = records.find(x => x.date === d)
              return (
                <div key={d} title={d} style={{
                  flex: 1, height: 18, borderRadius: 4,
                  background: r?.attended ? 'rgba(52,211,153,0.5)' : r ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${r?.attended ? 'rgba(52,211,153,0.3)' : r ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
                }} />
              )
            })}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between' }}>
            <span>6 days ago</span><span>today</span>
          </div>
        </div>
      )}

      {/* ── Catch-up planner panel ── */}
      {panel === 'catchup' && (
        <div style={{ marginTop: 10 }}>
          <CatchUpPlanner moduleName={moduleName} moduleColor={color} onClose={() => setPanel(null)} />
        </div>
      )}
    </div>
  )
}

// ─── ModulesTab ──────────────────────────────────────────────
export default function ModulesTab({ modules, tasks = [], exams = [], userId, supabase }: Props) {
  const { addModule, removeModule } = useAppStore()
  const [modalOpen, setModalOpen]   = useState(false)
  const [saving, setSaving]         = useState(false)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { colour: 'teal', credits: '16' },
  })

  const selectedColour = watch('colour') as ModuleColour

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const { data: module, error } = await supabase
        .from('modules')
        .insert({
          user_id:       userId,
          module_name:   data.name,
          module_code:   data.code || '',
          color:         data.colour as ModuleColour,
          lecturer_name: data.lecturer || null,
          venue:         data.venue || null,
          credits:       parseInt(data.credits || '16') || 16,
        })
        .select()
        .single()

      if (error) throw error
      addModule(module)
      toast.success('Module added!')
      setModalOpen(false)
      reset()
    } catch (err) {
      toast.error('Failed to add module')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const deleteModule = async (id: string) => {
    if (!window.confirm('Delete this module? Its linked tasks and exams may be removed too. This cannot be undone.')) return
    const snapshot = modules.find(m => m.id === id)
    removeModule(id)
    const { error } = await supabase.from('modules').delete().eq('id', id)
    if (error && snapshot) {
      addModule(snapshot) // roll back the optimistic removal
      toast.error('Could not delete the module — please try again.')
    }
  }

  function moduleTaskCount(id: string) {
    return tasks.filter(t => t.module_id === id && t.status !== 'done').length
  }
  function moduleExamCount(id: string) {
    const now = new Date().toISOString().split('T')[0]
    return exams.filter(e => e.module_id === id && e.exam_date >= now).length
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display font-bold text-white text-base">
            {modules.length > 0 ? `${modules.length} module${modules.length !== 1 ? 's' : ''}` : 'No modules'}
          </div>
          <div className="font-mono text-[0.62rem] text-white/78">
            Link tasks, exams and timetable to modules
          </div>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>+ Add module</Button>
      </div>

      {modules.length === 0 ? (
        <div className="text-center py-14 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl">
          <div className="text-4xl mb-3">📚</div>
          <p className="font-display font-bold text-white text-sm">No modules yet</p>
          <p className="font-mono text-[0.6rem] text-white/78 mt-1 px-8">
            Add your modules to connect tasks, timetable slots and exams in one place.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-5 font-mono text-[0.65rem] text-teal-400 border border-teal-600/25 bg-teal-600/10 hover:bg-teal-600/20 px-5 py-2 rounded-xl transition-all"
          >
            + Add your first module →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map(mod => {
            const col      = MODULE_COLOURS[mod.color] ?? MODULE_COLOURS.teal
            const taskCnt  = moduleTaskCount(mod.id)
            const examCnt  = moduleExamCount(mod.id)

            return (
              <div
                key={mod.id}
                className="group relative flex items-stretch rounded-2xl overflow-hidden border transition-all hover:scale-[1.005]"
                style={{ borderColor: col.dot + '25', background: col.bg }}
              >
                {/* Left accent bar */}
                <div className="w-1 flex-shrink-0" style={{ background: `linear-gradient(180deg, ${col.dot}, ${col.dot}66)` }} />

                {/* Main content */}
                <div className="flex-1 min-w-0 px-4 py-4">
                  {/* Name + code + delete */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-sm" style={{ color: col.text }}>
                          {mod.module_name}
                        </span>
                        {mod.module_code && (
                          <span className="font-mono text-[0.65rem] px-1.5 py-0.5 rounded border"
                            style={{ color: col.dot, borderColor: col.dot + '40', background: col.dot + '10' }}>
                            {mod.module_code}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {mod.credits && mod.credits > 0 && (
                          <span className="font-mono text-[0.62rem] opacity-55" style={{ color: col.text }}>{mod.credits} credits</span>
                        )}
                        {mod.lecturer_name && (
                          <>
                            {mod.credits && mod.credits > 0 && <span className="opacity-20 text-xs" style={{ color: col.text }}>·</span>}
                            <span className="font-mono text-[0.62rem] opacity-55" style={{ color: col.text }}>{mod.lecturer_name}</span>
                          </>
                        )}
                        {mod.venue && (
                          <>
                            <span className="opacity-20 text-xs" style={{ color: col.text }}>·</span>
                            <span className="font-mono text-[0.62rem] opacity-50" style={{ color: col.text }}>{mod.venue}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteModule(mod.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all text-white/72 hover:text-red-400 hover:bg-red-400/10"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  {/* Unified tool strip */}
                  <ModuleTools
                    moduleId={mod.id}
                    moduleName={mod.module_name}
                    color={col.dot}
                    supabase={supabase}
                    userId={userId}
                  />

                  {/* Task / exam badges */}
                  {(taskCnt > 0 || examCnt > 0) && (
                    <div className="flex items-center gap-2 mt-2.5">
                      {taskCnt > 0 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                          style={{ background: col.dot + '15', border: `0.5px solid ${col.dot}30` }}>
                          <span className="text-[0.62rem]">✓</span>
                          <span className="font-mono text-[0.65rem] font-bold" style={{ color: col.dot }}>
                            {taskCnt} task{taskCnt !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      {examCnt > 0 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(245,158,11,0.1)', border: '0.5px solid rgba(245,158,11,0.25)' }}>
                          <span className="text-[0.62rem]">◉</span>
                          <span className="font-mono text-[0.65rem] font-bold text-amber-400">
                            {examCnt} exam{examCnt !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Module Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); reset() }}
        title="Add Module"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalOpen(false); reset() }}>Cancel</Button>
            <Button form="module-form" type="submit" loading={saving}>Add Module</Button>
          </>
        }
      >
        <form id="module-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input
            label="Module name"
            placeholder="e.g. Introduction to Psychology"
            error={errors.name?.message}
            {...register('name')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Module code (optional)" placeholder="e.g. PSY101" {...register('code')} />
            <Input label="Credits (optional)" type="number" placeholder="16" {...register('credits')} />
          </div>
          <div>
            <div className="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-white/82 mb-3">Colour</div>
            <div className="flex gap-3 flex-wrap">
              {COLOUR_OPTIONS.map(c => {
                const col      = MODULE_COLOURS[c]
                const selected = selectedColour === c
                return (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Select ${COLOUR_LABELS[c]} theme`}
                    aria-pressed={selected}
                    onClick={() => setValue('colour', c)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs',
                      selected ? 'border-white/30' : 'border-white/8 hover:border-white/15'
                    )}
                    style={{ background: selected ? col.bg : 'rgba(255,255,255,0.03)' }}
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: col.dot }} />
                    <span style={{ color: selected ? col.text : 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}>
                      {COLOUR_LABELS[c]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Lecturer (optional)" placeholder="e.g. Dr. Nkosi" {...register('lecturer')} />
            <Input label="Venue (optional)" placeholder="e.g. Physics Lab" {...register('venue')} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
