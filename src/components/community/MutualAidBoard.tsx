'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { dispatchXP } from '@/lib/xp-engine'

// ── Types ─────────────────────────────────────────────────────────────────────
type AidCategory =
  | 'textbook'
  | 'notes'
  | 'food'
  | 'transport'
  | 'tutoring'
  | 'accommodation'
  | 'other'

type AidType = 'offer' | 'request'
type TypeFilter = 'all' | AidType
type Tab = 'browse' | 'post'

interface MutualAidRequest {
  id: string
  user_id: string
  title: string
  description: string
  request_type: AidType
  category: AidCategory
  institution: string | null
  is_anonymous: boolean
  is_fulfilled: boolean
  expiry_date: string | null
  created_at: string
}

interface PostForm {
  title: string
  description: string
  type: AidType
  category: AidCategory
  is_anonymous: boolean
  expires_at: string
}

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<AidCategory, { label: string; icon: string }> = {
  textbook:      { label: 'Textbook',      icon: '📚' },
  notes:         { label: 'Notes',         icon: '📝' },
  food:          { label: 'Food',          icon: '🍱' },
  transport:     { label: 'Transport',     icon: '🚌' },
  tutoring:      { label: 'Tutoring',      icon: '🎓' },
  accommodation: { label: 'Accommodation', icon: '🏠' },
  other:         { label: 'Other',         icon: '🤝' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Aid Card ──────────────────────────────────────────────────────────────────
function AidCard({
  item,
  isOwn,
  onFulfill,
}: {
  item: MutualAidRequest
  isOwn: boolean
  onFulfill: (id: string) => void
}) {
  const cfg = CATEGORY_CONFIG[item.category]
  const isOffer = item.request_type === 'offer'

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        opacity: item.is_fulfilled ? 0.6 : 1,
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Category */}
          <span
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '12px',
              color: '#9ca3af',
            }}
          >
            {cfg.icon} {cfg.label}
          </span>
          {/* Type badge */}
          <span
            style={{
              background: isOffer ? 'rgba(52,211,153,0.15)' : 'rgba(96,165,250,0.15)',
              border: isOffer ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(96,165,250,0.3)',
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '12px',
              color: isOffer ? '#34d399' : '#60a5fa',
              fontWeight: 600,
            }}
          >
            {isOffer ? 'Offering' : 'Requesting'}
          </span>
          {item.is_fulfilled && (
            <span
              style={{
                background: 'rgba(52,211,153,0.12)',
                border: '1px solid rgba(52,211,153,0.25)',
                borderRadius: '20px',
                padding: '2px 10px',
                fontSize: '11px',
                color: '#34d399',
              }}
            >
              Fulfilled
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <p style={{ margin: 0, color: '#e5e7eb', fontWeight: 600, fontSize: '15px', lineHeight: '1.4' }}>
        {item.title}
      </p>

      {/* Description */}
      <p style={{ margin: 0, color: '#9ca3af', fontSize: '13px', lineHeight: '1.6' }}>
        {item.description}
      </p>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {item.institution && (
            <span style={{ color: '#6b7280', fontSize: '11px' }}>{item.institution}</span>
          )}
          <span style={{ color: '#4b5563', fontSize: '11px' }}>{timeAgo(item.created_at)}</span>
          {item.expiry_date && !item.is_fulfilled && (
            <span style={{ color: '#6b7280', fontSize: '11px' }}>
              Expires {new Date(item.expiry_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        {isOwn && !item.is_fulfilled && (
          <button
            onClick={() => onFulfill(item.id)}
            style={{
              background: 'rgba(52,211,153,0.12)',
              border: '1px solid rgba(52,211,153,0.25)',
              borderRadius: '8px',
              padding: '4px 10px',
              color: '#34d399',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Mark as fulfilled
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MutualAidBoard({
  userId,
  university,
}: {
  userId: string
  university: string | null
}) {
  const supabase = createClient()

  const [items, setItems] = useState<MutualAidRequest[]>([])
  const [tab, setTab] = useState<Tab>('browse')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<AidCategory | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [postForm, setPostForm] = useState<PostForm>({
    title: '',
    description: '',
    type: 'request',
    category: 'textbook',
    is_anonymous: true,
    expires_at: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      const res = await fetch(`/api/community/mutual-aid?${params.toString()}`)
      const json = await res.json() as { data?: MutualAidRequest[]; error?: string }
      if (json.error) throw new Error(json.error)
      setItems(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [typeFilter, categoryFilter])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  async function handleFulfill(id: string) {
    const res = await fetch('/api/community/mutual-aid', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_fulfilled: true }),
    })
    const json = await res.json() as { data?: MutualAidRequest; error?: string }
    if (!json.error) {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_fulfilled: true } : item)))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!postForm.title.trim() || !postForm.description.trim()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: Record<string, unknown> = {
        title:        postForm.title.trim(),
        description:  postForm.description.trim(),
        request_type: postForm.type,
        category:     postForm.category,
        is_anonymous: postForm.is_anonymous,
        institution:  university ?? null,
      }
      if (postForm.expires_at) payload.expiry_date = postForm.expires_at

      const res = await fetch('/api/community/mutual-aid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json() as { data?: MutualAidRequest; error?: string }
      if (json.error) throw new Error(json.error)
      if (json.data) setItems((prev) => [json.data!, ...prev])
      setPostForm({
        title: '',
        description: '',
        type: 'request',
        category: 'textbook',
        is_anonymous: true,
        expires_at: '',
      })
      setSubmitSuccess(true)
      setTab('browse')
      dispatchXP('task_complete')
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to post')
    } finally {
      setSubmitting(false)
    }
  }

  const categories = Object.entries(CATEGORY_CONFIG) as [AidCategory, { label: string; icon: string }][]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb' }} className="pb-24">
      {/* Ubuntu quote header */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(52,211,153,0.1) 0%, rgba(96,165,250,0.06) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '24px 16px',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <blockquote
            style={{
              margin: '0 0 8px',
              fontStyle: 'italic',
              color: '#34d399',
              fontSize: '16px',
              fontWeight: 600,
              lineHeight: '1.4',
            }}
          >
            "Umuntu ngumuntu ngabantu"
          </blockquote>
          <p style={{ margin: '0 0 6px', color: '#9ca3af', fontSize: '13px' }}>
            A person is a person through other persons.
          </p>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>
            We rise by lifting others. Ask freely. Give freely.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="max-w-2xl mx-auto" style={{ padding: '12px 16px 0' }}>
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '4px',
          }}
        >
          {(['browse', 'post'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: tab === t ? '#34d399' : 'transparent',
                color: tab === t ? '#0a0a0f' : '#9ca3af',
                fontWeight: tab === t ? 700 : 400,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {t === 'browse' ? 'Browse Board' : '+ Post a Need or Offer'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto" style={{ padding: '16px' }}>
        {/* BROWSE TAB */}
        {tab === 'browse' && (
          <>
            {/* Type filter */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              {(['all', 'offer', 'request'] as TypeFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border:
                      typeFilter === t
                        ? t === 'offer'
                          ? '1px solid #34d399'
                          : t === 'request'
                          ? '1px solid #60a5fa'
                          : '1px solid #34d399'
                        : '1px solid rgba(255,255,255,0.1)',
                    background:
                      typeFilter === t
                        ? t === 'offer'
                          ? 'rgba(52,211,153,0.12)'
                          : t === 'request'
                          ? 'rgba(96,165,250,0.12)'
                          : 'rgba(52,211,153,0.12)'
                        : 'rgba(255,255,255,0.04)',
                    color:
                      typeFilter === t
                        ? t === 'offer'
                          ? '#34d399'
                          : t === 'request'
                          ? '#60a5fa'
                          : '#34d399'
                        : '#9ca3af',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: typeFilter === t ? 600 : 400,
                  }}
                >
                  {t === 'all' ? 'All' : t === 'offer' ? 'Offers' : 'Requests'}
                </button>
              ))}
            </div>

            {/* Category pills */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '6px',
                marginBottom: '14px',
                scrollbarWidth: 'none',
              }}
            >
              <button
                onClick={() => setCategoryFilter('all')}
                style={{
                  flexShrink: 0,
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: categoryFilter === 'all' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                  background: categoryFilter === 'all' ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
                  color: categoryFilter === 'all' ? '#34d399' : '#9ca3af',
                  fontSize: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                All
              </button>
              {categories.map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(key)}
                  style={{
                    flexShrink: 0,
                    padding: '5px 12px',
                    borderRadius: '20px',
                    border: categoryFilter === key ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                    background: categoryFilter === key ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
                    color: categoryFilter === key ? '#34d399' : '#9ca3af',
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>

            {/* Items list */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading board...</div>
            ) : error ? (
              <div
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  color: '#f87171',
                  fontSize: '13px',
                  marginBottom: '12px',
                }}
              >
                {error}
              </div>
            ) : items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
                <p style={{ fontSize: '32px', margin: '0 0 12px' }}>🤝</p>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#e5e7eb' }}>Board is quiet</p>
                <p style={{ margin: '6px 0 0', fontSize: '13px' }}>Be the first to offer or ask for help</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.map((item) => (
                  <AidCard
                    key={item.id}
                    item={item}
                    isOwn={item.user_id === userId}
                    onFulfill={handleFulfill}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* POST TAB */}
        {tab === 'post' && (
          <form onSubmit={(e) => { void handleSubmit(e) }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Type selector */}
            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
                What are you doing? *
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPostForm((f) => ({ ...f, type: 'offer' }))}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: postForm.type === 'offer' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                    background: postForm.type === 'offer' ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
                    color: postForm.type === 'offer' ? '#34d399' : '#9ca3af',
                    fontWeight: postForm.type === 'offer' ? 700 : 400,
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  I want to Offer
                </button>
                <button
                  type="button"
                  onClick={() => setPostForm((f) => ({ ...f, type: 'request' }))}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: postForm.type === 'request' ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.1)',
                    background: postForm.type === 'request' ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.04)',
                    color: postForm.type === 'request' ? '#60a5fa' : '#9ca3af',
                    fontWeight: postForm.type === 'request' ? 700 : 400,
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  I need Help
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
                Category *
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {categories.map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPostForm((f) => ({ ...f, category: key }))}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: postForm.category === key ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                      background: postForm.category === key ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
                      color: postForm.category === key ? '#34d399' : '#9ca3af',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>
                Title *
              </label>
              <input
                type="text"
                value={postForm.title}
                onChange={(e) => setPostForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={
                  postForm.type === 'offer'
                    ? 'e.g. Offering 2nd-year Chemistry notes (UCT)'
                    : 'e.g. Need a lift to Johannesburg this Friday'
                }
                maxLength={120}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#e5e7eb',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>
                Details *
              </label>
              <textarea
                value={postForm.description}
                onChange={(e) => setPostForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Be specific — what exactly are you offering or needing? Contact method, location, conditions..."
                rows={4}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#e5e7eb',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Expiry date */}
            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>
                Expiry date (optional)
              </label>
              <input
                type="date"
                value={postForm.expires_at}
                onChange={(e) => setPostForm((f) => ({ ...f, expires_at: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#e5e7eb',
                  fontSize: '14px',
                  outline: 'none',
                  colorScheme: 'dark',
                }}
              />
            </div>

            {/* Anonymous */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '10px 14px',
              }}
            >
              <input
                type="checkbox"
                checked={postForm.is_anonymous}
                onChange={(e) => setPostForm((f) => ({ ...f, is_anonymous: e.target.checked }))}
                style={{ width: '16px', height: '16px', accentColor: '#34d399' }}
              />
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>
                Post anonymously — your name will not be shown
              </span>
            </label>

            {submitError && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#f87171',
                  fontSize: '13px',
                }}
              >
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div
                style={{
                  background: 'rgba(52,211,153,0.1)',
                  border: '1px solid rgba(52,211,153,0.3)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#34d399',
                  fontSize: '13px',
                }}
              >
                Posted! The community can see it now.
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !postForm.title.trim() || !postForm.description.trim()}
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: submitting ? 'rgba(52,211,153,0.3)' : '#34d399',
                color: '#0a0a0f',
                fontWeight: 700,
                fontSize: '15px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {submitting ? 'Posting...' : postForm.type === 'offer' ? 'Post my Offer' : 'Post my Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
