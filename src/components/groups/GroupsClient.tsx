'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface GroupMember {
  id: string
  user_id: string | null
  email: string
  display_name: string | null
  role: 'leader' | 'member'
  member_role: string | null
  status: 'invited' | 'joined'
}

interface GroupTask {
  id: string
  title: string
  done: boolean
  assigned_to: string | null
  assigned_to_email: string | null
  due_date: string | null
}

interface GroupAssignment {
  id: string
  created_by: string
  title: string
  subject: string | null
  description: string | null
  due_date: string | null
  status: 'active' | 'submitted' | 'graded'
  created_at: string
  group_members: GroupMember[]
  group_tasks: GroupTask[]
}

interface GroupMessage {
  id: string
  assignment_id: string
  user_id: string
  content: string
  is_decision: boolean
  is_pinned: boolean
  created_at: string
}

interface GroupMeeting {
  id: string
  created_by: string
  title: string
  meeting_at: string
  duration_min: number
  location: string | null
  link: string | null
  agenda: string | null
  created_at: string
}

type View = 'list' | 'detail'
type DetailTab = 'overview' | 'tasks' | 'members' | 'discussion' | 'meetings' | 'tips'

const MEMBER_ROLES = ['Leader', 'Researcher', 'Writer', 'Designer', 'Presenter', 'Reviewer'] as const
type MemberRole = typeof MEMBER_ROLES[number]

const ROLE_COLORS: Record<MemberRole, string> = {
  Leader:     'text-amber-400 bg-amber-500/15 border-amber-500/20',
  Researcher: 'text-sky-400 bg-sky-500/15 border-sky-500/20',
  Writer:     'text-teal-400 bg-teal-500/15 border-teal-500/20',
  Designer:   'text-rose-400 bg-rose-500/15 border-rose-500/20',
  Presenter:  'text-indigo-400 bg-indigo-500/15 border-indigo-500/20',
  Reviewer:   'text-emerald-400 bg-emerald-500/15 border-emerald-500/20',
}

export default function GroupsClient({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [assignments, setAssignments]   = useState<GroupAssignment[]>([])
  const [loading, setLoading]           = useState(true)
  const [view, setView]                 = useState<View>('list')
  const [selected, setSelected]         = useState<GroupAssignment | null>(null)
  const [showNewForm, setShowNewForm]   = useState(false)
  const [showAddTask, setShowAddTask]   = useState(false)
  const [inviteUrl, setInviteUrl]       = useState<string | null>(null)
  const [copied, setCopied]             = useState(false)
  const [detailTab, setDetailTab]       = useState<DetailTab>('overview')
  const [submitting, setSubmitting]     = useState(false)
  const [submitLink, setSubmitLink]     = useState('')
  const [showSubmitForm, setShowSubmitForm] = useState(false)

  // Discussion state
  const [messages, setMessages]         = useState<GroupMessage[]>([])
  const [msgText, setMsgText]           = useState('')
  const [msgIsDecision, setMsgIsDecision] = useState(false)
  const [sendingMsg, setSendingMsg]     = useState(false)
  const [loadingMsgs, setLoadingMsgs]   = useState(false)

  // Meetings state
  const [meetings, setMeetings]         = useState<GroupMeeting[]>([])
  const [loadingMeetings, setLoadingMeetings] = useState(false)
  const [showMeetingForm, setShowMeetingForm] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingAt, setMeetingAt]       = useState('')
  const [meetingDuration, setMeetingDuration] = useState(60)
  const [meetingLocation, setMeetingLocation] = useState('')
  const [meetingLink, setMeetingLink]   = useState('')
  const [meetingAgenda, setMeetingAgenda] = useState('')
  const [creatingMeeting, setCreatingMeeting] = useState(false)

  // Task reassignment
  const [reassignTaskId, setReassignTaskId] = useState<string | null>(null)

  // New assignment form
  const [newTitle, setNewTitle]         = useState('')
  const [newSubject, setNewSubject]     = useState('')
  const [newDueDate, setNewDueDate]     = useState('')
  const [newDesc, setNewDesc]           = useState('')
  const [creating, setCreating]         = useState(false)

  // New task form
  const [taskTitle, setTaskTitle]       = useState('')
  const [taskAssigneeEmail, setTaskAssigneeEmail] = useState('')
  const [taskDueDate, setTaskDueDate]   = useState('')
  const [addingTask, setAddingTask]     = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/groups/assignments')
      if (!res.ok) {
        if (res.status === 401) router.push('/auth/login')
        return
      }
      const data = await res.json()
      const list: GroupAssignment[] = data.assignments || []
      setAssignments(list)
      // Keep selected in sync
      setSelected(prev => prev ? (list.find(a => a.id === prev.id) ?? prev) : prev)
    } catch (err) {
      console.error('[GroupsClient] load:', err)
      toast.error('Failed to load group assignments')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const tasksChannel = supabase
      .channel('group-tasks-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_tasks' }, () => load())
      .subscribe()
    const membersChannel = supabase
      .channel('group-members-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(membersChannel)
    }
  }, [supabase, load])

  const loadMessages = useCallback(async (assignmentId: string) => {
    setLoadingMsgs(true)
    try {
      const res = await fetch(`/api/groups/messages?assignment_id=${assignmentId}`)
      if (res.ok) setMessages((await res.json()).messages || [])
    } catch { /* non-critical */ }
    setLoadingMsgs(false)
  }, [])

  const loadMeetings = useCallback(async (assignmentId: string) => {
    setLoadingMeetings(true)
    try {
      const res = await fetch(`/api/groups/meetings?assignment_id=${assignmentId}`)
      if (res.ok) setMeetings((await res.json()).meetings || [])
    } catch { /* non-critical */ }
    setLoadingMeetings(false)
  }, [])

  const sendMessage = async (assignmentId: string) => {
    if (!msgText.trim() || sendingMsg) return
    setSendingMsg(true)
    const text = msgText.trim()
    setMsgText('')
    try {
      const res = await fetch('/api/groups/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: assignmentId, content: text, is_decision: msgIsDecision }),
      })
      if (res.ok) { const d = await res.json(); setMessages(prev => [...prev, d.message]); setMsgIsDecision(false) }
    } catch { toast.error('Failed to send message') }
    setSendingMsg(false)
  }

  const createAssignment = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/groups/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, subject: newSubject, description: newDesc, due_date: newDueDate || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Group assignment created!')
      setShowNewForm(false); setNewTitle(''); setNewSubject(''); setNewDueDate(''); setNewDesc('')
      await load()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to create') }
    finally { setCreating(false) }
  }

  const addTask = async () => {
    if (!taskTitle.trim() || !selected) return
    setAddingTask(true)
    try {
      const member = selected.group_members.find(m => m.email === taskAssigneeEmail)
      const res = await fetch('/api/groups/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: selected.id, title: taskTitle,
          due_date: taskDueDate || null,
          assigned_to: member?.user_id || null,
          assigned_to_email: taskAssigneeEmail || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Task added!'); setShowAddTask(false); setTaskTitle(''); setTaskAssigneeEmail(''); setTaskDueDate('')
      await load()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to add task') }
    finally { setAddingTask(false) }
  }

  const toggleTask = async (taskId: string, done: boolean) => {
    await fetch('/api/groups/tasks', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, done }),
    })
    await load()
  }

  const reassignTask = async (taskId: string, email: string) => {
    const member = selected?.group_members.find(m => m.email === email)
    await fetch('/api/groups/tasks', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, assigned_to: member?.user_id || null, assigned_to_email: email || null }),
    })
    setReassignTaskId(null)
    await load()
    toast.success('Task reassigned')
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    await fetch(`/api/groups/tasks?id=${taskId}`, { method: 'DELETE' })
    await load()
    toast.success('Task deleted')
  }

  const generateInvite = async (assignmentId: string) => {
    try {
      const res = await fetch('/api/groups/invite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: assignmentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInviteUrl(data.inviteUrl)
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to generate invite') }
  }

  const copyInvite = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true); toast.success('Invite link copied! Share via WhatsApp')
    setTimeout(() => setCopied(false), 2000)
  }

  const submitAssignment = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/groups/assignments', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, status: 'submitted', submission_link: submitLink || null }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      toast.success('Assignment marked as submitted!')
      setShowSubmitForm(false)
      await load()
    } catch { toast.error('Could not update submission status') }
    finally { setSubmitting(false) }
  }

  const assignRole = async (memberId: string, role: MemberRole) => {
    // Optimistic update in selected
    setSelected(prev => prev ? {
      ...prev,
      group_members: prev.group_members.map(m => m.id === memberId ? { ...m, member_role: role } : m),
    } : prev)
    try {
      const res = await fetch('/api/groups/members', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, member_role: role }),
      })
      if (!res.ok) throw new Error('Failed to save role')
      await load()
    } catch { toast.error('Could not save role — try again') }
  }

  const removeMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this group?`)) return
    try {
      const res = await fetch(`/api/groups/members?member_id=${memberId}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success(`${memberName} removed`)
      await load()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to remove member') }
  }

  const createMeeting = async () => {
    if (!meetingTitle.trim() || !meetingAt || !selected) return
    setCreatingMeeting(true)
    try {
      const res = await fetch('/api/groups/meetings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: selected.id,
          title: meetingTitle,
          meeting_at: meetingAt,
          duration_min: meetingDuration,
          location: meetingLocation || null,
          link: meetingLink || null,
          agenda: meetingAgenda || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Meeting scheduled!')
      setShowMeetingForm(false)
      setMeetingTitle(''); setMeetingAt(''); setMeetingLocation(''); setMeetingLink(''); setMeetingAgenda('')
      await loadMeetings(selected.id)
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to schedule meeting') }
    finally { setCreatingMeeting(false) }
  }

  const deleteMeeting = async (meetingId: string) => {
    if (!confirm('Delete this meeting?')) return
    await fetch(`/api/groups/meetings?id=${meetingId}`, { method: 'DELETE' })
    if (selected) await loadMeetings(selected.id)
    toast.success('Meeting removed')
  }

  const daysUntil = (date: string) => {
    const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
    if (d < 0)  return { label: `${Math.abs(d)}d overdue`, color: 'text-red-400' }
    if (d === 0) return { label: 'Due today',               color: 'text-amber-400' }
    if (d <= 3) return { label: `${d}d left`,              color: 'text-amber-400' }
    return { label: `${d}d left`, color: 'text-teal-400' }
  }

  const getProgress = (a: GroupAssignment) => {
    const total = a.group_tasks.length
    const done  = a.group_tasks.filter(t => t.done).length
    return total === 0 ? 0 : Math.round((done / total) * 100)
  }

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}
      </div>
    )
  }

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (view === 'detail' && selected) {
    const progress     = getProgress(selected)
    const isLeader     = selected.created_by === userId
    const joinedMembers = selected.group_members.filter(m => m.status === 'joined')

    const contribs: Record<string, { assigned: number; done: number }> = {}
    joinedMembers.forEach(m => { contribs[m.email] = { assigned: 0, done: 0 } })
    selected.group_tasks.forEach(t => {
      if (t.assigned_to_email && contribs[t.assigned_to_email]) {
        contribs[t.assigned_to_email].assigned++
        if (t.done) contribs[t.assigned_to_email].done++
      }
    })

    const freeRiders = selected.group_tasks.length > 0
      ? joinedMembers.filter(m => (contribs[m.email]?.assigned ?? 0) === 0)
      : []

    const DETAIL_TABS: { id: DetailTab; label: string }[] = [
      { id: 'overview',    label: 'Overview' },
      { id: 'tasks',       label: `Tasks (${selected.group_tasks.length})` },
      { id: 'members',     label: `Team (${joinedMembers.length})` },
      { id: 'discussion',  label: `Board (${messages.length})` },
      { id: 'meetings',    label: `Meetings (${meetings.length})` },
      { id: 'tips',        label: 'Playbook' },
    ]

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/7">
          <button
            onClick={() => { setView('list'); setInviteUrl(null); setDetailTab('overview'); setMeetings([]); setMessages([]) }}
            className="font-mono text-[0.62rem] text-white/35 hover:text-white/60 mb-2 flex items-center gap-1 transition-colors"
          >
            ← All groups
          </button>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display font-bold text-white text-base leading-tight truncate">{selected.title}</h2>
              {selected.subject && <p className="font-mono text-[0.62rem] text-teal-400 mt-0.5">{selected.subject}</p>}
            </div>
            <span className={cn('font-mono text-[0.55rem] px-2 py-1 rounded-lg border flex-shrink-0',
              selected.status === 'active'    ? 'bg-teal-600/15 text-teal-400 border-teal-600/20'
              : selected.status === 'submitted' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
              : 'bg-green-500/15 text-green-400 border-green-500/20'
            )}>
              {selected.status}
            </span>
          </div>
          {selected.due_date && (
            <p className={cn('font-mono text-[0.58rem] mt-1.5', daysUntil(selected.due_date).color)}>
              Due {new Date(selected.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} · {daysUntil(selected.due_date).label}
            </p>
          )}

          {/* Tab bar */}
          <div className="flex gap-1 mt-3 overflow-x-auto no-scrollbar">
            {DETAIL_TABS.map(t => (
              <button key={t.id} onClick={() => {
                setDetailTab(t.id)
                if (t.id === 'discussion') void loadMessages(selected.id)
                if (t.id === 'meetings')   void loadMeetings(selected.id)
              }} className={cn(
                'flex-shrink-0 font-mono text-[0.6rem] px-3 py-1.5 rounded-lg transition-all border',
                detailTab === t.id ? 'bg-teal-600/15 text-teal-400 border-teal-600/20' : 'bg-transparent text-white/35 border-white/7 hover:text-white/60',
              )}>
                {t.label}
                {t.id === 'members' && freeRiders.length > 0 && <span className="ml-1 text-red-400">⚠</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ── Overview tab ── */}
          {detailTab === 'overview' && (
            <>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="font-mono text-[0.6rem] text-white/40">Progress</span>
                  <span className="font-mono text-[0.6rem] text-white/60">{selected.group_tasks.filter(t => t.done).length}/{selected.group_tasks.length} tasks</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/8 overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all duration-500', progress === 100 ? 'bg-green-500' : progress > 60 ? 'bg-teal-500' : 'bg-amber-500')} style={{ width: `${progress}%` }} />
                </div>
                <p className="font-mono text-[0.53rem] text-white/25 mt-1">{progress}% complete</p>
              </div>

              {selected.due_date && (() => {
                const d = Math.ceil((new Date(selected.due_date).getTime() - Date.now()) / 86400000)
                if (d <= 3 && d >= 0 && selected.status === 'active') return (
                  <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2.5">
                    <p className="font-mono text-[0.65rem] text-red-400 font-bold">⚡ Due in {d === 0 ? 'today' : `${d} day${d === 1 ? '' : 's'}`}</p>
                    <p className="font-mono text-[0.58rem] text-white/40 mt-1">Coordinate final review now. All tasks should be done 24h before submission.</p>
                  </div>
                )
                if (d < 0) return (
                  <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2.5">
                    <p className="font-mono text-[0.65rem] text-amber-400 font-bold">⏰ Overdue by {Math.abs(d)} day{Math.abs(d) === 1 ? '' : 's'}</p>
                    <p className="font-mono text-[0.58rem] text-white/40 mt-1">Submit immediately or contact your lecturer to request an extension.</p>
                  </div>
                )
                return null
              })()}

              {freeRiders.length > 0 && (
                <div className="bg-red-500/6 border border-red-500/15 rounded-xl px-3 py-2.5">
                  <p className="font-mono text-[0.62rem] text-red-400 font-bold mb-1">⚠️ No tasks assigned to: {freeRiders.map(m => m.display_name || m.email).join(', ')}</p>
                  <p className="font-mono text-[0.58rem] text-white/40">Go to the Team tab → assign tasks or remove inactive members.</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Members',    value: joinedMembers.length },
                  { label: 'Tasks done', value: `${selected.group_tasks.filter(t => t.done).length}/${selected.group_tasks.length}` },
                  { label: 'Status',     value: selected.status },
                ].map(s => (
                  <div key={s.label} className="bg-white/3 border border-white/7 rounded-xl px-3 py-2.5 text-center">
                    <div className="font-display font-black text-white text-sm">{s.value}</div>
                    <div className="font-mono text-[0.53rem] text-white/30 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {selected.description && (
                <div className="bg-white/3 border border-white/7 rounded-xl px-3 py-2.5">
                  <p className="font-mono text-[0.58rem] text-white/40 leading-relaxed">{selected.description}</p>
                </div>
              )}

              {selected.status === 'active' && isLeader && progress >= 80 && (
                <div>
                  {!showSubmitForm ? (
                    <button onClick={() => setShowSubmitForm(true)} className="w-full font-display font-bold text-sm bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/20 py-2.5 rounded-xl transition-all">
                      Mark as Submitted →
                    </button>
                  ) : (
                    <div className="bg-white/3 border border-white/10 rounded-xl p-3 space-y-2.5">
                      <p className="font-mono text-[0.62rem] text-white/50">Submission link or reference (optional)</p>
                      <input value={submitLink} onChange={e => setSubmitLink(e.target.value)} placeholder="e.g. Google Drive link" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-amber-500 font-body" />
                      <div className="flex gap-2">
                        <button onClick={submitAssignment} disabled={submitting} className="flex-1 font-display font-bold text-sm bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white py-2 rounded-xl transition-all">
                          {submitting ? 'Submitting…' : 'Confirm Submitted'}
                        </button>
                        <button onClick={() => setShowSubmitForm(false)} className="px-3 font-mono text-sm text-white/40 border border-white/10 rounded-xl">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isLeader && (
                <div>
                  <button onClick={() => generateInvite(selected.id)} className="w-full font-mono text-[0.65rem] text-teal-400 hover:text-teal-300 border border-teal-600/20 bg-teal-600/8 py-2 rounded-xl transition-all">
                    + Generate invite link (share via WhatsApp)
                  </button>
                  {inviteUrl && (
                    <div className="mt-2 bg-teal-600/10 border border-teal-600/20 rounded-xl p-3">
                      <p className="font-mono text-[0.6rem] text-teal-300 break-all mb-2">{inviteUrl}</p>
                      <button onClick={copyInvite} className={cn('font-mono text-[0.62rem] px-3 py-1.5 rounded-lg border transition-all', copied ? 'bg-green-500/15 text-green-400 border-green-500/20' : 'bg-white/5 text-white/60 border-white/10')}>
                        {copied ? '✓ Copied!' : 'Copy link'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── Tasks tab ── */}
          {detailTab === 'tasks' && (
            <>
              <div className="flex justify-between items-center">
                <span className="font-mono text-[0.6rem] text-white/40 uppercase tracking-wide">Task list</span>
                <button onClick={() => setShowAddTask(!showAddTask)} className="font-mono text-[0.62rem] text-teal-400 hover:text-teal-300 transition-colors">
                  {showAddTask ? '✕ Cancel' : '+ Add task'}
                </button>
              </div>

              {showAddTask && (
                <div className="bg-white/3 border border-white/10 rounded-xl p-3 space-y-2">
                  <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Task title *" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-teal-600 font-body" />
                  <select value={taskAssigneeEmail} onChange={e => setTaskAssigneeEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 outline-none focus:border-teal-600 font-body">
                    <option value="">Assign to… (optional)</option>
                    {joinedMembers.map(m => (
                      <option key={m.email} value={m.email}>{m.display_name || m.email}{m.member_role ? ` · ${m.member_role}` : ''}</option>
                    ))}
                  </select>
                  <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 outline-none focus:border-teal-600 font-body" />
                  <div className="flex gap-2">
                    <button onClick={addTask} disabled={addingTask || !taskTitle.trim()} className="flex-1 font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white py-2 rounded-xl transition-all">
                      {addingTask ? 'Adding…' : 'Add task'}
                    </button>
                  </div>
                </div>
              )}

              {selected.group_tasks.length === 0 ? (
                <p className="font-mono text-[0.65rem] text-white/25 text-center py-6">No tasks yet — add the first one above</p>
              ) : (
                <div className="space-y-2">
                  <p className="font-mono text-[0.56rem] text-white/25 uppercase tracking-wide">To do</p>
                  {selected.group_tasks.filter(t => !t.done).map(t => {
                    const assignee = joinedMembers.find(m => m.email === t.assigned_to_email)
                    const isReassigning = reassignTaskId === t.id
                    return (
                      <div key={t.id} className="bg-white/3 border border-white/10 rounded-xl px-3 py-2.5 space-y-2">
                        <div className="flex items-start gap-3">
                          <button onClick={() => toggleTask(t.id, true)} className="mt-0.5 w-5 h-5 rounded-md border-2 border-white/20 hover:border-teal-500 flex-shrink-0 transition-all" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-body text-white">{t.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {t.assigned_to_email ? (
                                <span className="font-mono text-[0.55rem] text-teal-400">→ {assignee?.display_name || t.assigned_to_email}</span>
                              ) : (
                                <span className="font-mono text-[0.55rem] text-red-400/60">⚠ Unassigned</span>
                              )}
                              {t.due_date && <span className={cn('font-mono text-[0.55rem]', daysUntil(t.due_date).color)}>{daysUntil(t.due_date).label}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => setReassignTaskId(isReassigning ? null : t.id)} className="font-mono text-[0.5rem] px-1.5 py-1 rounded border border-white/10 text-white/35 hover:text-teal-400 hover:border-teal-600/30 transition-all">
                              reassign
                            </button>
                            <button onClick={() => deleteTask(t.id)} className="font-mono text-[0.5rem] px-1.5 py-1 rounded border border-white/10 text-white/25 hover:text-red-400 hover:border-red-500/30 transition-all">
                              ✕
                            </button>
                          </div>
                        </div>
                        {isReassigning && (
                          <select
                            defaultValue={t.assigned_to_email ?? ''}
                            onChange={e => reassignTask(t.id, e.target.value)}
                            className="w-full bg-white/5 border border-teal-600/30 rounded-lg px-2 py-1.5 text-xs text-white/70 outline-none font-body"
                          >
                            <option value="">Unassigned</option>
                            {joinedMembers.map(m => (
                              <option key={m.email} value={m.email}>{m.display_name || m.email}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )
                  })}

                  {selected.group_tasks.some(t => t.done) && (
                    <>
                      <p className="font-mono text-[0.56rem] text-white/25 uppercase tracking-wide mt-3">Done</p>
                      {selected.group_tasks.filter(t => t.done).map(t => {
                        const assignee = joinedMembers.find(m => m.email === t.assigned_to_email)
                        return (
                          <div key={t.id} className="flex items-center gap-3 bg-white/2 border border-white/5 rounded-xl px-3 py-2 opacity-50">
                            <button onClick={() => toggleTask(t.id, false)} className="w-5 h-5 rounded-md bg-green-500 border-green-500 border-2 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-[0.6rem]">✓</span>
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-body text-white/40 line-through">{t.title}</p>
                              {t.assigned_to_email && <span className="font-mono text-[0.55rem] text-white/25">→ {assignee?.display_name || t.assigned_to_email}</span>}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── Members / Team Dynamics tab ── */}
          {detailTab === 'members' && (
            <>
              <p className="font-mono text-[0.58rem] text-white/35 leading-relaxed">
                Assign roles so everyone knows their lane. Track who&apos;s doing the work. Leaders can remove inactive members.
              </p>

              {isLeader && (
                <div>
                  <button onClick={() => generateInvite(selected.id)} className="w-full font-mono text-[0.62rem] text-teal-400 border border-teal-600/20 bg-teal-600/8 py-2 rounded-xl transition-all">
                    + Invite member (WhatsApp link)
                  </button>
                  {inviteUrl && (
                    <div className="mt-2 bg-teal-600/10 border border-teal-600/20 rounded-xl p-3">
                      <p className="font-mono text-[0.6rem] text-teal-300 break-all mb-2">{inviteUrl}</p>
                      <button onClick={copyInvite} className="font-mono text-[0.62rem] px-3 py-1.5 rounded-lg border bg-white/5 text-white/60 border-white/10">
                        {copied ? '✓ Copied!' : 'Copy link'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {joinedMembers.map(m => {
                  const stats = contribs[m.email] ?? { assigned: 0, done: 0 }
                  const isFreeRider = selected.group_tasks.length > 0 && stats.assigned === 0
                  const pct = stats.assigned > 0 ? Math.round((stats.done / stats.assigned) * 100) : 0
                  const mRole = m.member_role as MemberRole | null | undefined
                  const isSelf = m.user_id === userId

                  return (
                    <div key={m.id} className={cn('bg-white/3 border rounded-2xl p-3 space-y-2.5 transition-all', isFreeRider ? 'border-red-500/20 bg-red-500/3' : 'border-white/7')}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-display font-bold text-white text-xs">{m.display_name || m.email}</span>
                            {isSelf && <span className="font-mono text-[0.48rem] bg-white/8 text-white/40 px-1 py-0.5 rounded">you</span>}
                            {m.role === 'leader' && <span className="font-mono text-[0.5rem] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-500/20">owner</span>}
                            {mRole && <span className={cn('font-mono text-[0.5rem] px-1.5 py-0.5 rounded-md border', ROLE_COLORS[mRole])}>{mRole}</span>}
                            {isFreeRider && <span className="font-mono text-[0.5rem] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-md border border-red-500/20">⚠ no tasks</span>}
                          </div>
                          <p className="font-mono text-[0.53rem] text-white/30 mt-0.5 truncate">{m.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <div className="font-display font-black text-white text-sm">{pct}%</div>
                            <div className="font-mono text-[0.5rem] text-white/30">{stats.done}/{stats.assigned}</div>
                          </div>
                          {isLeader && !isSelf && (
                            <button
                              onClick={() => removeMember(m.id, m.display_name || m.email)}
                              className="font-mono text-[0.5rem] px-1.5 py-1 rounded border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', pct >= 80 ? 'bg-teal-500' : pct >= 40 ? 'bg-amber-500' : isFreeRider ? 'bg-red-500' : 'bg-white/20')} style={{ width: `${pct}%` }} />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[0.54rem] text-white/30">Role:</span>
                        <div className="flex gap-1 flex-wrap">
                          {MEMBER_ROLES.map(r => (
                            <button key={r} onClick={() => assignRole(m.id, r)} className={cn('font-mono text-[0.5rem] px-1.5 py-0.5 rounded border transition-all', mRole === r ? ROLE_COLORS[r] : 'text-white/25 border-white/8 hover:text-white/50')}>
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {selected.group_members.some(m => m.status === 'invited') && (
                <div>
                  <p className="font-mono text-[0.56rem] text-white/25 uppercase tracking-wide mb-2">Pending invites</p>
                  {selected.group_members.filter(m => m.status === 'invited').map(m => (
                    <div key={m.id} className="flex items-center justify-between bg-white/2 border border-white/5 rounded-xl px-3 py-2 mb-1.5">
                      <span className="font-mono text-[0.62rem] text-white/40">{m.email}</span>
                      <span className="font-mono text-[0.5rem] bg-white/5 text-white/25 px-1.5 py-0.5 rounded">awaiting</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Discussion board tab ── */}
          {detailTab === 'discussion' && (
            <div className="flex flex-col gap-3">
              <div className="bg-white/3 border border-white/7 rounded-xl px-3 py-2.5">
                <p className="font-mono text-[0.6rem] text-white/40 leading-relaxed">
                  Group notice board — log decisions, share updates, flag blockers. Mark important posts as 📌 Decisions.
                </p>
              </div>

              {(() => {
                const now = new Date()
                const inactive = joinedMembers.filter(m => {
                  const tasks = selected.group_tasks.filter(t => t.assigned_to_email === m.email)
                  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < now && !t.done)
                  return overdue.length >= 2
                })
                if (!inactive.length) return null
                return (
                  <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2.5">
                    <p className="font-mono text-[0.6rem] text-red-400 font-bold mb-1">⚠ Team members falling behind</p>
                    {inactive.map(m => (
                      <p key={m.id} className="font-mono text-[0.58rem] text-red-300/70">{m.display_name || m.email} has 2+ overdue tasks.</p>
                    ))}
                  </div>
                )
              })()}

              {loadingMsgs ? (
                <div className="font-mono text-[0.62rem] text-white/30 text-center py-6">Loading board…</div>
              ) : messages.length === 0 ? (
                <div className="bg-white/3 border border-white/7 rounded-xl py-8 text-center">
                  <div className="text-2xl mb-2">💬</div>
                  <p className="font-mono text-[0.62rem] text-white/30">No posts yet. Be the first to post.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {messages.map(msg => (
                    <div key={msg.id} className={cn(
                      'rounded-xl px-3 py-2.5 border',
                      msg.is_decision ? 'bg-amber-500/8 border-amber-500/20' : 'bg-white/3 border-white/7',
                      msg.user_id === userId ? 'ml-6' : 'mr-6',
                    )}>
                      {msg.is_decision && <p className="font-mono text-[0.52rem] text-amber-400 font-bold mb-1">📌 DECISION</p>}
                      <p className="font-mono text-[0.68rem] text-white/75 leading-relaxed">{msg.content}</p>
                      <p className="font-mono text-[0.52rem] text-white/25 mt-1">
                        {msg.user_id === userId ? 'You' : 'Team member'} · {new Date(msg.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-white/3 border border-white/7 rounded-xl p-3 space-y-2">
                <textarea
                  value={msgText} onChange={e => setMsgText(e.target.value)}
                  placeholder="Post an update, question, or decision…" rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[0.78rem] text-white placeholder:text-white/25 outline-none focus:border-teal-600 font-body resize-none"
                />
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={msgIsDecision} onChange={e => setMsgIsDecision(e.target.checked)} className="w-3 h-3" />
                    <span className="font-mono text-[0.58rem] text-amber-400">📌 Mark as decision</span>
                  </label>
                  <button onClick={() => void sendMessage(selected.id)} disabled={!msgText.trim() || sendingMsg}
                    className="font-mono text-[0.62rem] px-3 py-1.5 bg-teal-600/15 text-teal-400 border border-teal-600/20 rounded-lg disabled:opacity-40 hover:bg-teal-600/25 transition-all">
                    {sendingMsg ? 'Sending…' : 'Post →'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Meetings tab ── */}
          {detailTab === 'meetings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[0.6rem] text-white/40">Schedule and manage group meetings</p>
                </div>
                <button onClick={() => setShowMeetingForm(!showMeetingForm)} className="font-mono text-[0.62rem] text-teal-400 hover:text-teal-300 transition-colors">
                  {showMeetingForm ? '✕ Cancel' : '+ Schedule meeting'}
                </button>
              </div>

              {showMeetingForm && (
                <div className="bg-white/3 border border-white/10 rounded-xl p-3 space-y-2">
                  <input value={meetingTitle} onChange={e => setMeetingTitle(e.target.value)} placeholder="Meeting title *" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-teal-600 font-body" />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-mono text-[0.55rem] text-white/35 mb-1 block">Date & time *</label>
                      <input type="datetime-local" value={meetingAt} onChange={e => setMeetingAt(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/70 outline-none focus:border-teal-600 font-body" />
                    </div>
                    <div>
                      <label className="font-mono text-[0.55rem] text-white/35 mb-1 block">Duration (min)</label>
                      <input type="number" value={meetingDuration} onChange={e => setMeetingDuration(Number(e.target.value))} min={15} max={480} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 outline-none focus:border-teal-600 font-body" />
                    </div>
                  </div>
                  <input value={meetingLocation} onChange={e => setMeetingLocation(e.target.value)} placeholder="Location (e.g. Library Room 3, Wits)" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-teal-600 font-body" />
                  <input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="Virtual link (Google Meet, Zoom…)" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-teal-600 font-body" />
                  <textarea value={meetingAgenda} onChange={e => setMeetingAgenda(e.target.value)} placeholder="Agenda (optional)" rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-teal-600 resize-none font-body" />
                  <button onClick={createMeeting} disabled={creatingMeeting || !meetingTitle.trim() || !meetingAt} className="w-full font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white py-2 rounded-xl transition-all">
                    {creatingMeeting ? 'Scheduling…' : 'Schedule Meeting'}
                  </button>
                </div>
              )}

              {loadingMeetings ? (
                <div className="font-mono text-[0.62rem] text-white/30 text-center py-6">Loading meetings…</div>
              ) : meetings.length === 0 ? (
                <div className="bg-white/3 border border-white/7 rounded-xl py-8 text-center">
                  <div className="text-2xl mb-2">📅</div>
                  <p className="font-mono text-[0.62rem] text-white/30">No meetings scheduled yet.</p>
                  <p className="font-mono text-[0.58rem] text-white/20 mt-1">Schedule your first sync above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {meetings.map(meeting => {
                    const dt  = new Date(meeting.meeting_at)
                    const isPast = dt < new Date()
                    return (
                      <div key={meeting.id} className={cn('bg-white/3 border rounded-2xl p-3 space-y-2', isPast ? 'border-white/5 opacity-60' : 'border-teal-600/20')}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-display font-bold text-white text-sm">{meeting.title}</p>
                            <p className={cn('font-mono text-[0.6rem] mt-0.5', isPast ? 'text-white/30' : 'text-teal-400')}>
                              {dt.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })} · {dt.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })} · {meeting.duration_min} min
                            </p>
                          </div>
                          {meeting.created_by === userId && (
                            <button onClick={() => deleteMeeting(meeting.id)} className="font-mono text-[0.5rem] px-1.5 py-1 rounded border border-red-500/20 text-red-400/60 hover:text-red-400 transition-all flex-shrink-0">
                              ✕
                            </button>
                          )}
                        </div>
                        {meeting.location && <p className="font-mono text-[0.58rem] text-white/40">📍 {meeting.location}</p>}
                        {meeting.link && (
                          <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="font-mono text-[0.58rem] text-sky-400 hover:text-sky-300 transition-colors">
                            🔗 Join virtual meeting →
                          </a>
                        )}
                        {meeting.agenda && (
                          <div className="bg-white/3 border border-white/7 rounded-lg px-2.5 py-2">
                            <p className="font-mono text-[0.53rem] text-white/25 mb-1">AGENDA</p>
                            <p className="font-mono text-[0.62rem] text-white/55 leading-relaxed whitespace-pre-wrap">{meeting.agenda}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Playbook tab ── */}
          {detailTab === 'tips' && (
            <>
              <div className="bg-white/3 border border-white/7 rounded-xl px-3 py-2.5">
                <p className="font-mono text-[0.6rem] text-white/40 leading-relaxed">Best practices from research and books — applied to SA student group work.</p>
              </div>
              {[
                { book: 'Getting Things Done — David Allen', color: '#38BDF8', tip: 'Capture everything into a shared task list before your first meeting. Every action needs an owner and a due date. If it has no owner, it will not happen.' },
                { book: 'Atomic Habits — James Clear', color: 'var(--teal)', tip: '2-minute rule: if a task takes under 2 minutes, do it now. Assign micro-tasks with specific due times — "intro draft by Tuesday 6pm", not "soon".' },
                { book: 'The Five Dysfunctions of a Team — Lencioni', color: '#a78bfa', tip: '5 common failures: (1) Absence of trust. (2) Fear of conflict. (3) Lack of commitment. (4) Avoidance of accountability. (5) Inattention to results. Fix: weekly 5-minute check-in before submission week.' },
                { book: 'Deep Work — Cal Newport', color: '#6366F1', tip: 'Split into solo deep-work blocks, then collaborative review sessions. Writing and research are individual tasks. Don\'t do deep work in a group setting.' },
                { book: 'Crucial Conversations — Patterson et al.', color: '#f59e0b', tip: 'Address poor performance privately: "I noticed you haven\'t submitted the literature review — is something blocking you?" Calling someone out publicly creates resentment, not productivity.' },
                { book: 'SA university group work research', color: '#fb7185', tip: 'Common failures: (1) Starting writing in the last 48h. (2) Merging 5 Word documents in the final hour. Fix: use Google Docs from day 1 — one document, everyone editing simultaneously.' },
              ].map(t => (
                <div key={t.book} className="bg-white/3 border border-white/7 rounded-xl p-3" style={{ borderLeft: `3px solid ${t.color}` }}>
                  <p className="font-mono text-[0.55rem] mb-2" style={{ color: t.color }}>{t.book}</p>
                  <p className="font-mono text-[0.65rem] text-white/55 leading-relaxed">{t.tip}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    )
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-white text-xl">Group Work</h1>
          <p className="font-mono text-[0.62rem] text-white/35 mt-0.5">Manage assignments, roles & team dynamics</p>
        </div>
        <button onClick={() => setShowNewForm(!showNewForm)} className="font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-xl transition-all">
          + New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 space-y-3">
        {showNewForm && (
          <div className="mb-1 bg-white/3 border border-white/10 rounded-2xl p-4 space-y-3">
            <h3 className="font-display font-bold text-white text-sm">New Group Assignment</h3>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Assignment title *" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-teal-600 font-body" />
            <input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Subject / Module (e.g. Marketing 201)" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-teal-600 font-body" />
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-teal-600 resize-none font-body" />
            <div>
              <label className="font-mono text-[0.6rem] text-white/40 mb-1 block">Due date</label>
              <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/70 outline-none focus:border-teal-600 font-body" />
            </div>
            <div className="flex gap-2">
              <button onClick={createAssignment} disabled={creating || !newTitle.trim()} className="flex-1 font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white py-2.5 rounded-xl transition-all">
                {creating ? 'Creating…' : 'Create Group'}
              </button>
              <button onClick={() => setShowNewForm(false)} className="px-4 font-mono text-sm text-white/40 hover:text-white/70 border border-white/10 rounded-xl transition-all">Cancel</button>
            </div>
          </div>
        )}

        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="font-display font-bold text-white text-sm">No group assignments yet</h3>
            <p className="font-mono text-[0.6rem] text-white/30 mt-1">Create one and invite your classmates.</p>
            <button onClick={() => setShowNewForm(true)} className="mt-4 bg-teal-600 hover:bg-teal-500 text-white font-display font-bold text-sm px-4 py-2 rounded-xl transition-all">
              Create assignment
            </button>
          </div>
        ) : (
          assignments.map(a => {
            const progress    = getProgress(a)
            const memberCount = a.group_members.filter(m => m.status === 'joined').length
            return (
              <button key={a.id} onClick={() => { setSelected(a); setView('detail') }} className="w-full text-left bg-[var(--bg-surface)] border border-white/7 hover:border-teal-600/30 rounded-2xl p-4 transition-all group">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-display font-bold text-white text-sm group-hover:text-teal-300 transition-colors">{a.title}</h3>
                    {a.subject && <p className="font-mono text-[0.6rem] text-teal-400/70 mt-0.5">{a.subject}</p>}
                  </div>
                  <div className={cn('font-mono text-[0.55rem] px-2 py-1 rounded-lg border flex-shrink-0',
                    a.status === 'active'    ? 'bg-teal-600/10 text-teal-400 border-teal-600/15'
                    : a.status === 'submitted' ? 'bg-amber-500/10 text-amber-400 border-amber-500/15'
                    : 'bg-green-500/10 text-green-400 border-green-500/15'
                  )}>
                    {a.status}
                  </div>
                </div>

                {a.group_tasks.length > 0 && (
                  <div className="mb-2">
                    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', progress === 100 ? 'bg-green-500' : 'bg-teal-500')} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 font-mono text-[0.58rem] text-white/35">
                  <span>👥 {memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                  {a.group_tasks.length > 0 && <span>✓ {a.group_tasks.filter(t => t.done).length}/{a.group_tasks.length} tasks</span>}
                  {a.due_date && <span className={daysUntil(a.due_date).color}>{daysUntil(a.due_date).label}</span>}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
