import type { Metadata } from 'next'
import { Suspense } from 'react'
import SignupForm from '@/components/auth/SignupForm'

export const metadata: Metadata = {
  title: 'Create Account',
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080f0e] flex items-center justify-center">
        <div className="font-mono text-white/40 text-sm">Loading…</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
