'use client'
import { useState, useEffect, useRef } from 'react'
import { hideBrokenImg } from '@/lib/imgFallback'
import { createClient } from '@/lib/supabase/client'

type Condition = 'new' | 'like_new' | 'good' | 'fair' | 'poor'
type ListingType = 'sell' | 'swap' | 'free'
type Tab = 'browse' | 'sell' | 'mine' | 'learn'

interface Listing {
  id: string; seller_id: string; isbn: string | null; title: string
  author: string | null; edition: string | null; subject: string | null
  university: string | null; price_cents: number; condition: Condition
  listing_type: ListingType; description: string | null
  image_url: string | null; whatsapp_number: string | null
  is_sold: boolean; created_at: string; sellerName?: string
}

interface Interest {
  id: string; listing_id: string; buyer_id: string
  message: string | null; whatsapp_number: string | null
  created_at: string; buyerName: string
}

const CONDITION_LABELS: Record<Condition, string> = {
  new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair', poor: 'Poor',
}
const CONDITION_COLOR: Record<Condition, string> = {
  new: 'var(--teal)', like_new: 'var(--teal)', good: 'var(--gold)',
  fair: 'var(--coral)', poor: 'var(--text-muted)',
}

function cleanWA(raw: string) {
  return raw.replace(/[\s\-()+]/g, '').replace(/^0/, '27')
}

export default function TextbookMarketplace({ userId, university }: { userId: string; university?: string }) {
  const [tab, setTab]                       = useState<Tab>('browse')
  const [listings, setListings]             = useState<Listing[]>([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [typeFilter, setTypeFilter]         = useState<ListingType | 'all'>('all')
  const [interests, setInterests]           = useState<Interest[]>([])
  const [interestsLoading, setInterestsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => { load() }, [university])

  useEffect(() => {
    if (tab !== 'mine') return
    const myIds = listings.filter(l => l.seller_id === userId).map(l => l.id)
    if (myIds.length > 0) loadInterests(myIds)
  }, [tab, listings])

  async function load() {
    setLoading(true)
    let q = supabase.from('textbook_listings').select('*').eq('is_sold', false)
      .order('created_at', { ascending: false }).limit(60)
    if (university) q = q.eq('university', university)
    const { data } = await q
    const rows = (data ?? []) as Omit<Listing, 'sellerName'>[]

    if (rows.length > 0) {
      const sellerIds = [...new Set(rows.map(r => r.seller_id))]
      const { data: sellers } = await supabase
        .from('public_profiles').select('id, display_name').in('id', sellerIds)
      const nameMap: Record<string, string> = {}
      sellers?.forEach(s => { nameMap[s.id] = (s.display_name as string) || 'Student' })
      setListings(rows.map(r => ({ ...r, sellerName: nameMap[r.seller_id] ?? 'Student' })))
    } else {
      setListings([])
    }
    setLoading(false)
  }

  async function loadInterests(myListingIds: string[]) {
    setInterestsLoading(true)
    const { data: raw } = await supabase
      .from('textbook_interests').select('*')
      .in('listing_id', myListingIds).order('created_at', { ascending: false })

    if (!raw?.length) { setInterests([]); setInterestsLoading(false); return }

    const buyerIds = [...new Set(raw.map(r => r.buyer_id as string))]
    const { data: buyers } = await supabase
      .from('public_profiles').select('id, display_name').in('id', buyerIds)
    const nameMap: Record<string, string> = {}
    buyers?.forEach(b => { nameMap[b.id as string] = (b.display_name as string) || 'A student' })
    setInterests(raw.map(r => ({ ...(r as Omit<Interest, 'buyerName'>), buyerName: nameMap[r.buyer_id as string] ?? 'A student' })))
    setInterestsLoading(false)
  }

  const filtered = listings.filter(l => {
    if (typeFilter !== 'all' && l.listing_type !== typeFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return l.title.toLowerCase().includes(s)
        || (l.author ?? '').toLowerCase().includes(s)
        || (l.subject ?? '').toLowerCase().includes(s)
        || (l.isbn ?? '').includes(s)
    }
    return true
  })

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'browse', label: 'Browse', icon: '📚' },
    { id: 'sell',   label: 'Sell / Give', icon: '➕' },
    { id: 'mine',   label: 'My Listings', icon: '📋' },
    { id: 'learn',  label: 'Tips', icon: '💡' },
  ]

  const myListings = listings.filter(l => l.seller_id === userId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-surface)', border: '1px solid rgba(var(--teal-rgb,0,229,176),0.25)', borderRadius: 16, padding: '16px 18px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,var(--teal),transparent)' }} />
        <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--teal)', letterSpacing: '0.09em', marginBottom: 4 }}>TEXTBOOK MARKETPLACE</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Buy, sell, swap, free</div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 3 }}>
          {university || 'All universities'} · {listings.length} listing{listings.length !== 1 ? 's' : ''} available
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '1px solid var(--border-subtle)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flexShrink: 0, padding: '8px 12px', background: 'none', border: 'none',
            borderBottom: tab === t.id ? '2px solid var(--teal)' : '2px solid transparent',
            color: tab === t.id ? 'var(--teal)' : 'var(--text-tertiary)',
            fontSize: '0.67rem', fontFamily: 'var(--font-mono)', fontWeight: tab === t.id ? 700 : 400,
            cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap',
          }}>
            {t.icon} {t.label}
            {t.id === 'mine' && myListings.length > 0 && (
              <span style={{ marginLeft: 5, background: 'rgba(0,229,176,0.15)', color: 'var(--teal)', borderRadius: 9999, padding: '1px 5px', fontSize: '0.63rem', fontWeight: 700 }}>
                {myListings.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Browse tab */}
      {tab === 'browse' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text" placeholder="Search by title, author, subject, ISBN..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.82rem' }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'sell', 'swap', 'free'] as const).map(f => (
              <button key={f} onClick={() => setTypeFilter(f)} style={{
                flex: 1, padding: '7px 0',
                background: typeFilter === f ? 'rgba(0,229,176,0.1)' : 'var(--bg-surface)',
                border: `1px solid ${typeFilter === f ? 'rgba(0,229,176,0.3)' : 'var(--border-subtle)'}`,
                borderRadius: 8, color: typeFilter === f ? 'var(--teal)' : 'var(--text-secondary)',
                fontSize: '0.67rem', fontFamily: 'var(--font-mono)', fontWeight: typeFilter === f ? 700 : 400,
                cursor: 'pointer', textTransform: 'capitalize',
              }}>{f}</button>
            ))}
          </div>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse" style={{ height: 80, borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.06)' }} />
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              No listings found{university ? ` at ${university}` : ''}. Be the first to sell a textbook!
            </div>
          )}
          {filtered.map(l => <ListingCard key={l.id} listing={l} userId={userId} onRefresh={load} />)}
        </div>
      )}

      {/* Sell tab */}
      {tab === 'sell' && (
        <SellForm userId={userId} university={university} onDone={() => { load(); setTab('browse') }} />
      )}

      {/* Mine tab */}
      {tab === 'mine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {myListings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              You have no active listings.
            </div>
          ) : (
            myListings.map(l => (
              <div key={l.id}>
                <ListingCard listing={l} userId={userId} onRefresh={load} isOwner />
                <div style={{ marginTop: 4 }}>
                  <InterestedBuyers listingId={l.id} listing={l} interests={interests} loading={interestsLoading} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Learn tab */}
      {tab === 'learn' && <TextbookTips />}
    </div>
  )
}

// ─── Listing Card ────────────────────────────────────────────
function ListingCard({ listing: l, userId, onRefresh, isOwner }: {
  listing: Listing; userId: string; onRefresh: () => void; isOwner?: boolean
}) {
  const [showInterest, setShowInterest] = useState(false)
  const [buyerWA, setBuyerWA]           = useState('')
  const [contacted, setContacted]       = useState(false)
  const supabase = createClient()

  const price = l.listing_type === 'free' ? 'FREE' : l.listing_type === 'swap' ? 'SWAP' : `R${(l.price_cents / 100).toFixed(0)}`
  const priceColor = l.listing_type === 'free' ? 'var(--teal)' : l.listing_type === 'swap' ? 'var(--indigo,#6366F1)' : 'var(--gold)'

  const markSold = async () => {
    await supabase.from('textbook_listings').update({ is_sold: true }).eq('id', l.id)
    onRefresh()
  }
  const deleteListing = async () => {
    await supabase.from('textbook_listings').update({ is_sold: true }).eq('id', l.id)
    onRefresh()
  }
  const submitInterest = async () => {
    await supabase.from('textbook_interests').upsert({
      listing_id: l.id, buyer_id: userId,
      message: 'Interested!',
      whatsapp_number: buyerWA.trim() || null,
    })
    setContacted(true)
    setShowInterest(false)
  }

  const sellerWA = l.whatsapp_number ? cleanWA(l.whatsapp_number) : null
  const waMsg = encodeURIComponent(`Hi! I saw your "${l.title}" listing on VarsityOS. Is it still available?`)

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Thumbnail if image exists */}
      {l.image_url && (
        <div style={{ height: 110, overflow: 'hidden', position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={l.image_url} alt={l.title} onError={hideBrokenImg}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6))' }} />
          <div style={{ position: 'absolute', bottom: 8, left: 12, fontSize: '0.95rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: priceColor }}>{price}</div>
        </div>
      )}

      <div style={{ padding: '13px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>{l.title}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 1 }}>
              {[l.author, l.edition ? `${l.edition} ed.` : null, l.subject].filter(Boolean).join(' · ')}
            </div>
          </div>
          {!l.image_url && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: priceColor }}>{price}</div>
              <div style={{ fontSize: '0.6rem', color: CONDITION_COLOR[l.condition], fontFamily: 'var(--font-mono)' }}>{CONDITION_LABELS[l.condition]}</div>
            </div>
          )}
          {l.image_url && (
            <div style={{ fontSize: '0.6rem', color: CONDITION_COLOR[l.condition], fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{CONDITION_LABELS[l.condition]}</div>
          )}
        </div>

        {l.description && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 8, lineHeight: 1.5 }}>{l.description}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
            {l.sellerName || 'Student'}{l.university ? ` · ${l.university}` : ''}
          </div>

          {isOwner ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={markSold} style={{ padding: '5px 10px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, color: 'var(--teal)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>
                Mark sold
              </button>
              <button onClick={deleteListing} style={{ padding: '5px 8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#f87171', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>
                Remove
              </button>
            </div>
          ) : l.seller_id !== userId ? (
            sellerWA ? (
              <a
                href={`https://wa.me/${sellerWA}?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: '5px 12px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: 6, color: '#25D366', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}
              >
                💬 WhatsApp seller
              </a>
            ) : contacted ? (
              <span style={{ fontSize: '0.65rem', color: 'var(--teal)', fontFamily: 'var(--font-mono)' }}>✓ Interest sent</span>
            ) : (
              <button onClick={() => setShowInterest(v => !v)} style={{ padding: '5px 12px', background: 'rgba(0,229,176,0.1)', border: '1px solid rgba(0,229,176,0.25)', borderRadius: 6, color: 'var(--teal)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>
                Express interest →
              </button>
            )
          ) : null}
        </div>

        {/* Inline interest form when no seller WA */}
        {showInterest && !sellerWA && !contacted && (
          <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(0,229,176,0.04)', border: '1px solid rgba(0,229,176,0.12)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
              Leave your WhatsApp so the seller can contact you directly (optional)
            </div>
            <input
              type="tel" placeholder="e.g. 073 456 7890"
              value={buyerWA} onChange={e => setBuyerWA(e.target.value)}
              style={{ padding: '8px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 7, color: 'var(--text-primary)', fontSize: '0.78rem' }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={submitInterest} style={{ flex: 1, padding: '7px 0', background: 'rgba(0,229,176,0.1)', border: '1px solid rgba(0,229,176,0.25)', borderRadius: 7, color: 'var(--teal)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>
                Send →
              </button>
              <button onClick={() => setShowInterest(false)} style={{ padding: '7px 10px', background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 7, color: 'var(--text-muted)', fontSize: '0.65rem', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Interested Buyers Panel (mine tab) ─────────────────────
function InterestedBuyers({ listingId, listing, interests, loading }: {
  listingId: string; listing: Listing; interests: Interest[]; loading: boolean
}) {
  const [open, setOpen] = useState(false)
  const relevant = interests.filter(i => i.listing_id === listingId)

  if (loading) return (
    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)', padding: '4px 0' }}>
      checking interest…
    </div>
  )

  const priceText = listing.listing_type === 'free' ? 'free'
    : listing.listing_type === 'swap' ? 'a swap'
    : `R${(listing.price_cents / 100).toFixed(0)}`

  if (!relevant.length) return (
    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)', padding: '4px 0' }}>
      No buyers yet — share your listing
    </div>
  )

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          fontSize: '0.65rem', color: 'var(--teal)', background: 'rgba(0,229,176,0.06)',
          border: '1px solid rgba(0,229,176,0.2)', borderRadius: 6, padding: '4px 10px',
          fontFamily: 'var(--font-mono)', cursor: 'pointer', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        👥 {relevant.length} {relevant.length === 1 ? 'buyer' : 'buyers'} interested
        <span style={{ opacity: 0.5, fontSize: '0.63rem' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ marginTop: 6, padding: '10px 12px', background: 'rgba(0,229,176,0.04)', border: '1px solid rgba(0,229,176,0.12)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {relevant.map((i, idx) => {
            const waNum = i.whatsapp_number ? cleanWA(i.whatsapp_number) : null
            const introMsg = encodeURIComponent(
              `Hi ${i.buyerName}! I saw you're interested in my "${listing.title}" (${priceText}). Still keen?`
            )
            return (
              <div
                key={i.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: idx > 0 ? 8 : 0,
                  borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{i.buyerName}</div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
                    {new Date(i.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                    {i.whatsapp_number && (
                      <span style={{ marginLeft: 5, color: '#25D366' }}>· {i.whatsapp_number}</span>
                    )}
                  </div>
                </div>
                {waNum ? (
                  <a
                    href={`https://wa.me/${waNum}?text=${introMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.6rem', color: '#25D366', background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 6, padding: '4px 9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textDecoration: 'none' }}
                  >
                    💬 Chat
                  </a>
                ) : (
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)' }}>
                    No WA given
                  </span>
                )}
              </div>
            )
          })}
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            Arrange campus pickup — no payments through the app
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sell Form ───────────────────────────────────────────────
function SellForm({ userId, university, onDone }: { userId: string; university?: string; onDone: () => void }) {
  const [form, setForm] = useState({
    title: '', author: '', edition: '', subject: '', isbn: '', price: '',
    condition: 'good' as Condition, listing_type: 'sell' as ListingType,
    description: '', whatsapp_number: '',
  })
  const [imageFile, setImageFile]     = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving]           = useState(false)
  const [uploadPct, setUploadPct]     = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const submit = async () => {
    if (!form.title) return
    setSaving(true)

    let image_url: string | null = null
    if (imageFile) {
      setUploadPct(20)
      const ext = imageFile.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('textbook-images')
        .upload(path, imageFile, { upsert: true })
      if (!error) {
        const { data: pub } = supabase.storage.from('textbook-images').getPublicUrl(path)
        image_url = pub.publicUrl
      }
      setUploadPct(60)
    }

    const price_cents = form.listing_type === 'free' || form.listing_type === 'swap'
      ? 0 : Math.round(parseFloat(form.price || '0') * 100)

    await supabase.from('textbook_listings').insert({
      seller_id: userId, title: form.title, author: form.author || null,
      edition: form.edition || null, subject: form.subject || null,
      isbn: form.isbn || null, price_cents,
      condition: form.condition, listing_type: form.listing_type,
      description: form.description || null, university: university || null,
      image_url, whatsapp_number: form.whatsapp_number.trim() || null,
    })
    setSaving(false)
    setUploadPct(0)
    onDone()
  }

  const f = (k: keyof typeof form, v: string) => setForm(x => ({ ...x, [k]: v }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        List your textbook so students at {university || 'your university'} can buy, swap, or get it for free.
        Students connect directly — no payments through the app.
      </div>

      {/* Image upload */}
      <div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginBottom: 5 }}>Cover photo (optional)</div>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            height: imagePreview ? 'auto' : 80, borderRadius: 10, overflow: 'hidden',
            border: '1px dashed rgba(0,229,176,0.25)', cursor: 'pointer',
            background: imagePreview ? 'none' : 'rgba(0,229,176,0.03)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', objectPosition: 'top' }} />
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'var(--teal)', fontFamily: 'var(--font-mono)' }}>📷 Tap to add photo</span>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
        {imagePreview && (
          <button onClick={() => { setImageFile(null); setImagePreview(null) }} style={{ marginTop: 5, fontSize: '0.6rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            × Remove photo
          </button>
        )}
      </div>

      {[
        { l: 'Book title *', k: 'title', p: 'e.g. Microeconomics 11th Edition' },
        { l: 'Author', k: 'author', p: 'e.g. Mankiw' },
        { l: 'Edition / Year', k: 'edition', p: 'e.g. 11th' },
        { l: 'Subject / Module', k: 'subject', p: 'e.g. ECO1010' },
        { l: 'ISBN (optional)', k: 'isbn', p: '978-...' },
      ].map(({ l, k, p }) => (
        <div key={k}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginBottom: 3 }}>{l}</div>
          <input
            value={form[k as keyof typeof form]}
            onChange={e => f(k as keyof typeof form, e.target.value)}
            placeholder={p}
            style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }}
          />
        </div>
      ))}

      {/* WhatsApp number */}
      <div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginBottom: 3 }}>
          Your WhatsApp number
          <span style={{ marginLeft: 5, color: '#25D366' }}>· buyers will contact you directly</span>
        </div>
        <input
          type="tel" value={form.whatsapp_number}
          onChange={e => f('whatsapp_number', e.target.value)}
          placeholder="e.g. 073 456 7890"
          style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' }}
        />
        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
          Shown only to potential buyers on this listing
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginBottom: 3 }}>Listing type</div>
          <select value={form.listing_type} onChange={e => f('listing_type', e.target.value)} style={{ width: '100%', padding: '9px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.78rem' }}>
            <option value="sell">Sell</option>
            <option value="swap">Swap</option>
            <option value="free">Give away</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginBottom: 3 }}>Condition</div>
          <select value={form.condition} onChange={e => f('condition', e.target.value)} style={{ width: '100%', padding: '9px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.78rem' }}>
            {(Object.keys(CONDITION_LABELS) as Condition[]).map(c => (
              <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
            ))}
          </select>
        </div>
      </div>
      {form.listing_type === 'sell' && (
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginBottom: 3 }}>Price (R)</div>
          <input type="number" inputMode="decimal" aria-label="Price in rands" value={form.price} onChange={e => f('price', e.target.value)} placeholder="150" style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }} />
        </div>
      )}
      <div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginBottom: 3 }}>Description (optional)</div>
        <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2} placeholder="Any highlights, missing pages, etc." style={{ width: '100%', padding: '9px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.78rem', resize: 'none' }} />
      </div>

      {saving && uploadPct > 0 && uploadPct < 100 && (
        <div style={{ height: 3, borderRadius: 2, background: 'var(--border-subtle)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${uploadPct}%`, background: 'var(--teal)', transition: 'width 0.4s' }} />
        </div>
      )}

      <button onClick={submit} disabled={saving || !form.title} style={{ padding: '12px 0', background: 'rgba(0,229,176,0.1)', border: '1px solid rgba(0,229,176,0.25)', borderRadius: 10, color: 'var(--teal)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer', opacity: form.title ? 1 : 0.5 }}>
        {saving ? (imageFile ? `Uploading… ${uploadPct}%` : 'Publishing...') : 'Publish listing →'}
      </button>
    </div>
  )
}

// ─── Tips ────────────────────────────────────────────────────
function TextbookTips() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[
        { e: '💰', t: 'Price textbooks right', b: 'New price ÷ 2 = good used price. Check Takealot for the current retail price. Books in Good condition typically sell for 40–60% of retail.' },
        { e: '📸', t: 'Good photos sell faster', b: "Take a clear photo of the cover and one of any highlights/notes. Buyers want to see exactly what they're getting. Most buyers in SA prefer to meet in person on campus." },
        { e: '📱', t: 'Add your WhatsApp', b: 'Listings with a WhatsApp number get contacted directly — faster deals, no back-and-forth through the app. Add your number when listing.' },
        { e: '🔄', t: 'Swapping saves more money', b: 'A swap means both students pay nothing. Especially valuable for core curriculum books used across departments.' },
        { e: '📖', t: 'Give it away and earn karma', b: 'Books you won\'t use again can change someone\'s semester. Mark it as Free. Ubuntu principle: your success lifting others lifts the whole community.' },
        { e: '⚠️', t: 'Safety when meeting', b: 'Meet in a public campus area (library foyer, cafeteria). Bring a friend if the book value is high. Verify payment before handing over the book.' },
      ].map((s, i) => (
        <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 11, padding: '12px 14px', display: 'flex', gap: 12 }}>
          <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: 1 }}>{s.e}</span>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{s.t}</div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.b}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
