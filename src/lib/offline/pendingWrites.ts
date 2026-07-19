import { getOfflineDB } from './db'
import type { SupabaseClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// The SINGLE offline write queue. Every offline-capable mutation goes through
// here. There must be exactly one flush implementation and one operation
// vocabulary — a previous split (lib/offline/sync.ts) handled only upsert|delete
// and silently DELETED insert/update rows un-sent, losing student data offline.
// ─────────────────────────────────────────────────────────────────────────────

export type PendingOp = 'insert' | 'update' | 'upsert' | 'delete'

export interface QueueOptions {
  /** PostgREST onConflict target for upserts, e.g. 'user_id,date'. */
  onConflict?: string
}

export interface PendingWrite {
  id?: number
  table: string
  operation: PendingOp
  data: Record<string, unknown>
  timestamp: number
  retries: number
  options?: QueueOptions
}

const MAX_RETRIES = 5

// ── Queue a write while offline ──────────────────────────────────────────────
// For inserts, pass a client-generated `id` (e.g. crypto.randomUUID()) in `data`
// so re-flushing after a lost response upserts-on-id instead of duplicating.
export async function queueWrite(
  table: string,
  operation: PendingOp,
  data: Record<string, unknown>,
  options?: QueueOptions,
): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const db = await getOfflineDB()
    await db.add('pending_writes', { table, operation, data, timestamp: Date.now(), retries: 0, options })
  } catch (err) {
    console.warn('[offline] queueWrite failed:', err)
  }
}

export async function getFailedCount(): Promise<number> {
  if (typeof window === 'undefined') return 0
  try {
    const db = await getOfflineDB()
    return await db.count('failed_writes')
  } catch {
    return 0
  }
}

// ── Offline-safe mutation helpers ────────────────────────────────────────────
// Do the write online; if offline (or the request errors/throws) queue it for
// replay. Inserts always carry a client id so a lost-response replay upserts on
// id instead of duplicating. Rooms use these instead of raw supabase.from(...).

export async function offlineInsert<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  data: Record<string, unknown>,
  select = '*',
): Promise<{ row: T; queued: boolean }> {
  const row: Record<string, unknown> = data.id != null ? data : { ...data, id: crypto.randomUUID() }
  const offline = typeof navigator !== 'undefined' && !navigator.onLine
  if (!offline) {
    try {
      const { data: inserted, error } = await supabase.from(table).insert(row).select(select).single()
      if (!error && inserted) return { row: inserted as unknown as T, queued: false }
    } catch { /* fall through to queue */ }
  }
  await queueWrite(table, 'insert', row)
  return { row: row as unknown as T, queued: true }
}

export async function offlineUpdate(
  supabase: SupabaseClient,
  table: string,
  id: string | number,
  patch: Record<string, unknown>,
): Promise<{ queued: boolean }> {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine
  if (!offline) {
    try {
      const { error } = await supabase.from(table).update(patch).eq('id', id)
      if (!error) return { queued: false }
    } catch { /* fall through to queue */ }
  }
  await queueWrite(table, 'update', { id, ...patch })
  return { queued: true }
}

export async function offlineUpsert(
  supabase: SupabaseClient,
  table: string,
  data: Record<string, unknown>,
  onConflict?: string,
): Promise<{ queued: boolean }> {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine
  if (!offline) {
    try {
      const { error } = await supabase.from(table).upsert(data, onConflict ? { onConflict } : undefined)
      if (!error) return { queued: false }
    } catch { /* fall through to queue */ }
  }
  await queueWrite(table, 'upsert', data, onConflict ? { onConflict } : undefined)
  return { queued: true }
}

export async function offlineDelete(
  supabase: SupabaseClient,
  table: string,
  id: string | number,
): Promise<{ queued: boolean }> {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine
  if (!offline) {
    try {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (!error) return { queued: false }
    } catch { /* fall through to queue */ }
  }
  await queueWrite(table, 'delete', { id })
  return { queued: true }
}

export async function getPendingCount(): Promise<number> {
  if (typeof window === 'undefined') return 0
  try {
    const db = await getOfflineDB()
    return await db.count('pending_writes')
  } catch {
    return 0
  }
}

// ── Flush all pending writes to Supabase ─────────────────────────────────────
// A module-level guard makes this safe to call from multiple `online` listeners
// (PWARegister, useOfflineSync, TasksTab): overlapping calls no-op instead of
// double-sending. `client` is optional — callers without one get the browser
// client lazily so this stays tree-shakeable on the server.
let isFlushing = false

export async function flushPendingWrites(
  client?: SupabaseClient,
): Promise<{ flushed: number; failed: number }> {
  if (typeof window === 'undefined') return { flushed: 0, failed: 0 }
  if (isFlushing) return { flushed: 0, failed: 0 }
  isFlushing = true
  window.dispatchEvent(new CustomEvent('sync:start'))

  let flushed = 0
  let failed = 0

  try {
    const db = await getOfflineDB()
    const all = await db.getAll('pending_writes')
    if (all.length === 0) return { flushed: 0, failed: 0 }

    const supabase = client ?? (await import('@/lib/supabase/client')).createClient()

    // Don't drop writes when we can't authenticate — leave them queued for next time.
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { flushed: 0, failed: all.length }

    for (const row of all) {
      const w = row as PendingWrite
      if (w.id == null) continue

      let error: { message: string } | null = null
      try {
        if (w.operation === 'insert') {
          // Idempotent when a client id was supplied: a re-flush after a lost
          // response upserts-on-id instead of creating a duplicate row.
          error = w.data?.id != null
            ? (await supabase.from(w.table).upsert(w.data, { onConflict: 'id' })).error
            : (await supabase.from(w.table).insert(w.data)).error
        } else if (w.operation === 'upsert') {
          error = (await supabase.from(w.table).upsert(
            w.data,
            w.options?.onConflict ? { onConflict: w.options.onConflict } : undefined,
          )).error
        } else if (w.operation === 'update') {
          const { id, ...rest } = w.data as { id: string | number; [k: string]: unknown }
          error = (await supabase.from(w.table).update(rest).eq('id', id)).error
        } else if (w.operation === 'delete') {
          const id = w.data?.id as string | number | undefined
          error = id != null
            ? (await supabase.from(w.table).delete().eq('id', id)).error
            : { message: 'delete without id' }
        } else {
          // Unknown op — never silently succeed-and-delete (the original bug).
          error = { message: `unknown operation: ${String(w.operation)}` }
        }
      } catch (e) {
        error = { message: e instanceof Error ? e.message : 'flush threw' }
      }

      if (!error) {
        await db.delete('pending_writes', w.id)
        flushed++
      } else {
        console.warn('[offline] write failed:', w.table, w.operation, error.message)
        const retries = (w.retries ?? 0) + 1
        if (retries >= MAX_RETRIES) {
          // Dead-letter instead of silently dropping — preserve the data and let
          // the UI surface "N changes couldn't sync" rather than losing it.
          try {
            await db.add('failed_writes', {
              table: w.table, operation: w.operation, data: w.data,
              timestamp: w.timestamp, retries, options: w.options,
              failedAt: Date.now(), lastError: error.message,
            })
          } catch { /* dead-letter is best-effort */ }
          await db.delete('pending_writes', w.id)
          window.dispatchEvent(new CustomEvent('sync:deadletter', { detail: { table: w.table } }))
          console.warn('[offline] dead-lettered write after max retries:', w.table, w.operation)
        } else {
          const tx = db.transaction('pending_writes', 'readwrite')
          const existing = await tx.store.get(w.id)
          if (existing) await tx.store.put({ ...existing, retries })
          await tx.done
        }
        failed++
      }
    }
  } catch (err) {
    console.warn('[offline] flushPendingWrites error:', err)
  } finally {
    isFlushing = false
    window.dispatchEvent(new CustomEvent('sync:complete', { detail: { flushed, failed } }))
  }

  return { flushed, failed }
}

// ── Single online-flush owner (idempotent) ───────────────────────────────────
let syncInitialized = false

export function initOfflineSync(): void {
  if (typeof window === 'undefined' || syncInitialized) return
  syncInitialized = true
  window.addEventListener('online', () => {
    // Small delay to let the connection stabilise before flushing.
    setTimeout(() => { flushPendingWrites().catch(() => {}) }, 1500)
  })
}
