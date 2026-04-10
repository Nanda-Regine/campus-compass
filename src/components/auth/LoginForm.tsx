'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const { loading, signIn, signInWithGoogle } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    await signIn(data.email, data.password)
  }

  return (
    <div className="min-h-screen bg-[#080f0e] flex flex-col">
      {/* Top brand bar */}
      <div className="px-5 pt-12 pb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center">
            <Image src="/logo.png" alt="VarsityOS" width={40} height={40} className="object-contain" />
          </div>
          <span className="font-display font-bold text-white">VarsityOS</span>
        </Link>
        <h1 className="font-display font-black text-2xl text-white mb-1.5">Welcome back</h1>
        <p className="font-mono text-xs text-white/40">Sign in to your account</p>
      </div>

      {/* Card */}
      <div className="flex-1 px-5 pb-10 max-w-sm mx-auto w-full">
        <div className="bg-[#111a18] border border-white/7 rounded-2xl p-6">

          {/* Google OAuth button */}
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
            Sign in with Google
          </Button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/7" />
            <span className="font-mono text-[0.6rem] text-white/25 uppercase tracking-widest">or continue with email</span>
            <div className="flex-1 h-px bg-white/7" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
              placeholder="Your password"
              autoComplete="current-password"
              icon={<Lock size={15} />}
              error={errors.password?.message}
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
              {...register('password')}
            />

            <div className="flex justify-end">
              <Link
                href="/auth/reset-password"
                className="font-mono text-[0.65rem] text-teal-500 hover:text-teal-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={loading} className="mt-2">
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center mt-5 font-mono text-xs text-white/30">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-teal-500 hover:text-teal-400 transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
