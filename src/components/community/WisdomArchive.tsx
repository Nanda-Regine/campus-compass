'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { dispatchXP } from '@/lib/xp-engine'

// ── Types ─────────────────────────────────────────────────────────────────────
type WisdomCategory =
  | 'nsfas'
  | 'study_tips'
  | 'campus_life'
  | 'accommodation'
  | 'lecturer'
  | 'admin'
  | 'wellness'
  | 'finance'
  | 'general'

type Tab = 'browse' | 'post' | 'mine'

interface WisdomPost {
  id: string
  user_id?: string
  category: WisdomCategory
  title: string
  content: string
  upvotes: number
  is_verified?: boolean
  is_anonymous?: boolean
  institution?: string
  created_at?: string
  isSeed?: boolean
}

interface PostForm {
  title: string
  content: string
  category: WisdomCategory
  is_anonymous: boolean
}

// ── Category Config ───────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<WisdomCategory, { label: string; icon: string; color: string }> = {
  nsfas:         { label: 'NSFAS',       icon: '💰', color: '#fbbf24' },
  study_tips:    { label: 'Study Tips',  icon: '📚', color: '#4ecf9e' },
  campus_life:   { label: 'Campus Life', icon: '🏛️', color: '#60a5fa' },
  accommodation: { label: 'Housing',     icon: '🏠', color: '#a78bfa' },
  lecturer:      { label: 'Lecturers',   icon: '👨‍🏫', color: '#f472b6' },
  admin:         { label: 'Admin',       icon: '📋', color: '#fb923c' },
  wellness:      { label: 'Wellness',    icon: '💚', color: '#34d399' },
  finance:       { label: 'Finance',     icon: '🏦', color: '#fbbf24' },
  general:       { label: 'General',     icon: '💬', color: '#9ca3af' },
}

// ── Seed Posts ────────────────────────────────────────────────────────────────
const SEED_POSTS: WisdomPost[] = [
  {
    id: 'seed1',
    category: 'nsfas',
    title: 'How I successfully appealed a NSFAS late payment',
    content:
      'I submitted: 1) Bank statement showing no payment, 2) Proof of registration, 3) NSFAS correspondence. Go to financial aid office in person — do NOT just email. Take a friend for support. Appeal ref number came within 3 days.',
    upvotes: 47,
    is_verified: true,
    institution: 'Multiple universities',
    isSeed: true,
  },
  {
    id: 'seed2',
    category: 'study_tips',
    title: 'UNISA myUnisa submission: always use Chrome on desktop',
    content:
      'I lost marks twice submitting from my phone. The site breaks on mobile and doesn\'t always confirm. Submit from a campus computer lab or Chrome desktop only. Submit 24 hours before the deadline in case of technical issues.',
    upvotes: 89,
    is_verified: true,
    institution: 'UNISA',
    isSeed: true,
  },
  {
    id: 'seed3',
    category: 'admin',
    title: 'Wits financial aid office: go at 7am',
    content:
      'Queue builds by 8:30am and you can wait 3–4 hours. Arrive at 7am when doors open. Bring all documents in a folder. They\'re actually really helpful — just overwhelmed.',
    upvotes: 62,
    institution: 'University of the Witwatersrand (Wits)',
    isSeed: true,
  },
  {
    id: 'seed4',
    category: 'campus_life',
    title: 'Free data at taxi ranks and libraries',
    content:
      'ConnectZA provides free Wi-Fi at most major taxi ranks and public libraries. 20 minutes free, reconnect after. Great for downloading lecture slides before data runs out.',
    upvotes: 134,
    is_verified: true,
    institution: 'Multiple universities',
    isSeed: true,
  },
  {
    id: 'seed5',
    category: 'wellness',
    title: 'UCT student psychologist is free — but book 2 weeks ahead',
    content:
      'UCT Student Wellness offers free sessions with a psychologist. The wait is usually 2 weeks. Book as soon as you feel you need it, not when it\'s urgent. Call 021 650 5083.',
    upvotes: 78,
    institution: 'University of Cape Town (UCT)',
    isSeed: true,
  },
  {
    id: 'seed6',
    category: 'accommodation',
    title: 'How to get out of a bad res situation',
    content:
      'Document everything in writing. Email Student Housing, CC your SRC rep. If unresolved in 5 days, escalate to Dean of Students. They have emergency accommodation options they don\'t advertise.',
    upvotes: 41,
    institution: 'Multiple universities',
    isSeed: true,
  },
  {
    id: 'seed7',
    category: 'finance',
    title: 'Capitec has the best student fees — switch before you lose money',
    content:
      'I was paying R72/month at Absa. Capitec is R7.50/month with unlimited app transactions. Switching took 30 minutes. My savings: R768/year — that\'s almost a month of food.',
    upvotes: 93,
    institution: 'Multiple universities',
    isSeed: true,
  },
  {
    id: 'seed8',
    category: 'study_tips',
    title: 'The Pomodoro method actually works for ADHD',
    content:
      'I was diagnosed with ADHD and couldn\'t study for more than 10 minutes. 25 min on, 5 min off changed everything. Set phone face down in another room. The key is the PHYSICAL break — get up, move.',
    upvotes: 56,
    institution: 'Multiple universities',
    isSeed: true,
  },
]

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

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({
  post,
  userId,
  votedIds,
  onVote,
  onDelete,
  isOwn,
}: {
  post: WisdomPost
  userId: string
  votedIds: Set<string>
  onVote: (id: string) => void
  onDelete?: (id: string) => void
  isOwn?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = CATEGORY_CONFIG[post.category]
  const hasVoted = votedIds.has(post.id)

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
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Category badge */}
          <span
            style={{
              background: `${cfg.color}20`,
              color: cfg.color,
              border: `1px solid ${cfg.color}40`,
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {cfg.icon} {cfg.label}
          </span>
          {post.is_verified && (
            <span
              style={{
                background: '#34d39920',
                color: '#34d399',
                border: '1px solid #34d39940',
                borderRadius: '20px',
                padding: '2px 8px',
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              Verified
            </span>
          )}
          {post.isSeed && (
            <span
              style={{
                background: 'rgba(99,102,241,0.15)',
                color: '#818cf8',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '20px',
                padding: '2px 8px',
                fontSize: '10px',
              }}
            >
              Pinned
            </span>
          )}
        </div>
        {isOwn && onDelete && (
          <button
            onClick={() => onDelete(post.id)}
            style={{
              background: 'rgba(239,68,68,0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
              padding: '3px 8px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        )}
      </div>

      {/* Title */}
      <p style={{ margin: 0, color: '#e5e7eb', fontWeight: 600, fontSize: '15px', lineHeight: '1.4' }}>
        {post.title}
      </p>

      {/* Content */}
      <div>
        <p
          style={{
            margin: 0,
            color: '#9ca3af',
            fontSize: '13px',
            lineHeight: '1.6',
            display: '-webkit-box',
            WebkitLineClamp: expanded ? undefined : 3,
            WebkitBoxOrient: 'vertical' as const,
            overflow: expanded ? 'visible' : 'hidden',
          }}
        >
          {post.content}
        </p>
        {post.content.length > 120 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', color: '#34d399', fontSize: '12px', cursor: 'pointer', padding: '4px 0 0' }}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Upvote */}
          <button
            onClick={() => onVote(post.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: hasVoted ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)',
              border: hasVoted ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '4px 12px',
              cursor: post.isSeed ? 'default' : 'pointer',
              color: hasVoted ? '#34d399' : '#9ca3af',
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
          >
            <span>{hasVoted ? '✓' : '↑'}</span>
            <span style={{ fontWeight: 600 }}>{post.upvotes}</span>
          </button>
          {post.institution && (
            <span style={{ color: '#6b7280', fontSize: '11px' }}>
              {post.institution}
            </span>
          )}
        </div>
        {post.created_at && (
          <span style={{ color: '#4b5563', fontSize: '11px' }}>{timeAgo(post.created_at)}</span>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function WisdomArchive({
  userId,
  university,
}: {
  userId: string
  university: string | null
}) {
  const supabase = createClient()

  const [posts, setPosts] = useState<WisdomPost[]>([])
  const [tab, setTab] = useState<Tab>('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<WisdomCategory | 'all'>('all')
  const [myUniOnly, setMyUniOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())
  const [postForm, setPostForm] = useState<PostForm>({
    title: '',
    content: '',
    category: 'general',
    is_anonymous: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (myUniOnly && university) params.set('institution', university)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      const res = await fetch(`/api/community/wisdom?${params.toString()}`)
      const json = await res.json() as { data?: WisdomPost[]; error?: string }
      if (json.error) throw new Error(json.error)
      // Seed posts first, then DB posts (de-dup seeds)
      const dbPosts: WisdomPost[] = (json.data ?? []).map((p) => ({ ...p, isSeed: false }))
      const filtered = SEED_POSTS.filter(
        (s) =>
          (categoryFilter === 'all' || s.category === categoryFilter) &&
          (!myUniOnly || !university || s.institution === university || s.institution === 'Multiple universities')
      )
      setPosts([...filtered, ...dbPosts])

      // Load voted IDs from localStorage
      const stored = localStorage.getItem(`wisdom_votes_${userId}`)
      if (stored) setVotedIds(new Set(JSON.parse(stored) as string[]))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts')
      // Still show seeds
      setPosts(SEED_POSTS)
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, myUniOnly, university, userId])

  useEffect(() => {
    void loadPosts()
  }, [loadPosts])

  async function handleVote(postId: string) {
    if (votedIds.has(postId)) return
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p))
    )
    const next = new Set(votedIds)
    next.add(postId)
    setVotedIds(next)
    localStorage.setItem(`wisdom_votes_${userId}`, JSON.stringify([...next]))

    if (postId.startsWith('seed')) return // Don't persist seed votes to DB

    try {
      await supabase.from('wisdom_votes').insert({ post_id: postId, user_id: userId })
      // Fetch current upvote count and increment it
      const { data: current } = await supabase
        .from('wisdom_posts')
        .select('upvotes')
        .eq('id', postId)
        .maybeSingle()
      if (current) {
        await supabase
          .from('wisdom_posts')
          .update({ upvotes: (current as { upvotes: number }).upvotes + 1 })
          .eq('id', postId)
      }
    } catch {
      // Best effort
    }
    dispatchXP('wellness_checkin') // community contribution XP
  }

  async function handleDelete(postId: string) {
    if (!confirm('Delete this post?')) return
    const { error: err } = await supabase.from('wisdom_posts').delete().eq('id', postId).eq('user_id', userId)
    if (!err) setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!postForm.title.trim() || !postForm.content.trim()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/community/wisdom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...postForm,
          institution: university ?? 'Multiple universities',
          upvotes: 0,
        }),
      })
      const json = await res.json() as { data?: WisdomPost; error?: string }
      if (json.error) throw new Error(json.error)
      if (json.data) setPosts((prev) => [json.data!, ...prev])
      setPostForm({ title: '', content: '', category: 'general', is_anonymous: true })
      setSubmitSuccess(true)
      setTab('mine')
      dispatchXP('task_complete')
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to post')
    } finally {
      setSubmitting(false)
    }
  }

  // Filtered + searched posts
  const displayPosts = posts.filter((p) => {
    const matchesTab = tab === 'mine' ? p.user_id === userId : true
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const categories = Object.entries(CATEGORY_CONFIG) as [WisdomCategory, { label: string; icon: string; color: string }][]

  return (
    <div
      style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb' }}
      className="pb-24"
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(52,211,153,0.12) 0%, rgba(16,185,129,0.06) 100%)',
          borderBottom: '1px solid rgba(52,211,153,0.15)',
          padding: '24px 16px 20px',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '28px' }}>🧠</span>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#e5e7eb' }}>
              Student Wisdom Archive
            </h1>
          </div>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
            Real tips from real students. No marketing. No fluff. Just what works.
          </p>
        </div>
      </div>

      {/* Tab Bar */}
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
          {(['browse', 'post', 'mine'] as Tab[]).map((t) => (
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
              {t === 'browse' ? 'Browse' : t === 'post' ? '+ Share Wisdom' : 'My Posts'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto" style={{ padding: '16px' }}>
        {/* BROWSE TAB */}
        {(tab === 'browse' || tab === 'mine') && (
          <>
            {/* Search */}
            {tab === 'browse' && (
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Search tips, topics, advice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
            )}

            {/* Category pills */}
            {tab === 'browse' && (
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  paddingBottom: '6px',
                  marginBottom: '10px',
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
                    background: categoryFilter === 'all' ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)',
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
                      border: categoryFilter === key ? `1px solid ${cfg.color}` : '1px solid rgba(255,255,255,0.1)',
                      background: categoryFilter === key ? `${cfg.color}20` : 'rgba(255,255,255,0.04)',
                      color: categoryFilter === key ? cfg.color : '#9ca3af',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                ))}
              </div>
            )}

            {/* My university toggle */}
            {tab === 'browse' && university && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                <button
                  onClick={() => setMyUniOnly(false)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    border: !myUniOnly ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                    background: !myUniOnly ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
                    color: !myUniOnly ? '#34d399' : '#9ca3af',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  All universities
                </button>
                <button
                  onClick={() => setMyUniOnly(true)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    border: myUniOnly ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                    background: myUniOnly ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
                    color: myUniOnly ? '#34d399' : '#9ca3af',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  My university
                </button>
              </div>
            )}

            {/* Post list */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading wisdom...</div>
            ) : error ? (
              <div
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#f87171',
                  fontSize: '13px',
                  marginBottom: '12px',
                }}
              >
                {error} — showing cached posts
              </div>
            ) : null}

            {displayPosts.length === 0 && !loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                {tab === 'mine' ? 'You haven\'t posted any wisdom yet.' : 'No posts found.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {displayPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    userId={userId}
                    votedIds={votedIds}
                    onVote={handleVote}
                    onDelete={tab === 'mine' ? handleDelete : undefined}
                    isOwn={tab === 'mine'}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* POST TAB */}
        {tab === 'post' && (
          <form onSubmit={(e) => { void handleSubmit(e) }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                background: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.15)',
                borderRadius: '12px',
                padding: '12px 14px',
              }}
            >
              <p style={{ margin: 0, color: '#34d399', fontSize: '13px', fontWeight: 600 }}>
                Share what you know
              </p>
              <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '12px' }}>
                Your tip could save another student hours of stress. Be specific and honest.
              </p>
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
                placeholder="One clear sentence that captures your tip..."
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

            {/* Category */}
            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
                Category *
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {categories.map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPostForm((f) => ({ ...f, category: key }))}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      border: postForm.category === key ? `1px solid ${cfg.color}` : '1px solid rgba(255,255,255,0.1)',
                      background: postForm.category === key ? `${cfg.color}20` : 'rgba(255,255,255,0.04)',
                      color: postForm.category === key ? cfg.color : '#9ca3af',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>
                Details *
              </label>
              <textarea
                value={postForm.content}
                onChange={(e) => setPostForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Give all the details. What exactly should a student do? Numbers, contacts, steps — be specific."
                rows={5}
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

            {/* Anonymous toggle */}
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
                Wisdom shared! Thank you for helping fellow students.
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !postForm.title.trim() || !postForm.content.trim()}
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
              {submitting ? 'Sharing...' : 'Share Wisdom'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
