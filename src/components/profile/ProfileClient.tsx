'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import TopBar from '@/components/layout/TopBar'
import ReferralWidget from '@/components/referral/ReferralWidget'
import { AmbientImage } from '@/components/ui/AmbientImage'
import { FeedbackModal } from '@/components/feedback/FeedbackModal'
import { SA_LANGUAGES } from '@/types'
import InstitutionPicker from '@/components/profile/InstitutionPicker'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { DataSaverToggle } from '@/components/ui/DataSaverToggle'
import BadgesPanel from '@/components/gamification/BadgesPanel'
import VarsityScore from '@/components/gamification/VarsityScore'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { getStoredLocale, type AppLocale } from '@/lib/i18n/IntlProvider'
import GuardianAccess from '@/components/profile/GuardianAccess'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProfileData {
  id: string
  name: string
  email: string | null
  emoji: string
  bio: string | null
  university: string | null
  year_of_study: string | null
  faculty: string | null
  funding_type: string | null
  dietary_pref: string | null
  living_situation: string | null
  ai_language: string | null
  province: string | null
  monthly_allowance: string | null
  study_schedule: string | null
  is_first_gen: boolean
  commute_type: string | null
  is_premium: boolean
  premium_until: string | null
  subscription_tier: 'free' | 'scholar' | 'nova_unlimited' | null
  avatar_url: string | null
  created_at: string
}

interface MyListing {
  id: string; title: string; price_cents: number
  listing_type: 'sell' | 'swap' | 'free'; is_sold: boolean; condition: string
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
  { value: 'nsfas',        label: 'NSFAS' },
  { value: 'tvet_nsfas',   label: 'TVET NSFAS' },
  { value: 'bursary',      label: 'Bursary' },
  { value: 'scholarship',  label: 'Scholarship' },
  { value: 'family',       label: 'Family Support' },
  { value: 'self_funded', label: 'Self-Funded' },
  { value: 'other',       label: 'Other / Mixed' },
]

const DIETARY_OPTIONS = ['No restrictions', 'Vegetarian', 'Vegan', 'Halaal', 'Kosher', 'Gluten-free', 'Other']

const LIVING_OPTIONS = ['On-campus res', 'Off-campus rent', 'At home (family)', 'Private student accommodation', 'Other']

const EMOJI_OPTIONS = ['🎓', '📚', '🌟', '⚡', '🔥', '💡', '🚀', '🎯', '🧠', '🌍', '✨', '💪']

const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
]

const ALLOWANCE_OPTIONS = [
  { value: 'under_500',   label: 'Under R500/month' },
  { value: '500_1500',    label: 'R500 – R1 500/month' },
  { value: '1500_3000',   label: 'R1 500 – R3 000/month' },
  { value: '3000_5000',   label: 'R3 000 – R5 000/month' },
  { value: 'over_5000',   label: 'Over R5 000/month' },
  { value: 'varies',      label: 'Varies / unsure' },
]

const SCHEDULE_OPTIONS = [
  { value: 'morning',   label: '🌅 Morning person (before 12pm)' },
  { value: 'afternoon', label: '☀️ Afternoon (12pm–6pm)' },
  { value: 'night',     label: '🌙 Night owl (after 6pm)' },
  { value: 'mixed',     label: '🔀 Depends on the day' },
]

const COMMUTE_OPTIONS = [
  { value: 'on_campus',  label: '🏠 I live on campus' },
  { value: 'walk',       label: '🚶 I walk to campus' },
  { value: 'taxi',       label: '🚌 Taxi / bus commuter' },
  { value: 'car',        label: '🚗 I drive myself' },
  { value: 'bicycle',    label: '🚲 I cycle' },
  { value: 'train',      label: '🚆 Train / Metrorail' },
]

// What each field unlocks in the OS
const FIELD_UNLOCKS: Record<string, string> = {
  university:        'institution-specific events, textbook marketplace, study twins',
  year_of_study:     'correct academic pacing, exam readiness, year-appropriate resources',
  faculty:           'Nova speaks your subject language, relevant bursaries and tutors',
  funding_type:      'NSFAS Oracle, budget coaching, financial health scoring',
  province:          'load shedding schedule, local clinic info, regional weather context',
  monthly_allowance: 'meal budget targets, grocery list value, spending benchmarks',
  study_schedule:    'Nova schedules Pomodoro sessions at your peak hours',
  is_first_gen:      'extra process guidance, first-gen bursaries surfaced, simplified admin help',
  commute_type:      'time budgeting, transport cost tracking, safety route planning',
  dietary_pref:      'AI meal plans respect your diet, grocery list filters by dietary need',
  living_situation:  'cooking tips match your kitchen access, relevant off-campus resources',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-mono text-[0.58rem] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full rounded-xl px-4 py-3 font-display text-sm text-white outline-none transition-all focus:ring-1 focus:ring-teal-500/40"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
    />
  )
}

function SelectInput({ value, options, onChange }: {
  value: string
  options: { value: string; label: string }[] | string[]
  onChange: (v: string) => void
}) {
  const normalised = (options as (string | { value: string; label: string })[]).map(o =>
    typeof o === 'string' ? { value: o, label: o } : o
  )
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-xl px-4 py-3 font-display text-sm text-white outline-none appearance-none transition-all focus:ring-1 focus:ring-teal-500/40"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
    >
      <option value="">Not set</option>
      {normalised.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function SaveButton({ onClick, saving, label = 'Save changes' }: { onClick: () => void; saving: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="w-full font-display font-bold text-sm py-3.5 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
      style={{
        background: saving ? 'rgba(13,148,136,0.5)' : 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
        color: '#fff',
        boxShadow: saving ? 'none' : '0 4px 20px rgba(13,148,136,0.3)',
      }}
    >
      {saving ? 'Saving…' : label}
    </button>
  )
}

// ─── Subscription section ────────────────────────────────────────────────────

const TIER_DISPLAY: Record<string, { name: string; colour: string; messages: string }> = {
  scholar:        { name: 'Nova Scholar',   colour: '#e8956e', messages: '150 messages/month' },
  nova_unlimited: { name: 'Nova Unlimited', colour: '#d4a847', messages: 'Unlimited messages' },
}

function SubscriptionSection({ profile, isPremium }: { profile: ProfileData | null; isPremium: boolean }) {
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled]   = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const tier = profile?.subscription_tier || (isPremium ? 'scholar' : 'free')
  const meta = TIER_DISPLAY[tier]

  const handleCancel = async () => {
    setCancelling(true)
    setCancelError(null)
    try {
      const res = await fetch('/api/payfast/cancel', { method: 'POST', signal: AbortSignal.timeout(10000) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Cancellation failed')
      setCancelled(true)
      setConfirmCancel(false)
    } catch (err) {
      setCancelError((err as { message?: string })?.message || 'Something went wrong')
    } finally {
      setCancelling(false)
    }
  }

  const tierBg = meta
    ? `${meta.colour}12`
    : 'rgba(255,255,255,0.03)'
  const tierBorder = meta
    ? `1px solid ${meta.colour}30`
    : '1px solid rgba(255,255,255,0.07)'

  return (
    <div className="rounded-2xl p-5" style={{ background: tierBg, border: tierBorder }}>
      <p className="font-mono text-[0.58rem] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
        Subscription
      </p>

      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="font-display font-bold text-white">
            {meta ? `✦ ${meta.name}` : 'Free plan'}
          </p>
          <p className="font-mono text-[0.58rem] mt-0.5" style={{ color: meta ? meta.colour : 'rgba(255,255,255,0.3)' }}>
            {meta ? meta.messages : '20 Nova messages / month'}
          </p>
        </div>

        {/* CTA for free users or Scholar upgrading to Unlimited */}
        {tier === 'free' && (
          <a
            href="/upgrade"
            className="font-display font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95"
            style={{ background: 'rgba(217,120,84,0.18)', color: '#e8956e', border: '1px solid rgba(217,120,84,0.3)' }}
          >
            Upgrade ↗
          </a>
        )}
        {tier === 'scholar' && !cancelled && (
          <a
            href="/upgrade"
            className="font-display font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95"
            style={{ background: 'rgba(212,168,71,0.18)', color: '#d4a847', border: '1px solid rgba(212,168,71,0.3)' }}
          >
            Go Unlimited ↗
          </a>
        )}
      </div>

      {/* Cancel flow */}
      {meta && !cancelled && (
        <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
          {!confirmCancel ? (
            <button
              onClick={() => setConfirmCancel(true)}
              className="font-mono text-[0.58rem]"
              style={{ color: 'rgba(255,255,255,0.22)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Cancel subscription
            </button>
          ) : (
            <div>
              <p className="font-mono text-[0.6rem] mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Cancel subscription? You&apos;ll move to the Free plan immediately.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="font-display font-bold text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444430', cursor: cancelling ? 'wait' : 'pointer' }}
                >
                  {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                </button>
                <button
                  onClick={() => { setConfirmCancel(false); setCancelError(null) }}
                  className="font-display font-bold text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                >
                  Keep plan
                </button>
              </div>
              {cancelError && (
                <p className="font-mono text-[0.58rem] mt-2" style={{ color: '#ef4444' }}>{cancelError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {cancelled && (
        <p className="font-mono text-[0.6rem] mt-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Subscription cancelled — you&apos;re on the Free plan now.
        </p>
      )}
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

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [emoji, setEmoji] = useState('🎓')
  const [university, setUniversity] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')
  const [faculty, setFaculty] = useState('')
  const [fundingType, setFundingType] = useState('')
  const [dietaryPref, setDietaryPref] = useState('')
  const [livingSituation, setLivingSituation] = useState('')
  const [aiLanguage, setAiLanguage] = useState('')
  const [province, setProvince] = useState('')
  const [monthlyAllowance, setMonthlyAllowance] = useState('')
  const [studySchedule, setStudySchedule] = useState('')
  const [isFirstGen, setIsFirstGen] = useState(false)
  const [commuteType, setCommuteType] = useState('')
  const [uiLocale, setUiLocale] = useState<AppLocale>('en')
  const [myListings, setMyListings] = useState<MyListing[]>([])
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setUiLocale(getStoredLocale()) }, [])

  const [activeSection, setActiveSection] = useState<'profile' | 'preferences' | 'account' | 'progress'>('profile')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch('/api/profile', { signal: AbortSignal.timeout(10000) })
      .then(r => r.json())
      .then(data => {
        if (data.error) return
        const p: ProfileData = data.profile
        setProfile(p)
        setStats(data.stats)
        setName(p.name ?? '')
        setBio(p.bio ?? '')
        setEmoji(p.emoji ?? '🎓')
        setUniversity(p.university ?? '')
        setYearOfStudy(p.year_of_study ?? '')
        setFaculty(p.faculty ?? '')
        setFundingType(p.funding_type ?? '')
        setProvince(p.province ?? '')
        setMonthlyAllowance(p.monthly_allowance ?? '')
        setStudySchedule(p.study_schedule ?? '')
        setIsFirstGen(p.is_first_gen ?? false)
        setCommuteType(p.commute_type ?? '')
        setDietaryPref(p.dietary_pref ?? '')
        setLivingSituation(p.living_situation ?? '')
        setAiLanguage(p.ai_language ?? 'English')
      })
      .catch(() => toast.error('Could not load profile'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (activeSection !== 'progress') return
    supabase.from('textbook_listings')
      .select('id, title, price_cents, listing_type, is_sold, condition, created_at')
      .eq('seller_id', profile?.id ?? '')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setMyListings((data ?? []) as MyListing[]))
  }, [activeSection, profile?.id])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${profile.id}/avatar.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: pub.publicUrl }),
        signal: AbortSignal.timeout(10000),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setProfile(prev => prev ? { ...prev, avatar_url: pub.publicUrl } : prev)
      toast.success('Photo updated')
    } catch (err) {
      console.error('[ProfileClient] uploadAvatar:', err)
      toast.error('Could not upload photo')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, full_name: name, bio: bio || null, emoji, university,
          year_of_study: yearOfStudy, faculty, funding_type: fundingType,
          dietary_pref: dietaryPref, living_situation: livingSituation,
          ai_language: aiLanguage,
          province: province || null, monthly_allowance: monthlyAllowance || null,
          study_schedule: studySchedule || null, is_first_gen: isFirstGen,
          commute_type: commuteType || null,
        }),
        signal: AbortSignal.timeout(10000),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success('Profile saved')
      setProfile(prev => prev ? { ...prev, name, bio: bio || null, emoji, university, year_of_study: yearOfStudy, faculty, funding_type: fundingType, dietary_pref: dietaryPref, living_situation: livingSituation, ai_language: aiLanguage, province: province || null, monthly_allowance: monthlyAllowance || null, study_schedule: studySchedule || null, is_first_gen: isFirstGen, commute_type: commuteType || null } : prev)
    } catch (err) {
      console.error('[ProfileClient] handleSave:', err)
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
      const res = await fetch('/api/account/delete', { method: 'DELETE', signal: AbortSignal.timeout(10000) })
      if (!res.ok) throw new Error('Failed')
      await supabase.auth.signOut()
      router.push('/?deleted=1')
    } catch (err) {
      console.error('[ProfileClient] deleteAccount:', err)
      toast.error('Account deletion failed. Please try again or contact support.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: 'var(--bg-base)' }}>
        <TopBar title="Profile" />
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      </div>
    )
  }

  const isPremium = profile?.is_premium ?? false

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      <AmbientImage zone="wellness" opacity={0.38} blurPx={5} saturation={1.2} overlayColor="transparent" />
      <TopBar title="Profile" />

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ── Hero card ────────────────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f1a18 0%, #0c1215 100%)', border: '1px solid rgba(13,148,136,0.18)', boxShadow: '0 0 40px rgba(13,148,136,0.06)' }}>
          {/* Gradient orbs */}
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.14) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-6 -left-6 w-36 h-36 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(8,145,178,0.1) 0%, transparent 70%)' }} />
          {/* Top accent line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #0d9488, #0891b2, transparent)' }} />

          <div className="relative p-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => profile?.avatar_url ? setShowEmojiPicker(!showEmojiPicker) : avatarInputRef.current?.click()}
                  className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-3xl transition-all active:scale-95 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(13,148,136,0.2) 0%, rgba(8,145,178,0.15) 100%)',
                    border: '1px solid rgba(13,148,136,0.25)',
                    boxShadow: '0 0 24px rgba(13,148,136,0.15)',
                  }}
                  aria-label="Change avatar"
                >
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : emoji}
                </button>
                {uploadingAvatar ? (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[0.45rem]" style={{ background: '#0d9488', border: '2px solid var(--bg-base)' }}>
                    ⏳
                  </div>
                ) : (
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[0.5rem]"
                    style={{ background: '#0d9488', border: '2px solid var(--bg-base)' }}
                    aria-label="Upload photo"
                  >
                    📷
                  </button>
                )}
                <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h1 className="font-display font-black text-white text-xl leading-tight">{profile?.name || 'Student'}</h1>
                  <span
                    className="font-mono text-[0.5rem] uppercase tracking-widest px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{
                      background: isPremium ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.06)',
                      color: isPremium ? '#4db6ac' : 'rgba(255,255,255,0.35)',
                      border: `1px solid ${isPremium ? 'rgba(13,148,136,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    }}
                  >
                    {isPremium ? '★ Premium' : 'Free'}
                  </span>
                </div>
                <p className="font-mono text-[0.6rem] mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {profile?.email}
                </p>
                {profile?.university && (
                  <p className="font-display text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {profile.university}{profile.year_of_study && ` · ${profile.year_of_study}`}
                  </p>
                )}
                {profile?.bio && (
                  <p className="font-display text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{profile.bio}</p>
                )}
              </div>
            </div>

            {/* Emoji picker */}
            {showEmojiPicker && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="font-mono text-[0.55rem] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Choose your avatar</p>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(e => (
                    <button
                      key={e}
                      onClick={() => { setEmoji(e); setShowEmojiPicker(false) }}
                      className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90',
                        emoji === e ? 'scale-110' : 'opacity-50 hover:opacity-90'
                      )}
                      style={{
                        background: emoji === e ? 'rgba(13,148,136,0.25)' : 'rgba(255,255,255,0.05)',
                        border: emoji === e ? '1px solid rgba(13,148,136,0.4)' : '1px solid rgba(255,255,255,0.07)',
                        boxShadow: emoji === e ? '0 0 12px rgba(13,148,136,0.2)' : 'none',
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats strip ──────────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-3 gap-2.5">
            {/* Nova messages */}
            <div className="rounded-2xl p-4 flex flex-col gap-1.5 relative overflow-hidden" style={{ background: 'rgba(13,148,136,0.07)', border: '1px solid rgba(13,148,136,0.18)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #0d9488, transparent)' }} />
              <p className="font-mono text-[0.5rem] uppercase tracking-widest" style={{ color: 'rgba(77,182,172,0.6)' }}>Nova</p>
              <p className="font-display font-black text-xl" style={{ color: '#4db6ac' }}>
                {stats.novaLimit === null ? stats.novaMessagesUsed : `${stats.novaMessagesUsed}`}
              </p>
              <p className="font-mono text-[0.52rem]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {stats.novaLimit === null ? 'unlimited' : `/ ${stats.novaLimit}`}
              </p>
              {stats.novaLimit !== null && (
                <div className="h-1 rounded-full mt-0.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: `${Math.min(100, (stats.novaMessagesUsed / stats.novaLimit) * 100)}%`,
                      background: 'linear-gradient(90deg, #0d9488, #0891b2)',
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Study time */}
            <div className="rounded-2xl p-4 flex flex-col gap-1.5 relative overflow-hidden" style={{ background: 'rgba(212,168,71,0.07)', border: '1px solid rgba(212,168,71,0.18)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #d4a847, transparent)' }} />
              <p className="font-mono text-[0.5rem] uppercase tracking-widest" style={{ color: 'rgba(212,168,71,0.6)' }}>Study</p>
              <p className="font-display font-black text-xl" style={{ color: '#d4a847' }}>
                {stats.totalStudyMinutesThisMonth >= 60
                  ? `${Math.floor(stats.totalStudyMinutesThisMonth / 60)}h`
                  : `${stats.totalStudyMinutesThisMonth}m`}
              </p>
              <p className="font-mono text-[0.52rem]" style={{ color: 'rgba(255,255,255,0.25)' }}>this month</p>
            </div>

            {/* Referrals */}
            <div className="rounded-2xl p-4 flex flex-col gap-1.5 relative overflow-hidden" style={{ background: 'rgba(217,120,84,0.07)', border: '1px solid rgba(217,120,84,0.18)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #d97b54, transparent)' }} />
              <p className="font-mono text-[0.5rem] uppercase tracking-widest" style={{ color: 'rgba(217,120,84,0.6)' }}>Refs</p>
              <p className="font-display font-black text-xl" style={{ color: '#d97b54' }}>{stats.referralCount}</p>
              <p className="font-mono text-[0.52rem]" style={{ color: 'rgba(255,255,255,0.25)' }}>+{stats.referralCredits} earned</p>
            </div>
          </div>
        )}

        {/* ── OS Personalization summary ───────────────────────────────────── */}
        {profile && (() => {
          const checks = [
            { key: 'university',        val: profile.university,        label: profile.university?.split('(')[0].trim() ?? '', emoji: '🎓' },
            { key: 'year_of_study',     val: profile.year_of_study,     label: profile.year_of_study ?? '', emoji: '📅' },
            { key: 'faculty',           val: profile.faculty,           label: profile.faculty ?? '', emoji: '📖' },
            { key: 'funding_type',      val: profile.funding_type,      label: profile.funding_type?.toUpperCase().replace('_', ' ') ?? '', emoji: '💰' },
            { key: 'province',          val: profile.province,          label: profile.province ?? '', emoji: '📍' },
            { key: 'monthly_allowance', val: profile.monthly_allowance, label: ALLOWANCE_OPTIONS.find(o => o.value === profile.monthly_allowance)?.label ?? '', emoji: '💵' },
            { key: 'study_schedule',    val: profile.study_schedule,    label: SCHEDULE_OPTIONS.find(o => o.value === profile.study_schedule)?.label ?? '', emoji: '⏰' },
            { key: 'commute_type',      val: profile.commute_type,      label: COMMUTE_OPTIONS.find(o => o.value === profile.commute_type)?.label ?? '', emoji: '🚌' },
            { key: 'is_first_gen',      val: profile.is_first_gen ? 'yes' : null, label: 'First-gen student', emoji: '👤' },
            { key: 'living_situation',  val: profile.living_situation,  label: profile.living_situation ?? '', emoji: '🏠' },
            { key: 'dietary_pref',      val: profile.dietary_pref,      label: profile.dietary_pref ?? '', emoji: '🥗' },
          ]
          const filled  = checks.filter(c => c.val)
          const missing = checks.filter(c => !c.val)
          const pct     = Math.round((filled.length / checks.length) * 100)

          return (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    OS personalisation
                  </p>
                  <p className="font-display font-bold text-sm text-white mt-0.5">{pct}% complete</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[0.6rem]" style={{ color: pct === 100 ? '#4ecf9e' : 'rgba(255,255,255,0.3)' }}>
                    {filled.length}/{checks.length} fields
                  </div>
                  {pct < 100 && (
                    <div className="font-mono text-[0.52rem] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      {missing.length} unlock{missing.length !== 1 ? 's' : ''} waiting
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: pct === 100 ? '#4ecf9e' : 'linear-gradient(90deg, #4ecf9e, #0891b2)' }} />
              </div>

              {/* Filled tags */}
              {filled.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {filled.map(c => (
                    <span key={c.key} className="font-mono text-[0.5rem] px-2 py-1 rounded-full"
                      style={{ background: 'rgba(78,207,158,0.08)', border: '1px solid rgba(78,207,158,0.15)', color: 'rgba(78,207,158,0.7)' }}>
                      {c.emoji} {c.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Missing nudge */}
              {missing.length > 0 && pct < 100 && (
                <p className="font-mono text-[0.52rem]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  Missing: {missing.slice(0, 4).map(c => c.emoji + ' ' + c.key.replace(/_/g, ' ')).join(' · ')}{missing.length > 4 ? ` + ${missing.length - 4} more` : ''}
                </p>
              )}
            </div>
          )
        })()}

        {/* ── Section tabs ─────────────────────────────────────────────────── */}
        <div
          className="flex gap-1 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          role="tablist"
        >
          {([
            { id: 'profile', icon: '👤', label: 'Profile' },
            { id: 'preferences', icon: '⚙️', label: 'Prefs' },
            { id: 'progress', icon: '🏆', label: 'Progress' },
            { id: 'account', icon: '🔐', label: 'Account' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeSection === tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={cn(
                'flex-1 py-2.5 rounded-xl font-display font-bold text-xs transition-all flex items-center justify-center gap-1.5',
                activeSection === tab.id
                  ? 'text-white'
                  : 'text-white/35 hover:text-white/55'
              )}
              style={activeSection === tab.id ? {
                background: 'linear-gradient(135deg, rgba(13,148,136,0.25) 0%, rgba(8,145,178,0.2) 100%)',
                boxShadow: '0 1px 12px rgba(13,148,136,0.12)',
              } : {}}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Profile tab ──────────────────────────────────────────────────── */}
        {activeSection === 'profile' && (
          <div className="space-y-3">
            <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Field label="Display name">
                <TextInput value={name} onChange={setName} placeholder="Your name" maxLength={60} />
              </Field>
              <Field label="Bio (optional)">
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell other students a bit about yourself…"
                  maxLength={160}
                  rows={2}
                  className="w-full rounded-xl px-4 py-3 font-display text-sm text-white outline-none transition-all focus:ring-1 focus:ring-teal-500/40 resize-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                />
                <p className="font-mono text-[0.52rem] text-right" style={{ color: 'rgba(255,255,255,0.2)' }}>{bio.length}/160</p>
              </Field>
              <Field label="Institution">
                <InstitutionPicker value={university} onChange={setUniversity} />
                {university && (
                  <p className="font-mono text-[0.52rem] mt-1.5 px-1" style={{ color: 'rgba(78,207,158,0.5)' }}>
                    🔓 {FIELD_UNLOCKS.university}
                  </p>
                )}
              </Field>
            </div>

            <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Year of study">
                  <SelectInput value={yearOfStudy} options={YEAR_OPTIONS} onChange={setYearOfStudy} />
                </Field>
                <Field label="Funding type">
                  <SelectInput value={fundingType} options={FUNDING_OPTIONS} onChange={setFundingType} />
                </Field>
              </div>
              <Field label="Faculty / Department">
                <TextInput value={faculty} onChange={setFaculty} placeholder="e.g. Science and Technology" maxLength={80} />
                {faculty && (
                  <p className="font-mono text-[0.52rem] mt-1.5 px-1" style={{ color: 'rgba(78,207,158,0.5)' }}>
                    🔓 {FIELD_UNLOCKS.faculty}
                  </p>
                )}
              </Field>
              <Field label="Province where you study">
                <SelectInput value={province} options={['', ...SA_PROVINCES].map(v => ({ value: v, label: v || 'Select province…' }))} onChange={setProvince} />
                {province && (
                  <p className="font-mono text-[0.52rem] mt-1.5 px-1" style={{ color: 'rgba(78,207,158,0.5)' }}>
                    🔓 {FIELD_UNLOCKS.province}
                  </p>
                )}
              </Field>
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <div>
                  <div className="font-mono text-[0.58rem] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>First-generation student</div>
                  <div className="font-display text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {isFirstGen ? '✓ First in your family to study at university/college' : 'Are you the first in your family to study?'}
                  </div>
                  {isFirstGen && (
                    <p className="font-mono text-[0.52rem] mt-1" style={{ color: 'rgba(78,207,158,0.5)' }}>
                      🔓 {FIELD_UNLOCKS.is_first_gen}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsFirstGen(v => !v)}
                  className="ml-4 flex-shrink-0 w-11 h-6 rounded-full transition-all relative"
                  style={{ background: isFirstGen ? '#4ecf9e' : 'rgba(255,255,255,0.1)' }}
                >
                  <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all shadow-sm"
                    style={{ left: isFirstGen ? '22px' : '2px' }} />
                </button>
              </div>
            </div>

            <SaveButton onClick={handleSave} saving={saving} label="Save profile" />
          </div>
        )}

        {/* ── Preferences tab ──────────────────────────────────────────────── */}
        {activeSection === 'preferences' && (
          <div className="space-y-3">
            <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Field label="Living situation">
                <SelectInput value={livingSituation} options={LIVING_OPTIONS} onChange={setLivingSituation} />
                {livingSituation && (
                  <p className="font-mono text-[0.52rem] mt-1.5 px-1" style={{ color: 'rgba(78,207,158,0.5)' }}>
                    🔓 {FIELD_UNLOCKS.living_situation}
                  </p>
                )}
              </Field>
              <Field label="Monthly allowance / budget">
                <SelectInput value={monthlyAllowance} options={[{ value: '', label: 'Select range…' }, ...ALLOWANCE_OPTIONS]} onChange={setMonthlyAllowance} />
                {monthlyAllowance && (
                  <p className="font-mono text-[0.52rem] mt-1.5 px-1" style={{ color: 'rgba(78,207,158,0.5)' }}>
                    🔓 {FIELD_UNLOCKS.monthly_allowance}
                  </p>
                )}
              </Field>
              <Field label="Dietary preference">
                <SelectInput value={dietaryPref} options={DIETARY_OPTIONS} onChange={setDietaryPref} />
                {dietaryPref && dietaryPref !== 'No restrictions' && (
                  <p className="font-mono text-[0.52rem] mt-1.5 px-1" style={{ color: 'rgba(78,207,158,0.5)' }}>
                    🔓 {FIELD_UNLOCKS.dietary_pref}
                  </p>
                )}
              </Field>
              <Field label="When do you study best?">
                <SelectInput value={studySchedule} options={[{ value: '', label: 'Select schedule…' }, ...SCHEDULE_OPTIONS]} onChange={setStudySchedule} />
                {studySchedule && (
                  <p className="font-mono text-[0.52rem] mt-1.5 px-1" style={{ color: 'rgba(78,207,158,0.5)' }}>
                    🔓 {FIELD_UNLOCKS.study_schedule}
                  </p>
                )}
              </Field>
              <Field label="How do you get to campus?">
                <SelectInput value={commuteType} options={[{ value: '', label: 'Select commute…' }, ...COMMUTE_OPTIONS]} onChange={setCommuteType} />
                {commuteType && (
                  <p className="font-mono text-[0.52rem] mt-1.5 px-1" style={{ color: 'rgba(78,207,158,0.5)' }}>
                    🔓 {FIELD_UNLOCKS.commute_type}
                  </p>
                )}
              </Field>
              <Field label="Nova language">
                <SelectInput value={aiLanguage} options={SA_LANGUAGES.map(l => ({ value: l.value, label: l.label }))} onChange={setAiLanguage} />
              </Field>
            </div>

            <SaveButton onClick={handleSave} saving={saving} label="Save preferences" />

            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <LanguageSwitcher currentLocale={uiLocale} onChange={setUiLocale} />
            </div>

            <div className="pt-1">
              <p className="font-mono text-[0.58rem] uppercase tracking-widest mb-3 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Referral program
              </p>
              <ReferralWidget />
            </div>
          </div>
        )}

        {/* ── Progress tab ─────────────────────────────────────────────────── */}
        {activeSection === 'progress' && (
          <div className="space-y-5">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <VarsityScore />
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <BadgesPanel />
            </div>

            {/* My textbook listings */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <p className="font-mono text-[0.58rem] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>My textbook listings</p>
                <a href="/textbooks" className="font-mono text-[0.58rem]" style={{ color: 'rgba(0,229,176,0.6)', textDecoration: 'none' }}>Browse →</a>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {myListings.length === 0 ? (
                  <div className="px-5 py-4 font-mono text-[0.65rem]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    No listings yet. Go to Textbooks to sell or give away books.
                  </div>
                ) : myListings.map((l, i) => {
                  const price = l.listing_type === 'free' ? 'FREE' : l.listing_type === 'swap' ? 'SWAP' : `R${(l.price_cents / 100).toFixed(0)}`
                  const priceColor = l.listing_type === 'free' ? 'var(--teal)' : l.listing_type === 'swap' ? '#6366F1' : 'var(--gold)'
                  return (
                    <div
                      key={l.id}
                      className="flex items-center justify-between px-5 py-3"
                      style={{ borderBottom: i < myListings.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', opacity: l.is_sold ? 0.45 : 1 }}
                    >
                      <div>
                        <p className="font-display text-sm font-medium text-white">{l.title}</p>
                        <p className="font-mono text-[0.55rem] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {l.condition} · {new Date(l.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                          {l.is_sold && <span style={{ color: 'var(--teal)', marginLeft: 5 }}>· Sold</span>}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold" style={{ color: priceColor }}>{price}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Account tab ──────────────────────────────────────────────────── */}
        {activeSection === 'account' && (
          <div className="space-y-3">

            {/* Subscription */}
            <SubscriptionSection profile={profile} isPremium={isPremium} />

            {/* Guardian Access */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <GuardianAccess />
            </div>

            {/* Account info */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 pt-5 pb-3">
                <p className="font-mono text-[0.58rem] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Account details</p>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex justify-between items-center px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="font-mono text-[0.65rem]" style={{ color: 'rgba(255,255,255,0.4)' }}>Email</span>
                  <span className="font-mono text-[0.65rem]" style={{ color: 'rgba(255,255,255,0.55)' }}>{profile?.email}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-3.5">
                  <span className="font-mono text-[0.65rem]" style={{ color: 'rgba(255,255,255,0.4)' }}>Member since</span>
                  <span className="font-mono text-[0.65rem]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Display */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 pt-5 pb-3">
                <p className="font-mono text-[0.58rem] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Display</p>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} className="p-3 space-y-2">
                <div className="px-1 space-y-2">
                  <div>
                    <p className="font-mono text-[0.54rem] mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Outdoor mode increases contrast for bright South African sunlight.
                    </p>
                    <ThemeToggle />
                  </div>
                  <div>
                    <p className="font-mono text-[0.54rem] mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Data Saver skips auto-loading AI content to protect your prepaid data.
                    </p>
                    <DataSaverToggle />
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 pt-5 pb-3">
                <p className="font-mono text-[0.58rem] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Feedback & reviews</p>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} className="p-3 space-y-2">
                <button
                  onClick={() => setShowFeedback(true)}
                  className="w-full text-left font-display text-sm py-3 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <span className="text-base">📝</span>
                  <span>Send feedback</span>
                </button>
                <a
                  href="https://g.page/r/CdPIXBcTmJE6EAI/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-left font-display text-sm py-3 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center gap-3"
                  style={{ background: 'rgba(245,158,11,0.07)', color: 'rgba(251,191,36,0.85)', border: '1px solid rgba(245,158,11,0.18)' }}
                >
                  <span className="text-base">⭐</span>
                  <span>Review on Google</span>
                  <span className="ml-auto text-xs opacity-60">→</span>
                </a>
                <p className="font-mono text-[0.54rem] text-center pt-1" style={{ color: 'rgba(255,255,255,0.18)' }}>Your review helps other students find VarsityOS</p>
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 pt-5 pb-3">
                <p className="font-mono text-[0.58rem] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Actions</p>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} className="p-3 space-y-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left font-display text-sm py-3 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <span className="text-base">🚪</span>
                  <span>Sign out</span>
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full text-left font-display text-sm py-3 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center gap-3"
                  style={{ background: 'rgba(239,68,68,0.04)', color: 'rgba(239,68,68,0.7)', border: '1px solid rgba(239,68,68,0.14)' }}
                >
                  <span className="text-base">🗑️</span>
                  <span>Delete my account</span>
                </button>
                <p className="font-mono text-[0.52rem] text-center pt-1" style={{ color: 'rgba(255,255,255,0.16)' }}>
                  POPIA: you may request deletion of all your data at any time
                </p>
              </div>
            </div>

          </div>
        )}

      </div>

      <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} />

      {/* ── Account deletion modal ───────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ background: 'rgba(239,68,68,0.1)' }}>
                ⚠️
              </div>
              <h2 className="font-display font-black text-white text-lg mb-2">Delete your account?</h2>
              <p className="font-mono text-xs mb-5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                This permanently deletes your account and <strong className="text-white/70">all data</strong> — study plans, budget history, Nova conversations. Cannot be undone.
              </p>
              <p className="font-mono text-[0.62rem] mb-2" style={{ color: 'rgba(239,68,68,0.7)' }}>
                Type <strong className="text-red-400">DELETE</strong> to confirm
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-xl px-4 py-3 font-mono text-sm text-white outline-none mb-4 focus:ring-1 focus:ring-red-500/40"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
                  className="flex-1 font-display font-bold text-sm py-3 rounded-xl transition-all active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="flex-1 font-display font-bold text-sm py-3 rounded-xl transition-all disabled:opacity-30 active:scale-95"
                  style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
