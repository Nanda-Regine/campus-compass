import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join Group',
  description: 'Join a study group on VarsityOS.',
  robots: { index: false, follow: false },
}

export default function JoinGroupLayout({ children }: { children: React.ReactNode }) {
  return children
}
