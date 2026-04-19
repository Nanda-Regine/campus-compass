'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { type JobType, type PayType, JOB_TYPE_LABELS } from '@/types'
import toast from 'react-hot-toast'

const JOB_TYPES: JobType[] = ['retail','food_service','tutoring','call_centre','campus_job','freelance','gig','other']
const PAY_TYPES: { value: PayType; label: string }[] = [
  { value: 'hourly',   label: 'Hourly (pay per hour)' },
  { value: 'shift',    label: 'Per shift (fixed per shift)' },
  { value: 'monthly',  label: 'Monthly salary' },
  { value: 'per_gig',  label: 'Per gig (variable)' },
]

export default function AddJobPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    employer_name: '',
    job_type: 'retail' as JobType,
    role_title: '',
    location: '',
    is_on_campus: false,
    is_remote: false,
    pay_type: 'hourly' as PayType,
    pay_rate: '',
    contracted_hours_per_week: '',
    max_comfortable_hours: '20',
    start_date: '',
    block_exam_periods: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.employer_name.trim()) {
      toast.error('Employer name is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/work/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employer_name: form.employer_name,
          job_type: form.job_type,
          role_title: form.role_title || null,
          location: form.location || null,
          is_on_campus: form.is_on_campus,
          is_remote: form.is_remote,
          pay_type: form.pay_type,
          pay_rate: form.pay_rate ? parseFloat(form.pay_rate) : null,
          contracted_hours_per_week: form.contracted_hours_per_week ? parseInt(form.contracted_hours_per_week) : null,
          max_comfortable_hours: parseInt(form.max_comfortable_hours) || 20,
          start_date: form.start_date || null,
          block_exam_periods: form.block_exam_periods,
          status: 'active',
        }),
      })
      if (!res.ok) throw new Error('Failed to add job')
      toast.success('Job added!')
      router.push('/dashboard/work')
    } catch {
      toast.error('Failed to add job')
    } finally {
      setSaving(false)
    }
  }

  const set = (key: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }))

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-24">
      <TopBar title="Add Job" />
      <div className="px-4 py-3 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">

          <Input
            label="Employer name"
            placeholder="e.g. Woolworths Food, SPAR, UCT Library"
            value={form.employer_name}
            onChange={e => set('employer_name', e.target.value)}
            required
          />

          <div>
            <div className="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-white/40 mb-2">Job type</div>
            <div className="grid grid-cols-2 gap-2">
              {JOB_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => set('job_type', type)}
                  className={`text-left px-3 py-2.5 rounded-xl border transition-all text-sm ${
                    form.job_type === type
                      ? 'bg-teal-600/15 border-teal-600/40 text-teal-300'
                      : 'bg-white/3 border-white/8 text-white/50 hover:border-white/20'
                  }`}
                >
                  {JOB_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Role / position (optional)"
            placeholder="e.g. Cashier, Barista, Peer Tutor"
            value={form.role_title}
            onChange={e => set('role_title', e.target.value)}
          />

          <Input
            label="Location (optional)"
            placeholder="e.g. Rondebosch Pick n Pay, Online"
            value={form.location}
            onChange={e => set('location', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_on_campus}
                onChange={e => set('is_on_campus', e.target.checked)}
                className="w-4 h-4 accent-teal-500"
              />
              <span className="font-mono text-[0.6rem] text-white/50 uppercase">On campus</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_remote}
                onChange={e => set('is_remote', e.target.checked)}
                className="w-4 h-4 accent-teal-500"
              />
              <span className="font-mono text-[0.6rem] text-white/50 uppercase">Remote</span>
            </label>
          </div>

          <Select
            label="How are you paid?"
            value={form.pay_type}
            onChange={e => set('pay_type', e.target.value)}
            options={PAY_TYPES}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Pay rate (R${form.pay_type === 'hourly' ? '/hr' : form.pay_type === 'shift' ? '/shift' : '/mo'})`}
              type="number"
              placeholder="e.g. 35"
              value={form.pay_rate}
              onChange={e => set('pay_rate', e.target.value)}
            />
            <Input
              label="Hours/week (typical)"
              type="number"
              placeholder="e.g. 12"
              value={form.contracted_hours_per_week}
              onChange={e => set('contracted_hours_per_week', e.target.value)}
            />
          </div>

          <Input
            label="My max comfortable hours/week"
            type="number"
            placeholder="20"
            value={form.max_comfortable_hours}
            onChange={e => set('max_comfortable_hours', e.target.value)}
          />

          <Input
            label="Start date (optional)"
            type="date"
            value={form.start_date}
            onChange={e => set('start_date', e.target.value)}
          />

          <label className="flex items-start gap-3 cursor-pointer bg-[var(--bg-surface)] border border-white/7 rounded-2xl p-4">
            <input
              type="checkbox"
              checked={form.block_exam_periods}
              onChange={e => set('block_exam_periods', e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-teal-500 flex-shrink-0"
            />
            <div>
              <div className="font-display font-bold text-white text-sm">Protect exam periods</div>
              <div className="font-mono text-[0.58rem] text-white/35 mt-0.5">
                Nova will flag shifts within 3 days of an exam and remind you to request time off
              </div>
            </div>
          </label>

          <Button type="submit" loading={saving} className="w-full">
            Add Job
          </Button>

        </form>
      </div>
    </div>
  )
}
