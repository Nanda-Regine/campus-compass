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
import { type Module, type ModuleColour, MODULE_COLOURS } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { SupabaseClient } from '@supabase/supabase-js'

const COLOUR_OPTIONS: ModuleColour[] = ['teal','coral','purple','amber','blue','green']

const schema = z.object({
  name:     z.string().min(2, 'Module name is required'),
  code:     z.string().optional(),
  colour:   z.string(),
  lecturer: z.string().optional(),
  venue:    z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  modules:  Module[]
  userId:   string
  supabase: SupabaseClient
}

export default function ModulesTab({ modules, userId, supabase }: Props) {
  const { addModule, removeModule } = useAppStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [saving,    setSaving]    = useState(false)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { colour: 'teal' },
  })

  const selectedColour = watch('colour') as ModuleColour

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const { data: module, error } = await supabase
        .from('modules')
        .insert({
          user_id:  userId,
          name:     data.name,
          code:     data.code || null,
          colour:   data.colour as ModuleColour,
          lecturer: data.lecturer || null,
          venue:    data.venue || null,
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
    removeModule(id)
    await supabase.from('modules').delete().eq('id', id)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setModalOpen(true)}>+ Add module</Button>
      </div>

      {modules.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-3">📚</div>
          <p className="font-display font-bold text-white text-sm">No modules yet</p>
          <p className="font-mono text-[0.6rem] text-white/30 mt-1">Add your modules to link tasks, timetable and exams.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {modules.map(mod => {
            const col = MODULE_COLOURS[mod.colour]
            return (
              <div
                key={mod.id}
                className="group flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all"
                style={{ background: col.bg, border: `1px solid ${col.dot}25` }}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: col.dot }} />

                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-sm truncate" style={{ color: col.text }}>
                    {mod.name}
                    {mod.code && (
                      <span
                        className="ml-2 font-mono text-[0.55rem] opacity-60 border rounded px-1"
                        style={{ borderColor: col.dot + '40' }}
                      >
                        {mod.code}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {mod.lecturer && (
                      <span className="font-mono text-[0.58rem] opacity-60" style={{ color: col.text }}>
                        {mod.lecturer}
                      </span>
                    )}
                    {mod.venue && (
                      <span className="font-mono text-[0.58rem] opacity-50" style={{ color: col.text }}>
                        · {mod.venue}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteModule(mod.id)}
                  className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all text-xs"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}

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
          </div>

          {/* Colour picker */}
          <div>
            <div className="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-white/40 mb-2">Colour</div>
            <div className="flex gap-2 flex-wrap">
              {COLOUR_OPTIONS.map(c => {
                const col = MODULE_COLOURS[c]
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue('colour', c)}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all border-2',
                      selectedColour === c ? 'scale-110 border-white' : 'border-transparent opacity-70'
                    )}
                    style={{ background: col.dot }}
                    aria-label={c}
                  />
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
