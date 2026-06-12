'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import TopBar from '@/components/layout/TopBar'
import ReferralWidget from '@/components/referral/ReferralWidget'
import { AmbientImage } from '@/components/ui/AmbientImage'
import { FeedbackModal } from '@/components/feedback/FeedbackModal'
import { SA_UNIVERSITIES, SA_LANGUAGES } from '@/types'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { DataSaverToggle } from '@/components/ui/DataSaverToggle'
import BadgesPanel from '@/components/gamification/BadgesPanel'
import VarsityScore from '@/components/gamification/VarsityScore'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { getStoredLocale, type AppLocale } from '@/lib/i18n/IntlProvider'

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

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfileClient() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎓')
  const [university, setUniversity] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')
  const [faculty, setFaculty] = useState('')
  const [fundingType, setFundingType] = useState('')
  const [dietaryPref, setDietaryPref] = useState('')
  const [livingSituation, setLivingSituation] = useState('')
  const [aiLanguage, setAiLanguage] = useState('')
  const [uiLocale, setUiLocale] = useState<AppLocale>('en')

  useEffect(() => { setUiLocale(getStoredLocale()) }, [])

  const [activeSection, setActiveSection] = useState<'profile' | 'preferences' | 'account' | 'progress'>('profile')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

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
          name, full_name: name, emoji, university, year_of_study: yearOfStudy,
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
      <AmbientImage zone="wellness" opacity={0.05} blurPx={10} saturation={1.2} overlayColor="transparent" />
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
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-3xl transition-all active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, rgba(13,148,136,0.2) 0%, rgba(8,145,178,0.15) 100%)',
                    border: '1px solid rgba(13,148,136,0.25)',
                    boxShadow: '0 0 24px rgba(13,148,136,0.15)',
                  }}
                  aria-label="Change avatar emoji"
                >
                  {emoji}
                </button>
                <div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[0.5rem]"
                  style={{ background: '#0d9488', border: '2px solid var(--bg-base)' }}
                >
                  ✏️
                </div>
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
              <Field label="University">
                <SelectInput value={university} options={[...SA_UNIVERSITIES]} onChange={setUniversity} />
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
              </Field>
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
              </Field>
              <Field label="Dietary preference">
                <SelectInput value={dietaryPref} options={DIETARY_OPTIONS} onChange={setDietaryPref} />
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
          </div>
        )}

        {/* ── Account tab ──────────────────────────────────────────────────── */}
        {activeSection === 'account' && (
          <div className="space-y-3">

            {/* Subscription */}
            <div className="rounded-2xl p-5" style={{ background: isPremium ? 'rgba(13,148,136,0.06)' : 'rgba(255,255,255,0.03)', border: isPremium ? '1px solid rgba(13,148,136,0.2)' : '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-mono text-[0.58rem] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Subscription</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-white">{isPremium ? '★ Premium' : 'Free plan'}</p>
                  {isPremium && profile?.premium_until ? (
                    <p className="font-mono text-[0.58rem] mt-0.5" style={{ color: 'rgba(77,182,172,0.6)' }}>
                      Active until {new Date(profile.premium_until).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  ) : (
                    <p className="font-mono text-[0.58rem] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>15 Nova messages / month</p>
                  )}
                </div>
                {!isPremium && (
                  <a
                    href="/upgrade"
                    className="font-display font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, rgba(217,120,84,0.2) 0%, rgba(217,120,84,0.12) 100%)',
                      color: '#e8956e',
                      border: '1px solid rgba(217,120,84,0.3)',
                    }}
                  >
                    Upgrade ↗
                  </a>
                )}
              </div>
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
