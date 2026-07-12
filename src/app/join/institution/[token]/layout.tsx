import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join Your Institution',
  description: 'Activate your institution-sponsored VarsityOS access.',
  robots: { index: false, follow: false },
}

export default function JoinInstitutionLayout({ children }: { children: React.ReactNode }) {
  return children
}
