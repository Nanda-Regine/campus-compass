'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'

const schema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Enter a valid email'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { loading, signUp, signInWithGoogle } = useAuth()
  const searchParams = useSearchParams()

  // Capture referral code from URL and persist in localStorage
  // Applied after login via the dashboard's useEffect
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) localStorage.setItem('pending_ref', ref.toLowerCase().trim())
  }, [searchParams])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    const { error } = await signUp(data.email, data.password, data.name)
    if (!error) setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#080f0e] flex flex-col items-center justify-center px-5 text-center">
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
    <div className="min-h-screen bg-[#080f0e] flex flex-col">
      <div className="px-5 pt-12 pb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center">
            <Image src="/logo.png" alt="VarsityOS" width={40} height={40} className="object-contain" />
          </div>
          <span className="font-display font-bold text-white">VarsityOS</span>
        </Link>
        <h1 className="font-display font-black text-2xl text-white mb-1.5">Create your account</h1>
        <p className="font-mono text-xs text-white/40">Free forever. No credit card needed.</p>
      </div>

      <div className="flex-1 px-5 pb-10 max-w-sm mx-auto w-full">
        <div className="bg-[#111a18] border border-white/7 rounded-2xl p-6">

          <Button
            variant="outline"
            fullWidth
            onClick={signInWithGoogle}
            loading={loading}
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
            <Input
              label="Email address"
              type="email"
              placeholder="you@university.ac.za"
              autoComplete="email"
              icon={<Mail size={15} />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              icon={<Lock size={15} />}
              error={errors.password?.message}
              hint="Use a mix of letters, numbers and symbols"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              {...register('password')}
            />
            <Input
              label="Confirm password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat your password"
              autoComplete="new-password"
              icon={<Lock size={15} />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <p className="font-mono text-[0.6rem] text-white/25 leading-relaxed">
              By signing up, you agree to our{' '}
              <a href="#" className="text-teal-500 hover:underline">Terms</a> and{' '}
              <a href="#" className="text-teal-500 hover:underline">Privacy Policy</a>.
            </p>

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
