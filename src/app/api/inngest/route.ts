export const dynamic = 'force-dynamic'

import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { examReminders, wellnessNudge } from '@/lib/inngest/functions'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [examReminders, wellnessNudge],
})
