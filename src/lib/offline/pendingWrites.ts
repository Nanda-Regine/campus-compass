import { getOfflineDB } from './db'
import type { SupabaseClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// The SINGLE offline write queue. Every offline-capable mutation goes through
// here. There must be exactly one flush implementation and one operation
// vocabulary — a previous split (lib/offline/sync.ts) handled only upsert|delete
// and silently DELETED insert/update rows un-sent, losing student data offline.
// ─────────────────────────────────────────────────────────────────────────────

export type PendingOp = 'insert' | 'update' | 'upsert' | 'delete'

export interface PendingWrite {
  id?: number
  table: string
  operation: PendingOp
  data: Record<string, unknown>
  timestamp: number
  retries: number
}

const MAX_RETRIES = 5

// ── Queue a write while offline ──────────────────────────────────────────────
export async function queueWrite(
  table: string,
  operation: PendingOp,
  data: Record<string, unknown>,
): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const db = await getOfflineDB()
    await db.add('pending_writes', { table, operation, data, timestamp: Date.now(), retries: 0 })
  } catch (err) {
    console.warn('[offline] queueWrite failed:', err)
  }
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
          error = (await supabase.from(w.table).insert(w.data)).error
        } else if (w.operation === 'upsert') {
          error = (await supabase.from(w.table).upsert(w.data)).error
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
          await db.delete('pending_writes', w.id)
          console.warn('[offline] dropping write after max retries:', w.table, w.operation)
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
