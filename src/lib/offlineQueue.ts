// ────────────────────────────────────────────────────────────────
// VarsityOS — Offline Mutation Queue
// IndexedDB-backed queue for writes that happen while offline.
// On reconnect, flushQueue() replays them in order.
// ────────────────────────────────────────────────────────────────

export type MutationOp = 'upsert' | 'update' | 'delete' | 'insert'

export interface QueuedMutation {
  id: string
  table: string
  op: MutationOp
  payload: Record<string, unknown>
  recordId?: string
  createdAt: number
  retries: number
}

const DB_NAME    = 'varsityos-offline'
const STORE_NAME = 'mutations'
const DB_VERSION = 1

// ── Open / lazy-init the IndexedDB ──────────────────────────────

let _db: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
    req.onsuccess  = (e) => { _db = (e.target as IDBOpenDBRequest).result; resolve(_db) }
    req.onerror    = () => reject(req.error)
  })
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ── Public API ───────────────────────────────────────────────────

/** Enqueue a mutation to be synced when online */
export async function enqueue(
  table: string,
  op: MutationOp,
  payload: Record<string, unknown>,
  recordId?: string,
): Promise<void> {
  const db = await openDB()
  const mutation: QueuedMutation = {
    id: uid(),
    table,
    op,
    payload,
    recordId,
    createdAt: Date.now(),
    retries: 0,
  }
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.put(mutation)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

/** Get all pending mutations, sorted by createdAt */
export async function getPending(): Promise<QueuedMutation[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('createdAt')
    const req   = index.getAll()
    req.onsuccess = () => resolve(req.result as QueuedMutation[])
    req.onerror   = () => reject(req.error)
  })
}

/** Remove a mutation by id after it has been successfully synced */
export async function dequeue(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

/** Count pending mutations (cheap — for badge display) */
export async function pendingCount(): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.count()
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

/** Flush all pending mutations against the provided Supabase client.
 *  Mutations that fail are kept in the queue for the next flush.
 *  Returns the number of mutations successfully synced.
 */
export async function flushQueue(
  supabase: {
    from: (table: string) => {
      insert: (d: unknown) => Promise<{ error: unknown }>
      upsert: (d: unknown) => Promise<{ error: unknown }>
      update: (d: unknown) => { eq: (col: string, val: unknown) => Promise<{ error: unknown }> }
      delete: () => { eq: (col: string, val: unknown) => Promise<{ error: unknown }> }
    }
  }
): Promise<number> {
  const pending = await getPending()
  if (pending.length === 0) return 0

  let synced = 0
  for (const m of pending) {
    try {
      let error: unknown = null
      if (m.op === 'insert') {
        const res = await supabase.from(m.table).insert(m.payload)
        error = res.error
      } else if (m.op === 'upsert') {
        const res = await supabase.from(m.table).upsert(m.payload)
        error = res.error
      } else if (m.op === 'update' && m.recordId) {
        const res = await supabase.from(m.table).update(m.payload).eq('id', m.recordId)
        error = res.error
      } else if (m.op === 'delete' && m.recordId) {
        const res = await supabase.from(m.table).delete().eq('id', m.recordId)
        error = res.error
      }

      if (!error) {
        await dequeue(m.id)
        synced++
      }
    } catch {
      // keep in queue — will retry on next flush
    }
  }

  return synced
}
