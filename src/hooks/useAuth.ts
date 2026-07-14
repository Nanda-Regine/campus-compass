'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store'
import toast from 'react-hot-toast'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { reset } = useAppStore()

  const signUp = async (email: string, password: string, name: string, popiaConsent = false) => {
    setLoading(true)
    try {
      // Clear any partial/ghost session before creating a new one.
      // Prevents IndexedDB lock contention on interrupted signups.
      await supabase.auth.signOut({ scope: 'local' })

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Carry consent in user_metadata for the audit trail. The profiles row
          // is stamped server-side in /auth/callback — a client write here runs
          // as the anon role (no session until email confirmation) and is blocked
          // by RLS, so it cannot be relied on.
          data: { full_name: name, popia_consent: popiaConsent },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      // With email auto-confirm ON, signUp returns a live session immediately —
      // no email in the critical path, so the student goes straight to onboarding.
      // If confirmation is ever re-enabled, session is null and we fall back to
      // the "check your email" screen. Email must never be able to block signup.
      const session = data.session ?? null
      if (session) toast.success('Account created! Let’s set you up 🚀')
      else toast.success('Check your email to confirm your account!')
      return { error: null, session }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      toast.error(message)
      return { error: message, session: null }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string, redirectTo = '/dashboard') => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      // refresh() forces the server to re-read the new session cookie before navigating
      router.refresh()
      router.replace(redirectTo)
      return { error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      toast.error(message)
      return { error: message }
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) throw error
      return { error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign in failed'
      toast.error(message)
      setLoading(false)
      return { error: message }
    }
  }

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    reset()
    router.push('/auth/login')
    router.refresh()
    setLoading(false)
  }

  const resetPassword = async (email: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      })
      if (error) throw error
      toast.success('Password reset email sent!')
      return { error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Reset failed'
      toast.error(message)
      return { error: message }
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Password updated!')
      router.push('/dashboard')
      return { error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed'
      toast.error(message)
      return { error: message }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  }
}
