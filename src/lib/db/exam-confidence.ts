import { createClient } from '@/lib/supabase/client'

export async function loadExamConfidences(): Promise<Record<string, number>> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return {}

    const { data, error } = await supabase
      .from('exam_confidence')
      .select('exam_id, confidence')
      .eq('user_id', user.id)

    if (error || !data) return {}

    const result: Record<string, number> = {}
    for (const row of data as { exam_id: string; confidence: number }[]) {
      result[row.exam_id] = row.confidence
    }
    return result
  } catch {
    return {}
  }
}

export async function saveExamConfidence(examId: string, confidence: number): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return

    const { error } = await supabase
      .from('exam_confidence')
      .upsert(
        {
          user_id: user.id,
          exam_id: examId,
          confidence,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,exam_id' }
      )

    if (error) console.error('[exam-confidence] saveExamConfidence error:', error.message)
  } catch (err) {
    console.error('[exam-confidence] saveExamConfidence unexpected error:', err)
  }
}
