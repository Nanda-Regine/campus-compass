'use client'

import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { type SupabaseClient } from '@supabase/supabase-js'

interface ScanResult {
  merchant: string
  total: number
  date: string
  category: string
  items: string[]
  confidence: 'high' | 'medium' | 'low'
}

interface ReceiptScannerProps {
  userId: string
  supabase: SupabaseClient
  onExpenseAdded?: () => void
}

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍲', transport: '🚌', books: '📚', clothing: '👕',
  health: '💊', entertainment: '🎬', accommodation: '🏠', other: '📦',
}

export default function ReceiptScanner({ userId, supabase, onExpenseAdded }: ReceiptScannerProps) {
  const [open, setOpen] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Editable fields after scan
  const [merchant, setMerchant] = useState('')
  const [total, setTotal] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState('other')
  const [description, setDescription] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setResult(null)
    setPreviewUrl(null)
    setMerchant('')
    setTotal('')
    setDate('')
    setCategory('other')
    setDescription('')
  }

  const handleFile = async (file: File) => {
    if (!file) return

    // Show preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setScanning(true)
    setResult(null)

    const form = new FormData()
    form.append('receipt', file)

    try {
      const res = await fetch('/api/budget/receipt', { method: 'POST', body: form })
      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
        setPreviewUrl(null)
        return
      }

      const r: ScanResult = data
      setResult(r)
      // Pre-fill form
      setMerchant(r.merchant)
      setTotal(String(r.total))
      setDate(r.date)
      setCategory(r.category as string)
      setDescription(r.items.length > 0 ? r.items.join(', ') : r.merchant)

      if (r.confidence === 'low') {
        toast('Scan confidence is low — please check the details', { icon: '⚠️' })
      } else {
        toast.success('Receipt scanned — check details before saving')
      }
    } catch {
      toast.error('Scan failed — try again')
      setPreviewUrl(null)
    } finally {
      setScanning(false)
    }
  }

  const handleSave = async () => {
    const amount = parseFloat(total)
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }
    if (!merchant.trim()) { toast.error('Enter a merchant name'); return }

    setSaving(true)
    try {
      const { error } = await supabase.from('expenses').insert({
        user_id: userId,
        amount,
        category,
        description: (description.slice(0, 200) || merchant.slice(0, 100)).trim(),
        expense_date: date || new Date().toISOString().slice(0, 10),
      })
      if (error) throw error
      toast.success(`R${amount.toFixed(2)} added to budget`)
      reset()
      setOpen(false)
      onExpenseAdded?.()
    } catch {
      toast.error('Could not save expense')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 font-display font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
        style={{ background: 'rgba(212,168,71,0.12)', color: '#d4a847', border: '1px solid rgba(212,168,71,0.2)' }}
        aria-label="Scan receipt"
      >
        📸 Scan receipt
      </button>
    )
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#120e0a', border: '1px solid rgba(212,168,71,0.18)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <span aria-hidden="true">📸</span>
          <p className="font-display font-bold text-sm text-white">Scan receipt</p>
        </div>
        <button
          onClick={() => { setOpen(false); reset() }}
          className="font-mono text-xs"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          aria-label="Close scanner"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Upload options */}
        {!result && !scanning && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex flex-col items-center gap-2 py-5 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}
            >
              <span className="text-2xl" aria-hidden="true">📷</span>
              <span className="font-display text-xs">Take photo</span>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center gap-2 py-5 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}
            >
              <span className="text-2xl" aria-hidden="true">🖼️</span>
              <span className="font-display text-xs">Upload image</span>
            </button>
          </div>
        )}

        {/* Hidden inputs */}
        <input
          ref={cameraRef}
          type="file" accept="image/*" capture="environment"
          className="sr-only"
          aria-hidden="true"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
        />
        <input
          ref={fileRef}
          type="file" accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-hidden="true"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
        />

        {/* Scanning state */}
        {scanning && (
          <div className="flex flex-col items-center gap-3 py-6">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Receipt preview" className="h-32 object-contain rounded-xl opacity-50" />
            )}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
              <p className="font-display text-sm text-white">Reading receipt…</p>
            </div>
            <p className="font-mono text-[0.58rem]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Claude Vision is extracting the details
            </p>
          </div>
        )}

        {/* Result + edit form */}
        {result && !scanning && (
          <div className="space-y-3">
            {/* Confidence badge */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: result.confidence === 'high' ? 'rgba(13,148,136,0.1)' : result.confidence === 'medium' ? 'rgba(212,168,71,0.1)' : 'rgba(217,120,84,0.1)',
                border: `1px solid ${result.confidence === 'high' ? 'rgba(13,148,136,0.2)' : result.confidence === 'medium' ? 'rgba(212,168,71,0.2)' : 'rgba(217,120,84,0.2)'}`,
              }}
            >
              <span className="text-sm" aria-hidden="true">
                {result.confidence === 'high' ? '✓' : result.confidence === 'medium' ? '~' : '!'}
              </span>
              <p className="font-mono text-[0.6rem]" style={{ color: result.confidence === 'high' ? '#4db6ac' : result.confidence === 'medium' ? '#d4a847' : '#e8956e' }}>
                {result.confidence === 'high' ? 'High confidence scan' : result.confidence === 'medium' ? 'Medium confidence — check details' : 'Low confidence — review carefully'}
              </p>
            </div>

            {/* Preview image */}
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Scanned receipt" className="w-full h-32 object-contain rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
            )}

            {/* Editable fields */}
            <div className="space-y-2">
              <div>
                <label className="font-mono text-[0.58rem] uppercase tracking-widest block mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Merchant</label>
                <input value={merchant} onChange={e => setMerchant(e.target.value)} maxLength={100} className="w-full rounded-xl px-3 py-2 font-display text-sm text-white outline-none" style={{ background: '#161009', border: '1px solid rgba(255,255,255,0.09)' }} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-mono text-[0.58rem] uppercase tracking-widest block mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Amount (R)</label>
                  <input type="number" value={total} onChange={e => setTotal(e.target.value)} min="0.01" step="0.01" className="w-full rounded-xl px-3 py-2 font-display text-sm text-white outline-none" style={{ background: '#161009', border: '1px solid rgba(255,255,255,0.09)' }} />
                </div>
                <div>
                  <label className="font-mono text-[0.58rem] uppercase tracking-widest block mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-xl px-3 py-2 font-display text-sm text-white outline-none" style={{ background: '#161009', border: '1px solid rgba(255,255,255,0.09)' }} />
                </div>
              </div>

              {/* Category selector */}
              <div>
                <label className="font-mono text-[0.58rem] uppercase tracking-widest block mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(CATEGORY_ICONS).map(([cat, icon]) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={cn('font-display text-xs px-2.5 py-1.5 rounded-xl capitalize transition-all', category === cat ? 'font-bold' : 'opacity-50')}
                      style={{ background: category === cat ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.05)', color: category === cat ? '#4db6ac' : 'rgba(255,255,255,0.5)', border: `1px solid ${category === cat ? 'rgba(13,148,136,0.25)' : 'rgba(255,255,255,0.07)'}` }}
                    >
                      {icon} {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-mono text-[0.58rem] uppercase tracking-widest block mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)} maxLength={200} placeholder="What did you buy?" className="w-full rounded-xl px-3 py-2 font-display text-sm text-white outline-none" style={{ background: '#161009', border: '1px solid rgba(255,255,255,0.09)' }} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="flex-1 font-display text-xs py-2.5 rounded-xl"
                style={{ border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.4)' }}
              >
                Scan again
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 font-display font-bold text-xs py-2.5 rounded-xl disabled:opacity-50"
                style={{ background: '#0d9488', color: '#fff' }}
              >
                {saving ? 'Saving…' : `Save R${parseFloat(total || '0').toFixed(2)}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
