'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { AmbientImage } from '@/components/ui/AmbientImage'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react'

const schema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Enter a valid email'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  popia_consent:   z.literal(true, { errorMap: () => ({ message: 'You must accept the Privacy Policy to continue' }) }),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

// SA university email domains → friendly name
const SA_UNI_DOMAINS: Record<string, string> = {
  'wits.ac.za': 'Wits University',
  'uct.ac.za': 'UCT',
  'sun.ac.za': 'Stellenbosch University',
  'up.ac.za': 'University of Pretoria',
  'ukzn.ac.za': 'UKZN',
  'uj.ac.za': 'UJ',
  'nwu.ac.za': 'NWU',
  'ufs.ac.za': 'UFS',
  'ru.ac.za': 'Rhodes University',
  'uwc.ac.za': 'UWC',
  'ufh.ac.za': 'UFH',
  'unizulu.ac.za': 'UniZulu',
  'univen.ac.za': 'UniVen',
  'ul.ac.za': 'UL',
  'cput.ac.za': 'CPUT',
  'dut.ac.za': 'DUT',
  'tut.ac.za': 'TUT',
  'cut.ac.za': 'CUT',
  'vut.ac.za': 'VUT',
  'mut.ac.za': 'MUT',
  'wsu.ac.za': 'WSU',
  'smu.ac.za': 'SMU',
}

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8)  score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const map = [
    { label: '', color: '' },
    { label: 'Weak', color: '#ef4444' },
    { label: 'Fair', color: '#f97316' },
    { label: 'Good', color: '#eab308' },
    { label: 'Strong', color: '#22c55e' },
  ]
  return { score, ...map[score] }
}

function getUniHint(email: string): string | null {
  if (!email.includes('@')) return null
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null
  if (SA_UNI_DOMAINS[domain]) return `${SA_UNI_DOMAINS[domain]} detected`
  if (domain.endsWith('.ac.za')) return 'University email detected'
  return null
}

export default function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { loading, signUp, signInWithGoogle } = useAuth()
  const searchParams = useSearchParams()
  const consentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) localStorage.setItem('pending_ref', ref.toLowerCase().trim())
  }, [searchParams])

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const passwordValue = watch('password') ?? ''
  const emailValue    = watch('email') ?? ''
  const consentChecked = watch('popia_consent') === true
  const strength      = getPasswordStrength(passwordValue)
  const uniHint       = getUniHint(emailValue)

  const onSubmit = async (data: FormData) => {
    setAuthError(null)
    const { error } = await signUp(data.email, data.password, data.name, true)
    if (!error) setSubmitted(true)
    else setAuthError(error)
  }

  const handleGoogle = async () => {
    // POPIA requires explicit consent for OAuth signups too, not just the
    // email/password path — gate the Google button on the same checkbox.
    if (!consentChecked) {
      setAuthError('Please tick the Privacy Policy consent box below before continuing.')
      consentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setGoogleLoading(true)
    await signInWithGoogle()
    setGoogleLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-5xl mb-4 animate-bounce-in">📬</div>
        <h1 className="font-display font-black text-2xl text-white mb-2">Check your email!</h1>
        <p className="font-body text-sm text-white/50 max-w-xs leading-relaxed mb-6">
          We sent a confirmation link to your inbox. Click it to activate your account and start organising your varsity life.
        </p>
        <Link href="/auth/login" className="font-mono text-xs text-teal-500 hover:text-teal-400 transition-colors">
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      <AmbientImage zone="onboarding" opacity={0.15} blurPx={16} saturation={1.4} overlayColor="rgba(5,4,12,0.72)" />
      <div className="px-5 pt-12 pb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
            <Image src="/favicon.jpg" alt="VarsityOS" width={40} height={40} className="object-contain" />
          </div>
          <span className="font-display font-bold text-white">VarsityOS</span>
        </Link>
        <h1 className="font-display font-black text-2xl text-white mb-1.5">Create your account</h1>
        <p className="font-mono text-xs text-white/40">Free forever. No credit card needed.</p>
      </div>

      <div className="flex-1 px-5 pb-10 max-w-sm mx-auto w-full">
        <div className="card-base" style={{ padding: 24 }}>

          <Button
            variant="outline"
            fullWidth
            onClick={handleGoogle}
            loading={googleLoading}
            className="mb-5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </Button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/7" />
            <span className="font-mono text-[0.6rem] text-white/25 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/7" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Input
              label="Your name"
              type="text"
              placeholder="e.g. Thandi Nkosi"
              autoComplete="name"
              icon={<User size={15} />}
              error={errors.name?.message}
              {...register('name')}
            />

            <div>
              <Input
                label="Email address"
                type="email"
                placeholder="you@university.ac.za"
                autoComplete="email"
                icon={<Mail size={15} />}
                error={errors.email?.message}
                {...register('email')}
              />
              {uniHint && !errors.email && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <CheckCircle2 size={11} className="text-teal-400 shrink-0" />
                  <span className="font-mono text-[0.6rem] text-teal-400">{uniHint}</span>
                </div>
              )}
            </div>

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                icon={<Lock size={15} />}
                error={errors.password?.message}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-white/30 hover:text-white/60 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                {...register('password')}
              />
              {/* Password strength bar */}
              {passwordValue.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)',
                        }}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className="font-mono text-[0.58rem]" style={{ color: strength.color }}>
                      {strength.label}
                      {strength.score < 3 && ' — add uppercase, numbers or symbols'}
                    </p>
                  )}
                </div>
              )}
            </div>

            <Input
              label="Confirm password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat your password"
              autoComplete="new-password"
              icon={<Lock size={15} />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {/* POPIA explicit consent — required by POPIA s11 (gates both the
                email/password submit and the Google button above) */}
            <div ref={consentRef} className="rounded-xl border border-white/8 bg-white/3 px-3 py-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500 focus:ring-offset-0 shrink-0"
                  {...register('popia_consent')}
                />
                <span className="font-mono text-[0.6rem] text-white/45 leading-relaxed">
                  I have read and agree to the{' '}
                  <Link href="/terms" className="text-teal-500 hover:text-teal-400 underline">Terms &amp; Conditions</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-teal-500 hover:text-teal-400 underline">Privacy Policy</Link>
                  {' '}(POPIA — Reg. 2026-005658). I consent to VarsityOS processing my personal information as described.
                </span>
              </label>
              {errors.popia_consent && (
                <p className="mt-1.5 font-mono text-[0.6rem] text-red-400">{errors.popia_consent.message}</p>
              )}
            </div>

            {authError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <p className="font-mono text-[0.65rem] text-red-400">{authError}</p>
              </div>
            )}

            <Button type="submit" fullWidth loading={loading} className="mt-1">
              Create free account 🚀
            </Button>
          </form>
        </div>

        <p className="text-center mt-5 font-mono text-xs text-white/30">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-teal-500 hover:text-teal-400 transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
