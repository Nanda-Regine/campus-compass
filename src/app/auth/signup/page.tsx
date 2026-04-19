import type { Metadata } from 'next'
import { Suspense } from 'react'
import SignupForm from '@/components/auth/SignupForm'

export const metadata: Metadata = {
  title: 'Create Account',
}

function SignupSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      {/* Brand bar */}
      <div className="px-5 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-400 flex items-center justify-center text-xl">
            🧭
          </div>
          <span className="font-display font-bold text-white">VarsityOS</span>
        </div>
        <div className="h-7 w-48 bg-white/8 rounded-lg mx-auto mb-2 animate-pulse" />
        <div className="h-3 w-36 bg-white/5 rounded mx-auto animate-pulse" />
      </div>

      {/* Card skeleton */}
      <div className="flex-1 px-5 pb-10 max-w-sm mx-auto w-full">
        <div className="bg-[var(--bg-surface)] border border-white/7 rounded-2xl p-6 space-y-4">
          {/* Google button skeleton */}
          <div className="h-11 w-full bg-white/6 rounded-xl animate-pulse" />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/7" />
            <span className="font-mono text-[0.6rem] text-white/25 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/7" />
          </div>

          {/* Name field */}
          <div className="space-y-1.5">
            <div className="h-3 w-16 bg-white/8 rounded animate-pulse" />
            <div className="h-11 w-full bg-white/6 rounded-xl animate-pulse" />
          </div>

          {/* Email field */}
          <div className="space-y-1.5">
            <div className="h-3 w-24 bg-white/8 rounded animate-pulse" />
            <div className="h-11 w-full bg-white/6 rounded-xl animate-pulse" />
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="h-3 w-16 bg-white/8 rounded animate-pulse" />
            <div className="h-11 w-full bg-white/6 rounded-xl animate-pulse" />
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-white/8 rounded animate-pulse" />
            <div className="h-11 w-full bg-white/6 rounded-xl animate-pulse" />
          </div>

          {/* CTA button */}
          <div className="h-11 w-full bg-teal-600/40 rounded-xl animate-pulse mt-1" />
        </div>

        <div className="h-4 w-40 bg-white/5 rounded mx-auto mt-5 animate-pulse" />
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupSkeleton />}>
      <SignupForm />
    </Suspense>
  )
}
