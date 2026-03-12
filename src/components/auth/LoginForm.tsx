'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  const { loading, signIn } = useAuth()

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-400 flex items-center justify-center text-xl">
            🧭
          </div>
          <span className="font-display font-bold text-white">VarsityOS</span>
        </Link>
        <h1 className="font-display font-black text-2xl text-white mb-1.5">Welcome back</h1>
        <p className="font-mono text-xs text-white/40">Sign in to your account</p>
      </div>

      {/* Card */}
      <div className="flex-1 px-5 pb-10 max-w-sm mx-auto w-full">
        <div className="bg-[#111a18] border border-white/7 rounded-2xl p-6">

          {/* Form */}
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
