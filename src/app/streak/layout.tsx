import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your Streak',
  description:
    'Keep your study streak alive and earn XP, shields and milestones on VarsityOS.',
  robots: { index: false, follow: false },
}

export default function StreakLayout({ children }: { children: React.ReactNode }) {
  return children
}
