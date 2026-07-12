import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Institution Admin',
  description: 'Manage your institution, students and broadcasts on VarsityOS.',
  robots: { index: false, follow: false },
}

export default function InstitutionAdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
