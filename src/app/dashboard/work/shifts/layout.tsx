import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shifts',
  description: 'Log and manage your work shifts on VarsityOS.',
  robots: { index: false, follow: false },
}

export default function ShiftsLayout({ children }: { children: React.ReactNode }) {
  return children
}
