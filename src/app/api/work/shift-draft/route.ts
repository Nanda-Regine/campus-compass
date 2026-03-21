import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(user.id, 'shift-draft', 10, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })

  const { shift_id, request_type, reason } = await req.json()
  if (!shift_id || !request_type) {
    return NextResponse.json({ error: 'Missing shift_id or request_type' }, { status: 400 })
  }

  const { data: shift } = await supabase
    .from('work_shifts')
    .select('*, job:part_time_jobs(employer_name, job_type)')
    .eq('id', shift_id)
    .eq('student_id', user.id)
    .single()

  if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const requestTypeLabels: Record<string, string> = {
    swap:       'a shift swap',
    time_off:   'time off',
    reduction:  'a shift reduction',
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: `You write professional but warm shift request messages for a part-time worker who is also a full-time university student in South Africa. Keep it brief (under 5 sentences), honest, and non-apologetic. The student's academic commitments are legitimate. Never grovel. Never over-explain. Format it ready to paste into WhatsApp.`,
    messages: [{
      role: 'user',
      content: `Draft ${requestTypeLabels[request_type] ?? request_type} request.
Student name: ${profile?.name ?? 'the student'}
Employer: ${shift.job?.employer_name ?? 'my employer'}
Job type: ${shift.job?.job_type ?? 'general'}
Shift: ${shift.shift_date} from ${shift.start_time} to ${shift.end_time}
Reason: ${reason ?? 'university assessment — I have an exam/assignment deadline that conflicts'}

Keep it under 5 sentences. Professional but human. Ready to copy to WhatsApp.`,
    }],
  })

  const draft = (message.content[0] as { type: string; text: string }).text

  return NextResponse.json({ draft })
}
