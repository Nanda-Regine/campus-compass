import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "You're Offline",
  description:
    'No connection right now — your cached VarsityOS pages, notes and study plans stay available offline.',
  robots: { index: false, follow: false },
}

export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return children
}
