import { createClient } from '@/lib/supabase/client'

export async function loadSavedBursaries(): Promise<string[]> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return []

    const { data, error } = await supabase
      .from('saved_bursaries')
      .select('bursary_id')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false })

    if (error || !data) return []

    return (data as { bursary_id: string }[]).map(r => r.bursary_id)
  } catch {
    return []
  }
}

export async function saveBursary(bursaryId: string, bursaryName: string): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return

    const { error } = await supabase
      .from('saved_bursaries')
      .upsert(
        {
          user_id: user.id,
          bursary_id: bursaryId,
          bursary_name: bursaryName,
          saved_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,bursary_id' }
      )

    if (error) console.error('[saved-bursaries] saveBursary error:', error.message)
  } catch (err) {
    console.error('[saved-bursaries] saveBursary unexpected error:', err)
  }
}

export async function unsaveBursary(bursaryId: string): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return

    const { error } = await supabase
      .from('saved_bursaries')
      .delete()
      .eq('user_id', user.id)
      .eq('bursary_id', bursaryId)

    if (error) console.error('[saved-bursaries] unsaveBursary error:', error.message)
  } catch (err) {
    console.error('[saved-bursaries] unsaveBursary unexpected error:', err)
  }
}
