import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For Institutions — Bulk-Activate VarsityOS for Your Students',
  description:
    'Universities, TVET colleges and SRCs can bulk-activate premium VarsityOS features for their students — NSFAS tracking, study planning, wellbeing support and broadcasts. Free Scholar tier for every student.',
  alternates: { canonical: 'https://varsityos.co.za/institutions' },
  openGraph: {
    title: 'For Institutions — VarsityOS',
    description:
      'Bulk-activate premium VarsityOS features for your students. Free Scholar tier for every South African student.',
    url: 'https://varsityos.co.za/institutions',
  },
}

export default function InstitutionsLayout({ children }: { children: React.ReactNode }) {
  return children
}
