'use client'
import { useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { getOfflineDB } from '@/lib/offline/db'
import { flushPendingWrites } from '@/lib/offline/pendingWrites'
import { currentMonthYear } from '@/lib/utils'

export function useOfflineSync() {
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function syncToIndexedDB() {
      if (typeof window === 'undefined' || !navigator.onLine) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const db = await getOfflineDB()
      const today = new Date().toISOString().split('T')[0]
      const monthYear = currentMonthYear()

      await Promise.allSettled([
        // Timetable
        supabase.from('timetable_slots').select('*').eq('user_id', user.id).then(async ({ data }) => {
          if (!data) return
          const tx = db.transaction('timetable', 'readwrite')
          await Promise.all([...data.map(r => tx.store.put(r as Record<string, unknown>)), tx.done])
        }),

        // Tasks (open ones)
        supabase.from('tasks').select('*').eq('user_id', user.id).eq('done', false).then(async ({ data }) => {
          if (!data) return
          const tx = db.transaction('tasks', 'readwrite')
          await Promise.all([...data.map(r => tx.store.put(r as Record<string, unknown>)), tx.done])
        }),

        // Expenses (current month)
        supabase.from('expenses').select('*').eq('user_id', user.id).gte('date', monthYear + '-01').then(async ({ data }) => {
          if (!data) return
          const tx = db.transaction('expenses', 'readwrite')
          await Promise.all([...data.map(r => tx.store.put(r as Record<string, unknown>)), tx.done])
        }),

        // Savings goals
        supabase.from('savings_goals').select('*').eq('user_id', user.id).then(async ({ data }) => {
          if (!data) return
          const tx = db.transaction('savings_goals', 'readwrite')
          await Promise.all([...data.map(r => tx.store.put(r as Record<string, unknown>)), tx.done])
        }),

        // Upcoming exams
        supabase.from('exams').select('*').eq('user_id', user.id).gte('exam_date', today).then(async ({ data }) => {
          if (!data) return
          const tx = db.transaction('exams', 'readwrite')
          await Promise.all([...data.map(r => tx.store.put(r as Record<string, unknown>)), tx.done])
        }),
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
