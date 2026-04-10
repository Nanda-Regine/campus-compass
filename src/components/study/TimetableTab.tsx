'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAppStore } from '@/store'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import { MODULE_COLOURS, WEEKDAYS, TIMETABLE_HOURS, type Module, type TimetableEntry, DAYS_OF_WEEK } from '@/types'
import { cn, fmt } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { SupabaseClient } from '@supabase/supabase-js'

interface Props {
  timetable: TimetableEntry[]
  modules:   Module[]
  userId:    string
  supabase:  SupabaseClient
}

export default function TimetableTab({ timetable, modules, userId, supabase }: Props) {
  const { addTimetableEntry, removeTimetableEntry } = useAppStore()
  const [modalOpen, setModalOpen]   = useState(false)
  const [saving,    setSaving]      = useState(false)
  const [prefill,   setPrefill]     = useState<{ day: string; time: string } | null>(null)

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { module_id: '', day_of_week: 'Monday', start_time: '08:00', end_time: '', venue: '' },
  })

  const openModal = (day?: string, time?: string) => {
    if (day && time) {
      setPrefill({ day, time })
      setValue('day_of_week', day)
      setValue('start_time', time)
    }
    setModalOpen(true)
  }

  const onSubmit = async (data: Record<string, string>) => {
    setSaving(true)
    try {
      const { data: entry, error } = await supabase
        .from('timetable_slots')
        .insert({
          user_id:     userId,
          module_id:   data.module_id || null,
          day_of_week: data.day_of_week,
          start_time:  data.start_time,
          end_time:    data.end_time || null,
          venue:       data.venue || null,
        })
        .select('*, module:modules(id,module_name,color)')
        .single()

      if (error) throw error
      addTimetableEntry(entry)
      toast.success('Class added!')
      setModalOpen(false)
      reset()
      setPrefill(null)
    } catch (err) {
      toast.error('Failed to add class')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const deleteEntry = async (id: string) => {
    removeTimetableEntry(id)
    await supabase.from('timetable_slots').delete().eq('id', id)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openModal()}>+ Add class</Button>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: '44px repeat(5, minmax(70px, 1fr))', minWidth: '440px' }}
        >
          {/* Header */}
          <div />
          {WEEKDAYS.map(day => {
            const isToday = DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] === day
            return (
              <div
                key={day}
                className={cn(
                  'font-mono text-[0.56rem] uppercase tracking-widest text-center pb-2',
                  isToday ? 'text-teal-400 font-bold' : 'text-white/30'
                )}
              >
                {day.slice(0,3)}
                {isToday && <span className="block w-1 h-1 bg-teal-400 rounded-full mx-auto mt-0.5" />}
              </div>
            )
          })}

          {/* Time rows */}
          {TIMETABLE_HOURS.map(hour => (
            <>
              <div key={`t-${hour}`} className="font-mono text-[0.52rem] text-white/25 text-right pr-2 pt-1.5">
                {fmt.time(hour)}
              </div>
              {WEEKDAYS.map(day => {
                const entry = timetable.find(e => e.day_of_week === day && e.start_time === hour + ':00')
                           ?? timetable.find(e => e.day_of_week === day && e.start_time === hour)
                const mod = entry?.module || modules.find(m => m.id === entry?.module_id)
                const col = mod?.color ? MODULE_COLOURS[mod.color] : null

                if (entry && col) {
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="rounded-lg p-1.5 min-h-[44px] relative group"
                      style={{ background: col.bg, border: `1px solid ${col.dot}30` }}
                    >
                      <div className="font-mono text-[0.52rem] leading-snug" style={{ color: col.text }}>
                        {mod?.module_name?.split(' ').slice(0,3).join(' ') ?? 'Class'}
                      </div>
                      {entry.venue && (
                        <div className="font-mono text-[0.48rem] opacity-60 mt-0.5" style={{ color: col.text }}>
                          {entry.venue}
                        </div>
                      )}
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 items-center justify-center text-[0.5rem] hidden group-hover:flex rounded"
                        style={{ background: 'rgba(0,0,0,0.4)', color: col.text }}
                      >
                        ✕
                      </button>
                    </div>
                  )
                }

                return (
                  <button
                    key={`${day}-${hour}`}
                    onClick={() => openModal(day, hour + ':00')}
                    className="rounded-lg min-h-[44px] border border-dashed border-white/8 hover:border-teal-600/40 hover:bg-teal-600/5 transition-all"
                  />
                )
              })}
            </>
          ))}
        </div>
      </div>

      {timetable.length === 0 && (
        <div className="text-center py-12">
          <div className="text-3xl mb-2">🗓️</div>
          <p className="font-display font-bold text-white text-sm">Your timetable is empty</p>
          <p className="font-mono text-[0.6rem] text-white/30 mt-1">
            Tap a time slot or use &apos;+ Add class&apos; to build your weekly schedule.
          </p>
        </div>
      )}

      {modules.length === 0 && (
        <p className="text-center font-mono text-[0.6rem] text-white/30 pt-2">
          Add modules first to assign them to timetable slots.
        </p>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); reset(); setPrefill(null) }}
        title="Add Class"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalOpen(false); reset(); setPrefill(null) }}>Cancel</Button>
            <Button form="class-form" type="submit" loading={saving}>Add Class</Button>
          </>
        }
      >
        <form id="class-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Select
            label="Module"
            placeholder="Select module…"
            options={modules.map(m => ({ value: m.id, label: m.module_name }))}
            {...register('module_id')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Day"
              options={WEEKDAYS.map(d => ({ value: d, label: d }))}
              {...register('day_of_week')}
            />
            <Select
              label="Start time"
              options={TIMETABLE_HOURS.map(h => ({ value: h + ':00', label: fmt.time(h + ':00') }))}
              {...register('start_time')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="End time (optional)"
              placeholder="No end time"
              options={TIMETABLE_HOURS.map(h => ({ value: h + ':00', label: fmt.time(h + ':00') }))}
              {...register('end_time')}
            />
            <Input label="Venue (optional)" placeholder="e.g. LS1A" {...register('venue')} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
