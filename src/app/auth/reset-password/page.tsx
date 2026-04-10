'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Eye, EyeOff, Lock } from 'lucide-react'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [sent, setSent] = useState(false)
  const [updated, setUpdated] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [validationError, setValidationError] = useState('')
  const { loading, resetPassword, updatePassword } = useAuth()

  // Detect if the user arrived here after a password-reset link (session already set by callback)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user)
    })
  }, [])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await resetPassword(email)
    if (!error) setSent(true)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match')
      return
    }
    const { error } = await updatePassword(password)
    if (!error) setUpdated(true)
  }

  // Loading state while we check auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#080f0e] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Success: password updated ──────────────────────────────
  if (updated) {
    return (
      <div className="min-h-screen bg-[#080f0e] flex flex-col items-center justify-center px-5 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="font-display font-black text-2xl text-white mb-2">Password updated!</h1>
        <p className="font-body text-sm text-white/50 max-w-xs leading-relaxed mb-6">
          Your password has been changed. You&apos;re now signed in.
        </p>
        <Link href="/dashboard" className="font-mono text-xs text-teal-500 hover:text-teal-400 transition-colors">
          Go to dashboard
        </Link>
      </div>
    )
  }

  // ── Success: reset email sent ──────────────────────────────
  if (sent) {
    return (
      <div className="min-h-screen bg-[#080f0e] flex flex-col items-center justify-center px-5 text-center">
        <div className="text-5xl mb-4">📬</div>
        <h1 className="font-display font-black text-2xl text-white mb-2">Check your email</h1>
        <p className="font-body text-sm text-white/50 max-w-xs leading-relaxed mb-6">
          If an account exists for {email}, you&apos;ll receive a password reset link shortly.
        </p>
        <Link href="/auth/login" className="font-mono text-xs text-teal-500 hover:text-teal-400 transition-colors">
          Back to login
        </Link>
      </div>
    )
  }

  // ── Set new password (post-reset-link, user is authenticated) ──
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080f0e] flex flex-col">
        <div className="px-5 pt-12 pb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
              <Image src="/logo.jpg" alt="VarsityOS" width={40} height={40} className="object-contain" />
            </div>
            <span className="font-display font-bold text-white">VarsityOS</span>
          </Link>
          <h1 className="font-display font-black text-2xl text-white mb-1.5">Set a new password</h1>
          <p className="font-mono text-xs text-white/40">Choose something strong and memorable.</p>
        </div>

        <div className="flex-1 px-5 pb-10 max-w-sm mx-auto w-full">
          <div className="bg-[#111a18] border border-white/7 rounded-2xl p-6">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <Input
                label="New password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                icon={<Lock size={15} />}
                hint="Use a mix of letters, numbers and symbols"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-white/30 hover:text-white/60 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
              <Input
                label="Confirm new password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                icon={<Lock size={15} />}
                error={validationError}
              />
              <Button type="submit" fullWidth loading={loading}>
                Update password
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ── Request reset link (unauthenticated) ───────────────────
  return (
    <div className="min-h-screen bg-[#080f0e] flex flex-col">
      <div className="px-5 pt-12 pb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-400 flex items-center justify-center text-xl">
            🧭
          </div>
          <span className="font-display font-bold text-white">VarsityOS</span>
        </Link>
        <h1 className="font-display font-black text-2xl text-white mb-1.5">Reset your password</h1>
        <p className="font-mono text-xs text-white/40">We&apos;ll send you a link to reset it.</p>
      </div>

      <div className="flex-1 px-5 pb-10 max-w-sm mx-auto w-full">
        <div className="bg-[#111a18] border border-white/7 rounded-2xl p-6">
          <form onSubmit={handleRequestReset} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@university.ac.za"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Button type="submit" fullWidth loading={loading}>
              Send reset link
            </Button>
          </form>
        </div>
        <p className="text-center mt-5 font-mono text-xs text-white/30">
          Remembered it?{' '}
          <Link href="/auth/login" className="text-teal-500 hover:text-teal-400 transition-colors">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
