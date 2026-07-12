import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add a Job',
  description: 'Add a part-time job to track your shifts and earnings on VarsityOS.',
  robots: { index: false, follow: false },
}

export default function AddJobLayout({ children }: { children: React.ReactNode }) {
  return children
}
