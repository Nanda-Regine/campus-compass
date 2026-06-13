import type { Metadata } from 'next'
import SetupFlow from '@/components/setup/SetupFlow'
import { AmbientImage } from '@/components/ui/AmbientImage'

export const metadata: Metadata = {
  title: 'Set Up Your Profile',
}

export default function SetupPage() {
  return (
    <div style={{ position: 'relative', minHeight: '100dvh' }}>
      <AmbientImage zone="onboarding" opacity={0.30} blurPx={22} saturation={1.1} />
      <SetupFlow />
    </div>
  )
}
