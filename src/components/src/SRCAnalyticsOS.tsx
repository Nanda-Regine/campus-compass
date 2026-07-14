'use client'

import { useState } from 'react'
import { Megaphone, Users2, FileEdit, Info, Heart, Eye, Pin, AlertTriangle, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { AmbientImage } from '@/components/ui/AmbientImage'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Post {
  id: string
  author_id: string
  university: string
  title: string
  body: string
  category: string
  pinned: boolean
  likes_count: number
  views_count: number
  created_at: string
}

interface Member {
  id: string
  user_id: string
  university: string
  role: string
  portfolio: string | null
  bio: string | null
  is_active: boolean
}

interface Props {
  userId: string
  initialPosts: Post[]
  members: Member[]
  isSrcMember: boolean
  university: string
}

type TabId = 'feed' | 'team' | 'post' | 'about'
type CategoryFilter = 'all' | 'announcement' | 'consultation' | 'minutes' | 'event' | 'urgent'

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; pulse?: boolean }> = {
  announcement:  { label: 'Announcement', color: '#60a5fa',  bg: 'rgba(96,165,250,0.15)'  },
  consultation:  { label: 'Consultation', color: '#a78bfa',  bg: 'rgba(167,139,250,0.15)' },
  minutes:       { label: 'Minutes',      color: '#94a3b8',  bg: 'rgba(148,163,184,0.15)' },
  event:         { label: 'Event',        color: '#34d399',  bg: 'rgba(52,211,153,0.15)'  },
  urgent:        { label: 'Urgent',       color: '#f87171',  bg: 'rgba(248,113,113,0.15)', pulse: true },
}

const CATEGORIES: CategoryFilter[] = ['all', 'announcement', 'consultation', 'minutes', 'event', 'urgent']

const VALID_CATEGORIES = ['announcement', 'consultation', 'minutes', 'event', 'urgent'] as const
type PostCategory = typeof VALID_CATEGORIES[number]

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

function excerpt(text: string, max = 150): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

// ── Tab config ────────────────────────────────────────────────────────────────
const TAB_CONFIG: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'feed',  label: 'Feed',  icon: <Megaphone size={14} /> },
  { id: 'team',  label: 'Team',  icon: <Users2 size={14} />    },
  { id: 'post',  label: 'Post',  icon: <FileEdit size={14} />  },
  { id: 'about', label: 'About', icon: <Info size={14} />      },
]

const ACCENT = '#8b5cf6'

// ── Main Component ────────────────────────────────────────────────────────────
export default function SRCAnalyticsOS({ userId, initialPosts, members, isSrcMember, university }: Props) {
  const [tab, setTab] = useState<TabId>('feed')
  const [posts, setPosts] = useState<Post[]>(initialPosts)

  const activeTab = TAB_CONFIG.find(t => t.id === tab)!

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: 96, display: 'flex', position: 'relative', overflowX: 'hidden' }}>
      <AmbientImage zone="community" opacity={0.32} blurPx={2} saturation={1.4} />

      {/* Vertical tab rail */}
      <div style={{
        width: 64, flexShrink: 0,
        position: 'sticky', top: 73,
        height: 'calc(100vh - 73px)',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        borderRight: '0.5px solid var(--border-subtle)',
        background: 'rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
      }}>
        {TAB_CONFIG.map(t => {
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
                background: isActive ? `${ACCENT}14` : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${isActive ? ACCENT : 'transparent'}`,
                color: isActive ? ACCENT : 'rgba(255,255,255,0.58)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                padding: '6px 2px',
              }}
            >
              <span style={{ flexShrink: 0, display: 'flex', opacity: isActive ? 1 : 0.6 }}>{t.icon}</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
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
          background: `linear-gradient(135deg, #3b076420 0%, #6d28d920 100%)`,
          borderBottom: '0.5px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: `linear-gradient(135deg, #3b0764 0%, #6d28d9 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0,
          }}>
            <Megaphone size={14} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {activeTab.label}
            </div>
            {university && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginTop: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {university}
              </div>
            )}
          </div>
          {isSrcMember && (
            <div style={{ marginLeft: 'auto', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: ACCENT, background: `${ACCENT}14`, border: `1px solid ${ACCENT}40`, borderRadius: 6, padding: '2px 7px', letterSpacing: '0.04em' }}>
              SRC MEMBER
            </div>
          )}
        </div>

        {/* Tab content */}
        <div style={{ padding: '16px 16px 0' }}>
          {tab === 'feed' && (
            <FeedTab posts={posts} setPosts={setPosts} userId={userId} />
          )}
          {tab === 'team' && (
            <TeamTab members={members} />
          )}
          {tab === 'post' && (
            <PostTab isSrcMember={isSrcMember} university={university} userId={userId} setPosts={setPosts} />
          )}
          {tab === 'about' && (
            <AboutTab />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Feed Tab ──────────────────────────────────────────────────────────────────
function FeedTab({ posts, setPosts, userId }: { posts: Post[]; setPosts: React.Dispatch<React.SetStateAction<Post[]>>; userId: string }) {
  const [filter, setFilter] = useState<CategoryFilter>('all')
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [loadingLike, setLoadingLike] = useState<string | null>(null)

  const filtered = filter === 'all' ? posts : posts.filter(p => p.category === filter)
  const pinned   = filtered.filter(p => p.pinned)
  const regular  = filtered.filter(p => !p.pinned)
  const ordered  = [...pinned, ...regular]

  async function toggleLike(post: Post) {
    if (loadingLike) return
    setLoadingLike(post.id)
    try {
      const res = await fetch(`/api/src/${post.id}/like`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      const json = await res.json() as { liked: boolean; likes_count: number }
      setLikedIds(prev => {
        const next = new Set(prev)
        json.liked ? next.add(post.id) : next.delete(post.id)
        return next
      })
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: json.likes_count } : p))
    } catch {
      toast.error('Could not update like')
    } finally {
      setLoadingLike(null)
    }
  }

  return (
    <div>
      {/* Category filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {CATEGORIES.map(cat => {
          const isActive = filter === cat
          const cfg = cat === 'all' ? null : CATEGORY_CONFIG[cat]
          const color = cfg?.color ?? ACCENT
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.12)'}`,
                background: isActive ? `${color}18` : 'transparent',
                color: isActive ? color : 'rgba(255,255,255,0.66)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat === 'all' ? 'All' : CATEGORY_CONFIG[cat].label}
            </button>
          )
        })}
      </div>

      {ordered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'rgba(255,255,255,0.5)' }}>
          <Megaphone size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>
            No posts yet
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem' }}>
            Your SRC will share updates here
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ordered.map(post => {
          const cfg = CATEGORY_CONFIG[post.category] ?? CATEGORY_CONFIG.announcement
          const liked = likedIds.has(post.id)
          return (
            <div
              key={post.id}
              className="card-base"
              style={{ padding: 16, position: 'relative' }}
            >
              {/* Pinned badge */}
              {post.pinned && (
                <div style={{
                  position: 'absolute', top: 10, right: 12,
                  display: 'flex', alignItems: 'center', gap: 3,
                  fontSize: '0.63rem', fontFamily: 'var(--font-mono)',
                  color: '#f59e0b', letterSpacing: '0.04em',
                }}>
                  <Pin size={9} />
                  PINNED
                </div>
              )}

              {/* Category badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: cfg.bg,
                  color: cfg.color,
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {post.category === 'urgent' && (
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: cfg.color,
                      display: 'inline-block',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                  )}
                  {cfg.label}
                </span>
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
                  {timeAgo(post.created_at)}
                </span>
              </div>

              {/* Title */}
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '0.92rem',
                color: 'var(--text-primary)',
                marginBottom: 6,
                paddingRight: post.pinned ? 60 : 0,
              }}>
                {post.title}
              </div>

              {/* Body excerpt */}
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.55,
                marginBottom: 12,
              }}>
                {excerpt(post.body)}
              </div>

              {/* Footer: likes + views */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  onClick={() => toggleLike(post)}
                  disabled={loadingLike === post.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'none', border: 'none',
                    color: liked ? '#f87171' : 'rgba(255,255,255,0.55)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    transition: 'color 0.15s ease',
                    padding: 0,
                  }}
                >
                  <Heart size={13} fill={liked ? '#f87171' : 'none'} />
                  {post.likes_count}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                  <Eye size={12} />
                  {post.views_count}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Team Tab ──────────────────────────────────────────────────────────────────
function TeamTab({ members }: { members: Member[] }) {
  return (
    <div>
      {members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'rgba(255,255,255,0.5)' }}>
          <Users2 size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 6, color: 'rgba(255,255,255,0.66)' }}>
            No SRC members registered yet
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem' }}>
            SRC members can register through the Members tab
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {members.map(member => (
            <div key={member.id} className="card-base" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `linear-gradient(135deg, #3b0764 0%, #6d28d9 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>
                🎓
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    SRC Member
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 10,
                    background: 'rgba(139,92,246,0.15)',
                    color: '#8b5cf6',
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}>
                    {member.role}
                  </span>
                </div>
                {member.portfolio && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.58)', marginBottom: 4 }}>
                    Portfolio: {member.portfolio}
                  </div>
                )}
                {member.bio && (
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                    {member.bio}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Join note */}
      <div className="card-base" style={{ padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
        <Info size={15} style={{ color: ACCENT, flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: 3 }}>
            Want to join SRC?
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.66)', lineHeight: 1.5 }}>
            SRC membership is subject to election by your student body. Contact your university's Student Affairs office for information on how to stand for election. Once elected, you can register your profile on this platform.
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Post Tab ──────────────────────────────────────────────────────────────────
function PostTab({
  isSrcMember,
  university,
  userId,
  setPosts,
}: {
  isSrcMember: boolean
  university: string
  userId: string
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>
}) {
  const [title, setTitle]       = useState('')
  const [body, setBody]         = useState('')
  const [category, setCategory] = useState<PostCategory>('announcement')
  const [pinned, setPinned]     = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!isSrcMember) {
    return (
      <div className="card-base" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 8 }}>
          SRC members only
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.62)', lineHeight: 1.55, maxWidth: 280, margin: '0 auto' }}>
          Only active SRC members can publish posts. If you are an elected SRC representative, please register your profile via the Members API.
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimTitle = title.trim()
    const trimBody  = body.trim()
    if (trimTitle.length < 3 || trimTitle.length > 120) {
      toast.error('Title must be 3–120 characters')
      return
    }
    if (trimBody.length < 10 || trimBody.length > 5000) {
      toast.error('Body must be 10–5000 characters')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/src', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimTitle, body: trimBody, category, pinned }),
      })
      const json = await res.json() as { data?: Post; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to post')
      if (json.data) {
        setPosts(prev => [json.data!, ...prev])
      }
      toast.success('Post published!')
      setTitle(''); setBody(''); setCategory('announcement'); setPinned(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not publish post')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 16 }}>
        New Post
      </div>
      <form onSubmit={handleSubmit}>
        <div className="card-base" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Title */}
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)', display: 'block', marginBottom: 6 }}>
              Title *
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Updated NSFAS disbursement schedule"
              maxLength={120}
              required
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.63rem', color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
              {title.length}/120
            </div>
          </div>

          {/* Body */}
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)', display: 'block', marginBottom: 6 }}>
              Body *
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your message to students…"
              rows={6}
              maxLength={5000}
              required
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                lineHeight: 1.6,
              }}
            />
            <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.63rem', color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
              {body.length}/5000
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)', display: 'block', marginBottom: 6 }}>
              Category *
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as PostCategory)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  padding: '10px 36px 10px 12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              >
                {VALID_CATEGORIES.map(cat => (
                  <option key={cat} value={cat} style={{ background: '#1a1a2e' }}>
                    {CATEGORY_CONFIG[cat].label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.58)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Pinned toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                Pin this post
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.58)' }}>
                Pinned posts appear at the top of the feed
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPinned(!pinned)}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: pinned ? ACCENT : 'rgba(255,255,255,0.1)',
                border: 'none', cursor: 'pointer',
                position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute', top: 3,
                left: pinned ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s ease',
              }} />
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '12px',
              borderRadius: 12,
              background: submitting ? 'rgba(139,92,246,0.4)' : `linear-gradient(135deg, #3b0764 0%, #6d28d9 100%)`,
              border: 'none',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s ease',
            }}
          >
            {submitting ? 'Publishing…' : 'Publish Post'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── About Tab ─────────────────────────────────────────────────────────────────
function AboutTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* What is SRC */}
      <div className="card-base" style={{ padding: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: ACCENT, marginBottom: 8 }}>
          What is the SRC?
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
          The Student Representative Council (SRC) is the elected body that represents all students at your institution. Established under the Higher Education Act of 1997, the SRC serves as the official liaison between students and university management. Members are elected annually and serve on committees ranging from academic affairs to student welfare.
        </div>
      </div>

      {/* Student Rights */}
      <div className="card-base" style={{ padding: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: ACCENT, marginBottom: 10 }}>
          Your Student Rights
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { right: 'Right to quality education', detail: 'All students are entitled to quality higher education and equal access to learning resources.' },
            { right: 'Right to representation', detail: 'You have the right to elect SRC members and to be heard through your elected representatives.' },
            { right: 'Freedom of expression', detail: 'You may express opinions and concerns through legitimate channels including petitions, meetings, and the SRC.' },
            { right: 'Access to support services', detail: 'Financial aid (NSFAS), counselling, health services, and housing assistance must be accessible to all.' },
            { right: 'Academic due process', detail: 'You have the right to appeal academic decisions, disciplinary rulings, and exclusions.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, flexShrink: 0, marginTop: 6 }} />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: 2 }}>{item.right}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.73rem', color: 'rgba(255,255,255,0.66)', lineHeight: 1.5 }}>{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to petition */}
      <div className="card-base" style={{ padding: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: ACCENT, marginBottom: 10 }}>
          How to Petition
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Identify the issue and gather support from fellow students.',
            'Draft a clear, concise petition with specific demands.',
            'Collect signatures — both physical and digital (WhatsApp groups, online forms).',
            'Submit the petition to your SRC in writing.',
            'The SRC is required to respond within a reasonable timeframe and escalate to management if needed.',
            'Follow up in the next SRC meeting minutes, published in the Feed tab.',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: `${ACCENT}20`, border: `1px solid ${ACCENT}40`,
                color: ACCENT, fontFamily: 'var(--font-mono)',
                fontSize: '0.63rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 1,
              }}>
                {i + 1}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, flex: 1 }}>
                {step}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact your SRC */}
      <div className="card-base" style={{ padding: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: ACCENT, marginBottom: 10 }}>
          Contact Your SRC
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 12 }}>
          There are several ways to reach your SRC and have your voice heard:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { method: 'SRC Office', detail: 'Visit the SRC office on campus — check your university website for location and office hours.' },
            { method: 'Email', detail: 'Most universities publish the SRC email address on the student portal or university website.' },
            { method: 'Social Media', detail: 'Follow your SRC on Instagram, Facebook, or Twitter for real-time announcements.' },
            { method: 'SRC Meetings', detail: 'SRC general meetings are open to all students. Check the Feed tab for upcoming meeting dates.' },
            { method: 'WhatsApp Groups', detail: 'Many SRCs manage student WhatsApp groups per faculty or residence — ask at Student Affairs.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertTriangle size={12} style={{ color: ACCENT, flexShrink: 0, marginTop: 3, opacity: 0.7 }} />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.77rem', color: 'var(--text-primary)', marginBottom: 1 }}>{item.method}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.62)', lineHeight: 1.5 }}>{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
