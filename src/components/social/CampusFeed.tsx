'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Heart, MessageCircle, Trash2, ChevronDown, ChevronUp, Globe, Building2, MoreHorizontal, Flag } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'general' | 'opportunity' | 'academic' | 'campus' | 'sell_swap'

interface Post {
  id: string
  content: string
  category: Category
  institution: string | null
  created_at: string
  user_id: string
  author_name: string
  author_emoji: string
  is_own: boolean
  reaction_count: number
  reacted: boolean
  comment_count: number
}

interface Comment {
  id: string
  content: string
  created_at: string
  author_name: string
  author_emoji: string
  is_own: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: Category | ''; label: string; icon: string; color: string }[] = [
  { value: '',           label: 'All',        icon: '✦',  color: '#7090d0' },
  { value: 'general',    label: 'General',    icon: '💬', color: '#7090d0' },
  { value: 'opportunity',label: 'Opportunity',icon: '💼', color: '#4ecf9e' },
  { value: 'academic',   label: 'Academic',   icon: '📚', color: '#8b5cf6' },
  { value: 'campus',     label: 'Campus',     icon: '🏫', color: '#0d9488' },
  { value: 'sell_swap',  label: 'Sell/Swap',  icon: '🔁', color: '#c9a84c' },
]

const CAT_META: Record<Category, { label: string; icon: string; color: string }> = {
  general:     { label: 'General',    icon: '💬', color: '#7090d0' },
  opportunity: { label: 'Opportunity',icon: '💼', color: '#4ecf9e' },
  academic:    { label: 'Academic',   icon: '📚', color: '#8b5cf6' },
  campus:      { label: 'Campus',     icon: '🏫', color: '#0d9488' },
  sell_swap:   { label: 'Sell/Swap',  icon: '🔁', color: '#c9a84c' },
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

const REPORT_REASONS: { value: string; label: string }[] = [
  { value: 'spam',           label: 'Spam / scam' },
  { value: 'harassment',     label: 'Harassment' },
  { value: 'hate_speech',    label: 'Hate speech' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other',          label: 'Other' },
]

function PostCard({
  post,
  onDelete,
  onReact,
}: {
  post: Post
  onDelete: (id: string) => void
  onReact: (id: string, current: boolean) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments]         = useState<Comment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [newComment, setNewComment]     = useState('')
  const [posting, setPosting]           = useState(false)
  const [localCount, setLocalCount]     = useState(post.comment_count)
  const [showMenu, setShowMenu]         = useState(false)
  const [reporting, setReporting]       = useState(false)
  const menuRef                         = useRef<HTMLDivElement>(null)
  const meta = CAT_META[post.category]

  useEffect(() => {
    if (!showMenu) return
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showMenu])

  async function handleReport(reason: string) {
    setShowMenu(false)
    setReporting(true)
    try {
      const res = await fetch('/api/feed/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id, reason }),
        signal: AbortSignal.timeout(10000),
      })
      if (res.ok) toast.success('Report submitted — thank you')
      else toast.error('Could not submit report')
    } catch (err) {
      console.error('[CampusFeed] reportPost:', err)
      toast.error('Could not submit report')
    } finally {
      setReporting(false)
    }
  }

  async function loadComments() {
    if (commentsLoaded) return
    try {
      const res = await fetch(`/api/feed/${post.id}/comments`, { signal: AbortSignal.timeout(10000) })
      if (res.ok) {
        const d = await res.json()
        setComments(d.comments ?? [])
      }
      setCommentsLoaded(true)
    } catch { /* timeout or network error — leave commentsLoaded false so user can retry */ }
  }

  function toggleComments() {
    if (!showComments) loadComments()
    setShowComments(v => !v)
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    setPosting(true)
    try {
      const res = await fetch(`/api/feed/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) throw new Error()
      const { comment } = await res.json()
      setComments(prev => [...prev, { ...comment, author_name: 'You', author_emoji: '🎓', is_own: true }])
      setLocalCount(c => c + 1)
      setNewComment('')
    } catch (err) {
      console.error('[CampusFeed] postComment:', err)
      toast.error('Could not post comment')
    } finally {
      setPosting(false)
    }
  }

  return (
    <article style={{
      borderRadius: 16,
      background: 'rgba(255,255,255,0.05)',
      border: '0.5px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
      transition: 'border-color 0.15s ease',
    }}>
      {/* Top accent bar */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${meta.color}60, transparent)` }} />

      <div style={{ padding: '14px 16px' }}>
        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
              {post.author_emoji}
            </div>
            <div>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.82rem', color: '#fff', margin: 0 }}>
                {post.author_name}
              </p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#fff', margin: 0 }}>
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                {post.institution ? ` · ${post.institution.split(' ').slice(0, 2).join(' ')}` : ''}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
              padding: '2px 8px', borderRadius: 9999,
              background: `${meta.color}15`, border: `0.5px solid ${meta.color}35`,
              color: meta.color,
            }}>
              {meta.icon} {meta.label}
            </span>
            {post.is_own ? (
              <button
                onClick={() => { if (confirm('Delete this post?')) onDelete(post.id) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4, display: 'flex', alignItems: 'center' }}
              >
                <Trash2 size={13} />
              </button>
            ) : (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowMenu(v => !v)}
                  disabled={reporting}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4, display: 'flex', alignItems: 'center' }}
                >
                  <MoreHorizontal size={13} />
                </button>
                {showMenu && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, zIndex: 40,
                    background: '#1a1a2e', border: '0.5px solid rgba(255,255,255,0.12)',
                    borderRadius: 10, padding: '4px 0', minWidth: 148,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.63rem', color: '#fff', padding: '6px 12px 4px', margin: 0 }}>
                      REPORT POST
                    </p>
                    {REPORT_REASONS.map(r => (
                      <button
                        key={r.value}
                        onClick={() => handleReport(r.value)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          width: '100%', background: 'none', border: 'none',
                          cursor: 'pointer', padding: '7px 12px',
                          color: '#fff',
                          fontFamily: 'DM Sans, sans-serif', fontSize: '0.77rem',
                          textAlign: 'left',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <Flag size={11} style={{ color: '#f87171', flexShrink: 0 }} />
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.88rem', lineHeight: 1.65, color: '#fff', margin: '0 0 12px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {post.content}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => onReact(post.id, post.reacted)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              color: post.reacted ? '#f43f5e' : 'rgba(255,255,255,0.55)',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem',
              padding: 0, transition: 'color 0.15s ease',
            }}
          >
            <Heart size={15} fill={post.reacted ? '#f43f5e' : 'none'} />
            {post.reaction_count > 0 && post.reaction_count}
          </button>
          <button
            onClick={toggleComments}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              color: showComments ? '#7090d0' : 'rgba(255,255,255,0.55)',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem',
              padding: 0, transition: 'color 0.15s ease',
            }}
          >
            <MessageCircle size={15} />
            {localCount > 0 ? localCount : 'Reply'}
            {showComments ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* Comments thread */}
      {showComments && (
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!commentsLoaded && (
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#fff', margin: 0 }}>Loading...</p>
            )}
            {commentsLoaded && comments.length === 0 && (
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', color: '#fff', margin: 0 }}>No replies yet — be the first.</p>
            )}
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.9rem', flexShrink: 0, marginTop: 1 }}>{c.author_emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: '#fff', marginRight: 6 }}>{c.author_name}</span>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', color: '#fff', lineHeight: 1.5, wordBreak: 'break-word' }}>{c.content}</span>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.63rem', color: '#fff', margin: '2px 0 0 0' }}>
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* Comment composer */}
          <form onSubmit={submitComment} style={{ padding: '8px 16px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Write a reply..."
              maxLength={300}
              style={{
                flex: 1, padding: '8px 12px',
                background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: 20, color: '#fff', fontSize: '0.78rem',
                fontFamily: 'DM Sans, sans-serif', outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={posting || !newComment.trim()}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: newComment.trim() ? '#7090d0' : 'rgba(255,255,255,0.07)',
                color: newComment.trim() ? '#fff' : 'rgba(255,255,255,0.45)',
                cursor: newComment.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease', flexShrink: 0,
              }}
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </article>
  )
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function PostComposer({ institution, onPosted }: { institution: string | null; onPosted: (post: Post) => void }) {
  const [content, setContent]   = useState('')
  const [category, setCategory] = useState<Category>('general')
  const [open, setOpen]         = useState(false)
  const [posting, setPosting]   = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleFocus() {
    setOpen(true)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setPosting(true)
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), category }),
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      const { post } = await res.json()
      onPosted({
        ...post,
        author_name: 'You', author_emoji: '🎓',
        is_own: true, reaction_count: 0, reacted: false, comment_count: 0,
      })
      setContent('')
      setOpen(false)
      toast.success('Posted!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Post failed')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div style={{ borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 16 }}>
      {!open ? (
        <button
          onClick={handleFocus}
          style={{
            width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🎓</div>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: '#fff' }}>
            Share something with {institution ? `your campus` : 'SA students'}...
          </span>
        </button>
      ) : (
        <form onSubmit={handlePost} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`What's on your mind? Share a tip, opportunity, or question with ${institution ? 'your campus' : 'SA students'}...`}
            maxLength={500}
            rows={3}
            style={{
              width: '100%', padding: '10px 12px', resize: 'none',
              background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.1)',
              borderRadius: 12, color: '#fff', fontSize: '0.85rem',
              fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box',
              lineHeight: 1.6,
            }}
          />
          {/* Category chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.slice(1).map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value as Category)}
                style={{
                  padding: '4px 10px', borderRadius: 9999, border: '0.5px solid',
                  borderColor: category === c.value ? c.color : 'rgba(255,255,255,0.1)',
                  background: category === c.value ? `${c.color}18` : 'transparent',
                  color: category === c.value ? c.color : 'rgba(255,255,255,0.58)',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: content.length > 450 ? '#f59e0b' : 'rgba(255,255,255,0.2)' }}>
              {content.length}/500
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => { setOpen(false); setContent('') }} style={{ padding: '7px 14px', borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.1)', background: 'none', color: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={posting || !content.trim()}
                style={{
                  padding: '7px 16px', borderRadius: 10, border: 'none',
                  background: content.trim() ? '#7090d0' : 'rgba(255,255,255,0.07)',
                  color: content.trim() ? '#fff' : 'rgba(255,255,255,0.45)',
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.78rem',
                  cursor: content.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <Send size={13} /> {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Main feed component ──────────────────────────────────────────────────────

interface Props {
  institution: string | null
}

export default function CampusFeed({ institution }: Props) {
  const [posts, setPosts]           = useState<Post[]>([])
  const [loading, setLoading]       = useState(true)
  const [scope, setScope]           = useState<'campus' | 'all'>(institution ? 'campus' : 'all')
  const [category, setCategory]     = useState<Category | ''>('')
  const [hasMore, setHasMore]       = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const cursorRef = useRef<string>('')

  const fetchPosts = useCallback(async (reset = false) => {
    if (reset) { setLoading(true); cursorRef.current = '' }
    else setLoadingMore(true)

    const params = new URLSearchParams({ scope })
    if (category) params.set('category', category)
    if (!reset && cursorRef.current) params.set('cursor', cursorRef.current)

    try {
      const res = await fetch(`/api/feed?${params}`, { signal: AbortSignal.timeout(10000) })
      if (!res.ok) return
      const { posts: fetched } = await res.json() as { posts: Post[] }
      if (reset) {
        setPosts(fetched)
      } else {
        setPosts(prev => [...prev, ...fetched])
      }
      setHasMore(fetched.length === 20)
      if (fetched.length > 0) cursorRef.current = fetched[fetched.length - 1].created_at
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [scope, category])

  useEffect(() => { fetchPosts(true) }, [fetchPosts])

  // ─── Real-time: prepend new posts from other members live ─────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('campus_posts_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'campus_posts' },
        (payload) => {
          const newRow = payload.new as Record<string, unknown>
          // Scope filter: skip campus posts from other institutions
          if (scope === 'campus' && institution && newRow.institution !== institution) return
          // Re-fetch the full post (with author join + reaction counts)
          fetch(`/api/feed?id=${newRow.id}`, { signal: AbortSignal.timeout(10000) })
            .then(r => r.ok ? r.json() : null)
            .then((data: { post?: Post } | null) => {
              if (data?.post) {
                setPosts(prev => {
                  // Don't duplicate if we already have it (e.g. from our own post)
                  if (prev.some(p => p.id === data.post!.id)) return prev
                  return [data.post!, ...prev]
                })
              }
            })
            .catch(() => {/* non-fatal */})
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'campus_posts' },
        (payload) => {
          setPosts(prev => prev.filter(p => p.id !== (payload.old as { id: string }).id))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [scope, institution])

  function handleDelete(id: string) {
    fetch(`/api/feed?id=${id}`, { method: 'DELETE', signal: AbortSignal.timeout(10000) }).catch(() => {})
    setPosts(prev => prev.filter(p => p.id !== id))
    toast.success('Post deleted')
  }

  function handleReact(id: string, currentlyReacted: boolean) {
    setPosts(prev => prev.map(p =>
      p.id !== id ? p : {
        ...p,
        reacted: !currentlyReacted,
        reaction_count: currentlyReacted ? p.reaction_count - 1 : p.reaction_count + 1,
      }
    ))
    fetch('/api/feed/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: id }),
      signal: AbortSignal.timeout(10000),
    }).catch(() => {})
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 100px 0' }}>

      {/* Scope toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button
          onClick={() => setScope('campus')}
          disabled={!institution}
          style={{
            flex: 1, padding: '9px', borderRadius: 12, border: '0.5px solid',
            borderColor: scope === 'campus' ? '#0d9488' : 'rgba(255,255,255,0.08)',
            background: scope === 'campus' ? 'rgba(13,148,136,0.12)' : 'rgba(255,255,255,0.06)',
            color: scope === 'campus' ? '#5eead4' : 'rgba(255,255,255,0.55)',
            fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', fontWeight: scope === 'campus' ? 700 : 400,
            cursor: institution ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <Building2 size={13} />
          My Campus
        </button>
        <button
          onClick={() => setScope('all')}
          style={{
            flex: 1, padding: '9px', borderRadius: 12, border: '0.5px solid',
            borderColor: scope === 'all' ? '#7090d0' : 'rgba(255,255,255,0.08)',
            background: scope === 'all' ? 'rgba(112,144,208,0.12)' : 'rgba(255,255,255,0.06)',
            color: scope === 'all' ? '#93c5fd' : 'rgba(255,255,255,0.55)',
            fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', fontWeight: scope === 'all' ? 700 : 400,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <Globe size={13} />
          All SA Students
        </button>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value as Category | '')}
            style={{
              flexShrink: 0, padding: '5px 12px', borderRadius: 9999, border: '0.5px solid',
              borderColor: category === c.value ? c.color : 'rgba(255,255,255,0.08)',
              background: category === c.value ? `${c.color}15` : 'transparent',
              color: category === c.value ? c.color : 'rgba(255,255,255,0.55)',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
              cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap',
            }}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Composer */}
      <PostComposer institution={institution} onPosted={post => setPosts(prev => [post, ...prev])} />

      {/* Feed */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 110, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <p style={{ fontSize: '2rem', marginBottom: 12 }}>📣</p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: 6 }}>Be the first to post</p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', color: '#fff', maxWidth: 280, margin: '0 auto' }}>
            Share a tip, post an opportunity, or start a conversation with students at your campus.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {posts.map(post => (
            <PostCard key={post.id} post={post} onDelete={handleDelete} onReact={handleReact} />
          ))}
          {hasMore && (
            <button
              onClick={() => fetchPosts(false)}
              disabled={loadingMore}
              style={{
                padding: '12px', borderRadius: 12, border: '0.5px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.06)', color: '#fff',
                fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem',
                cursor: 'pointer', width: '100%', marginTop: 4,
              }}
            >
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
