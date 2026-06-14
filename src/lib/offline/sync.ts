'use client'

import { getOfflineDB } from '@/lib/offline/db'

export interface PendingWrite {
  id?: number
  table: string
  operation: 'upsert' | 'delete'
  data: Record<string, unknown>
  timestamp: number
  retries: number
}

const MAX_RETRIES = 3
const SYNC_TIMEOUT_MS = 8000

// ── Queue a write while offline ───────────────────────────────────────────────

export async function queueWrite(
  table: string,
  operation: 'upsert' | 'delete',
  data: Record<string, unknown>
): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const db = await getOfflineDB()
    await db.add('pending_writes', {
      table,
      operation,
      data,
      timestamp: Date.now(),
      retries: 0,
    })
  } catch (err) {
    console.warn('[offline/sync] queueWrite failed:', err)
  }
}

// ── Get pending write count ───────────────────────────────────────────────────

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

export async function flushPendingWrites(): Promise<{ flushed: number; failed: number }> {
  if (typeof window === 'undefined') return { flushed: 0, failed: 0 }

  window.dispatchEvent(new CustomEvent('sync:start'))

  let flushed = 0
  let failed = 0

  try {
    const db = await getOfflineDB()
    const all = await db.getAll('pending_writes')
    if (all.length === 0) {
      window.dispatchEvent(new CustomEvent('sync:complete', { detail: { flushed: 0, failed: 0 } }))
      return { flushed: 0, failed: 0 }
    }

    // Lazy-import the browser Supabase client so this file is tree-shakeable on server
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    // Verify we have a session before flushing
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.dispatchEvent(new CustomEvent('sync:complete', { detail: { flushed: 0, failed: all.length } }))
      return { flushed: 0, failed: all.length }
    }

    for (const write of all) {
      if (!write.id) continue
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS)

        let error: { message: string } | null = null

        if (write.operation === 'upsert') {
          const res = await supabase
            .from(write.table as string)
            .upsert(write.data as Record<string, unknown>)
          error = res.error
        } else if (write.operation === 'delete') {
          const id = write.data?.id as string | number
          if (id) {
            const res = await supabase
              .from(write.table as string)
              .delete()
              .eq('id', id)
            error = res.error
          }
        }

        clearTimeout(timer)

        if (error) {
          // Increment retry count — remove from queue after max retries
          const updatedRetries = (write.retries ?? 0) + 1
          if (updatedRetries >= MAX_RETRIES) {
            await db.delete('pending_writes', write.id)
            console.warn(`[offline/sync] Dropping write after ${MAX_RETRIES} retries:`, write.table)
          } else {
            const tx = db.transaction('pending_writes', 'readwrite')
            const existing = await tx.store.get(write.id)
            if (existing) await tx.store.put({ ...existing, retries: updatedRetries })
            await tx.done
          }
          failed++
        } else {
          await db.delete('pending_writes', write.id)
          flushed++
        }
      } catch {
        failed++
      }
    }
  } catch (err) {
    console.warn('[offline/sync] flushPendingWrites error:', err)
  }

  window.dispatchEvent(new CustomEvent('sync:complete', { detail: { flushed, failed } }))
  return { flushed, failed }
}

// ── Init: listen for online event and auto-flush ──────────────────────────────

let syncInitialized = false

export function initOfflineSync(): void {
  if (typeof window === 'undefined' || syncInitialized) return
  syncInitialized = true

  const handleOnline = async () => {
    // Small delay to let the network stabilize
    await new Promise(r => setTimeout(r, 1500))
    const count = await getPendingCount()
    if (count > 0) {
      await flushPendingWrites()
    }
  }

  window.addEventListener('online', handleOnline)
}
