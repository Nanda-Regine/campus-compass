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

type View = 'list' | 'detail'
type DetailTab = 'overview' | 'tasks' | 'members' | 'tips'

const MEMBER_ROLES = ['Leader', 'Researcher', 'Writer', 'Designer', 'Presenter', 'Reviewer'] as const
type MemberRole = typeof MEMBER_ROLES[number]

const ROLE_COLORS: Record<MemberRole, string> = {
  Leader: 'text-amber-400 bg-amber-500/15 border-amber-500/20',
  Researcher: 'text-sky-400 bg-sky-500/15 border-sky-500/20',
  Writer: 'text-teal-400 bg-teal-500/15 border-teal-500/20',
  Designer: 'text-rose-400 bg-rose-500/15 border-rose-500/20',
  Presenter: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/20',
  Reviewer: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/20',
}

const ROLES_KEY = 'varsityos-group-roles'

function loadRoles(): Record<string, MemberRole> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(ROLES_KEY) ?? '{}') }
  catch { return {} }
}

function saveRoles(r: Record<string, MemberRole>) {
  if (typeof window !== 'undefined') localStorage.setItem(ROLES_KEY, JSON.stringify(r))
}

export default function GroupsClient({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [assignments, setAssignments] = useState<GroupAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<GroupAssignment | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [detailTab, setDetailTab] = useState<DetailTab>('overview')
  const [memberRoles, setMemberRoles] = useState<Record<string, MemberRole>>(loadRoles)
  const [submitting, setSubmitting] = useState(false)
  const [submitLink, setSubmitLink] = useState('')
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [flaggedMember, setFlaggedMember] = useState<string | null>(null)

  // New assignment form state
  const [newTitle, setNewTitle] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  // New task form state
  const [taskTitle, setTaskTitle] = useState('')
  const [taskAssigneeEmail, setTaskAssigneeEmail] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [addingTask, setAddingTask] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/groups/assignments')
      if (!res.ok) {
        if (res.status === 401) router.push('/auth/login')
        return
      }
      const data = await res.json()
      setAssignments(data.assignments || [])
    } catch (err) {
      console.error('[GroupsClient] load:', err)
      toast.error('Failed to load group assignments')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load() }, [load])

  // ── Realtime: refresh when group_tasks or group_members change ──
  useEffect(() => {
    const tasksChannel = supabase
      .channel('group-tasks-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'group_tasks',
      }, () => {
        load()
      })
      .subscribe()

    // Refresh assignments when a new member joins (invite accepted)
    const membersChannel = supabase
      .channel('group-members-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_members',
      }, () => {
        load()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'group_members',
      }, () => {
        load()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(membersChannel)
    }
  }, [supabase, load])

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
      setShowNewForm(false)
      setNewTitle(''); setNewSubject(''); setNewDueDate(''); setNewDesc('')
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setCreating(false)
    }
  }

  const addTask = async () => {
    if (!taskTitle.trim() || !selected) return
    setAddingTask(true)
    try {
      // Find member by email to get user_id
      const member = selected.group_members.find(m => m.email === taskAssigneeEmail)
      const res = await fetch('/api/groups/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: selected.id,
          title: taskTitle,
          due_date: taskDueDate || null,
          assigned_to: member?.user_id || null,
          assigned_to_email: taskAssigneeEmail || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Task added!')
      setShowAddTask(false)
      setTaskTitle(''); setTaskAssigneeEmail(''); setTaskDueDate('')
      await load()
      // Refresh selected
      const updated = assignments.find(a => a.id === selected.id)
      if (updated) setSelected(updated)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add task')
    } finally {
      setAddingTask(false)
    }
  }

  const toggleTask = async (taskId: string, done: boolean) => {
    await fetch('/api/groups/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, done }),
    })
    await load()
    if (selected) {
      setSelected(prev => prev ? {
        ...prev,
        group_tasks: prev.group_tasks.map(t => t.id === taskId ? { ...t, done } : t)
      } : prev)
    }
  }

  const generateInvite = async (assignmentId: string) => {
    try {
      const res = await fetch('/api/groups/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: assignmentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInviteUrl(data.inviteUrl)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate invite')
    }
  }

  const copyInvite = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success('Invite link copied! Share via WhatsApp')
    setTimeout(() => setCopied(false), 2000)
  }

  const submitAssignment = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/groups/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, status: 'submitted', submission_link: submitLink || null }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      toast.success('Assignment marked as submitted!')
      setShowSubmitForm(false)
      await load()
      setSelected(prev => prev ? { ...prev, status: 'submitted' } : prev)
    } catch {
      toast.error('Could not update submission status')
    } finally {
      setSubmitting(false)
    }
  }

  const assignRole = (memberId: string, role: MemberRole) => {
    setMemberRoles(prev => {
      const next = { ...prev, [memberId]: role }
      saveRoles(next)
      return next
    })
  }

  const daysUntil = (date: string) => {
    const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
    if (d < 0) return { label: `${Math.abs(d)}d overdue`, color: 'text-red-400' }
    if (d === 0) return { label: 'Due today', color: 'text-amber-400' }
    if (d <= 3) return { label: `${d}d left`, color: 'text-amber-400' }
    return { label: `${d}d left`, color: 'text-teal-400' }
  }

  const getProgress = (a: GroupAssignment) => {
    const total = a.group_tasks.length
    const done = a.group_tasks.filter(t => t.done).length
    return total === 0 ? 0 : Math.round((done / total) * 100)
  }

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  // ── Detail view ──────────────────────────────────────────────────────────
  if (view === 'detail' && selected) {
    const progress = getProgress(selected)
    const isLeader = selected.created_by === userId
    const joinedMembers = selected.group_members.filter(m => m.status === 'joined')

    // Contribution heatmap: tasks done per member email
    const contribs: Record<string, { assigned: number; done: number }> = {}
    joinedMembers.forEach(m => { contribs[m.email] = { assigned: 0, done: 0 } })
    selected.group_tasks.forEach(t => {
      if (t.assigned_to_email && contribs[t.assigned_to_email]) {
        contribs[t.assigned_to_email].assigned++
        if (t.done) contribs[t.assigned_to_email].done++
      }
    })

    // Free-rider detection: joined member with 0 assigned tasks (and >0 tasks exist)
    const freeRiders = selected.group_tasks.length > 0
      ? joinedMembers.filter(m => (contribs[m.email]?.assigned ?? 0) === 0)
      : []

    const DETAIL_TABS: { id: DetailTab; label: string }[] = [
      { id: 'overview', label: 'Overview' },
      { id: 'tasks', label: `Tasks (${selected.group_tasks.length})` },
      { id: 'members', label: `Team (${joinedMembers.length})` },
      { id: 'tips', label: 'Playbook' },
    ]

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/7">
          <button
            onClick={() => { setView('list'); setInviteUrl(null); setDetailTab('overview') }}
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
              selected.status === 'active' ? 'bg-teal-600/15 text-teal-400 border-teal-600/20'
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
          <div className="flex gap-1 mt-3 overflow-x-auto">
            {DETAIL_TABS.map(t => (
              <button key={t.id} onClick={() => setDetailTab(t.id)} className={cn(
                'flex-shrink-0 font-mono text-[0.6rem] px-3 py-1.5 rounded-lg transition-all border',
                detailTab === t.id
                  ? 'bg-teal-600/15 text-teal-400 border-teal-600/20'
                  : 'bg-transparent text-white/35 border-white/7 hover:text-white/60',
              )}>
                {t.label}
                {t.id === 'members' && freeRiders.length > 0 && (
                  <span className="ml-1 text-red-400">⚠</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ── Overview tab ── */}
          {detailTab === 'overview' && (
            <>
              {/* Progress bar */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="font-mono text-[0.6rem] text-white/40">Progress</span>
                  <span className="font-mono text-[0.6rem] text-white/60">{selected.group_tasks.filter(t => t.done).length}/{selected.group_tasks.length} tasks</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/8 overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all duration-500', progress === 100 ? 'bg-green-500' : progress > 60 ? 'bg-teal-500' : 'bg-amber-500')} style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-mono text-[0.53rem] text-white/25">{progress}% complete</span>
                  {progress === 100 && <span className="font-mono text-[0.53rem] text-green-400">All tasks done ✓</span>}
                </div>
              </div>

              {/* Deadline warning */}
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

              {/* Free-rider alert */}
              {freeRiders.length > 0 && (
                <div className="bg-red-500/6 border border-red-500/15 rounded-xl px-3 py-2.5">
                  <p className="font-mono text-[0.62rem] text-red-400 font-bold mb-1">⚠️ Free-rider alert</p>
                  <p className="font-mono text-[0.58rem] text-white/40">{freeRiders.map(m => m.display_name || m.email).join(', ')} {freeRiders.length === 1 ? 'has' : 'have'} no tasks assigned yet. Go to the Team tab to assign tasks.</p>
                </div>
              )}

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Members', value: joinedMembers.length },
                  { label: 'Tasks done', value: `${selected.group_tasks.filter(t => t.done).length}/${selected.group_tasks.length}` },
                  { label: 'Status', value: selected.status },
                ].map(s => (
                  <div key={s.label} className="bg-white/3 border border-white/7 rounded-xl px-3 py-2.5 text-center">
                    <div className="font-display font-black text-white text-sm">{s.value}</div>
                    <div className="font-mono text-[0.53rem] text-white/30 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {selected.description && (
                <div className="bg-white/3 border border-white/7 rounded-xl px-3 py-2.5">
                  <p className="font-mono text-[0.58rem] text-white/40 leading-relaxed">{selected.description}</p>
                </div>
              )}

              {/* Submission workflow */}
              {selected.status === 'active' && isLeader && progress >= 80 && (
                <div>
                  {!showSubmitForm ? (
                    <button onClick={() => setShowSubmitForm(true)} className="w-full font-display font-bold text-sm bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/20 py-2.5 rounded-xl transition-all">
                      Mark as Submitted →
                    </button>
                  ) : (
                    <div className="bg-white/3 border border-white/10 rounded-xl p-3 space-y-2.5">
                      <p className="font-mono text-[0.62rem] text-white/50">Submission link or reference (optional)</p>
                      <input value={submitLink} onChange={e => setSubmitLink(e.target.value)} placeholder="e.g. Google Drive link, submission portal ref" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-amber-500 font-body" />
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

              {/* Invite link */}
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
                      <option key={m.email} value={m.email}>{m.display_name || m.email}{memberRoles[m.id] ? ` · ${memberRoles[m.id]}` : ''}</option>
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
                  {/* Pending tasks */}
                  <p className="font-mono text-[0.56rem] text-white/25 uppercase tracking-wide">To do</p>
                  {selected.group_tasks.filter(t => !t.done).map(t => {
                    const assignee = joinedMembers.find(m => m.email === t.assigned_to_email)
                    return (
                      <div key={t.id} className="flex items-start gap-3 bg-white/3 border border-white/10 rounded-xl px-3 py-2.5">
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

          {/* ── Members / Accountability tab ── */}
          {detailTab === 'members' && (
            <>
              <p className="font-mono text-[0.58rem] text-white/35 leading-relaxed">
                Contribution heatmap — who&apos;s doing the work. Assign roles so everyone knows their lane. Flag a team conflict to the leader.
              </p>

              {/* Invite */}
              {isLeader && (
                <button onClick={() => generateInvite(selected.id)} className="w-full font-mono text-[0.62rem] text-teal-400 border border-teal-600/20 bg-teal-600/8 py-2 rounded-xl transition-all">
                  + Invite member (WhatsApp link)
                </button>
              )}
              {inviteUrl && (
                <div className="bg-teal-600/10 border border-teal-600/20 rounded-xl p-3">
                  <p className="font-mono text-[0.6rem] text-teal-300 break-all mb-2">{inviteUrl}</p>
                  <button onClick={copyInvite} className="font-mono text-[0.62rem] px-3 py-1.5 rounded-lg border bg-white/5 text-white/60 border-white/10">
                    {copied ? '✓ Copied!' : 'Copy link'}
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {joinedMembers.map(m => {
                  const stats = contribs[m.email] ?? { assigned: 0, done: 0 }
                  const isFreeRider = selected.group_tasks.length > 0 && stats.assigned === 0
                  const pct = stats.assigned > 0 ? Math.round((stats.done / stats.assigned) * 100) : 0
                  const role = memberRoles[m.id] as MemberRole | undefined
                  const isFlagged = flaggedMember === m.id

                  return (
                    <div key={m.id} className={cn('bg-white/3 border rounded-2xl p-3 space-y-2.5 transition-all', isFreeRider ? 'border-red-500/20 bg-red-500/3' : 'border-white/7')}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-display font-bold text-white text-xs">{m.display_name || m.email}</span>
                            {m.role === 'leader' && <span className="font-mono text-[0.5rem] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-500/20">leader</span>}
                            {role && <span className={cn('font-mono text-[0.5rem] px-1.5 py-0.5 rounded-md border', ROLE_COLORS[role])}>{role}</span>}
                            {isFreeRider && <span className="font-mono text-[0.5rem] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-md border border-red-500/20">⚠ no tasks</span>}
                          </div>
                          <p className="font-mono text-[0.53rem] text-white/30 mt-0.5 truncate">{m.email}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-display font-black text-white text-sm">{pct}%</div>
                          <div className="font-mono text-[0.5rem] text-white/30">{stats.done}/{stats.assigned} done</div>
                        </div>
                      </div>

                      {/* Contribution bar */}
                      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', pct >= 80 ? 'bg-teal-500' : pct >= 40 ? 'bg-amber-500' : isFreeRider ? 'bg-red-500' : 'bg-white/20')} style={{ width: `${pct}%` }} />
                      </div>

                      {/* Role selector */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[0.54rem] text-white/30">Role:</span>
                        <div className="flex gap-1 flex-wrap">
                          {MEMBER_ROLES.map(r => (
                            <button key={r} onClick={() => assignRole(m.id, r)} className={cn('font-mono text-[0.5rem] px-1.5 py-0.5 rounded border transition-all', role === r ? ROLE_COLORS[r] : 'text-white/25 border-white/8 hover:text-white/50')}>
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Flag button */}
                      {m.user_id !== userId && !isFlagged && (
                        <button onClick={() => { setFlaggedMember(m.id); toast.success(`${m.display_name || m.email} flagged — notify your leader.`) }} className="font-mono text-[0.55rem] text-red-400/60 hover:text-red-400 transition-colors">
                          ⚑ Flag a concern to leader
                        </button>
                      )}
                      {isFlagged && <p className="font-mono text-[0.53rem] text-red-400/50">Concern flagged — speak to your leader or lecturer if unresolved.</p>}
                    </div>
                  )
                })}
              </div>

              {/* Pending invites */}
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

          {/* ── Playbook / Tips tab ── */}
          {detailTab === 'tips' && (
            <>
              <div className="bg-white/3 border border-white/7 rounded-xl px-3 py-2.5">
                <p className="font-mono text-[0.6rem] text-white/40 leading-relaxed">Best practices from research and famous books — applied to student group work.</p>
              </div>
              {[
                {
                  book: 'Getting Things Done — David Allen',
                  color: '#38BDF8',
                  tip: 'Capture everything into a shared task list before your first meeting. No idea left in someone\'s head. Every action has an owner and a due date. If it doesn\'t have an owner, it won\'t happen.',
                },
                {
                  book: 'Atomic Habits — James Clear',
                  color: 'var(--teal)',
                  tip: '2-minute rule: if a task takes under 2 minutes, do it now. Group work stalls on tiny "I\'ll do it later" tasks. Assign micro-tasks with specific due times — "send me the intro draft by Tuesday 6pm", not "soon".',
                },
                {
                  book: 'The Five Dysfunctions of a Team — Patrick Lencioni',
                  color: '#a78bfa',
                  tip: 'The most common group work failures in order: (1) Absence of trust — people don\'t admit when they\'re stuck. (2) Fear of conflict — real disagreements avoided until deadline. (3) Lack of commitment — "I\'ll try" instead of "I will". Fix: weekly 5-minute check-in before submission week.',
                },
                {
                  book: 'Deep Work — Cal Newport',
                  color: '#6366F1',
                  tip: 'Split the work into solo deep-work blocks first, then collaborative review sessions. Writing and researching are individual tasks — reviewing and editing are collaborative. Don\'t do deep work in a group setting.',
                },
                {
                  book: 'Crucial Conversations — Patterson et al.',
                  color: '#f59e0b',
                  tip: 'When someone is not pulling their weight: address it privately and specifically ("I noticed you haven\'t submitted the literature review section — is there something blocking you?") rather than calling them out in the group chat. Humiliation creates resentment, not productivity.',
                },
                {
                  book: 'Group work research — SA universities',
                  color: '#fb7185',
                  tip: 'Common group assignment failures at South African universities: (1) Starting the writing in the last 48h. (2) Formatting and merging 5 different Word documents in the final hour. Fix: use Google Docs or Notion from day 1 — one document, all editing simultaneously.',
                },
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

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-white text-xl">Group Work</h1>
          <p className="font-mono text-[0.62rem] text-white/35 mt-0.5">Collaborate on assignments with your classmates</p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-xl transition-all"
        >
          + New
        </button>
      </div>

      {/* Assignment list + new form (both inside scroll container so mobile button stays reachable) */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 space-y-3">
        {showNewForm && (
          <div className="mb-1 bg-white/3 border border-white/10 rounded-2xl p-4 space-y-3 animate-fade-in">
            <h3 className="font-display font-bold text-white text-sm">New Group Assignment</h3>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Assignment title *"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-teal-600 font-body"
            />
            <input
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
              placeholder="Subject / Module (e.g. Marketing 201)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-teal-600 font-body"
            />
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-teal-600 resize-none font-body"
            />
            <div>
              <label className="font-mono text-[0.6rem] text-white/40 mb-1 block">Due date</label>
              <input
                type="date"
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/70 outline-none focus:border-teal-600 font-body"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={createAssignment}
                disabled={creating || !newTitle.trim()}
                className="flex-1 font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white py-2.5 rounded-xl transition-all"
              >
                {creating ? 'Creating…' : 'Create Group'}
              </button>
              <button
                onClick={() => setShowNewForm(false)}
                className="px-4 font-mono text-sm text-white/40 hover:text-white/70 border border-white/10 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="font-display font-bold text-white text-sm">No group assignments yet</h3>
            <p className="font-mono text-[0.6rem] text-white/30 mt-1">
              Create a group assignment and invite your classmates.
            </p>
            <button
              onClick={() => setShowNewForm(true)}
              className="mt-4 bg-teal-600 hover:bg-teal-500 text-white font-display font-bold text-sm px-4 py-2 rounded-xl transition-all"
            >
              Create assignment
            </button>
          </div>
        ) : (
          assignments.map(a => {
            const progress = getProgress(a)
            const memberCount = a.group_members.filter(m => m.status === 'joined').length
            return (
              <button
                key={a.id}
                onClick={() => { setSelected(a); setView('detail') }}
                className="w-full text-left bg-[var(--bg-surface)] border border-white/7 hover:border-teal-600/30 rounded-2xl p-4 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-display font-bold text-white text-sm group-hover:text-teal-300 transition-colors">
                      {a.title}
                    </h3>
                    {a.subject && <p className="font-mono text-[0.6rem] text-teal-400/70 mt-0.5">{a.subject}</p>}
                  </div>
                  <div className={cn('font-mono text-[0.55rem] px-2 py-1 rounded-lg border flex-shrink-0',
                    a.status === 'active' ? 'bg-teal-600/10 text-teal-400 border-teal-600/15'
                    : a.status === 'submitted' ? 'bg-amber-500/10 text-amber-400 border-amber-500/15'
                    : 'bg-green-500/10 text-green-400 border-green-500/15'
                  )}>
                    {a.status}
                  </div>
                </div>

                {/* Progress bar */}
                {a.group_tasks.length > 0 && (
                  <div className="mb-2">
                    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all',
                          progress === 100 ? 'bg-green-500' : 'bg-teal-500'
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 font-mono text-[0.58rem] text-white/35">
                  <span>👥 {memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                  {a.group_tasks.length > 0 && (
                    <span>
                      ✓ {a.group_tasks.filter(t => t.done).length}/{a.group_tasks.length} tasks
                    </span>
                  )}
                  {a.due_date && (
                    <span className={daysUntil(a.due_date).color}>
                      {daysUntil(a.due_date).label}
                    </span>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
