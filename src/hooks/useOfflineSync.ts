'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getOfflineDB } from '@/lib/offline/db'
import { flushPendingWrites } from '@/lib/offline/pendingWrites'
import { currentMonthYear } from '@/lib/utils'

export function useOfflineSync() {
  const supabase = createClient()

  useEffect(() => {
    async function syncToIndexedDB() {
      if (typeof window === 'undefined' || !navigator.onLine) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const db = await getOfflineDB()
      const today = new Date().toISOString().split('T')[0]
      const monthYear = currentMonthYear()

      type SyncResult = { data: Record<string, unknown>[] | null }

      const syncTable = async (
        query: PromiseLike<SyncResult>,
        storeName: string,
      ) => {
        const { data } = await query
        if (!data) return
        const tx = db.transaction(storeName as Parameters<typeof db.transaction>[0], 'readwrite')
        const store = tx.objectStore(storeName as Parameters<typeof db.transaction>[0])
        await Promise.all([...data.map(r => store.put(r)), tx.done])
      }

      await Promise.allSettled([
        syncTable(supabase.from('timetable_slots').select('*').eq('user_id', user.id) as unknown as PromiseLike<SyncResult>, 'timetable'),
        syncTable(supabase.from('tasks').select('*').eq('user_id', user.id).neq('status', 'done') as unknown as PromiseLike<SyncResult>, 'tasks'),
        syncTable(supabase.from('expenses').select('*').eq('user_id', user.id).gte('expense_date', monthYear + '-01') as unknown as PromiseLike<SyncResult>, 'expenses'),
        syncTable(supabase.from('savings_goals').select('*').eq('user_id', user.id) as unknown as PromiseLike<SyncResult>, 'savings_goals'),
        syncTable(supabase.from('exams').select('*').eq('user_id', user.id).gte('exam_date', today) as unknown as PromiseLike<SyncResult>, 'exams'),
      ])

      // Flush any pending offline writes
      await flushPendingWrites(supabase)
    }

    syncToIndexedDB()

    const handleOnline = () => syncToIndexedDB()
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [supabase])
}
