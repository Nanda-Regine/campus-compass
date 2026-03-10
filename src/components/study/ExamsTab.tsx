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
import { type Exam, type Module, MODULE_COLOURS } from '@/types'
import { cn, fmt, getDaysUntil } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { SupabaseClient } from '@supabase/supabase-js'
import StudyAssistModal from '@/components/study/StudyAssistModal'

const schema = z.object({
  name:       z.string().min(2, 'Name is required'),
  exam_date:  z.string().min(1, 'Date is required'),
  module_id:  z.string().optional(),
  start_time: z.string().optional(),
  venue:      z.string().optional(),
  notes:      z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  exams:    Exam[]
  modules:  Module[]
  userId:   string
  supabase: SupabaseClient
}

export default function ExamsTab({ exams, modules, userId, supabase }: Props) {
  const { addExam, removeExam } = useAppStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [assistModal, setAssistModal] = useState<{ open: boolean; exam: Exam | null; type: 'exam_prep' | 'conflict_check' }>({ open: false, exam: null, type: 'exam_prep' })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const upcoming = exams.filter(e => new Date(e.exam_date) >= new Date())
  const past     = exams.filter(e => new Date(e.exam_date) < new Date())

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const { data: exam, error } = await supabase
        .from('exams')
        .insert({
          user_id:    userId,
          name:       data.name,
          exam_date:  data.exam_date,
          module_id:  data.module_id || null,
          start_time: data.start_time || null,
          venue:      data.venue || null,
          notes:      data.notes || null,
        })
        .select('*, module:modules(id,name,colour)')
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

  const ExamCard = ({ exam }: { exam: Exam }) => {
    const days = getDaysUntil(exam.exam_date)
    const isPast = days < 0
    const modColour = exam.module?.colour ? MODULE_COLOURS[exam.module.colour] : null

    const urgencyStyle =
      isPast          ? { bg: 'bg-white/3',             border: 'border-white/7',         count: 'text-white/30' }
      : days === 0    ? { bg: 'bg-orange-500/8',        border: 'border-orange-500/20',   count: 'text-orange-300' }
      : days <= 3     ? { bg: 'bg-red-500/8',           border: 'border-red-500/20',      count: 'text-red-300' }
      : days <= 7     ? { bg: 'bg-amber-500/8',         border: 'border-amber-500/20',    count: 'text-amber-300' }
      :                 { bg: 'bg-purple-500/8',        border: 'border-purple-500/20',   count: 'text-purple-300' }

    return (
      <div className={cn('group relative rounded-2xl p-4 border transition-all', urgencyStyle.bg, urgencyStyle.border)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-sm text-white truncate">{exam.name}</div>
            {exam.module && (
              <div className="font-mono text-[0.58rem] mt-0.5" style={{ color: modColour?.text ?? '#c084fc' }}>
                {exam.module.name}
              </div>
            )}
            <div className="font-mono text-[0.6rem] text-white/40 mt-1.5">
              {fmt.dateFull(exam.exam_date)}
              {exam.start_time && ` · ${fmt.time(exam.start_time)}`}
              {exam.venue && ` · ${exam.venue}`}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className={cn('font-display font-black text-2xl leading-none', urgencyStyle.count)}>
              {isPast ? '✓' : days === 0 ? '!' : days}
            </div>
            <div className="font-mono text-[0.52rem] text-white/30 uppercase">
              {isPast ? 'done' : days === 0 ? 'today' : 'days'}
            </div>
          </div>
        </div>

        <button
          onClick={e => { e.stopPropagation(); setAssistModal({ open: true, exam, type: 'exam_prep' }) }}
          className="absolute top-3 right-12 opacity-0 group-hover:opacity-100 text-purple-400/60 hover:text-purple-400 transition-all text-xs"
          title="Exam Prep Guide"
        >
          📚
        </button>
        <button
          onClick={() => deleteExam(exam.id)}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all text-xs"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setAssistModal({ open: true, exam: null, type: 'conflict_check' })}
          className="font-mono text-[0.62rem] bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 px-3 py-1.5 rounded-xl transition-all"
        >
          ⚡ Conflict check
        </button>
        <Button size="sm" onClick={() => setModalOpen(true)}>+ Add exam</Button>
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-3">📝</div>
          <p className="font-display font-bold text-white text-sm">No exams yet</p>
          <p className="font-mono text-[0.6rem] text-white/30 mt-1">Add your exam dates to start the countdown.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <div className="font-mono text-[0.58rem] text-white/30 uppercase tracking-widest mb-2">
                Upcoming ({upcoming.length})
              </div>
              <div className="space-y-2">
                {upcoming.map(e => <ExamCard key={e.id} exam={e} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <div className="font-mono text-[0.58rem] text-white/30 uppercase tracking-widest mb-2 mt-4">
                Past ({past.length})
              </div>
              <div className="space-y-2 opacity-60">
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
        examName={assistModal.exam?.name}
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
          <Input label="Exam name" placeholder="e.g. Anatomy Finals" error={errors.name?.message} {...register('name')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" error={errors.exam_date?.message} {...register('exam_date')} />
            <Input label="Start time (optional)" type="time" {...register('start_time')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Module (optional)"
              placeholder="No module"
              options={modules.map(m => ({ value: m.id, label: m.name }))}
              {...register('module_id')}
            />
            <Input label="Venue (optional)" placeholder="e.g. Main Hall" {...register('venue')} />
          </div>
          <Input label="Notes (optional)" placeholder="Chapters covered, etc." {...register('notes')} />
        </form>
      </Modal>
    </div>
  )
}
