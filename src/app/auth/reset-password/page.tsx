'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const { loading, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await resetPassword(email)
    if (!error) setSent(true)
  }

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

  return (
    <div className="min-h-screen bg-[#080f0e] flex flex-col">
      <div className="px-5 pt-12 pb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-400 flex items-center justify-center text-xl">
            🧭
          </div>
          <span className="font-display font-bold text-white">Campus Compass</span>
        </Link>
        <h1 className="font-display font-black text-2xl text-white mb-1.5">Reset your password</h1>
        <p className="font-mono text-xs text-white/40">We&apos;ll send you a link to reset it.</p>
      </div>

      <div className="flex-1 px-5 pb-10 max-w-sm mx-auto w-full">
        <div className="bg-[#111a18] border border-white/7 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
