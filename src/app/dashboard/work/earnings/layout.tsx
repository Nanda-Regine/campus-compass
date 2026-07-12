import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Earnings',
  description: 'Review your student earnings and payslips on VarsityOS.',
  robots: { index: false, follow: false },
}

export default function EarningsLayout({ children }: { children: React.ReactNode }) {
  return children
}
