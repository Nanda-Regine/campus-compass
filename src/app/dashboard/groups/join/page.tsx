'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface InviteData {
  invite: {
    assignment_id: string
    expires_at: string
    group_assignments: {
      title: string
      subject: string | null
      due_date: string | null
      profiles: { name: string } | null
    }
  }
}

export default function JoinGroupPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setError('No invite token found'); setLoading(false); return }

    fetch(`/api/groups/invite?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setInviteData(data)
      })
      .catch(() => setError('Failed to load invite'))
      .finally(() => setLoading(false))
  }, [token])

  const acceptInvite = async () => {
    if (!token) return
    setJoining(true)
    try {
      const res = await fetch('/api/groups/invite', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (res.status === 401) {
        // Not logged in — send to signup with invite in URL
        router.push(`/auth/signup?invite=${token}`)
        return
      }
      if (!res.ok) { toast.error(data.error || 'Failed to join'); return }
      toast.success(`Joined "${data.assignment_title}"!`)
      router.push(`/dashboard/groups`)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080f0e] flex items-center justify-center">
        <div className="font-mono text-white/40 text-sm">Loading invite…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#080f0e] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="font-display font-bold text-white text-xl mb-2">Invalid Invite</h2>
          <p className="font-mono text-sm text-white/40 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="font-display font-bold text-sm bg-teal-600 text-white px-6 py-3 rounded-xl"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const assignment = inviteData?.invite?.group_assignments
  const creatorName = assignment?.profiles?.name || 'A classmate'

  return (
    <div className="min-h-screen bg-[#080f0e] flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-teal-600/20 border border-teal-600/30 flex items-center justify-center text-3xl mx-auto mb-5">
          👥
        </div>
        <h2 className="font-display font-black text-white text-2xl mb-1">You&apos;re invited!</h2>
        <p className="font-mono text-[0.7rem] text-white/40 mb-6">
          {creatorName} invited you to collaborate on a group assignment
        </p>

        <div className="bg-white/3 border border-white/10 rounded-2xl p-4 mb-6 text-left">
          <p className="font-display font-bold text-white text-base mb-0.5">{assignment?.title}</p>
          {assignment?.subject && (
            <p className="font-mono text-[0.65rem] text-teal-400">{assignment.subject}</p>
          )}
          {assignment?.due_date && (
            <p className="font-mono text-[0.62rem] text-white/40 mt-1">
              Due: {new Date(assignment.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

        <button
          onClick={acceptInvite}
          disabled={joining}
          className="w-full font-display font-bold text-base bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white py-3.5 rounded-2xl transition-all mb-3"
        >
          {joining ? 'Joining…' : 'Join Group'}
        </button>
        <p className="font-mono text-[0.58rem] text-white/25">
          You need a Campus Compass account to join. We&apos;ll create one if you don&apos;t have one.
        </p>
      </div>
    </div>
  )
}
