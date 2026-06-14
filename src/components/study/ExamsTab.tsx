'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '@/store'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { type Exam, type Module, type Task, MODULE_COLOURS } from '@/types'
import { fmt, getDaysUntil } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { SupabaseClient } from '@supabase/supabase-js'
import StudyAssistModal from '@/components/study/StudyAssistModal'
import ExamPushBanner from '@/components/study/ExamPushBanner'
import ExamReadinessPanel from '@/components/study/ExamReadinessPanel'

// ─── Form schema ─────────────────────────────────────────────────────────────
const schema = z.object({
  name:       z.string().min(2, 'Name is required'),
  exam_date:  z.string().min(1, 'Date is required'),
  module_id:  z.string().optional(),
  start_time: z.string().optional(),
  venue:      z.string().optional(),
  notes:      z.string().optional(),
})
type FormData = z.infer<typeof schema>

// ─── Ring geometry ────────────────────────────────────────────────────────────
const MAX_DAYS = 30       // normalize countdowns against 30 days
const RING_R   = 17       // SVG circle radius
const RING_C   = 2 * Math.PI * RING_R  // circumference ≈ 106.8

// ─── Urgency helpers ──────────────────────────────────────────────────────────
function urgency(days: number, isPast: boolean): { color: string; label: string } {
  if (isPast)     return { color: 'rgba(255,255,255,0.22)', label: 'DONE' }
  if (days === 0) return { color: '#ff6b6b', label: 'TODAY!' }
  if (days <= 3)  return { color: '#ff6b6b', label: 'CRITICAL' }
  if (days <= 7)  return { color: '#f59e0b', label: 'HIGH' }
  if (days <= 14) return { color: '#a78bfa', label: 'PREPARE' }
  return { color: '#4ecf9e', label: 'ON TRACK' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function RingCountdown({ days, isPast, color }: { days: number; isPast: boolean; color: string }) {
  const pct    = isPast ? 1 : Math.min(1, 1 - Math.max(0, days) / MAX_DAYS)
  const offset = RING_C * (1 - pct)

  return (
    <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
      <svg width={44} height={44} viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={22} cy={22} r={RING_R} fill="none" stroke={`${color}18`} strokeWidth={3.5} />
        {/* Progress arc */}
        <circle
          cx={22} cy={22} r={RING_R} fill="none"
          stroke={color} strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 4px ${color}55)`, transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {/* Centre label */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
          fontSize: isPast ? 11 : days <= 9 ? 12 : 9,
          color, lineHeight: 1,
        }}>
          {isPast ? '✓' : days === 0 ? '!' : days > 99 ? '99+' : days}
        </span>
        {!isPast && days !== 0 && (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 6.5,
            color: `${color}70`, lineHeight: 1, marginTop: 1,
          }}>
            days
          </span>
        )}
      </div>
    </div>
  )
}

function ExamTimeline({ exams }: { exams: Exam[] }) {
  const sorted = [...exams]
    .filter(e => getDaysUntil(e.exam_date) >= 0)
    .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
  if (sorted.length === 0) return null
  const maxDays = Math.max(1, ...sorted.map(e => getDaysUntil(e.exam_date)))

  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.06)', padding: '12px 14px',
    }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 7.5,
        color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase',
        letterSpacing: '0.12em', marginBottom: 14,
      }}>
        Exam Timeline · {sorted.length} upcoming
      </div>

      <div style={{ position: 'relative', height: 58 }}>
        {/* Axis line */}
        <div style={{
          position: 'absolute', top: 5, left: 0, right: 0, height: 1,
          background: 'rgba(255,255,255,0.06)',
        }} />
        {/* NOW marker */}
        <div style={{ position: 'absolute', top: 0, left: 0 }}>
          <div style={{ width: 1.5, height: 12, background: 'rgba(78,207,158,0.65)' }} />
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 6.5,
            color: 'rgba(78,207,158,0.65)', marginTop: 1, whiteSpace: 'nowrap',
          }}>
            NOW
          </div>
        </div>

        {sorted.map(exam => {
          const days   = getDaysUntil(exam.exam_date)
          const pct    = Math.min(96, (days / maxDays) * 100)
          const { color } = urgency(days, false)
          const modCol = exam.module?.color ? MODULE_COLOURS[exam.module.color] : null
          const dotCol = modCol?.dot ?? color

          return (
            <div key={exam.id} style={{
              position: 'absolute', top: 0,
              left: `${pct}%`, transform: 'translateX(-50%)',
              textAlign: 'center',
            }}>
              <div style={{
                width: 9, height: 9, borderRadius: '50%', margin: '0 auto',
                background: dotCol, border: `1.5px solid ${dotCol}`,
                boxShadow: `0 0 8px ${dotCol}55`,
              }} />
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 7,
                color: dotCol, marginTop: 13,
                whiteSpace: 'nowrap', maxWidth: 58,
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {exam.exam_name.split(' ')[0]}
              </div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 6,
                color: `${dotCol}70`, marginTop: 1,
              }}>
                {days === 0 ? 'TODAY' : `${days}d`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  exams:    Exam[]
  modules:  Module[]
  tasks:    Task[]
  userId:   string
  supabase: SupabaseClient
}

// ─── Study plan generator ─────────────────────────────────────────────────────
function buildStudyPlanTasks(
  exam: Exam,
  userId: string,
  daysUntil: number,
): { user_id: string; title: string; due_date: string; module_id: string | null; status: string; priority: string }[] {
  const moduleName = exam.module?.module_name ?? exam.exam_name
  const today      = new Date()
  const tasks      = []
  const totalDays  = Math.min(daysUntil, 21)  // cap at 3 weeks

  if (totalDays < 1) return []

  const dueDate = (daysFromNow: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + daysFromNow)
    return d.toISOString().slice(0, 10)
  }

  if (totalDays <= 3) {
    // Crunch mode
    tasks.push({ title: `${moduleName}: Summarise key concepts & formulas`, due_date: dueDate(0), priority: 'urgent' })
    if (totalDays >= 2) tasks.push({ title: `${moduleName}: Work through past papers`, due_date: dueDate(1), priority: 'urgent' })
    tasks.push({ title: `${moduleName}: Final review — weak areas only`, due_date: dueDate(totalDays - 1), priority: 'urgent' })
  } else {
    // Spread plan
    const PHASES = [
      'Overview & syllabus breakdown',
      'Core theory & definitions',
      'Chapter 1–3 deep study',
      'Chapter 4–6 deep study',
      'Worked examples & problem sets',
      'Past papers — timed conditions',
      'Mark past papers & identify gaps',
      'Weak area focus',
      'Summary notes & mind maps',
    ]

    const phase1End  = Math.max(1, Math.floor(totalDays * 0.15))
    const deepEnd    = Math.max(phase1End + 1, Math.floor(totalDays * 0.7))
    const reviewDays = totalDays - deepEnd

    // Opening days
    for (let d = 0; d < phase1End; d++) {
      tasks.push({ title: `${moduleName}: ${PHASES[d % 2]}`, due_date: dueDate(d), priority: 'high' })
    }
    // Deep study
    const deepCount = deepEnd - phase1End
    for (let d = 0; d < deepCount; d++) {
      const phaseIdx = 2 + (d % 4)
      tasks.push({ title: `${moduleName}: ${PHASES[phaseIdx]}`, due_date: dueDate(phase1End + d), priority: 'medium' })
    }
    // Review phase
    for (let d = 0; d < reviewDays; d++) {
      const phaseIdx = 5 + (d % 4)
      tasks.push({ title: `${moduleName}: ${PHASES[Math.min(phaseIdx, PHASES.length - 1)]}`, due_date: dueDate(deepEnd + d), priority: d === reviewDays - 1 ? 'urgent' : 'high' })
    }
  }

  return tasks.map(t => ({ ...t, user_id: userId, module_id: exam.module_id, status: 'todo' }))
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ExamsTab({ exams, modules, tasks, userId, supabase }: Props) {
  const { addExam, removeExam, addTask } = useAppStore()
  const [view,        setView]        = useState<'list' | 'readiness'>('list')
  const [modalOpen,   setModalOpen]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [planGenerating, setPlanGenerating] = useState<string | null>(null)
  const [assistModal, setAssistModal] = useState<{
    open: boolean; exam: Exam | null; type: 'exam_prep' | 'conflict_check'
  }>({ open: false, exam: null, type: 'exam_prep' })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const upcoming = exams
    .filter(e => getDaysUntil(e.exam_date) >= 0)
    .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
  const past = exams
    .filter(e => getDaysUntil(e.exam_date) < 0)
    .sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime())

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const { data: exam, error } = await supabase
        .from('exams')
        .insert({
          user_id:    userId,
          exam_name:  data.name,
          exam_date:  data.exam_date,
          module_id:  data.module_id || null,
          start_time: data.start_time || null,
          venue:      data.venue || null,
          notes:      data.notes || null,
        })
        .select('*, module:modules(id,module_name,color)')
        .single()
      if (error) throw error
      addExam(exam)
      toast.success('Exam added!')
      setModalOpen(false)
      reset()
    } catch (err) {
      toast.error('Failed to add exam')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const deleteExam = async (id: string) => {
    removeExam(id)
    await supabase.from('exams').delete().eq('id', id)
  }

  const generatePlan = async (exam: Exam) => {
    const days = getDaysUntil(exam.exam_date)
    if (days < 1) { toast.error('Exam is in the past'); return }
    setPlanGenerating(exam.id)
    try {
      const newTasks = buildStudyPlanTasks(exam, userId, days)
      if (!newTasks.length) { toast('Not enough days to generate a plan'); return }
      const { data: inserted, error } = await supabase.from('tasks').insert(newTasks).select('*, module:modules(id,module_name,color)')
      if (error) throw error
      ;(inserted ?? []).forEach(t => addTask(t))
      toast.success(`${newTasks.length} study tasks created for ${exam.exam_name}!`)
    } catch (err) {
      console.error('[ExamsTab] generateStudyPlan:', err)
      toast.error('Could not generate plan')
    } finally {
      setPlanGenerating(null)
    }
  }

  // ── Exam card ────────────────────────────────────────────────────────────
  const ExamCard = ({ exam }: { exam: Exam }) => {
    const days     = getDaysUntil(exam.exam_date)
    const isPast   = days < 0
    const { color, label } = urgency(days, isPast)
    const modColour = exam.module?.color ? MODULE_COLOURS[exam.module.color] : null

    return (
      <div
        className="group"
        style={{
          borderRadius: 14, overflow: 'hidden',
          background: `${color}08`,
          border: `1px solid ${color}25`,
          transition: 'border-color 0.2s',
        }}
      >
        {/* Top accent bar in module colour */}
        <div style={{
          height: 2,
          background: `linear-gradient(90deg, ${modColour?.dot ?? color} 0%, transparent 70%)`,
          opacity: isPast ? 0.3 : 1,
        }} />

        <div style={{ padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {/* Countdown ring */}
          <RingCountdown days={days} isPast={isPast} color={color} />

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13,
                  color: isPast ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.92)',
                  lineHeight: 1.3, overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {exam.exam_name}
                </div>
                {exam.module && (
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
                    color: modColour?.text ?? '#c084fc', marginTop: 1,
                  }}>
                    {exam.module.module_name}
                  </div>
                )}
              </div>
              {/* Status badge */}
              <div style={{
                padding: '2px 8px', borderRadius: 99, flexShrink: 0,
                background: `${color}14`, border: `1px solid ${color}32`,
                fontFamily: 'JetBrains Mono, monospace', fontSize: 7.5, fontWeight: 700,
                color, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                {label}
              </div>
            </div>

            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
              color: 'rgba(255,255,255,0.35)', marginBottom: 8,
            }}>
              {fmt.dateFull(exam.exam_date)}
              {exam.start_time && ` · ${fmt.time(exam.start_time)}`}
              {exam.venue && ` · ${exam.venue}`}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {!isPast && (
                <>
                  <button
                    onClick={e => { e.stopPropagation(); setAssistModal({ open: true, exam, type: 'exam_prep' }) }}
                    style={{
                      padding: '4px 10px', borderRadius: 8,
                      background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)',
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#a78bfa',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    📚 Nova prep
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); generatePlan(exam) }}
                    disabled={planGenerating === exam.id}
                    style={{
                      padding: '4px 10px', borderRadius: 8,
                      background: 'rgba(78,207,158,0.1)', border: '1px solid rgba(78,207,158,0.25)',
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4ecf9e',
                      cursor: planGenerating === exam.id ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      opacity: planGenerating === exam.id ? 0.6 : 1,
                    }}
                  >
                    {planGenerating === exam.id ? '⏳' : '📅'} Plan
                  </button>
                </>
              )}
              <button
                onClick={() => deleteExam(exam.id)}
                className="opacity-0 group-hover:opacity-100 transition-all"
                style={{
                  padding: '4px 8px', borderRadius: 8,
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
                  color: 'rgba(255,255,255,0.28)', cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* View toggle + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{
          display: 'flex', borderRadius: 10, overflow: 'hidden',
          border: '0.5px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
        }}>
          {(['list', 'readiness'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '6px 12px',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
                fontWeight: view === v ? 700 : 400,
                color: view === v ? '#4ecf9e' : 'rgba(255,255,255,0.35)',
                background: view === v ? 'rgba(78,207,158,0.1)' : 'transparent',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}
            >
              {v === 'list' ? 'List' : '% Ready'}
            </button>
          ))}
        </div>

        {view === 'list' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setAssistModal({ open: true, exam: null, type: 'conflict_check' })}
              style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)',
                color: '#f59e0b', padding: '6px 12px', borderRadius: 10,
                cursor: 'pointer', letterSpacing: '0.04em',
              }}
            >
              ⚡ Conflict
            </button>
            <Button size="sm" onClick={() => setModalOpen(true)}>+ Add</Button>
          </div>
        )}
      </div>

      {/* Readiness panel */}
      {view === 'readiness' && <ExamReadinessPanel exams={exams} tasks={tasks} onSwitchToList={() => setView('list')} />}

      {/* List view */}
      {view === 'list' && (
        <>
          <ExamPushBanner />

          {exams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📝</div>
              <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                No exams added yet
              </p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                Add upcoming exams to track countdowns and get AI prep guides.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  marginTop: 16, fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  color: '#4ecf9e', border: '1px solid rgba(78,207,158,0.25)',
                  background: 'rgba(78,207,158,0.1)', padding: '8px 16px',
                  borderRadius: 10, cursor: 'pointer',
                }}
              >
                + Add your first exam →
              </button>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <>
                  {/* Horizontal exam timeline */}
                  <ExamTimeline exams={upcoming} />

                  <div>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
                      color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
                      letterSpacing: '0.1em', marginBottom: 8,
                    }}>
                      Upcoming · {upcoming.length}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {upcoming.map(e => <ExamCard key={e.id} exam={e} />)}
                    </div>
                  </div>
                </>
              )}

              {upcoming.length === 0 && (
                <p style={{
                  textAlign: 'center', fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10, color: 'rgba(255,255,255,0.3)', padding: '12px 0',
                }}>
                  No upcoming exams — you&apos;re done! 🎉
                </p>
              )}

              {past.length > 0 && (
                <div style={{ opacity: 0.55 }}>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
                    color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
                    letterSpacing: '0.1em', marginBottom: 8, marginTop: 8,
                  }}>
                    Past · {past.length}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {past.slice(0, 5).map(e => <ExamCard key={e.id} exam={e} />)}
                  </div>
                </div>
              )}
            </>
          )}

          <StudyAssistModal
            open={assistModal.open}
            onClose={() => setAssistModal({ open: false, exam: null, type: 'exam_prep' })}
            type={assistModal.type}
            examName={assistModal.exam?.exam_name}
            moduleName={assistModal.exam?.module?.name}
            dueDate={assistModal.exam?.exam_date ?? undefined}
          />

          <Modal
            open={modalOpen}
            onClose={() => { setModalOpen(false); reset() }}
            title="Add Exam"
            footer={
              <>
                <Button variant="ghost" onClick={() => { setModalOpen(false); reset() }}>Cancel</Button>
                <Button form="exam-form" type="submit" loading={saving}>Add Exam</Button>
              </>
            }
          >
            <form id="exam-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <Input
                label="Exam name"
                placeholder="e.g. Anatomy Finals"
                error={errors.name?.message}
                {...register('name')}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Date" type="date" error={errors.exam_date?.message} {...register('exam_date')} />
                <Input label="Start time (optional)" type="time" {...register('start_time')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Module (optional)"
                  placeholder="No module"
                  options={modules.map(m => ({ value: m.id, label: m.module_name }))}
                  {...register('module_id')}
                />
                <Input label="Venue (optional)" placeholder="e.g. Main Hall" {...register('venue')} />
              </div>
              <Input label="Notes (optional)" placeholder="Chapters covered, etc." {...register('notes')} />
            </form>
          </Modal>
        </>
      )}
    </div>
  )
}
