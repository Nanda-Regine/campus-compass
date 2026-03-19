// Confetti utility — loaded lazily so it doesn't add to initial bundle
// Call triggerConfetti() when a student completes a task or milestone

export async function triggerConfetti(type: 'task' | 'all_done' | 'streak' | 'budget' = 'task') {
  if (typeof window === 'undefined') return

  const confetti = (await import('canvas-confetti')).default

  const configs: Record<typeof type, () => void> = {
    task: () => {
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.75 },
        colors: ['#0d9488', '#f97316', '#a855f7', '#22c55e'],
        scalar: 0.85,
      })
    },
    all_done: () => {
      // Bigger burst for clearing all tasks
      const count = 120
      const defaults = { origin: { y: 0.7 }, colors: ['#0d9488', '#f97316', '#fbbf24', '#a855f7'] }
      confetti({ ...defaults, particleCount: count * 0.25, spread: 26, startVelocity: 55 })
      confetti({ ...defaults, particleCount: count * 0.2, spread: 60 })
      confetti({ ...defaults, particleCount: count * 0.35, spread: 100, decay: 0.91, scalar: 0.8 })
      confetti({ ...defaults, particleCount: count * 0.1, spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
      confetti({ ...defaults, particleCount: count * 0.1, spread: 120, startVelocity: 45 })
    },
    streak: () => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: ['#f97316', '#fbbf24'],
      })
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: ['#f97316', '#fbbf24'],
      })
    },
    budget: () => {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#86efac', '#0d9488'],
        scalar: 0.9,
      })
    },
  }

  configs[type]?.()
}
