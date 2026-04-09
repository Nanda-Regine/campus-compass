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
    } catch {
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

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-white/7">
          <button
            onClick={() => { setView('list'); setInviteUrl(null) }}
            className="font-mono text-[0.65rem] text-white/40 hover:text-white/70 mb-3 flex items-center gap-1 transition-colors"
          >
            ← Back to groups
          </button>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-white text-lg leading-tight">{selected.title}</h2>
              {selected.subject && <p className="font-mono text-[0.65rem] text-teal-400 mt-0.5">{selected.subject}</p>}
              {selected.description && <p className="font-mono text-[0.62rem] text-white/40 mt-1">{selected.description}</p>}
            </div>
            <div className={cn('font-mono text-[0.6rem] px-2 py-1 rounded-lg border',
              selected.status === 'active' ? 'bg-teal-600/15 text-teal-400 border-teal-600/20'
              : selected.status === 'submitted' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
              : 'bg-green-500/15 text-green-400 border-green-500/20'
            )}>
              {selected.status}
            </div>
          </div>

          {selected.due_date && (
            <div className={cn('font-mono text-[0.6rem] mt-2', daysUntil(selected.due_date).color)}>
              Due {new Date(selected.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} · {daysUntil(selected.due_date).label}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[0.62rem] text-white/40">Progress</span>
              <span className="font-mono text-[0.62rem] text-white/60">
                {selected.group_tasks.filter(t => t.done).length}/{selected.group_tasks.length} tasks done
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500',
                  progress === 100 ? 'bg-green-500' : progress > 60 ? 'bg-teal-500' : 'bg-amber-500'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[0.65rem] text-white/50 uppercase tracking-wider">Members</span>
              {isLeader && (
                <button
                  onClick={() => generateInvite(selected.id)}
                  className="font-mono text-[0.6rem] text-teal-400 hover:text-teal-300 transition-colors"
                >
                  + Invite link
                </button>
              )}
            </div>

            {inviteUrl && (
              <div className="mb-3 bg-teal-600/10 border border-teal-600/20 rounded-xl p-3 animate-fade-in">
                <p className="font-mono text-[0.58rem] text-white/40 mb-1.5">Share this link via WhatsApp or SMS:</p>
                <p className="font-mono text-[0.6rem] text-teal-300 break-all mb-2">{inviteUrl}</p>
                <button
                  onClick={copyInvite}
                  className={cn('font-mono text-[0.62rem] px-3 py-1.5 rounded-lg border transition-all',
                    copied
                      ? 'bg-green-500/15 text-green-400 border-green-500/20'
                      : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                  )}
                >
                  {copied ? '✓ Copied!' : 'Copy link'}
                </button>
              </div>
            )}

            <div className="space-y-2">
              {selected.group_members.map(m => (
                <div key={m.id} className="flex items-center justify-between bg-white/3 border border-white/7 rounded-xl px-3 py-2">
                  <div>
                    <span className="font-display font-semibold text-white text-xs">{m.display_name || m.email}</span>
                    <span className="font-mono text-[0.55rem] text-white/30 ml-2">{m.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.role === 'leader' && (
                      <span className="font-mono text-[0.55rem] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-md">leader</span>
                    )}
                    <span className={cn('font-mono text-[0.55rem] px-1.5 py-0.5 rounded-md',
                      m.status === 'joined' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'
                    )}>
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[0.65rem] text-white/50 uppercase tracking-wider">Tasks</span>
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="font-mono text-[0.6rem] text-teal-400 hover:text-teal-300 transition-colors"
              >
                + Add task
              </button>
            </div>

            {showAddTask && (
              <div className="mb-3 bg-white/3 border border-white/10 rounded-xl p-3 space-y-2 animate-fade-in">
                <input
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="Task title"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-teal-600 font-body"
                />
                <select
                  value={taskAssigneeEmail}
                  onChange={e => setTaskAssigneeEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 outline-none focus:border-teal-600 font-body"
                >
                  <option value="">Assign to... (optional)</option>
                  {selected.group_members.filter(m => m.status === 'joined').map(m => (
                    <option key={m.email} value={m.email}>{m.display_name || m.email}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={e => setTaskDueDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 outline-none focus:border-teal-600 font-body"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addTask}
                    disabled={addingTask || !taskTitle.trim()}
                    className="flex-1 font-display font-bold text-sm bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white py-2 rounded-xl transition-all"
                  >
                    {addingTask ? 'Adding…' : 'Add task'}
                  </button>
                  <button
                    onClick={() => setShowAddTask(false)}
                    className="px-4 font-mono text-sm text-white/40 hover:text-white/70 border border-white/10 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {selected.group_tasks.length === 0 ? (
              <p className="font-mono text-[0.65rem] text-white/25 text-center py-4">No tasks yet — add the first one above</p>
            ) : (
              <div className="space-y-2">
                {selected.group_tasks.map(t => {
                  const assignee = selected.group_members.find(m => m.email === t.assigned_to_email)
                  return (
                    <div
                      key={t.id}
                      className={cn('flex items-center gap-3 bg-white/3 border rounded-xl px-3 py-2.5 transition-all',
                        t.done ? 'border-white/5 opacity-60' : 'border-white/10'
                      )}
                    >
                      <button
                        onClick={() => toggleTask(t.id, !t.done)}
                        className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                          t.done ? 'bg-green-500 border-green-500' : 'border-white/20 hover:border-teal-500'
                        )}
                      >
                        {t.done && <span className="text-white text-[0.6rem]">✓</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-body', t.done ? 'line-through text-white/30' : 'text-white')}>{t.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {t.assigned_to_email && (
                            <span className="font-mono text-[0.55rem] text-white/40">
                              → {assignee?.display_name || t.assigned_to_email}
                            </span>
                          )}
                          {t.due_date && (
                            <span className={cn('font-mono text-[0.55rem]', daysUntil(t.due_date).color)}>
                              {daysUntil(t.due_date).label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
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

      {/* New assignment form */}
      {showNewForm && (
        <div className="mx-4 mb-3 bg-white/3 border border-white/10 rounded-2xl p-4 space-y-3 animate-fade-in">
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

      {/* Assignment list */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
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
                className="w-full text-left bg-[#111a18] border border-white/7 hover:border-teal-600/30 rounded-2xl p-4 transition-all group"
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
