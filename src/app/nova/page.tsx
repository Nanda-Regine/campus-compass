import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import TopBar from '@/components/layout/TopBar'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Nova — AI Companion' }

export default async function NovaPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-[#080f0e] pb-24">
      <TopBar title="Nova" />
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">🌟</div>
        <h2 className="font-display font-black text-xl text-white mb-2">Nova — AI Companion</h2>
        <p className="font-mono text-sm text-white/40 mb-6">
          Your empathetic SA-coded AI mental health companion. Understands NSFAS stress, load shedding, and imposter syndrome.
          Full chat interface coming soon.
        </p>
        <Link
          href="/dashboard"
          className="font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-xl transition-all"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
