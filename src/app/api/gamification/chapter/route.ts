import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sastToday } from '@/lib/utils'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = sastToday()

  const [{ data: activeChapter }, { data: allChapters }] = await Promise.all([
    supabase.from('semester_chapters').select('*').eq('is_active', true).lte('start_date', today).gte('end_date', today).single(),
    supabase.from('semester_chapters').select('*').order('start_date'),
  ])

  const chapter = activeChapter ?? (allChapters ?? []).find(c => c.start_date <= today && c.end_date >= today) ?? null

  if (!chapter) return NextResponse.json({ chapter: null, chapter_xp: 0, pod_rank: null })

  const { data: chapterXP } = await supabase
    .from('user_chapter_xp')
    .select('xp')
    .eq('user_id', user.id)
    .eq('chapter_id', chapter.id)
    .single()

  return NextResponse.json({
    chapter,
    chapter_xp: chapterXP?.xp ?? 0,
    all_chapters: allChapters ?? [],
  })
}
