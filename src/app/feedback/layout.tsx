import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Feedback — Help Shape VarsityOS',
  description:
    'Tell us what to build next. Share ideas, report bugs and vote on features for VarsityOS — the free super-app for South African students.',
  alternates: { canonical: 'https://varsityos.co.za/feedback' },
  openGraph: {
    title: 'Feedback — Help Shape VarsityOS',
    description:
      'Share ideas, report bugs and vote on features for VarsityOS — built with and for SA students.',
    url: 'https://varsityos.co.za/feedback',
  },
}

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children
}
