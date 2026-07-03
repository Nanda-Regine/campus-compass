import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Demo — See VarsityOS in Action',
  description:
    'Take a guided tour of VarsityOS: the free NSFAS & budget tracker, study planner, meal prep, peer tutoring, notes marketplace and Nova AI companion — built for South African university and TVET students.',
  alternates: { canonical: 'https://varsityos.co.za/demo' },
  openGraph: {
    title: 'Demo — See VarsityOS in Action',
    description:
      'A guided tour of the free super-app for South African students: NSFAS tracking, budgeting, study planning, meal prep and Nova AI.',
    url: 'https://varsityos.co.za/demo',
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
