import { getOfflineDB } from './db'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function queueWrite(
  table: string,
  operation: 'insert' | 'update' | 'delete',
  data: Record<string, unknown>
): Promise<void> {
  const db = await getOfflineDB()
  await db.add('pending_writes', { table, operation, data, timestamp: Date.now() })
}

export async function getPendingCount(): Promise<number> {
  const db = await getOfflineDB()
  return db.count('pending_writes')
}

export async function flushPendingWrites(supabase: SupabaseClient): Promise<void> {
  const db = await getOfflineDB()
  const all = await db.getAll('pending_writes')
  if (!all.length) return

  for (const write of all) {
    try {
      if (write.operation === 'insert') {
        await supabase.from(write.table).insert(write.data)
      } else if (write.operation === 'update') {
        const { id, ...rest } = write.data as { id: string; [key: string]: unknown }
        await supabase.from(write.table).update(rest).eq('id', id)
      } else if (write.operation === 'delete') {
        await supabase.from(write.table).delete().eq('id', write.data.id)
      }
      await db.delete('pending_writes', (write as unknown as { id: number }).id)
    } catch {
      // Leave failed writes in queue to retry next sync
    }
  }
}
