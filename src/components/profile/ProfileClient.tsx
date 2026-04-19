'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import TopBar from '@/components/layout/TopBar'
import ReferralWidget from '@/components/referral/ReferralWidget'
import { FeedbackModal } from '@/components/feedback/FeedbackModal'
import { SA_UNIVERSITIES, SA_LANGUAGES } from '@/types'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProfileData {
  id: string
  name: string
  email: string | null
  emoji: string
  university: string | null
  year_of_study: string | null
  faculty: string | null
  funding_type: string | null
  dietary_pref: string | null
  living_situation: string | null
  ai_language: string | null
  is_premium: boolean
  premium_until: string | null
  avatar_url: string | null
  created_at: string
}

interface Stats {
  novaMessagesUsed: number
  novaLimit: number | null
  totalStudyMinutesThisMonth: number
  referralCount: number
  referralCredits: number
  referralCode: string | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

const YEAR_OPTIONS = ['1st year', '2nd year', '3rd year', '4th year', '5th year', 'Honours', 'Masters', 'PhD', 'Other']

const FUNDING_OPTIONS = [
  { value: 'nsfas',       label: 'NSFAS' },
  { value: 'bursary',     label: 'Bursary' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'family',      label: 'Family Support' },
  { value: 'self_funded', label: 'Self-Funded' },
  { value: 'other',       label: 'Other / Mixed' },
]

const DIETARY_OPTIONS = ['No restrictions', 'Vegetarian', 'Vegan', 'Halaal', 'Kosher', 'Gluten-free', 'Other']

const LIVING_OPTIONS = ['On-campus res', 'Off-campus rent', 'At home (family)', 'Private student accommodation', 'Other']

const EMOJI_OPTIONS = ['🎓', '📚', '🌟', '⚡', '🔥', '💡', '🚀', '🎯', '🧠', '🌍', '✨', '💪']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, colour }: { label: string; value: string; sub?: string; colour: string }) {
  return (
    <div className="rounded-xl p-4 flex flex-col" style={{ background: '#161009', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="font-mono text-[0.55rem] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
      <p className="font-display font-black text-xl" style={{ color: colour }}>{value}</p>
      {sub && <p className="font-mono text-[0.55rem] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{sub}</p>}
    </div>
  )
}

function SelectField({ label, value, options, onChange }: {
  label: string
  value: string
  options: { value: string; label: string }[] | string[]
  onChange: (v: string) => void
}) {
  const normalised = (options as (string | { value: string; label: string })[]).map(o =>
    typeof o === 'string' ? { value: o, label: o } : o
  )
  return (
    <div>
      <label className="font-mono text-[0.6rem] uppercase tracking-widest block mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl px-3 py-2.5 font-display text-sm text-white outline-none appearance-none"
        style={{ background: '#161009', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <option value="">Not set</option>
        {normalised.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfileClient() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Editable fields
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎓')
  const [university, setUniversity] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')
  const [faculty, setFaculty] = useState('')
  const [fundingType, setFundingType] = useState('')
  const [dietaryPref, setDietaryPref] = useState('')
  const [livingSituation, setLivingSituation] = useState('')
  const [aiLanguage, setAiLanguage] = useState('')

  const [activeSection, setActiveSection] = useState<'profile' | 'preferences' | 'account'>('profile')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.error) return
        const p: ProfileData = data.profile
        setProfile(p)
        setStats(data.stats)
        // Populate form
        setName(p.name ?? '')
        setEmoji(p.emoji ?? '🎓')
        setUniversity(p.university ?? '')
        setYearOfStudy(p.year_of_study ?? '')
        setFaculty(p.faculty ?? '')
        setFundingType(p.funding_type ?? '')
        setDietaryPref(p.dietary_pref ?? '')
        setLivingSituation(p.living_situation ?? '')
        setAiLanguage(p.ai_language ?? 'English')
      })
      .catch(() => toast.error('Could not load profile'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, emoji, university, year_of_study: yearOfStudy,
          faculty, funding_type: fundingType,
          dietary_pref: dietaryPref, living_situation: livingSituation,
          ai_language: aiLanguage,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success('Profile saved')
      setProfile(prev => prev ? { ...prev, name, emoji, university, year_of_study: yearOfStudy, faculty, funding_type: fundingType, dietary_pref: dietaryPref, living_situation: livingSituation, ai_language: aiLanguage } : prev)
    } catch {
      toast.error('Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      await supabase.auth.signOut()
      router.push('/?deleted=1')
    } catch {
      toast.error('Account deletion failed. Please try again or contact support.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-\[var(--bg-base)\] pb-24">
        <TopBar title="Profile" />
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: '#161009' }} />
          ))}
        </div>
      </div>
    )
  }

  const planLabel = profile?.is_premium ? 'Premium' : 'Free'
  const planColour = profile?.is_premium ? '#0d9488' : 'rgba(255,255,255,0.35)'

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0b0907' }}>
      <TopBar title="Profile" />

      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* ── Avatar + name header ──────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-5 mb-4 relative overflow-hidden"
          style={{ background: '#120e0a', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
            aria-hidden="true"
            style={{ background: 'radial-gradient(circle at top right, rgba(13,148,136,0.08), transparent 65%)' }}
          />
          <div className="flex items-center gap-4 relative">
            {/* Emoji avatar */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              title="Change avatar"
              aria-label="Change avatar emoji"
            >
              {emoji}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-black text-white text-lg">{profile?.name || 'Student'}</h1>
                <span
                  className="font-mono text-[0.55rem] uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ background: profile?.is_premium ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.07)', color: planColour, border: `1px solid ${profile?.is_premium ? 'rgba(13,148,136,0.25)' : 'rgba(255,255,255,0.1)'}` }}
                >
                  {planLabel}
                </span>
              </div>
              <p className="font-mono text-[0.62rem] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {profile?.email}
              </p>
              {profile?.university && (
                <p className="font-display text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {profile.university}
                  {profile.year_of_study && ` · ${profile.year_of_study}`}
                </p>
              )}
            </div>
          </div>

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-mono text-[0.55rem] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Choose avatar</p>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map(e => (
                  <button
                    key={e}
                    onClick={() => { setEmoji(e); setShowEmojiPicker(false) }}
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all',
                      emoji === e ? 'scale-110' : 'opacity-60 hover:opacity-100'
                    )}
                    style={{ background: emoji === e ? 'rgba(13,148,136,0.2)' : 'rgba(255,255,255,0.05)', border: emoji === e ? '1px solid rgba(13,148,136,0.3)' : '1px solid rgba(255,255,255,0.07)' }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Stats row ────────────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatCard
              label="Nova this month"
              value={stats.novaLimit === null ? `${stats.novaMessagesUsed}` : `${stats.novaMessagesUsed}/${stats.novaLimit}`}
              sub={stats.novaLimit === null ? 'unlimited' : 'messages'}
              colour="#4db6ac"
            />
            <StatCard
              label="Study time"
              value={stats.totalStudyMinutesThisMonth >= 60
                ? `${Math.floor(stats.totalStudyMinutesThisMonth / 60)}h ${stats.totalStudyMinutesThisMonth % 60}m`
                : `${stats.totalStudyMinutesThisMonth}m`}
              sub="this month"
              colour="#d4a847"
            />
            <StatCard
              label="Referrals"
              value={`${stats.referralCount}`}
              sub={`+${stats.referralCredits} msgs earned`}
              colour="#d97b54"
            />
          </div>
        )}

        {/* ── Section tabs ─────────────────────────────────────────────────── */}
        <div
          className="flex gap-1 mb-4 p-1 rounded-xl"
          style={{ background: '#120e0a', border: '1px solid rgba(255,255,255,0.07)' }}
          role="tablist"
        >
          {(['profile', 'preferences', 'account'] as const).map(tab => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeSection === tab}
              onClick={() => setActiveSection(tab)}
              className={cn(
                'flex-1 py-2 rounded-lg font-display font-bold text-xs capitalize transition-all',
                activeSection === tab ? 'bg-teal-600/20 text-teal-400' : 'text-white/40 hover:text-white/60'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Profile tab ──────────────────────────────────────────────────── */}
        {activeSection === 'profile' && (
          <div className="space-y-3">
            {/* Name */}
            <div className="rounded-2xl p-5" style={{ background: '#120e0a', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="mb-4">
                <label className="font-mono text-[0.6rem] uppercase tracking-widest block mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Display name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={60}
                  className="w-full rounded-xl px-3 py-2.5 font-display text-sm text-white outline-none"
                  style={{ background: '#161009', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              <SelectField
                label="University"
                value={university}
                options={[...SA_UNIVERSITIES]}
                onChange={setUniversity}
              />
            </div>

            <div className="rounded-2xl p-5 space-y-4" style={{ background: '#120e0a', border: '1px solid rgba(255,255,255,0.07)' }}>
              <SelectField
                label="Year of study"
                value={yearOfStudy}
                options={YEAR_OPTIONS}
                onChange={setYearOfStudy}
              />

              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest block mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Faculty / Department
                </label>
                <input
                  type="text"
                  value={faculty}
                  onChange={e => setFaculty(e.target.value)}
                  placeholder="e.g. Science and Technology"
                  maxLength={80}
                  className="w-full rounded-xl px-3 py-2.5 font-display text-sm text-white outline-none"
                  style={{ background: '#161009', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              <SelectField
                label="Funding type"
                value={fundingType}
                options={FUNDING_OPTIONS}
                onChange={setFundingType}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full font-display font-bold text-sm py-3 rounded-xl transition-all disabled:opacity-50"
              style={{ background: '#0d9488', color: '#fff' }}
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        )}

        {/* ── Preferences tab ──────────────────────────────────────────────── */}
        {activeSection === 'preferences' && (
          <div className="space-y-3">
            <div className="rounded-2xl p-5 space-y-4" style={{ background: '#120e0a', border: '1px solid rgba(255,255,255,0.07)' }}>
              <SelectField
                label="Living situation"
                value={livingSituation}
                options={LIVING_OPTIONS}
                onChange={setLivingSituation}
              />
              <SelectField
                label="Dietary preference"
                value={dietaryPref}
                options={DIETARY_OPTIONS}
                onChange={setDietaryPref}
              />
              <SelectField
                label="Nova language"
                value={aiLanguage}
                options={SA_LANGUAGES.map(l => ({ value: l.value, label: l.label }))}
                onChange={setAiLanguage}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full font-display font-bold text-sm py-3 rounded-xl transition-all disabled:opacity-50"
              style={{ background: '#0d9488', color: '#fff' }}
            >
              {saving ? 'Saving…' : 'Save preferences'}
            </button>

            {/* Referral section */}
            <div className="pt-2">
              <p className="font-mono text-[0.6rem] uppercase tracking-widest mb-3 px-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Referral program
              </p>
              <ReferralWidget />
            </div>
          </div>
        )}

        {/* ── Account tab ──────────────────────────────────────────────────── */}
        {activeSection === 'account' && (
          <div className="space-y-3">
            {/* Subscription */}
            <div className="rounded-2xl p-5" style={{ background: '#120e0a', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-mono text-[0.6rem] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Subscription</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-white text-sm">{planLabel} plan</p>
                  {profile?.is_premium && profile.premium_until && (
                    <p className="font-mono text-[0.58rem] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Active until {new Date(profile.premium_until).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  {!profile?.is_premium && (
                    <p className="font-mono text-[0.58rem] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>15 Nova messages / month</p>
                  )}
                </div>
                {!profile?.is_premium && (
                  <a
                    href="/upgrade"
                    className="font-display font-bold text-xs px-4 py-2 rounded-xl"
                    style={{ background: 'rgba(217,120,84,0.15)', color: '#e8956e', border: '1px solid rgba(217,120,84,0.25)' }}
                  >
                    Upgrade ↗
                  </a>
                )}
              </div>
            </div>

            {/* Account info */}
            <div className="rounded-2xl p-5" style={{ background: '#120e0a', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-mono text-[0.6rem] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Account</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="font-display text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Email</span>
                  <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{profile?.email}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-display text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Member since</span>
                  <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-2xl p-5 space-y-2" style={{ background: '#120e0a', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-mono text-[0.6rem] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Actions</p>

              <button
                onClick={handleLogout}
                className="w-full text-left font-display text-sm py-2.5 px-4 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Sign out
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full text-left font-display text-sm py-2.5 px-4 rounded-xl transition-all"
                style={{ background: 'rgba(239,68,68,0.05)', color: 'rgba(239,68,68,0.7)', border: '1px solid rgba(239,68,68,0.15)' }}
              >
                Delete my account
              </button>

              <p className="font-mono text-[0.55rem] text-center pt-1" style={{ color: 'rgba(255,255,255,0.18)' }}>
                POPIA: you may request deletion of all your data at any time
              </p>
            </div>

            {/* Feedback & Reviews */}
            <div className="rounded-2xl p-5" style={{ background: '#120e0a', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-mono text-[0.6rem] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Feedback &amp; Reviews</p>
              <div className="space-y-2">
                <button
                  onClick={() => setShowFeedback(true)}
                  className="w-full text-left font-display text-sm py-2.5 px-4 rounded-xl transition-all flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span>📝</span>
                  <span>Send feedback</span>
                </button>
                <a
                  href="https://g.page/r/CdPIXBcTmJE6EAI/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-left font-display text-sm py-2.5 px-4 rounded-xl transition-all flex items-center gap-2"
                  style={{ background: 'rgba(245,158,11,0.06)', color: 'rgba(251,191,36,0.8)', border: '1px solid rgba(245,158,11,0.15)' }}
                >
                  <span>⭐</span>
                  <span>Review on Google →</span>
                </a>
                <p className="font-mono text-[0.56rem] text-white/25 text-center">Your review helps other students find VarsityOS</p>
              </div>
            </div>
          </div>
        )}

      <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} />
      </div>

      {/* ── Account deletion confirmation modal ─────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#120e0a', border: '1px solid rgba(239,68,68,0.3)' }}>
            <h2 className="font-display font-black text-white text-lg mb-2">Delete account?</h2>
            <p className="font-mono text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              This will permanently delete your account and <strong className="text-white">all your data</strong> — study plans, budget history, Nova conversations, everything. This cannot be undone.
            </p>
            <p className="font-mono text-[0.65rem] mb-2" style={{ color: 'rgba(239,68,68,0.8)' }}>
              Type <strong>DELETE</strong> to confirm
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-xl px-3 py-2.5 font-mono text-sm text-white outline-none mb-4"
              style={{ background: '#1a1009', border: '1px solid rgba(239,68,68,0.3)' }}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
                className="flex-1 font-display font-bold text-sm py-2.5 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex-1 font-display font-bold text-sm py-2.5 rounded-xl transition-all disabled:opacity-40"
                style={{ background: 'rgba(239,68,68,0.85)', color: '#fff' }}
              >
                {deleting ? 'Deleting…' : 'Delete everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
