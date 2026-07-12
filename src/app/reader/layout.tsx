import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reader',
  description:
    'Read your notes, study guides and documents distraction-free — offline-ready on VarsityOS.',
  robots: { index: false, follow: false },
}

export default function ReaderLayout({ children }: { children: React.ReactNode }) {
  return children
}
