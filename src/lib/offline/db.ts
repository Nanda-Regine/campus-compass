import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'varsityos'
const DB_VERSION = 2

export type OfflineDB = IDBPDatabase<{
  timetable: { key: string; value: Record<string, unknown> }
  tasks: {
    key: string
    value: Record<string, unknown>
    indexes: { by_due: string; by_status: string }
  }
  income_entries: { key: string; value: Record<string, unknown> }
  expenses: { key: string; value: Record<string, unknown> }
  savings_goals: { key: string; value: Record<string, unknown> }
  exams: { key: string; value: Record<string, unknown> }
  meal_plans: { key: string; value: Record<string, unknown> }
  pending_writes: {
    key: number
    value: { table: string; operation: string; data: Record<string, unknown>; timestamp: number }
  }
}>

let dbPromise: Promise<OfflineDB> | null = null

export function getOfflineDB(): Promise<OfflineDB> {
  if (!dbPromise) {
    dbPromise = openDB<{
      timetable: { key: string; value: Record<string, unknown> }
      tasks: {
        key: string
        value: Record<string, unknown>
        indexes: { by_due: string; by_status: string }
      }
      income_entries: { key: string; value: Record<string, unknown> }
      expenses: { key: string; value: Record<string, unknown> }
      savings_goals: { key: string; value: Record<string, unknown> }
      exams: { key: string; value: Record<string, unknown> }
      meal_plans: { key: string; value: Record<string, unknown> }
      pending_writes: {
        key: number
        value: { table: string; operation: string; data: Record<string, unknown>; timestamp: number }
      }
    }>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('timetable')) {
          db.createObjectStore('timetable', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('tasks')) {
          const ts = db.createObjectStore('tasks', { keyPath: 'id' })
          ts.createIndex('by_due', 'due_date')
          ts.createIndex('by_status', 'status')
        }
        if (!db.objectStoreNames.contains('income_entries')) {
          db.createObjectStore('income_entries', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('expenses')) {
          db.createObjectStore('expenses', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('savings_goals')) {
          db.createObjectStore('savings_goals', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('exams')) {
          db.createObjectStore('exams', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('meal_plans')) {
          db.createObjectStore('meal_plans', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('pending_writes')) {
          db.createObjectStore('pending_writes', { keyPath: 'id', autoIncrement: true })
        }
      },
    }) as Promise<OfflineDB>
  }
  return dbPromise
}
