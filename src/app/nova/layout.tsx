import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nova — Your AI Student Companion',
  description:
    'Nova is the AI companion inside VarsityOS — mental-health support, study and budget help, and answers about student life in South Africa.',
  robots: { index: false, follow: false },
}

export default function NovaLayout({ children }: { children: React.ReactNode }) {
  return children
}
