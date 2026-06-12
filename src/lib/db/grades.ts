import { createClient } from '@/lib/supabase/client'

export interface GpaRow {
  id: string
  name: string
  mark: string
  credits: string
}

export interface DBAssessment {
  id: string
  name: string
  score: string
  weight: string
}

export interface DBModuleGrade {
  id: string
  moduleId: string
  moduleName: string
  colour: string
  credits: string
  assessments: DBAssessment[]
}

interface GradesRow {
  grade_modules: DBModuleGrade[]
  gpa_rows: GpaRow[]
}

export async function loadGradesData(): Promise<{ modules: DBModuleGrade[]; gpaRows: GpaRow[] }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return { modules: [], gpaRows: [] }

    const { data, error } = await supabase
      .from('student_grades_data')
      .select('grade_modules, gpa_rows')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !data) return { modules: [], gpaRows: [] }

    const row = data as GradesRow
    return {
      modules: (row.grade_modules as DBModuleGrade[]) ?? [],
      gpaRows: (row.gpa_rows as GpaRow[]) ?? [],
    }
  } catch {
    return { modules: [], gpaRows: [] }
  }
}

export async function saveGradesData(modules: DBModuleGrade[], gpaRows: GpaRow[]): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return

    const { error } = await supabase
      .from('student_grades_data')
      .upsert(
        {
          user_id: user.id,
          grade_modules: modules,
          gpa_rows: gpaRows,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (error) console.error('[grades] saveGradesData error:', error.message)
  } catch (err) {
    console.error('[grades] saveGradesData unexpected error:', err)
  }
}
