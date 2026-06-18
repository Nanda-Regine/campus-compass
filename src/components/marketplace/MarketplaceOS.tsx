'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShoppingBag, Plus, Package, MessageSquare, Search, ChevronDown, ChevronUp, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Listing {
  id: string
  user_id: string
  university: string
  title: string
  description: string | null
  price_rands: number | null
  is_free: boolean
  category: string
  condition: string | null
  pickup_location: string | null
  contact_whatsapp: string | null
  image_urls: string[]
  status: string
  created_at: string
}

interface Message {
  id: string
  listing_id: string
  sender_id: string
  recipient_id: string
  body: string
  read_at: string | null
  created_at: string
  marketplace_listings?: { title: string } | null
}

interface Thread {
  listing_id: string
  listing_title: string
  messages: Message[]
  otherParty: string
}

interface Props {
  userId: string
  initialListings: Listing[]
  myListings: Listing[]
  university: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

type Tab = 'browse' | 'sell' | 'my-listings' | 'messages'
type Category = 'textbooks' | 'electronics' | 'clothing' | 'furniture' | 'food' | 'transport' | 'other'
type Condition = 'new' | 'like_new' | 'good' | 'fair'

const ACCENT = '#f59e0b'
const ACCENT_DIM = 'rgba(245,158,11,0.14)'

const CATEGORY_META: Record<Category, { emoji: string; label: string }> = {
  textbooks:   { emoji: '📚', label: 'Textbooks' },
  electronics: { emoji: '💻', label: 'Electronics' },
  clothing:    { emoji: '👕', label: 'Clothing' },
  furniture:   { emoji: '🛋️', label: 'Furniture' },
  food:        { emoji: '🍱', label: 'Food' },
  transport:   { emoji: '🚗', label: 'Transport' },
  other:       { emoji: '📦', label: 'Other' },
}

const CONDITION_LABELS: Record<Condition, string> = {
  new:      'New',
  like_new: 'Like New',
  good:     'Good',
  fair:     'Fair',
}

const CATEGORIES = Object.keys(CATEGORY_META) as Category[]
const CONDITIONS = Object.keys(CONDITION_LABELS) as Condition[]

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'browse',      label: 'Browse',   icon: <ShoppingBag size={14} /> },
  { id: 'sell',        label: 'Sell',     icon: <Plus size={14} /> },
  { id: 'my-listings', label: 'Mine',     icon: <Package size={14} /> },
  { id: 'messages',    label: 'Messages', icon: <MessageSquare size={14} /> },
]

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PriceBadge({ listing }: { listing: Listing }) {
  const text = listing.is_free ? 'FREE' : listing.price_rands != null ? `R${Number(listing.price_rands).toFixed(0)}` : 'Price TBD'
  const color = listing.is_free ? '#34d399' : ACCENT
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '0.72rem',
      fontWeight: 700,
      color,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      borderRadius: 6,
      padding: '2px 8px',
      letterSpacing: '0.03em',
    }}>
      {text}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    active:  { label: 'Active',  color: '#34d399' },
    sold:    { label: 'Sold',    color: '#94a3b8' },
    deleted: { label: 'Deleted', color: '#f87171' },
  }
  const meta = map[status] ?? { label: status, color: '#94a3b8' }
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '0.6rem',
      fontWeight: 700,
      color: meta.color,
      background: `${meta.color}18`,
      border: `1px solid ${meta.color}40`,
      borderRadius: 5,
      padding: '2px 7px',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }}>
      {meta.label}
    </span>
  )
}

function ListingCard({ listing, showActions, onMarkSold, onDelete }: {
  listing: Listing
  showActions?: boolean
  onMarkSold?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const cat = CATEGORY_META[listing.category as Category] ?? CATEGORY_META.other
  const cond = listing.condition ? CONDITION_LABELS[listing.condition as Condition] : null

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '0.92rem',
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            marginBottom: 4,
          }}>
            {listing.title}
          </div>
          {listing.description && (
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {listing.description}
            </div>
          )}
        </div>
        <PriceBadge listing={listing} />
      </div>

      {/* Tags row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          color: ACCENT,
          background: ACCENT_DIM,
          border: `1px solid ${ACCENT}30`,
          borderRadius: 5,
          padding: '2px 7px',
        }}>
          {cat.emoji} {cat.label}
        </span>
        {cond && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: 'rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 5,
            padding: '2px 7px',
          }}>
            {cond}
          </span>
        )}
        {showActions && <StatusBadge status={listing.status} />}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.55rem',
          color: 'rgba(255,255,255,0.28)',
          marginLeft: 'auto',
        }}>
          {timeAgo(listing.created_at)}
        </span>
      </div>

      {/* Pickup */}
      {listing.pickup_location && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          color: 'rgba(255,255,255,0.38)',
        }}>
          📍 {listing.pickup_location}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {listing.contact_whatsapp && !showActions && (
          <a
            href={`https://wa.me/${listing.contact_whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#25D366',
              background: 'rgba(37,211,102,0.1)',
              border: '1px solid rgba(37,211,102,0.3)',
              borderRadius: 8,
              padding: '5px 12px',
              textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: '0.85rem' }}>💬</span> WhatsApp
          </a>
        )}
        {showActions && listing.status === 'active' && onMarkSold && (
          <button
            onClick={() => onMarkSold(listing.id)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              fontWeight: 600,
              color: '#34d399',
              background: 'rgba(52,211,153,0.1)',
              border: '1px solid rgba(52,211,153,0.3)',
              borderRadius: 8,
              padding: '5px 12px',
              cursor: 'pointer',
            }}
          >
            Mark Sold
          </button>
        )}
        {showActions && onDelete && listing.status !== 'deleted' && (
          <button
            onClick={() => onDelete(listing.id)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              fontWeight: 600,
              color: '#f87171',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 8,
              padding: '5px 12px',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Browse Tab ───────────────────────────────────────────────────────────────

function BrowseTab({ userId: _userId, initialListings, university: _university }: { userId: string; initialListings: Listing[]; university: string }) {
  const [listings, setListings] = useState<Listing[]>(initialListings)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<Category | 'all'>('all')
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      let url = `/api/marketplace?`
      if (catFilter !== 'all') url += `category=${catFilter}&`
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}`
      const res = await window.fetch(url)
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json() as { data: Listing[] }
      setListings(json.data ?? [])
    } catch {
      toast.error('Could not load listings')
    } finally {
      setLoading(false)
    }
  }, [catFilter, search])

  useEffect(() => {
    const t = setTimeout(() => { void fetch() }, 300)
    return () => clearTimeout(t)
  }, [fetch])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search listings..."
          style={{
            width: '100%',
            paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Category filter chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
        {(['all', ...CATEGORIES] as (Category | 'all')[]).map(c => {
          const active = catFilter === c
          const label = c === 'all' ? 'All' : `${CATEGORY_META[c].emoji} ${CATEGORY_META[c].label}`
          return (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              style={{
                flexShrink: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                fontWeight: active ? 700 : 400,
                color: active ? ACCENT : 'rgba(255,255,255,0.45)',
                background: active ? ACCENT_DIM : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? ACCENT + '50' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 20,
                padding: '5px 11px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Listings */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
          Loading...
        </div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🛒</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)' }}>
            No listings found
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.28)', marginTop: 6 }}>
            Be the first to sell something!
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {listings.map(l => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sell Tab ─────────────────────────────────────────────────────────────────

function SellTab({ onCreated }: { onCreated: (l: Listing) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priceStr, setPriceStr] = useState('')
  const [isFree, setIsFree] = useState(false)
  const [category, setCategory] = useState<Category>('other')
  const [condition, setCondition] = useState<Condition | ''>('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [contactWhatsapp, setContactWhatsapp] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (title.trim().length < 3) { toast.error('Title must be at least 3 characters'); return }

    setSaving(true)
    try {
      const price = isFree ? null : priceStr !== '' ? parseFloat(priceStr) : null
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          price_rands: price,
          is_free: isFree,
          category,
          condition: condition || null,
          pickup_location: pickupLocation.trim() || null,
          contact_whatsapp: contactWhatsapp.trim() || null,
        }),
      })
      const json = await res.json() as { data?: Listing; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to create listing')
      toast.success('Listing posted!')
      onCreated(json.data!)
      setTitle(''); setDescription(''); setPriceStr(''); setIsFree(false)
      setCategory('other'); setCondition(''); setPickupLocation(''); setContactWhatsapp('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 6,
    display: 'block',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Title *</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What are you selling?"
          maxLength={120}
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe the item..."
          maxLength={1000}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
        />
      </div>

      <div>
        <label style={labelStyle}>Price</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="number"
            min={0}
            step={0.01}
            value={isFree ? '' : priceStr}
            onChange={e => setPriceStr(e.target.value)}
            placeholder="R 0.00"
            disabled={isFree}
            style={{ ...inputStyle, width: 'auto', flex: 1, opacity: isFree ? 0.4 : 1 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
            <input
              type="checkbox"
              checked={isFree}
              onChange={e => { setIsFree(e.target.checked); if (e.target.checked) setPriceStr('') }}
              style={{ accentColor: '#34d399', width: 14, height: 14 }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#34d399', fontWeight: 600 }}>FREE</span>
          </label>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Category *</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value as Category)}
          required
          style={{ ...inputStyle, appearance: 'none' }}
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{CATEGORY_META[c].emoji} {CATEGORY_META[c].label}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Condition</label>
        <select
          value={condition}
          onChange={e => setCondition(e.target.value as Condition | '')}
          style={{ ...inputStyle, appearance: 'none' }}
        >
          <option value="">-- Select condition --</option>
          {CONDITIONS.map(c => (
            <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Pickup Location</label>
        <input
          value={pickupLocation}
          onChange={e => setPickupLocation(e.target.value)}
          placeholder="e.g. Bremner Building, Main Campus"
          maxLength={200}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>WhatsApp Number</label>
        <input
          value={contactWhatsapp}
          onChange={e => setContactWhatsapp(e.target.value)}
          placeholder="+27 82 000 0000"
          maxLength={20}
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        disabled={saving || title.trim().length < 3}
        style={{
          width: '100%',
          padding: '12px 0',
          background: saving ? 'rgba(245,158,11,0.2)' : `linear-gradient(135deg, #78350f, #b45309)`,
          border: 'none',
          borderRadius: 10,
          color: '#fff',
          fontFamily: 'var(--font-display)',
          fontSize: '0.9rem',
          fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: title.trim().length < 3 ? 0.5 : 1,
          transition: 'all 0.15s ease',
        }}
      >
        {saving ? 'Posting...' : '🛒 Post Listing'}
      </button>
    </form>
  )
}

// ─── My Listings Tab ──────────────────────────────────────────────────────────

function MyListingsTab({ initialMyListings }: { initialMyListings: Listing[] }) {
  const [listings, setListings] = useState<Listing[]>(initialMyListings)

  async function handleMarkSold(id: string) {
    try {
      const res = await fetch(`/api/marketplace/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sold' }),
      })
      if (!res.ok) {
        const j = await res.json() as { error?: string }
        throw new Error(j.error ?? 'Failed')
      }
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'sold' } : l))
      toast.success('Marked as sold!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/marketplace/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'deleted' }),
      })
      if (!res.ok) {
        const j = await res.json() as { error?: string }
        throw new Error(j.error ?? 'Failed')
      }
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'deleted' } : l))
      toast.success('Listing removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  if (listings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📦</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)' }}>
          No listings yet
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.28)', marginTop: 6 }}>
          Use the Sell tab to create your first listing
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {listings.map(l => (
        <ListingCard
          key={l.id}
          listing={l}
          showActions
          onMarkSold={handleMarkSold}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}

// ─── Messages Tab ─────────────────────────────────────────────────────────────

function MessagesTab({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [replies, setReplies] = useState<Record<string, string>>({})
  const [sending, setSending] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/marketplace/messages')
      const json = await res.json() as { data: Message[] }
      setMessages(json.data ?? [])
    } catch {
      toast.error('Could not load messages')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  // Group messages into threads by listing_id
  const threadMap = new Map<string, Message[]>()
  for (const msg of messages) {
    const arr = threadMap.get(msg.listing_id) ?? []
    arr.push(msg)
    threadMap.set(msg.listing_id, arr)
  }

  const threads = Array.from(threadMap.entries()).map(([listing_id, msgs]) => {
    const sorted = [...msgs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const first = sorted[0]
    const otherParty = first
      ? (first.sender_id === userId ? first.recipient_id : first.sender_id)
      : 'unknown'
    const listing_title = first?.marketplace_listings?.title ?? 'Listing'
    return { listing_id, listing_title, messages: sorted, otherParty }
  })

  async function sendReply(listingId: string, recipientId: string) {
    const body = (replies[listingId] ?? '').trim()
    if (!body) return
    setSending(listingId)
    try {
      const res = await fetch('/api/marketplace/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, recipient_id: recipientId, body }),
      })
      const json = await res.json() as { data?: Message; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      setReplies(prev => ({ ...prev, [listingId]: '' }))
      await load()
      toast.success('Sent!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    } finally {
      setSending(null)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>Loading...</div>
  }

  if (threads.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>💬</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)' }}>
          No messages yet
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.28)', marginTop: 6 }}>
          When buyers contact you, threads will appear here
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {threads.map(thread => {
        const isOpen = expanded === thread.listing_id
        const lastMsg = thread.messages[thread.messages.length - 1]
        const unread = thread.messages.filter(m => m.recipient_id === userId && !m.read_at).length

        return (
          <div key={thread.listing_id} style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${unread > 0 ? ACCENT + '40' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {/* Thread header */}
            <button
              onClick={() => setExpanded(isOpen ? null : thread.listing_id)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                textAlign: 'left',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {thread.listing_title}
                  {unread > 0 && (
                    <span style={{ marginLeft: 8, background: ACCENT, color: '#000', borderRadius: 10, padding: '1px 6px', fontSize: '0.55rem', fontWeight: 700 }}>
                      {unread} new
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lastMsg?.body ?? ''}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                  {lastMsg ? timeAgo(lastMsg.created_at) : ''}
                </div>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </button>

            {/* Expanded thread */}
            {isOpen && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {thread.messages.map(msg => {
                  const isMine = msg.sender_id === userId
                  return (
                    <div key={msg.id} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMine ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        maxWidth: '80%',
                        background: isMine ? `${ACCENT}20` : 'rgba(255,255,255,0.07)',
                        border: `1px solid ${isMine ? ACCENT + '30' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 10,
                        padding: '7px 11px',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.82rem',
                        color: 'var(--text-primary)',
                        lineHeight: 1.4,
                      }}>
                        {msg.body}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>
                        {timeAgo(msg.created_at)}
                      </div>
                    </div>
                  )
                })}

                {/* Reply form */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <input
                    value={replies[thread.listing_id] ?? ''}
                    onChange={e => setReplies(prev => ({ ...prev, [thread.listing_id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendReply(thread.listing_id, thread.otherParty) } }}
                    placeholder="Reply..."
                    maxLength={500}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => void sendReply(thread.listing_id, thread.otherParty)}
                    disabled={!replies[thread.listing_id]?.trim() || sending === thread.listing_id}
                    style={{
                      padding: '8px 12px',
                      background: ACCENT_DIM,
                      border: `1px solid ${ACCENT}40`,
                      borderRadius: 8,
                      color: ACCENT,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MarketplaceOS({ userId, initialListings, myListings: initialMyListings, university }: Props) {
  const [tab, setTab] = useState<Tab>('browse')
  const [myListings, setMyListings] = useState<Listing[]>(initialMyListings)
  const [browseListings, setBrowseListings] = useState<Listing[]>(initialListings)
  const activeTab = TABS.find(t => t.id === tab)!

  function handleNewListing(l: Listing) {
    setMyListings(prev => [l, ...prev])
    setBrowseListings(prev => [l, ...prev])
    setTab('my-listings')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: 96, display: 'flex' }}>

      {/* Vertical side rail */}
      <div style={{
        width: 64, flexShrink: 0,
        position: 'sticky', top: 57,
        height: 'calc(100vh - 57px)',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        borderRight: '0.5px solid var(--border-subtle)',
        background: 'rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
      }}>
        {TABS.map(t => {
          const isActive = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              title={t.label}
              style={{
                width: '100%', minHeight: 64,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 5,
                background: isActive ? ACCENT_DIM : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${isActive ? ACCENT : 'transparent'}`,
                color: isActive ? ACCENT : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                padding: '6px 2px',
              }}
            >
              <span style={{ flexShrink: 0, display: 'flex', opacity: isActive ? 1 : 0.6 }}>{t.icon}</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.46rem',
                letterSpacing: '0.04em',
                fontWeight: isActive ? 700 : 400,
                lineHeight: 1,
                textTransform: 'uppercase',
              }}>
                {t.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content column */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Compact header */}
        <div style={{
          padding: '14px 16px',
          background: `linear-gradient(180deg, ${ACCENT}0c 0%, transparent 100%)`,
          borderBottom: '0.5px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: 10,
          transition: 'background 0.3s ease',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: `linear-gradient(135deg, #78350f, #b45309)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0,
            boxShadow: `0 2px 8px ${ACCENT}40`,
          }}>
            <ShoppingBag size={14} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {activeTab.label}
            </div>
            {university && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'rgba(255,255,255,0.3)', marginTop: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {university}
              </div>
            )}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding: '16px 16px 0' }}>
          {tab === 'browse' && (
            <BrowseTab userId={userId} initialListings={browseListings} university={university} />
          )}
          {tab === 'sell' && (
            <SellTab onCreated={handleNewListing} />
          )}
          {tab === 'my-listings' && (
            <MyListingsTab initialMyListings={myListings} />
          )}
          {tab === 'messages' && (
            <MessagesTab userId={userId} />
          )}
        </div>
      </div>
    </div>
  )
}
