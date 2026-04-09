'use client'
import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'general',         label: '💬 General' },
  { value: 'bug',             label: '🐛 Bug' },
  { value: 'feature_request', label: '✨ Feature request' },
  { value: 'nova_feedback',   label: '🌟 Nova feedback' },
  { value: 'budget',          label: '💰 Budget' },
  { value: 'study',           label: '📚 Study' },
  { value: 'other',           label: '📝 Other' },
]

const GOOGLE_REVIEW_URL = 'https://g.page/r/CdPIXBcTmJE6EAI/review'

interface Props {
  open: boolean
  onClose: () => void
}

export function FeedbackModal({ open, onClose }: Props) {
  const [rating,   setRating]   = useState(0)
  const [category, setCategory] = useState('general')
  const [message,  setMessage]  = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [showReviewPrompt, setShowReviewPrompt] = useState(false)

  const submit = async () => {
    if (!rating || !message.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, category, message }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
      if (rating >= 4) {
        setShowReviewPrompt(true)
      } else {
        toast.success('Thank you — your feedback goes directly to the builder.')
        onClose()
      }
    } catch {
      toast.error('Failed to send feedback — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setRating(0); setCategory('general'); setMessage(''); setSubmitted(false); setShowReviewPrompt(false)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={showReviewPrompt ? 'You\'re helping students find VarsityOS' : 'Give feedback'}
      footer={
        showReviewPrompt ? (
          <div className="flex gap-3 w-full">
            <Button variant="ghost" onClick={handleClose} className="flex-1">Maybe later</Button>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              className="flex-1 flex items-center justify-center gap-2 font-display font-bold text-sm bg-amber-500/15 text-amber-400 border border-amber-500/25 px-5 py-2.5 rounded-xl hover:bg-amber-500/25 transition-all"
            >
              ⭐ Leave a Google Review
            </a>
          </div>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button onClick={submit} loading={submitting} disabled={!rating || !message.trim()}>
              Send feedback
            </Button>
          </>
        )
      }
    >
      {showReviewPrompt ? (
        <div className="text-center py-2">
          <div className="text-4xl mb-3">⭐</div>
          <p className="font-display font-bold text-white mb-2">A quick Google review makes a huge difference</p>
          <p className="font-mono text-xs text-white/50 leading-relaxed">
            Students searching for a budgeting or study app find VarsityOS through reviews.
            Your experience helps the next student who&apos;s struggling make the right call.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Star rating */}
          <div>
            <label className="font-mono text-[0.62rem] text-white/50 uppercase tracking-wide mb-2 block">
              How are you finding VarsityOS?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={cn(
                    'text-3xl transition-all hover:scale-110',
                    rating >= star ? 'text-amber-400' : 'text-white/15'
                  )}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="font-mono text-[0.62rem] text-white/50 uppercase tracking-wide mb-2 block">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    'font-mono text-[0.58rem] px-3 py-1.5 rounded-full border transition-all',
                    category === c.value
                      ? 'bg-teal-600/20 border-teal-500/40 text-teal-400'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="font-mono text-[0.62rem] text-white/50 uppercase tracking-wide mb-2 block">
              Your feedback
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Tell us what's working, what's broken, or what you wish existed."
              rows={4}
              maxLength={1000}
              className="w-full bg-[#111a18] border border-white/10 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 resize-none outline-none transition-all font-body"
            />
            <div className="text-right font-mono text-[0.55rem] text-white/20 mt-1">
              {message.length}/1000
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
