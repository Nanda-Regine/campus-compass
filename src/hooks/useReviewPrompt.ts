'use client'
import { useEffect, useState } from 'react'

const STORAGE_KEY    = 'feedback_prompted_at'
const COOLDOWN_MS    = 30 * 24 * 60 * 60 * 1000 // 30 days

export function useReviewPrompt(streak: number, savingsCompleted: boolean) {
  const [shouldPrompt, setShouldPrompt] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const lastShown = localStorage.getItem(STORAGE_KEY)
    if (lastShown && Date.now() - parseInt(lastShown) < COOLDOWN_MS) return

    const meetsCondition = streak >= 7 || savingsCompleted
    if (meetsCondition) {
      setShouldPrompt(true)
    }
  }, [streak, savingsCompleted])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
    setShouldPrompt(false)
  }

  return { shouldPrompt, dismiss }
}
